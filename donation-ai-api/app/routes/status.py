from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
from app.database import get_db
from app.db_models import (
    Donation, DonationStatus, DonationStatusHistory, User, RoleEnum, NGOProfile, 
    DonationRequest, DonationRequestStatus, DonationReceipt, DonationReceiptItem, 
    ItemCondition, Pickup, PickupStatus, Inventory, InventoryStatus, DonationItem, 
    DonationItemAllocation, AllocationStatus, Demand, DemandStatus
)
from app.schemas import DonationStatusUpdate, DonationStatusHistoryResponse, ReceiptCreate
from app.services.auth import get_current_user
from app.services.notifications import create_idempotent_notification

router = APIRouter(prefix="/status", tags=["Status"])

@router.get("/create-missing-tables-temp")
def create_missing_tables_temp():
    from app.db_models import Base
    from app.database import engine
    Base.metadata.create_all(bind=engine)
    return {"status": "success", "message": "Tables created."}

VALID_TRANSITIONS = {
    DonationStatus.matched: [DonationStatus.packaging_notified, DonationStatus.cancelled],
    DonationStatus.packaging_notified: [DonationStatus.packed, DonationStatus.pickup_scheduled, DonationStatus.cancelled],
    DonationStatus.packed: [DonationStatus.sealed, DonationStatus.cancelled],
    DonationStatus.sealed: [DonationStatus.pickup_scheduled, DonationStatus.cancelled],
    DonationStatus.pickup_scheduled: [DonationStatus.collected, DonationStatus.cancelled],
    DonationStatus.collected: [DonationStatus.delivered],
    DonationStatus.delivered: [],
    DonationStatus.cancelled: [],
    DonationStatus.MATCHED: [DonationStatus.PACKAGING_NOTIFIED, DonationStatus.CANCELLED],
    DonationStatus.PACKAGING_NOTIFIED: [DonationStatus.PACKED, DonationStatus.PICKUP_SCHEDULED, DonationStatus.CANCELLED],
    DonationStatus.PACKED: [DonationStatus.SEALED, DonationStatus.CANCELLED],
    DonationStatus.SEALED: [DonationStatus.PICKUP_SCHEDULED, DonationStatus.CANCELLED],
    DonationStatus.PICKUP_SCHEDULED: [DonationStatus.PICKUP_CONFIRMED, DonationStatus.CANCELLED],
    DonationStatus.PICKUP_CONFIRMED: [DonationStatus.COLLECTED, DonationStatus.CANCELLED],
    DonationStatus.COLLECTED: [DonationStatus.DELIVERED],
    DonationStatus.DELIVERED: [DonationStatus.RECEIVED],
    DonationStatus.RECEIVED: [],
    DonationStatus.CANCELLED: []
}

@router.get("/donations/{donation_id}", response_model=List[DonationStatusHistoryResponse])
def get_donation_status_history(
    donation_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    is_admin = current_user.role == RoleEnum.admin
    is_donor = donation.donor_id == current_user.id
    
    is_matched_ngo = False
    if current_user.role in [RoleEnum.NGO, RoleEnum.ngo]:
        ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == current_user.id).first()
        if ngo_profile:
            if donation.ngo_id == ngo_profile.id:
                is_matched_ngo = True
            elif db.query(DonationRequest).filter(DonationRequest.donation_id == donation.id, DonationRequest.ngo_id == ngo_profile.id).first():
                is_matched_ngo = True
            elif db.query(DonationItemAllocation).join(DonationItem).filter(DonationItem.donation_id == donation.id, DonationItemAllocation.ngo_id == ngo_profile.id).first():
                is_matched_ngo = True

    if not (is_admin or is_donor or is_matched_ngo):
        raise HTTPException(status_code=403, detail="Not authorized to view this donation's history")
        
    history = db.query(DonationStatusHistory).filter(DonationStatusHistory.donation_id == donation_id).order_by(DonationStatusHistory.created_at.asc()).all()
    return history

