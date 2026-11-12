from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.db_models import (
    User, Donation, DonationStatus, DonationStatusHistory, 
    Notification, NGOProfile, Match, DonationItem, DonationItemAllocation,
    DonationRequest, DonationRequestStatus, Pickup, PickupStatus, Demand, RoleEnum
)
from app.schemas import PickupCreate, PickupUpdate, PickupResponse, DonationResponse
from app.services.auth import get_current_user
from app.services.ngo_scoping import get_ngo_scoped_items
from app.services.notifications import create_idempotent_notification

router = APIRouter(prefix="/pickup", tags=["Pickup"])


@router.get("/debug/trigger_collected/{pickup_id}")
def debug_trigger_collected(pickup_id: int, db: Session = Depends(get_db)):
    try:
        pickup = db.query(Pickup).filter(Pickup.id == pickup_id).first()
        if not pickup: 
            return {"error": "Not found"}
        
        new_status = PickupStatus.COLLECTED
        pickup.status = new_status
        if pickup.donation:
            old_val = pickup.donation.status.value if hasattr(pickup.donation.status, 'value') else str(pickup.donation.status) if pickup.donation.status else None
            pickup.donation.status = DonationStatus.COLLECTED
            
            log = DonationStatusHistory(
                donation_id=pickup.donation.id,
                old_status=old_val,
                new_status=DonationStatus.COLLECTED,
                changed_by_id=pickup.ngo_id or 1,
                notes="Donation picked up and collected."
            )
            db.add(log)
            
            create_idempotent_notification(
                db=db,
                user_id=pickup.donation.donor_id,
                title="Donation Collected",
                message=f"Your donation #{pickup.donation.id} has been successfully collected.",
                type="donations",
                related_entity_type="donation",
                related_entity_id=pickup.donation.id,
                recipient_role="DONOR"
            )
            
            req = db.query(DonationRequest).filter(
                DonationRequest.donation_id == pickup.donation.id,
                DonationRequest.ngo_id == pickup.ngo_id
            ).first() if pickup.ngo_id else db.query(DonationRequest).filter(DonationRequest.donation_id == pickup.donation.id).first()
            
            if req:
                req.status = DonationRequestStatus.COLLECTED

        db.commit()
        db.refresh(pickup)
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        import traceback
        return {"error": traceback.format_exc()}


class PickupSlot(BaseModel):
    date: str
    time_slots: List[str]

class SchedulePickupRequest(BaseModel):
    scheduled_at: datetime
    pickup_address: str
    pickup_city: Optional[str] = "San Francisco"
    pickup_state: Optional[str] = "CA"
    pickup_postal_code: Optional[str] = "94101"
    notes: Optional[str] = None
    ngo_id: Optional[int] = None

@router.get("/slots", response_model=List[PickupSlot])
def get_pickup_slots(db: Session = Depends(get_db)):
    slots = []
    today = datetime.now()
    for i in range(1, 8):
        future_date = today + timedelta(days=i)
        slots.append(
            PickupSlot(
                date=future_date.strftime("%Y-%m-%d"),
                time_slots=["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"]
            )
        )
    return slots

