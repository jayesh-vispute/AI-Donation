from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.db_models import User, NGOProfile, Donation, Category, Inventory, AuditLog, AIDetection, RoleEnum, VerificationStatus, Match, Demand, MatchStatus, DemandStatus
from app.services.auth import require_admin, get_password_hash
from app.schemas import UserResponse, NGOProfileResponse, DonationResponse, CategoryResponse, InventoryResponse, AuditLogResponse, AIDetectionResponse, AdminUserUpdate, AdminCreateUserRequest

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).all()

@router.get("/donors", response_model=List[UserResponse])
def get_all_donors(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).filter(User.role == RoleEnum.DONOR).all()

@router.get("/ngos", response_model=List[NGOProfileResponse])
def get_all_ngos(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(NGOProfile).all()

@router.get("/ngos/{ngo_id}", response_model=NGOProfileResponse)
def get_ngo_by_id(ngo_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    ngo = db.query(NGOProfile).filter(NGOProfile.id == ngo_id).first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    return ngo

@router.get("/ngos/pending", response_model=List[NGOProfileResponse])
def get_pending_ngos(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(NGOProfile).filter(NGOProfile.verification_status == VerificationStatus.PENDING).all()

@router.put("/ngos/{ngo_id}/approve")
def approve_ngo(ngo_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    ngo = db.query(NGOProfile).filter(NGOProfile.id == ngo_id).first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    ngo.verification_status = VerificationStatus.APPROVED
    
    log = AuditLog(user_id=current_user.id, action="APPROVE_NGO", module="NGO", entity_type="NGOProfile", entity_id=ngo.id, description=f"Approved NGO {ngo.organization_name}")
    db.add(log)
    db.commit()
    return {"success": True, "message": f"NGO {ngo.organization_name} approved."}

@router.put("/ngos/{ngo_id}/reject")
def reject_ngo(ngo_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    ngo = db.query(NGOProfile).filter(NGOProfile.id == ngo_id).first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    ngo.verification_status = VerificationStatus.REJECTED
    
    log = AuditLog(user_id=current_user.id, action="REJECT_NGO", module="NGO", entity_type="NGOProfile", entity_id=ngo.id, description=f"Rejected NGO {ngo.organization_name}")
    db.add(log)
    db.commit()
    return {"success": True, "message": f"NGO {ngo.organization_name} rejected."}

@router.get("/donations", response_model=List[DonationResponse])
def get_all_donations(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Donation).all()

@router.get("/inventory", response_model=List[InventoryResponse])
def get_global_inventory(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Inventory).all()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()

@router.get("/ai/detections", response_model=List[AIDetectionResponse])
def get_all_ai_detections(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(AIDetection).order_by(AIDetection.created_at.desc()).all()

@router.delete("/ai/detections/{detection_id}")
def delete_ai_detection(detection_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.db_models import CartItem
    detection = db.query(AIDetection).filter(AIDetection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection record not found.")

    try:
        # Delete related cart items explicitly to avoid constraint violations
        db.query(CartItem).filter(CartItem.detection_id == detection_id).delete()
        
        # Delete detection
        db.delete(detection)
        
        # Audit Log
        log = AuditLog(
            user_id=current_user.id,
            action="DELETE_AI_DETECTION",
            module="AI",
            entity_type="AIDetection",
            entity_id=detection_id,
            description=f"Deleted AI detection DET-{detection_id}"
        )
        db.add(log)
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to delete detection. Please try again.")

    return {"success": True, "message": "Detection deleted successfully."}

from app.schemas import AdminDashboardResponse

@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_admin_dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    total_users = db.query(User).count()
    total_donors = db.query(User).filter(User.role == RoleEnum.DONOR).count()
    total_ngos = db.query(User).filter(User.role == RoleEnum.NGO).count()
    pending_ngo_approvals = db.query(NGOProfile).filter(NGOProfile.verification_status == VerificationStatus.PENDING).count()
    
    total_donations = db.query(Donation).count()
    completed_donations = db.query(Donation).filter(Donation.status == "RECEIVED").count()
    pending_donations = db.query(Donation).filter(Donation.status == "PENDING").count()
    
    ai_statistics = {
        "total_detections": db.query(AIDetection).count(),
        "avg_confidence": sum([d.confidence for d in db.query(AIDetection).all()]) / max(db.query(AIDetection).count(), 1)
    }
    
    active_matches = db.query(Match).filter(Match.status == MatchStatus.accepted).count()

    active_requests = db.query(Demand).filter(Demand.status.in_([DemandStatus.OPEN, DemandStatus.active])).count()
    
    system_health = {
        "status": "Healthy",
        "db_connection": "OK"
    }

    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "total_ngos": total_ngos,
        "pending_ngo_approvals": pending_ngo_approvals,
        "total_donations": total_donations,
        "completed_donations": completed_donations,
        "pending_donations": pending_donations,
        "active_matches": active_matches,

        "active_requests": active_requests,
        "ai_statistics": ai_statistics,
        "system_health": system_health
    }

@router.get("/reports/donations")
def get_donations_report(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return {"message": "Donations report data"}

@router.get("/reports/ngos")
def get_ngos_report(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return {"message": "NGOs report data"}

@router.get("/reports/users")
def get_users_report(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return {"message": "Users report data"}

@router.get("/reports/ai")
def get_ai_report(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return {"message": "AI report data"}

@router.get("/ai/statistics")
def get_ai_statistics(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Calculate detailed statistics
    detections = db.query(AIDetection).all()
    count = len(detections)
    avg_confidence = sum([d.confidence for d in detections]) / max(count, 1)
    high_confidence = len([d for d in detections if d.confidence >= 0.7])
    low_confidence = len([d for d in detections if d.confidence < 0.7])
    pending_review = len([d for d in detections if d.status == "PENDING_REVIEW"])
    
    # Calculate category distribution
    categories_dict = {}
    for d in detections:
        cat = d.category or "General"
        categories_dict[cat] = categories_dict.get(cat, 0) + 1

    return {
        "total_detections": count,
        "avg_confidence": round(avg_confidence, 4),
        "high_confidence_count": high_confidence,
        "low_confidence_count": low_confidence,
        "low_confidence_rate": round((low_confidence / max(count, 1)) * 100, 2),
        "pending_review_count": pending_review,
        "category_distribution": categories_dict
    }

@router.post("/users", response_model=UserResponse)
def create_admin_user(data: AdminCreateUserRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    try:
        role_val = data.role.upper()
        if role_val not in [RoleEnum.DONOR.value, RoleEnum.NGO.value, RoleEnum.ADMIN.value]:
            raise HTTPException(status_code=422, detail="Invalid role. Must be DONOR, NGO, or ADMIN.")

        new_user = User(
            email=data.email,
            full_name=data.full_name,
            password_hash=get_password_hash(data.password),
            phone=data.phone,
            role=RoleEnum(role_val),
            is_active=(data.status == "Active")
        )
        db.add(new_user)
        db.flush()

        if role_val == RoleEnum.NGO.value:
            if not data.organization_name:
                raise HTTPException(status_code=422, detail="Organization name is required for NGO role.")
            
            new_profile = NGOProfile(
                user_id=new_user.id,
                organization_name=data.organization_name,
                description=data.description,
                address=data.address,
                registration_number=data.registration_number,
                email=data.email,
                phone=data.phone,
                verification_status=VerificationStatus.APPROVED # Admin created it, so auto-approved
            )
            db.add(new_profile)

        log = AuditLog(
            user_id=current_user.id,
            action="CREATE_USER",
            module="USER",
            entity_type="User",
            entity_id=new_user.id,
            description=f"Created user {new_user.full_name} with role {role_val}"
        )
        db.add(log)
        
        db.commit()
        db.refresh(new_user)
        return new_user

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to create the user. Please try again.")

# ===== User Management CRUD =====

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: AdminUserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.role is not None:
        try:
            user.role = RoleEnum(data.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {data.role}")
    if data.is_active is not None:
        user.is_active = data.is_active

    log = AuditLog(user_id=current_user.id, action="UPDATE_USER", module="USER", entity_type="User", entity_id=user.id, description=f"Updated user {user.full_name}")
    db.add(log)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    action = "ACTIVATE_USER" if user.is_active else "SUSPEND_USER"
    log = AuditLog(user_id=current_user.id, action=action, module="USER", entity_type="User", entity_id=user.id, description=f"{'Activated' if user.is_active else 'Suspended'} user {user.full_name}")
    db.add(log)
    db.commit()
    db.refresh(user)
    return {"success": True, "message": f"User {user.full_name} {'activated' if user.is_active else 'suspended'}.", "is_active": user.is_active}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.db_models import (
        Donation, DonationItem, DonationStatusHistory, DonationImage,
        CartItem, Notification, AIDetection, DonationRequest, Pickup,
        DonationTrackingEvent, PackagingChecklist, PackagingChecklistItem,
        Match, NGOProfile, DonorProfile
    )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user_name = user.full_name

    try:
        # 1. Nullify references in audit logs (keep logs for history, just detach user)
        db.query(AuditLog).filter(AuditLog.user_id == user_id).update({"user_id": None})

        # 2. Delete notifications
        db.query(Notification).filter(Notification.user_id == user_id).delete()

        # 3. Delete cart items
        db.query(CartItem).filter(CartItem.user_id == user_id).delete()

        # 4. Nullify references in donation_status_history
        db.query(DonationStatusHistory).filter(DonationStatusHistory.changed_by_id == user_id).update({"changed_by_id": None})

        # 5. Nullify references in donation_tracking_events
        db.query(DonationTrackingEvent).filter(DonationTrackingEvent.created_by == user_id).update({"created_by": None})

        # 6. Nullify references in donation_requests (reviewed_by)
        db.query(DonationRequest).filter(DonationRequest.reviewed_by == user_id).update({"reviewed_by": None})

        # 7. Delete donation requests where user is the donor
        db.query(DonationRequest).filter(DonationRequest.donor_id == user_id).delete()

        # 8. Delete AI detections linked to this user
        db.query(AIDetection).filter(AIDetection.donor_id == user_id).delete()

        # 9. Delete donation images
        db.query(DonationImage).filter(DonationImage.donor_id == user_id).delete()

        # 10. Delete pickups where user is the donor
        db.query(Pickup).filter(Pickup.donor_id == user_id).delete()

        # 11. Delete donations and their children (items, status history, packaging, tracking events)
        user_donations = db.query(Donation).filter(Donation.donor_id == user_id).all()
        for donation in user_donations:
            # Delete packaging checklist items and checklists
            checklist = db.query(PackagingChecklist).filter(PackagingChecklist.donation_id == donation.id).first()
            if checklist:
                db.query(PackagingChecklistItem).filter(PackagingChecklistItem.checklist_id == checklist.id).delete()
                db.delete(checklist)

            # Delete matches linked to donation items
            donation_items = db.query(DonationItem).filter(DonationItem.donation_id == donation.id).all()
            for item in donation_items:
                db.query(Match).filter(Match.donation_item_id == item.id).delete()

            # Delete donation items
            db.query(DonationItem).filter(DonationItem.donation_id == donation.id).delete()

            # Delete status history
            db.query(DonationStatusHistory).filter(DonationStatusHistory.donation_id == donation.id).delete()

            # Delete tracking events
            db.query(DonationTrackingEvent).filter(DonationTrackingEvent.donation_id == donation.id).delete()

            # Delete AI detections linked to this donation
            db.query(AIDetection).filter(AIDetection.donation_id == donation.id).delete()

            # Delete pickups
            db.query(Pickup).filter(Pickup.donation_id == donation.id).delete()

            # Delete donation requests
            db.query(DonationRequest).filter(DonationRequest.donation_id == donation.id).delete()

            db.delete(donation)

        # 12. Delete donor profile
        db.query(DonorProfile).filter(DonorProfile.user_id == user_id).delete()

        # 13. Delete NGO profile and its related data if user is an NGO
        ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == user_id).first()
        if ngo_profile:
            from app.db_models import Demand, Inventory
            ngo_inventory = db.query(Inventory).filter(Inventory.ngo_id == ngo_profile.id).all()
            db.query(Inventory).filter(Inventory.ngo_id == ngo_profile.id).delete()

            # Delete demands and their matches
            ngo_demands = db.query(Demand).filter(Demand.ngo_id == ngo_profile.id).all()
            for demand in ngo_demands:
                db.query(Match).filter(Match.demand_id == demand.id).delete()
            db.query(Demand).filter(Demand.ngo_id == ngo_profile.id).delete()

            # Delete donation requests for this NGO
            db.query(DonationRequest).filter(DonationRequest.ngo_id == ngo_profile.id).delete()

            # Delete pickups for this NGO
            db.query(Pickup).filter(Pickup.ngo_id == ngo_profile.id).delete()

            # Nullify donations pointing to this NGO
            db.query(Donation).filter(Donation.ngo_id == ngo_profile.id).update({"ngo_id": None})

            db.delete(ngo_profile)

        # 14. Create audit log entry (with current admin as user, not the deleted user)
        log = AuditLog(user_id=current_user.id, action="DELETE_USER", module="USER", entity_type="User", entity_id=user_id, description=f"Deleted user {user_name}")
        db.add(log)

        # 15. Finally delete the user
        db.delete(user)
        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

    return {"success": True, "message": f"User {user_name} deleted."}
