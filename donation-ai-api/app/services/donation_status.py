from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.db_models import (
    Donation, DonationStatus, DonationRequest, DonationRequestStatus,
    DonationItem, DonationItemAllocation, AllocationStatus,
    DonationStatusHistory, NGOProfile
)
from app.services.ngo_scoping import get_ngo_scoped_items

def get_status_rank(status) -> int:
    if not status:
        return 0
    status_str = status.value if hasattr(status, 'value') else str(status)
    status_str = status_str.upper()
    mapping = {
        "PENDING": 0,
        "DRAFT": 0,
        "MATCHED": 1,
        "ACCEPTED": 1,
        "PACKAGING_NOTIFIED": 2,
        "PACKAGING_IN_PROGRESS": 2,
        "PACKED": 3,
        "SEALED": 4,
        "PICKUP_SCHEDULED": 5,
        "SCHEDULED": 5,
        "PICKUP_CONFIRMED": 6,
        "CONFIRMED": 6,
        "COLLECTED": 7,
        "PICKED_UP": 7,
        "DELIVERED": 8,
        "NGO_RECEIVED": 9,
        "RECEIVED": 9,
        "COMPLETED": 10,
        "ACKNOWLEDGED": 10,
    }
    return mapping.get(status_str, 0)


RANK_TO_DONATION_STATUS = {
    0: DonationStatus.PENDING,
    1: DonationStatus.MATCHED,
    2: DonationStatus.PACKAGING_NOTIFIED,
    3: DonationStatus.PACKED,
    4: DonationStatus.SEALED,
    5: DonationStatus.PICKUP_SCHEDULED,
    6: DonationStatus.PICKUP_CONFIRMED,
    7: DonationStatus.COLLECTED,
    8: DonationStatus.DELIVERED,
    9: DonationStatus.RECEIVED,
    10: DonationStatus.COMPLETED,
}


def compute_aggregate_donation_status(db: Session, donation_id: int) -> DonationStatus:
    """
    Calculates aggregate parent donation status from all active NGO requests/allocations.
    
    Rules:
    - If parent donation has reached RECEIVED or COMPLETED, preserve final status.
    - If ALL active requests are COMPLETED -> Parent becomes COMPLETED.
    - If ALL active requests are RECEIVED or COMPLETED -> Parent becomes RECEIVED.
    - If ALL active requests are DELIVERED or above -> Parent becomes DELIVERED.
    - If ALL active requests are COLLECTED or above -> Parent becomes COLLECTED.
    - If ALL active requests are PICKUP_CONFIRMED or above -> Parent becomes PICKUP_CONFIRMED.
    - If ALL active requests are PICKUP_SCHEDULED or above -> Parent becomes PICKUP_SCHEDULED.
    - If some requests are COMPLETED/DELIVERED but others are still waiting (e.g. PICKUP_SCHEDULED),
      the parent donation does NOT prematurely become COMPLETED; it reflects the minimum active state.
    """
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        return DonationStatus.PENDING

    current_rank = get_status_rank(donation.status)
    # Once a donation has reached RECEIVED or COMPLETED, preserve it
    if current_rank >= 9:
        return donation.status

    from app.db_models import DonationReceipt
    receipts_count = db.query(DonationReceipt).filter(DonationReceipt.donation_id == donation_id).count()

    requests = db.query(DonationRequest).filter(
        DonationRequest.donation_id == donation_id,
        DonationRequest.status != DonationRequestStatus.REJECTED,
        DonationRequest.status != DonationRequestStatus.CANCELLED
    ).all()

    if not requests:
        if receipts_count > 0:
            return DonationStatus.RECEIVED
        return donation.status if donation else DonationStatus.PENDING

    ranks = [get_status_rank(r.status) for r in requests]

    # Check if there are active allocated items that are not yet fulfilled
    all_items = db.query(DonationItem).filter(DonationItem.donation_id == donation_id).all()
    has_unfulfilled_items = any(it.matching_status != "FULFILLED" for it in all_items if it.allocated_quantity > 0)

    # Check top-down from highest threshold
    if not has_unfulfilled_items:
        if all(rk >= 10 for rk in ranks):
            return DonationStatus.COMPLETED
        if all(rk >= 9 for rk in ranks):
            return DonationStatus.RECEIVED
    if all(rk >= 8 for rk in ranks):
        return DonationStatus.DELIVERED
    if all(rk >= 7 for rk in ranks):
        return DonationStatus.COLLECTED
    if all(rk >= 6 for rk in ranks):
        return DonationStatus.PICKUP_CONFIRMED
    if all(rk >= 5 for rk in ranks):
        return DonationStatus.PICKUP_SCHEDULED
    if all(rk >= 4 for rk in ranks):
        return DonationStatus.SEALED
    if all(rk >= 3 for rk in ranks):
        return DonationStatus.PACKED
    if all(rk >= 2 for rk in ranks):
        return DonationStatus.PACKAGING_NOTIFIED

    min_rank = min(ranks)
    return RANK_TO_DONATION_STATUS.get(min_rank, DonationStatus.MATCHED)


def sync_donation_aggregate_status(
    db: Session, 
    donation_id: int, 
    changed_by_id: Optional[int] = None, 
    notes: Optional[str] = None
) -> Tuple[DonationStatus, bool]:
    """
    Computes aggregate status for the parent donation and records history if status changed.
    Guarantees that final/completed states are preserved and never regressed.
    Returns (new_status, changed_boolean).
    """
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        return DonationStatus.PENDING, False

    old_status = donation.status
    old_rank = get_status_rank(old_status)
    new_status = compute_aggregate_donation_status(db, donation_id)
    new_rank = get_status_rank(new_status)

    # Protect against accidental backward regression for advanced donations:
    # A donation that reached COLLECTED (7), DELIVERED (8), RECEIVED (9), or COMPLETED (10)
    # must never be regressed to an earlier workflow stage like MATCHED or PICKUP_SCHEDULED.
    if old_rank >= 7 and new_rank < old_rank and str(new_status).upper() not in ["CANCELLED", "REJECTED"]:
        new_status = old_status

    old_status_val = old_status.value if hasattr(old_status, 'value') else str(old_status)
    new_status_val = new_status.value if hasattr(new_status, 'value') else str(new_status)

    changed = old_status_val.upper() != new_status_val.upper()
    if changed:
        donation.status = new_status
        history = DonationStatusHistory(
            donation_id=donation.id,
            old_status=old_status_val,
            new_status=new_status,
            changed_by_id=changed_by_id,
            notes=notes or f"Status updated to {new_status_val} based on item allocations."
        )
        db.add(history)

    return new_status, changed