@router.post("/donations/{donation_id}/verify-delivery")
def verify_donation_delivery(
    donation_id: int,
    otp: str = Form(...),
    file: Optional[UploadFile] = File(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"[ROUTE DEBUG] verify-delivery called. user_id={current_user.id}, email={current_user.email}, role={current_user.role}")
    from app.services.delivery_proof import verify_and_record_delivery
    return verify_and_record_delivery(
        db=db,
        donation_id=donation_id,
        otp_code=otp,
        file=file,
        current_user=current_user,
        notes=notes
    )


@router.patch("/donations/{donation_id}")
def update_donation_status(
    donation_id: int,
    status_update: DonationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    is_admin = current_user.role == RoleEnum.admin
    is_donor = donation.donor_id == current_user.id
    
    is_matched_ngo = False
    if current_user.role in [RoleEnum.NGO, RoleEnum.ngo]:
        ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == current_user.id).first()
        if ngo_profile:
            if donation.ngo_id == ngo_profile.id:
                is_matched_ngo = True
            elif db.query(DonationRequest).filter(DonationRequest.donation_id == donation.id, DonationRequest.ngo_id == ngo_profile.id).first():
                is_matched_ngo = True
            elif db.query(DonationItemAllocation).join(DonationItem).filter(DonationItem.donation_id == donation.id, DonationItemAllocation.ngo_id == ngo_profile.id).first():
                is_matched_ngo = True
            
    if not (is_admin or is_donor or is_matched_ngo):
        raise HTTPException(status_code=403, detail="Not authorized to update this donation")

    try:
        new_status_enum = DonationStatus(status_update.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status_update.status}")
        
    current_status = donation.status
    
    if new_status_enum not in VALID_TRANSITIONS.get(current_status, []):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid transition from {current_status.value} to {new_status_enum.value}"
        )

    # If transitioning to DELIVERED, enforce delivery verification and OTP
    if new_status_enum == DonationStatus.DELIVERED:
        from app.services.delivery_proof import has_persisted_delivery_proof
        if not has_persisted_delivery_proof(db, donation.id):
            raise HTTPException(
                status_code=400,
                detail="Delivery verification with OTP is strictly required to mark donation as DELIVERED. Please submit proof via the delivery verification endpoint."
            )

    # RECEIVED is FINAL and requires physical NGO receipt verification with item-level data.
    # It must ONLY be set via the dedicated receipt endpoint (POST /status/donations/{id}/receipt).
    if new_status_enum == DonationStatus.RECEIVED:
        raise HTTPException(
            status_code=400,
            detail="RECEIVED status can only be set via the receipt confirmation endpoint. NGO must physically verify items, quantities, and conditions."
        )

    # Update donation
    donation.status = new_status_enum
    
    # Record history
    history = DonationStatusHistory(
        donation_id=donation.id,
        old_status=current_status.value,
        new_status=new_status_enum,
        changed_by_id=current_user.id,
        notes=status_update.notes
    )
    db.add(history)
    
    # Notification for completion
    if new_status_enum in [DonationStatus.RECEIVED, DonationStatus.COMPLETED]:
        create_idempotent_notification(
            db=db,
            user_id=donation.donor_id,
            title="Donation Completed",
            message=f"Donation #{donation.id} has been fully completed. Thank you for your contribution!",
            type="donations",
            related_entity_type="donation",
            related_entity_id=donation.id,
            recipient_role="DONOR"
        )
            
    # Sync status to DonationRequests if they exist
    requests = db.query(DonationRequest).filter(DonationRequest.donation_id == donation.id).all()
    for req in requests:
        try:
            req.status = DonationRequestStatus(new_status_enum.value)
        except ValueError:
            pass

    db.commit()
    db.refresh(donation)
    
    return {"status": "success", "new_status": donation.status.value}

