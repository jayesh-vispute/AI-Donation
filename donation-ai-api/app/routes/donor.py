from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.db_models import User, DonorProfile, Donation, DonationStatus, NGOProfile, Match, DonationItem, AIDetection
from app.schemas import DonorProfileResponse, DonorProfileUpdate, DonorDashboardResponse, DonationResponse, AIDetectionResponse
from app.services.auth import get_current_user, require_donor

router = APIRouter(prefix="/donor", tags=["Donor"])

@router.get("/profile", response_model=DonorProfileResponse)
def get_donor_profile(db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    profile = db.query(DonorProfile).filter(DonorProfile.user_id == current_user.id).first()
    if not profile:
        # Create a default profile if it doesn't exist
        profile = DonorProfile(user_id=current_user.id, donor_type="Individual")
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif not profile.donor_type:
        profile.donor_type = "Individual"
        db.commit()
        db.refresh(profile)
        
    profile.user = current_user
    return profile

@router.put("/profile", response_model=DonorProfileResponse)
def update_donor_profile(profile_update: DonorProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    profile = db.query(DonorProfile).filter(DonorProfile.user_id == current_user.id).first()
    if not profile:
        profile = DonorProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()
        
    # Update user table fields if provided
    if profile_update.full_name:
        current_user.full_name = profile_update.full_name
    if profile_update.phone:
        current_user.phone = profile_update.phone

    # Update profile table fields
    update_data = profile_update.dict(exclude_unset=True, exclude={"full_name", "phone"})
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    profile.user = current_user
    return profile

COMPLETED_STATUS_VALUES = [
    DonationStatus.RECEIVED.value, DonationStatus.COMPLETED.value,
    "RECEIVED", "COMPLETED", "NGO_RECEIVED",
    "received", "completed", "ngo_received"
]
TERMINAL_STATUS_VALUES = COMPLETED_STATUS_VALUES + [
    DonationStatus.CANCELLED.value, DonationStatus.REJECTED.value,
    "CANCELLED", "REJECTED", "cancelled", "rejected"
]

@router.get("/dashboard", response_model=DonorDashboardResponse)
def get_donor_dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    from app.db_models import Notification, Pickup

    donations = db.query(Donation).filter(Donation.donor_id == current_user.id).all()
    
    def is_completed(st):
        v = (st.value if hasattr(st, 'value') else str(st)).upper() if st else ""
        return v in ["RECEIVED", "COMPLETED", "NGO_RECEIVED"]

    def is_terminal(st):
        v = (st.value if hasattr(st, 'value') else str(st)).upper() if st else ""
        return v in ["RECEIVED", "COMPLETED", "NGO_RECEIVED", "CANCELLED", "REJECTED"]

    def is_pending(st):
        v = (st.value if hasattr(st, 'value') else str(st)).upper() if st else ""
        return v in ["PENDING", "DRAFT"]

    total_donations = len(donations)
    pending_donations = len([d for d in donations if is_pending(d.status)])
    completed_donations = len([d for d in donations if is_completed(d.status)])
    active_donations = len([d for d in donations if not is_terminal(d.status) and not is_pending(d.status)])
    
    total_items = sum(len(d.items) for d in donations)
    recent_donations = sorted(donations, key=lambda d: d.created_at, reverse=True)[:5]
    
    # Calculate NGOs Reached (distinct NGOs from matched/completed donations)
    ngos_reached = len(set(d.resolved_ngo_id for d in donations if d.resolved_ngo_id is not None))
    
    # Calculate pending pickups
    pending_pickups = db.query(Pickup).filter(Pickup.donor_id == current_user.id, Pickup.status == "SCHEDULED").count()
    
    # Calculate unread notifications
    unread_notifications = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).count()
    
    return {
        "total_donations": total_donations,
        "total_items": total_items,
        "completed_donations": completed_donations,
        "pending_donations": pending_donations,
        "active_donations": active_donations,
        "ngos_reached": ngos_reached,
        "recent_donations": recent_donations,
        "pending_pickups": pending_pickups,
        "unread_notifications": unread_notifications
    }

@router.get("/donations", response_model=List[DonationResponse])
def get_donor_donations(filter_type: str = "all", db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    query = db.query(Donation).filter(Donation.donor_id == current_user.id)
    
    if filter_type == "active":
        query = query.filter(Donation.status.notin_(TERMINAL_STATUS_VALUES))
    elif filter_type == "completed":
        query = query.filter(Donation.status.in_(COMPLETED_STATUS_VALUES))
        
    return query.order_by(Donation.created_at.desc()).all()

@router.get("/donations/{donation_id}", response_model=DonationResponse)
def get_donor_donation(donation_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    if donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this donation")
    return donation

@router.get("/ai-detections", response_model=List[AIDetectionResponse])
def get_donor_ai_detections(db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    detections = db.query(AIDetection).filter(AIDetection.donor_id == current_user.id).order_by(AIDetection.created_at.desc()).all()
    return detections

@router.get("/ai-detections/{id}", response_model=AIDetectionResponse)
def get_donor_ai_detection(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    detection = db.query(AIDetection).filter(AIDetection.id == id, AIDetection.donor_id == current_user.id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection

