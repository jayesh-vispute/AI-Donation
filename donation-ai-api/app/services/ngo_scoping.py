from sqlalchemy.orm import Session
from typing import List
from app.db_models import DonationItem, DonationItemAllocation, Match, Demand, AllocationStatus, MatchStatus, Donation, DonationRequest

def get_ngo_scoped_items(db: Session, donation_items: List[DonationItem], ngo_id: int) -> List[DonationItem]:
    """
    Returns donation items filtered specifically for an authenticated NGO.
    - Only includes items that have an active DonationItemAllocation or Match for this NGO.
    - Sets item.quantity and item.allocated_quantity to the quantity allocated/matched for this NGO.
    - Fallback: If no per-item allocations/matches found, but the donation is assigned to or requested by this NGO, returns all items.
    """
    if not donation_items:
        return []

    scoped_items = []
    for item in donation_items:
        # Check active allocation for this NGO
        allocation = db.query(DonationItemAllocation).filter(
            DonationItemAllocation.donation_item_id == item.id,
            DonationItemAllocation.ngo_id == ngo_id,
            DonationItemAllocation.status != AllocationStatus.REJECTED
        ).first()

        match = None
        if not allocation:
            # Check Match for this NGO
            match = db.query(Match).join(Demand).filter(
                Match.donation_item_id == item.id,
                Demand.ngo_id == ngo_id,
                Match.status != MatchStatus.REJECTED
            ).first()

        if allocation or match:
            target_qty = allocation.allocated_quantity if allocation else (match.matched_quantity if match else item.quantity)
            
            item_copy = DonationItem(
                id=item.id,
                donation_id=item.donation_id,
                category_id=item.category_id,
                item_name=item.item_name,
                category=item.category,
                subcategory=item.subcategory,
                quantity=target_qty,  # SCOPED QUANTITY FOR THIS NGO
                allocated_quantity=target_qty,
                matching_status=item.matching_status,
                condition=item.condition,
                confidence=item.confidence,
                unit=item.unit,
                image_url=item.image_url,
                detection_source=item.detection_source,
                description=item.description,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
            scoped_items.append(item_copy)

    # Fallback: If no per-item allocations/matches found, check if donation itself belongs to or is requested by this NGO
    if not scoped_items and donation_items:
        first_item = donation_items[0]
        donation = first_item.donation or db.query(Donation).filter(Donation.id == first_item.donation_id).first()
        if donation:
            req = db.query(DonationRequest).filter(
                DonationRequest.donation_id == donation.id,
                DonationRequest.ngo_id == ngo_id
            ).first()
            if donation.ngo_id == ngo_id or req is not None:
                for item in donation_items:
                    item_copy = DonationItem(
                        id=item.id,
                        donation_id=item.donation_id,
                        category_id=item.category_id,
                        item_name=item.item_name,
                        category=item.category,
                        subcategory=item.subcategory,
                        quantity=item.quantity,
                        allocated_quantity=item.quantity,
                        matching_status=item.matching_status,
                        condition=item.condition,
                        confidence=item.confidence,
                        unit=item.unit,
                        image_url=item.image_url,
                        detection_source=item.detection_source,
                        description=item.description,
                        created_at=item.created_at,
                        updated_at=item.updated_at
                    )
                    scoped_items.append(item_copy)

    return scoped_items