@router.post("/donations/{donation_id}/receipt", response_model=dict)
def confirm_donation_receipt(
    donation_id: int,
    receipt_data: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.ngo_scoping import get_ngo_scoped_items
    from app.services.donation_status import sync_donation_aggregate_status
    from app.db_models import DonationItemAllocation

    if current_user.role not in [RoleEnum.NGO, RoleEnum.ngo]:
        raise HTTPException(status_code=403, detail="Only NGOs can confirm receipt.")
        
    ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == current_user.id).first()
    if not ngo_profile:
        raise HTTPException(status_code=403, detail="Not authorized to confirm this donation.")
        
    try:
        # Lock the donation row to prevent concurrent receipt confirmations
        donation = db.query(Donation).filter(Donation.id == donation_id).with_for_update().first()
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")
            
        req = db.query(DonationRequest).filter(
            DonationRequest.donation_id == donation.id,
            DonationRequest.ngo_id == ngo_profile.id
        ).first()

        is_authorized = (
            donation.ngo_id == ngo_profile.id or
            req is not None or
            db.query(DonationItemAllocation).join(DonationItem).filter(
                DonationItem.donation_id == donation.id,
                DonationItemAllocation.ngo_id == ngo_profile.id
            ).first() is not None
        )
        if not is_authorized:
            raise HTTPException(status_code=403, detail="Not authorized to confirm this donation.")
            
        # If already received by this NGO, handle gracefully if all requested items are already confirmed
        if req and req.status in [DonationRequestStatus.RECEIVED, DonationRequestStatus.NGO_RECEIVED, DonationRequestStatus.COMPLETED]:
            receipt_exists = db.query(DonationReceipt).filter(
                DonationReceipt.donation_id == donation_id,
                DonationReceipt.ngo_id == ngo_profile.id
            ).first()
            if receipt_exists:
                existing_item_ids = [ri.donation_item_id for ri in receipt_exists.items]
                all_already_recorded = all(it.donation_item_id in existing_item_ids for it in receipt_data.items)
                if all_already_recorded:
                    from app.routes.inventory import sync_confirmed_receipts_to_inventory
                    sync_confirmed_receipts_to_inventory(ngo_profile.id, db)
                    return {
                        "status": "success", 
                        "message": "Donation items have already been received by your NGO.",
                        "donation_status": donation.status.value if hasattr(donation.status, 'value') else str(donation.status),
                        "ngo_request_status": DonationRequestStatus.RECEIVED.value,
                        "pickup_status": PickupStatus.COMPLETED.value
                    }

        # Check pickup for this NGO
        pickup = db.query(Pickup).filter(
            Pickup.donation_id == donation_id,
            Pickup.ngo_id == ngo_profile.id
        ).first()
        if not pickup:
            pickup = db.query(Pickup).filter(Pickup.donation_id == donation_id).first()

        # Scoped items for this NGO
        valid_items = get_ngo_scoped_items(db, donation.items, ngo_profile.id)
        valid_item_ids = [item.id for item in valid_items]
        all_donation_item_ids = [item.id for item in donation.items]

        # Verify items - must have at least one item for physical verification
        if not receipt_data.items or len(receipt_data.items) == 0:
            raise HTTPException(status_code=400, detail="Receipt must include at least one item with physical verification data (received quantity and condition).")
        
        for item in receipt_data.items:
            if item.donation_item_id not in valid_item_ids and item.donation_item_id not in all_donation_item_ids:
                raise HTTPException(status_code=400, detail=f"Item {item.donation_item_id} is not allocated to your NGO.")
            if item.received_quantity < 0 or item.received_quantity > item.expected_quantity:
                raise HTTPException(status_code=422, detail=f"Invalid received quantity for item {item.donation_item_id}")
                
        # Create receipt
        receipt = DonationReceipt(
            donation_id=donation_id,
            ngo_id=ngo_profile.id,
            notes=receipt_data.notes,
            confirmed_by_id=current_user.id
        )
        db.add(receipt)
        db.flush() # Get receipt.id
        
        # Create receipt items and add to inventory & update demand fulfillment
        for item in receipt_data.items:
            receipt_item = DonationReceiptItem(
                receipt_id=receipt.id,
                donation_item_id=item.donation_item_id,
                expected_quantity=item.expected_quantity,
                received_quantity=item.received_quantity,
                condition=item.condition
            )
            db.add(receipt_item)
            
            # Find the original donation item to get details for inventory and update matching_status
            donation_item = db.query(DonationItem).filter(DonationItem.id == item.donation_item_id).first()
            
            if item.received_quantity > 0 and donation_item:
                item_name_val = donation_item.item_name or donation_item.category or "General"
                cat_val = donation_item.category or "General"
                cond_raw = item.condition if isinstance(item.condition, str) else (item.condition.value if hasattr(item.condition, 'value') else str(item.condition))
                cond_val = cond_raw.upper() if isinstance(cond_raw, str) else cond_raw

                # 1. Update/Add to NGO Inventory
                inv = db.query(Inventory).filter(
                    Inventory.ngo_id == ngo_profile.id, 
                    func.lower(Inventory.item_name) == func.lower(item_name_val)
                ).first()
                if inv:
                    inv.quantity += item.received_quantity
                    inv.available_quantity += item.received_quantity
                    if cond_val:
                        inv.condition = cond_val
                else:
                    new_inv = Inventory(
                        ngo_id=ngo_profile.id,
                        donation_id=donation.id,
                        category_id=donation_item.category_id,
                        category_name=cat_val,
                        item_name=item_name_val,
                        subcategory=donation_item.subcategory,
                        quantity=item.received_quantity,
                        available_quantity=item.received_quantity,
                        used_quantity=0,
                        condition=cond_val,
                        status=InventoryStatus.AVAILABLE
                    )
                    db.add(new_inv)

                # 2. Update Demand Fulfillment for this NGO if matches exist or category/name matches
                from app.db_models import Match, MatchStatus
                match = db.query(Match).filter(
                    Match.donation_item_id == item.donation_item_id,
                    Match.status != MatchStatus.REJECTED
                ).first()
                
                matched_demands = []
                if match and match.demand and match.demand.ngo_id == ngo_profile.id:
                    matched_demands = [match.demand]
                else:
                    matched_demands = db.query(Demand).filter(
                        Demand.ngo_id == ngo_profile.id,
                        (func.lower(Demand.item_name) == func.lower(item_name_val)) | (func.lower(Demand.category) == func.lower(cat_val))
                    ).all()
                
                for dem in matched_demands:
                    dem.quantity_fulfilled = min(dem.quantity_required, (dem.quantity_fulfilled or 0) + item.received_quantity)
                    if dem.quantity_fulfilled >= dem.quantity_required:
                        dem.status = DemandStatus.fulfilled
                    elif dem.quantity_fulfilled > 0:
                        dem.status = DemandStatus.partially_fulfilled

                # 3. Update DonationItemAllocation status for this NGO
                allocations = db.query(DonationItemAllocation).filter(
                    DonationItemAllocation.donation_item_id == item.donation_item_id,
                    DonationItemAllocation.ngo_id == ngo_profile.id
                ).all()
                for alloc in allocations:
                    alloc.status = AllocationStatus.FULFILLED

                # 4. Update DonationItem matching_status
                all_allocs = db.query(DonationItemAllocation).filter(
                    DonationItemAllocation.donation_item_id == item.donation_item_id,
                    DonationItemAllocation.status != AllocationStatus.REJECTED
                ).all()
                fulfilled_qty = sum(a.allocated_quantity for a in all_allocs if a.status == AllocationStatus.FULFILLED)
                if fulfilled_qty >= (donation_item.quantity or 1):
                    donation_item.matching_status = "FULFILLED"
                elif fulfilled_qty > 0:
                    donation_item.matching_status = "PARTIALLY_FULFILLED"
            
        # Check if all items allocated to this NGO are fulfilled
        ngo_allocs = db.query(DonationItemAllocation).join(DonationItem).filter(
            DonationItem.donation_id == donation.id,
            DonationItemAllocation.ngo_id == ngo_profile.id,
            DonationItemAllocation.status != AllocationStatus.REJECTED
        ).all()
        all_ngo_items_fulfilled = all(a.status == AllocationStatus.FULFILLED for a in ngo_allocs) if ngo_allocs else True

        if all_ngo_items_fulfilled:
            if req:
                req.status = DonationRequestStatus.RECEIVED
            else:
                req = DonationRequest(
                    donation_id=donation.id,
                    ngo_id=ngo_profile.id,
                    donor_id=donation.donor_id,
                    status=DonationRequestStatus.RECEIVED
                )
                db.add(req)

        # Update this NGO's pickup status
        pickup_status_str = pickup.status.value if pickup else None
        if pickup and all_ngo_items_fulfilled:
            pickup.status = PickupStatus.COMPLETED
            pickup_status_str = PickupStatus.COMPLETED.value

        # Recalculate parent donation aggregate status without premature completion
        sync_donation_aggregate_status(
            db=db,
            donation_id=donation.id,
            changed_by_id=current_user.id,
            notes=f"NGO {ngo_profile.organization_name} confirmed receipt of allocated items."
        )
        
        # Scoped items text for notification
        items_desc = ", ".join([f"{it.item_name or it.category} (x{it.quantity})" for it in valid_items]) if valid_items else f"Donation #{donation.id}"
        create_idempotent_notification(
            db=db,
            user_id=donation.donor_id,
            title="Items Received by NGO",
            message=f"{ngo_profile.organization_name} has received {items_desc} for donation DON-{donation.id}.",
            type="donations",
            related_entity_type="donation",
            related_entity_id=donation.id,
            recipient_role="DONOR"
        )
            
        db.commit()
        db.refresh(donation)
        return {
            "status": "success", 
            "message": "Donation received successfully by the NGO.",
            "donation_status": donation.status.value if hasattr(donation.status, 'value') else str(donation.status),
            "ngo_request_status": DonationRequestStatus.RECEIVED.value,
            "pickup_status": pickup_status_str
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unable to confirm receipt. Please try again. Error: {str(e)}")