@router.post("/donations/{donation_id}", response_model=DonationResponse)
def schedule_pickup(
    donation_id: int, 
    request: SchedulePickupRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val.upper() == "DONOR" and donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to schedule pickup for this donation")
    elif role_val.upper() == "NGO":
        if not current_user.ngo_profile:
            raise HTTPException(status_code=403, detail="NGO Profile not found")
        
    old_status = donation.status.value if hasattr(donation.status, 'value') else str(donation.status)
    
    # Update Donation general pickup fields
    donation.pickup_scheduled_at = request.scheduled_at
    donation.pickup_address = request.pickup_address
    donation.pickup_city = request.pickup_city or "San Francisco"
    donation.pickup_state = request.pickup_state or "CA"
    donation.pickup_postal_code = request.pickup_postal_code or "94101"
    if request.notes:
        donation.notes = request.notes
        
    donation.status = DonationStatus.PICKUP_SCHEDULED

    formatted_address = f"{request.pickup_address}, {donation.pickup_city}, {donation.pickup_state} {donation.pickup_postal_code}".strip(", ")
    time_str = request.scheduled_at.strftime("%I:%M %p")

    # Determine target NGO(s) for pickup records
    ngo_ids = set()
    if role_val.upper() == "NGO" and current_user.ngo_profile:
        ngo_ids.add(current_user.ngo_profile.id)
    elif request.ngo_id:
        ngo_ids.add(request.ngo_id)
    else:
        # Collect all NGOs matched or allocated to items in this donation
        if donation.ngo_id:
            ngo_ids.add(donation.ngo_id)
            
        alloc_ngos = db.query(DonationItemAllocation.ngo_id).join(DonationItem).filter(
            DonationItem.donation_id == donation.id
        ).all()
        for (nid,) in alloc_ngos:
            if nid:
                ngo_ids.add(nid)

        req_ngos = db.query(DonationRequest.ngo_id).filter(
            DonationRequest.donation_id == donation.id
        ).all()
        for (nid,) in req_ngos:
            if nid:
                ngo_ids.add(nid)

        match_ngos = db.query(Demand.ngo_id).join(Match, Match.demand_id == Demand.id).join(DonationItem, Match.donation_item_id == DonationItem.id).filter(
            DonationItem.donation_id == donation.id
        ).all()
        for (nid,) in match_ngos:
            if nid:
                ngo_ids.add(nid)

    if not ngo_ids:
        # Fallback if no specific NGO is attached yet
        pickup_record = db.query(Pickup).filter(Pickup.donation_id == donation.id).first()
        if not pickup_record:
            pickup_record = Pickup(
                donation_id=donation.id,
                donor_id=donation.donor_id,
                ngo_id=None,
                date=request.scheduled_at,
                time_slot=time_str,
                address=formatted_address,
                notes=request.notes,
                status=PickupStatus.SCHEDULED
            )
            db.add(pickup_record)
        else:
            pickup_record.date = request.scheduled_at
            pickup_record.time_slot = time_str
            pickup_record.address = formatted_address
            pickup_record.notes = request.notes
            if pickup_record.status not in [PickupStatus.COLLECTED, PickupStatus.COMPLETED]:
                pickup_record.status = PickupStatus.SCHEDULED
    else:
        # Create/update per-NGO pickup records
        for nid in ngo_ids:
            pickup_record = db.query(Pickup).filter(
                Pickup.donation_id == donation.id,
                Pickup.ngo_id == nid
            ).first()

            if not pickup_record:
                pickup_record = Pickup(
                    donation_id=donation.id,
                    donor_id=donation.donor_id,
                    ngo_id=nid,
                    date=request.scheduled_at,
                    time_slot=time_str,
                    address=formatted_address,
                    notes=request.notes,
                    status=PickupStatus.SCHEDULED
                )
                db.add(pickup_record)
            else:
                pickup_record.date = request.scheduled_at
                pickup_record.time_slot = time_str
                pickup_record.address = formatted_address
                pickup_record.notes = request.notes
                pickup_record.ngo_id = nid
                if pickup_record.status not in [PickupStatus.COLLECTED, PickupStatus.COMPLETED]:
                    pickup_record.status = PickupStatus.SCHEDULED

            # Update associated DonationRequest only if it hasn't advanced past scheduled
            req = db.query(DonationRequest).filter(
                DonationRequest.donation_id == donation.id,
                DonationRequest.ngo_id == nid
            ).first()
            if req and req.status in [
                DonationRequestStatus.PENDING, DonationRequestStatus.MATCHED, 
                DonationRequestStatus.ACCEPTED, DonationRequestStatus.PACKAGING_NOTIFIED, 
                DonationRequestStatus.PACKED, DonationRequestStatus.SEALED
            ]:
                req.status = DonationRequestStatus.PICKUP_SCHEDULED

            # Item scoping for notifications
            scoped_items = get_ngo_scoped_items(db, donation.items, nid)
            items_desc = ", ".join([f"{it.item_name or it.category} (x{it.quantity})" for it in scoped_items]) if scoped_items else f"Donation #{donation.id}"

            ngo_profile = db.query(NGOProfile).filter(NGOProfile.id == nid).first()
            ngo_name = ngo_profile.organization_name if ngo_profile else "the NGO"

            # Notify NGO
            if ngo_profile and ngo_profile.user_id:
                create_idempotent_notification(
                    db=db,
                    user_id=ngo_profile.user_id,
                    title="Pickup Scheduled",
                    message=f"Pickup for {items_desc} (Donation #{donation.id}) has been scheduled for {request.scheduled_at.strftime('%b %d, %Y at %I:%M %p')}.",
                    type="pickups",
                    related_entity_type="pickup",
                    related_entity_id=donation.id,
                    recipient_role="NGO"
                )

            # Notify Donor
            create_idempotent_notification(
                db=db,
                user_id=donation.donor_id,
                title="Pickup Scheduled",
                message=f"Pickup with {ngo_name} for your {items_desc} has been scheduled for {request.scheduled_at.strftime('%b %d, %Y at %I:%M %p')}.",
                type="pickups",
                related_entity_type="pickup",
                related_entity_id=donation.id,
                recipient_role="DONOR"
            )

    from app.services.donation_status import sync_donation_aggregate_status
    # Sync parent donation status from all active requests
    sync_donation_aggregate_status(
        db=db,
        donation_id=donation.id,
        changed_by_id=current_user.id,
        notes=f"Pickup scheduled for {request.scheduled_at.strftime('%b %d, %Y at %I:%M %p')}"
    )

    db.commit()
    db.refresh(donation)
    
    return donation

@router.get("/donations/{donation_id}", response_model=DonationResponse)
def get_pickup_details(donation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val.upper() == "DONOR" and donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif role_val.upper() == "NGO":
        if not current_user.ngo_profile:
            raise HTTPException(status_code=403, detail="Not authorized")
        ngo_id = current_user.ngo_profile.id
        donation.items = get_ngo_scoped_items(db, donation.items, ngo_id)
        # Ensure donation.pickup reflects this NGO's pickup
        ngo_pickup = db.query(Pickup).filter(
            Pickup.donation_id == donation.id, 
            Pickup.ngo_id == ngo_id
        ).first()
        if ngo_pickup:
            donation.pickup = ngo_pickup
    return donation

@router.get("/", response_model=List[PickupResponse])
def get_pickups(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val.upper() == "DONOR":
        return db.query(Pickup).filter(Pickup.donor_id == current_user.id).all()
    elif role_val.upper() == "NGO":
        if not current_user.ngo_profile:
            return []
        return db.query(Pickup).filter(Pickup.ngo_id == current_user.ngo_profile.id).all()
    elif role_val.upper() == "ADMIN":
        return db.query(Pickup).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/{pickup_id}", response_model=PickupResponse)
def get_pickup_by_id(pickup_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pickup = db.query(Pickup).filter(Pickup.id == pickup_id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
        
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val.upper() == "DONOR" and pickup.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this pickup")
    elif role_val.upper() == "NGO" and (not current_user.ngo_profile or pickup.ngo_id != current_user.ngo_profile.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this pickup")
        
    return pickup

@router.patch("/{pickup_id}", response_model=PickupResponse)
def update_pickup(
    pickup_id: int, 
    update_data: PickupUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    from app.services.donation_status import sync_donation_aggregate_status
    pickup = db.query(Pickup).filter(Pickup.id == pickup_id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
        
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val.upper() == "DONOR" and pickup.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this pickup")
    elif role_val.upper() == "NGO" and (not current_user.ngo_profile or pickup.ngo_id != current_user.ngo_profile.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this pickup")

    try:
        if update_data.date is not None:
            pickup.date = update_data.date
        if update_data.time_slot is not None:
            pickup.time_slot = update_data.time_slot
        if update_data.address is not None:
            pickup.address = update_data.address
        if update_data.volunteer is not None:
            pickup.volunteer = update_data.volunteer
        if update_data.notes is not None:
            pickup.notes = update_data.notes
            
        if update_data.status is not None:
            new_status_str = update_data.status.upper()
            valid_statuses = [e.value for e in PickupStatus]
            if new_status_str not in valid_statuses:
                raise HTTPException(status_code=400, detail="Invalid status")
                
            new_status = PickupStatus(new_status_str)
            old_status = pickup.status

            # Anti-regression: don't regress pickup status backwards (e.g. collected back to scheduled)
            from app.services.donation_status import get_status_rank
            if get_status_rank(old_status) > get_status_rank(new_status):
                new_status = old_status

            if old_status != new_status:
                pickup.status = new_status
                
                # Scoped items description for notifications
                scoped_items = get_ngo_scoped_items(db, pickup.donation.items, pickup.ngo_id) if pickup.ngo_id else (pickup.donation.items if pickup.donation else [])
                items_desc = ", ".join([f"{it.item_name or it.category} (x{it.quantity})" for it in scoped_items]) if scoped_items else f"Donation #{pickup.donation.id}"
                ngo_name = pickup.ngo.organization_name if pickup.ngo else "the NGO"

                # Sync donation and request status if pickup is COLLECTED or CONFIRMED
                if new_status == PickupStatus.CONFIRMED:
                    req = db.query(DonationRequest).filter(
                        DonationRequest.donation_id == pickup.donation.id,
                        DonationRequest.ngo_id == pickup.ngo_id
                    ).first() if pickup.ngo_id else db.query(DonationRequest).filter(DonationRequest.donation_id == pickup.donation.id).first()
                    
                    if req and get_status_rank(req.status) < get_status_rank(DonationRequestStatus.PICKUP_CONFIRMED):
                        req.status = DonationRequestStatus.PICKUP_CONFIRMED
                    
                    # Sync aggregate parent donation status
                    sync_donation_aggregate_status(
                        db=db,
                        donation_id=pickup.donation.id,
                        changed_by_id=current_user.id,
                        notes=f"Pickup date and time confirmed by {ngo_name} for {items_desc}."
                    )
                    
                    # Notify donor
                    create_idempotent_notification(
                        db=db,
                        user_id=pickup.donation.donor_id,
                        title="Pickup Confirmed",
                        message=f"Pickup for your {items_desc} has been confirmed by {ngo_name}.",
                        type="pickups",
                        related_entity_type="pickup",
                        related_entity_id=pickup.id,
                        recipient_role="DONOR"
                    )
                        
                elif new_status == PickupStatus.COLLECTED:
                    req = db.query(DonationRequest).filter(
                        DonationRequest.donation_id == pickup.donation.id,
                        DonationRequest.ngo_id == pickup.ngo_id
                    ).first() if pickup.ngo_id else db.query(DonationRequest).filter(DonationRequest.donation_id == pickup.donation.id).first()
                    
                    if req and get_status_rank(req.status) < get_status_rank(DonationRequestStatus.COLLECTED):
                        req.status = DonationRequestStatus.COLLECTED

                    # Sync aggregate parent donation status
                    sync_donation_aggregate_status(
                        db=db,
                        donation_id=pickup.donation.id,
                        changed_by_id=current_user.id,
                        notes=f"{items_desc} picked up and collected by {ngo_name}."
                    )
                    
                    create_idempotent_notification(
                        db=db,
                        user_id=pickup.donation.donor_id,
                        title="Donation Collected",
                        message=f"Your {items_desc} (Donation #{pickup.donation.id}) has been successfully collected by {ngo_name}.",
                        type="donations",
                        related_entity_type="donation",
                        related_entity_id=pickup.donation.id,
                        recipient_role="DONOR"
                    )
                    
                    from app.services.delivery_otp import generate_delivery_otp
                    generate_delivery_otp(db, pickup.donation.id, pickup.id)

        db.commit()
        db.refresh(pickup)
        return pickup
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())
