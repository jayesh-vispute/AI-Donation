from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.db_models import Match, MatchStatus, Donation, DonationItem, DonationStatus, Demand, DemandStatus, NGOProfile, User, RoleEnum
from app.schemas import MatchResponse
from app.services.matcher import calculate_matches
from app.services.auth import get_current_user, require_ngo

router = APIRouter(prefix="/matches", tags=["Matches"])

@router.post("/generate/{donation_id}", response_model=List[MatchResponse])
def trigger_matches(
    donation_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admins can manually trigger matches")
        
    calculate_matches(db, donation_id)
    matches = db.query(Match).join(DonationItem).filter(DonationItem.donation_id == donation_id).all()
    return matches

@router.get("/", response_model=List[MatchResponse])
def get_matches(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_role_str = current_user.role.value.upper() if hasattr(current_user.role, 'value') else str(current_user.role).upper()
    if 'ADMIN' in user_role_str:
        return db.query(Match).offset(skip).limit(limit).all()
    elif 'NGO' in user_role_str:
        from app.services.ngo_service import get_or_create_ngo_profile
        ngo = get_or_create_ngo_profile(db, current_user)
        return db.query(Match).join(Demand).filter(Demand.ngo_id == ngo.id).offset(skip).limit(limit).all()
    else:
        raise HTTPException(status_code=403, detail="Donors cannot view raw matches")

@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.patch("/{match_id}/accept", response_model=MatchResponse)
def accept_match(
    match_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_ngo)
):
    from app.services.ngo_service import get_or_create_ngo_profile
    ngo = get_or_create_ngo_profile(db, current_user)
    match = db.query(Match).filter(Match.id == match_id).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.demand.ngo_id != ngo.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this match")
        
    if match.status != MatchStatus.active:
        raise HTTPException(status_code=400, detail=f"Cannot accept a match with status {match.status.value}")

    # Transaction to accept
    try:
        # Update Demand Fulfillment
        remaining_required = match.demand.quantity_required - match.demand.quantity_fulfilled
        if match.matched_quantity > remaining_required:
            raise HTTPException(status_code=400, detail="Match quantity exceeds remaining demand requirement")
            
        match.demand.quantity_fulfilled += match.matched_quantity
        
        if match.demand.quantity_fulfilled >= match.demand.quantity_required:
            match.demand.status = DemandStatus.fulfilled
        else:
            match.demand.status = DemandStatus.partially_fulfilled
            
        # Update Match Status
        match.status = MatchStatus.ACCEPTED
        
        # Update Donation Status
        donation = match.donation_item.donation
        if donation.status == DonationStatus.MATCHED: # only if not already advanced
            donation.status = DonationStatus.PACKAGING_NOTIFIED
            
        db.commit()
        db.refresh(match)
        return match
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")

@router.patch("/{match_id}/reject", response_model=MatchResponse)
def reject_match(
    match_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_ngo)
):
    from app.services.ngo_service import get_or_create_ngo_profile
    ngo = get_or_create_ngo_profile(db, current_user)
    match = db.query(Match).filter(Match.id == match_id).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.demand.ngo_id != ngo.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this match")
        
    if match.status != MatchStatus.active:
        raise HTTPException(status_code=400, detail=f"Cannot reject a match with status {match.status.value}")

    match.status = MatchStatus.REJECTED
    db.commit()
    db.refresh(match)
    return match

from pydantic import BaseModel

class MatchFindRequest(BaseModel):
    donation_id: int

@router.post("/find", response_model=List[MatchResponse])
def find_matches(request: MatchFindRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Calculate matches for a specific donation and return them
    donation = db.query(Donation).filter(Donation.id == request.donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    calculate_matches(db, request.donation_id)
    matches = db.query(Match).join(DonationItem).filter(DonationItem.donation_id == request.donation_id).order_by(Match.overall_score.desc()).all()
    return matches

@router.post("/{match_id}/select")
def select_match(
    match_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.db_models import DonationRequest, DonationRequestStatus
    
    if current_user.role.value != "DONOR":
        raise HTTPException(status_code=403, detail="Only donors can select a match")
        
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    donation = match.donation_item.donation
    if donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to select match for this donation")
        
    # Transaction to create the request
    try:
        # Check if an allocation already exists for this donation item and NGO
        from app.db_models import DonationItemAllocation, AllocationStatus
        existing_alloc = db.query(DonationItemAllocation).filter(
            DonationItemAllocation.donation_item_id == match.donation_item_id,
            DonationItemAllocation.ngo_id == match.demand.ngo_id
        ).first()
        if existing_alloc:
            existing_alloc.allocated_quantity = match.matched_quantity
            existing_alloc.status = AllocationStatus.PENDING
            existing_alloc.updated_at = datetime.utcnow()
        else:
            new_alloc = DonationItemAllocation(
                donation_item_id=match.donation_item_id,
                ngo_id=match.demand.ngo_id,
                allocated_quantity=match.matched_quantity,
                status=AllocationStatus.PENDING
            )
            db.add(new_alloc)

        # Update item allocated quantity & matching status
        if match.donation_item:
            item = match.donation_item
            db.flush()
            active_allocs = db.query(DonationItemAllocation).filter(
                DonationItemAllocation.donation_item_id == item.id,
                DonationItemAllocation.status != AllocationStatus.REJECTED
            ).all()
            total_alloc = sum(a.allocated_quantity for a in active_allocs)
            item.allocated_quantity = min(item.quantity, total_alloc)
            if item.allocated_quantity >= item.quantity:
                item.matching_status = "FULLY_MATCHED"
            elif item.allocated_quantity > 0:
                item.matching_status = "PARTIALLY_MATCHED"
            else:
                item.matching_status = "PENDING"

        # Check if one already exists
        existing_req = db.query(DonationRequest).filter(
            DonationRequest.donation_id == donation.id,
            DonationRequest.ngo_id == match.demand.ngo_id
        ).first()
        if existing_req:
            existing_req.match_id = match.id
            existing_req.ngo_id = match.demand.ngo_id
            existing_req.status = DonationRequestStatus.PENDING
        else:
            new_req = DonationRequest(
                donation_id=donation.id,
                ngo_id=match.demand.ngo_id,
                donor_id=current_user.id,
                match_id=match.id,
                status=DonationRequestStatus.PENDING
            )
            db.add(new_req)
            
        donation.ngo_id = match.demand.ngo_id
        donation.status = DonationStatus.MATCHED
        
        # Send item-level notification to the matched NGO
        if match.demand and match.demand.ngo and match.demand.ngo.user_id:
            from app.services.notifications import create_idempotent_notification
            item_name = match.donation_item.item_name if match.donation_item else "item"
            notif_title = f"New {item_name.title()} Match"
            notif_msg = f"New {item_name.lower()} donation matched to your NGO — Quantity: {match.matched_quantity}"
            create_idempotent_notification(
                db=db,
                user_id=match.demand.ngo.user_id,
                title=notif_title,
                message=notif_msg,
                type="matches",
                related_entity_type="donation_item",
                related_entity_id=match.donation_item_id,
                recipient_role="NGO"
            )

        db.commit()
        return {"success": True, "message": "Match selected successfully. Donation request created."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
