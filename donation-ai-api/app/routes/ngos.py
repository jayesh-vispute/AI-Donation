from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.db_models import (
    NGOProfile, User, VerificationStatus, MatchStatus,
    Donation, DonationItem, DonationRequest, DonationReceipt, DonationReceiptItem,
    Demand, Match, DonationStatus, DemandStatus, Pickup, RoleEnum
)
from app.schemas import NGOProfileCreate, NGOProfileUpdate, NGOProfileResponse
from app.services.auth import get_current_user, require_ngo, require_admin
from app.services.notifications import create_idempotent_notification
from app.services.ngo_scoping import get_ngo_scoped_items
from app.services.ngo_service import get_or_create_ngo_profile

router = APIRouter(prefix="/ngos", tags=["NGOs"])

@router.post("/", response_model=NGOProfileResponse)
@router.post("", response_model=NGOProfileResponse)
def create_ngo_profile(
    profile: NGOProfileCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_ngo)
):
    existing_profile = db.query(NGOProfile).filter(NGOProfile.user_id == current_user.id).first()
    if existing_profile:
        update_data = profile.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing_profile, key, value)
        db.commit()
        db.refresh(existing_profile)
        return existing_profile
        
    db_profile = NGOProfile(
        user_id=current_user.id,
        organization_name=profile.organization_name,
        registration_number=profile.registration_number or f"REG-NGO-{current_user.id:04d}",
        description=profile.description,
        contact_person=profile.contact_person,
        phone=profile.phone,
        email=profile.email,
        address=profile.address,
        city=profile.city,
        state=profile.state,
        postal_code=profile.postal_code,
        latitude=profile.latitude or 17.3850,
        longitude=profile.longitude or 78.4867,
        verification_status=VerificationStatus.APPROVED
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.get("/me", response_model=NGOProfileResponse)
def get_my_ngo_profile(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_ngo)
):
    return get_or_create_ngo_profile(db, current_user)

@router.put("/me", response_model=NGOProfileResponse)
def update_my_ngo_profile(
    profile_update: NGOProfileUpdate,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_ngo)
):
    profile = get_or_create_ngo_profile(db, current_user)
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    return profile


from fastapi import UploadFile, File
import shutil
import os
import uuid

@router.post("/me/logo", response_model=NGOProfileResponse)
def upload_my_ngo_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_ngo)
):
    profile = get_or_create_ngo_profile(db, current_user)
        
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Only PNG and JPG files are allowed")
        
    # Generate unique filename
    ext = file.filename.split('.')[-1]
    filename = f"ngo_logo_{profile.id}_{uuid.uuid4().hex}.{ext}"
    os.makedirs("uploads/logos", exist_ok=True)
    filepath = os.path.join("uploads/logos", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    profile.logo_url = f"/uploads/logos/{filename}"
    db.commit()
    db.refresh(profile)
    
    return profile

@router.post("/me/documents/{doc_type}", response_model=NGOProfileResponse)
def upload_my_ngo_document(
    doc_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_ngo)
):
    profile = get_or_create_ngo_profile(db, current_user)
        
    valid_doc_types = ["registration_certificate", "pan_card", "address_proof"]
    if doc_type not in valid_doc_types:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Allowed types: {', '.join(valid_doc_types)}")

    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Only PDF, PNG, and JPG files are allowed")
        
    ext = file.filename.split('.')[-1]
    filename = f"ngo_{doc_type}_{profile.id}_{uuid.uuid4().hex}.{ext}"
    os.makedirs("uploads/documents", exist_ok=True)
    filepath = os.path.join("uploads/documents", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc_url = f"/uploads/documents/{filename}"
    
    if doc_type == "registration_certificate":
        profile.registration_certificate_url = doc_url
    elif doc_type == "pan_card":
        profile.pan_card_url = doc_url
    elif doc_type == "address_proof":
        profile.address_proof_url = doc_url
        
    db.commit()
    db.refresh(profile)
    
    return profile

@router.get("/", response_model=List[NGOProfileResponse])
def list_ngos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(NGOProfile).filter(NGOProfile.is_active == True).offset(skip).limit(limit).all()

from app.schemas import NGODashboardResponse, DonationRequestResponse, UserResponse
from app.db_models import Donation, Demand, Match, Inventory, DonationRequest, DonationRequestStatus, DonationStatusHistory, Notification, DonationItem, DonationStatus

@router.get("/dashboard", response_model=NGODashboardResponse)
def get_ngo_dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    profile = get_or_create_ngo_profile(db, current_user)
        
    requests = db.query(DonationRequest).filter(DonationRequest.ngo_id == profile.id).all()
    incoming_donations = len([r for r in requests if r.status in [DonationRequestStatus.ACCEPTED, DonationRequestStatus.PICKUP_SCHEDULED, DonationRequestStatus.COLLECTED, DonationRequestStatus.DELIVERED]])
    pending_requests = len([r for r in requests if r.status == DonationRequestStatus.PENDING])
    
    open_demands = db.query(Demand).filter(Demand.ngo_id == profile.id, Demand.status.in_(["OPEN", "PARTIALLY_FULFILLED"])).count()
    inventory_summary = db.query(Inventory).filter(Inventory.ngo_id == profile.id).all()
    urgent_needs = db.query(Demand).filter(Demand.ngo_id == profile.id, Demand.priority == "URGENT").all()
    
    return {
        "incoming_donations": incoming_donations,
        "pending_requests": pending_requests,
        "open_demands": open_demands,
        "inventory_summary": inventory_summary,
        "urgent_needs": urgent_needs
    }

from app.schemas import NGOAnalyticsResponse
from sqlalchemy import func
from datetime import datetime, timedelta
import calendar

@router.get("/analytics", response_model=NGOAnalyticsResponse)
def get_ngo_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    profile = get_or_create_ngo_profile(db, current_user)
        
    # 1. Gather all donations associated with this NGO profile
    ngo_donation_ids = set()
    
    # a) Direct NGO link on Donation
    direct = db.query(Donation.id).filter(Donation.ngo_id == profile.id).all()
    for (did,) in direct:
        if did: ngo_donation_ids.add(did)
        
    # b) DonationRequest link
    reqs = db.query(DonationRequest.donation_id).filter(DonationRequest.ngo_id == profile.id, DonationRequest.donation_id.isnot(None)).all()
    for (did,) in reqs:
        if did: ngo_donation_ids.add(did)

    # c) DonationReceipt link
    rcpts = db.query(DonationReceipt.donation_id).filter(DonationReceipt.ngo_id == profile.id).all()
    for (did,) in rcpts:
        if did: ngo_donation_ids.add(did)

    # d) Demand / Match link
    matches = db.query(DonationItem.donation_id)\
        .join(Match, Match.donation_item_id == DonationItem.id)\
        .join(Demand, Match.demand_id == Demand.id)\
        .filter(Demand.ngo_id == profile.id).all()
    for (did,) in matches:
        if did: ngo_donation_ids.add(did)

    all_donations = db.query(Donation).filter(Donation.id.in_(list(ngo_donation_ids))).all() if ngo_donation_ids else []

    # Get explicit receipts for this NGO
    all_receipts = db.query(DonationReceipt).filter(DonationReceipt.ngo_id == profile.id).all()
    receipt_donation_ids = set(r.donation_id for r in all_receipts)

    # Received donations list
    received_donations = [d for d in all_donations if (d.status == DonationStatus.RECEIVED or d.id in receipt_donation_ids)]

    totalDonationsReceived = len(received_donations)
    
    # Sum items received across receipts and received donations
    totalItemsReceived = 0
    covered_donation_ids = set()

    for r in all_receipts:
        covered_donation_ids.add(r.donation_id)
        if r.items and len(r.items) > 0:
            totalItemsReceived += sum(ri.received_quantity for ri in r.items)
        elif r.donation and r.donation.items:
            totalItemsReceived += sum(item.quantity for item in r.donation.items)
        else:
            totalItemsReceived += 1

    for d in received_donations:
        if d.id not in covered_donation_ids:
            if d.items and len(d.items) > 0:
                totalItemsReceived += sum(item.quantity for item in d.items)
            else:
                totalItemsReceived += 1

    # 2. Active & Fulfilled Needs
    demands = db.query(Demand).filter(Demand.ngo_id == profile.id).all()
    activeNeeds = sum(1 for d in demands if d.status and str(d.status.value if hasattr(d.status, 'value') else d.status).upper() in ["OPEN", "PARTIALLY_FULFILLED", "ACTIVE", "PENDING"])
    fulfilledNeeds = sum(1 for d in demands if d.status and str(d.status.value if hasattr(d.status, 'value') else d.status).upper() in ["FULFILLED", "COMPLETED"])
    
    # 3. Monthly Data (Last 6 Months)
    today = datetime.utcnow()
    monthlyData = []
    monthlyBreakdown = []
    
    for i in range(5, -1, -1):
        target_month = (today.month - i - 1) % 12 + 1
        target_year = today.year + (today.month - i - 1) // 12
        month_abbr = calendar.month_abbr[target_month]
        
        # Receipts/Donations in this month
        month_donations_count = 0
        month_items = 0

        # Check receipts in this month
        for r in all_receipts:
            r_date = r.received_at or datetime.utcnow()
            if r_date.month == target_month and r_date.year == target_year:
                month_donations_count += 1
                if r.items and len(r.items) > 0:
                    month_items += sum(ri.received_quantity for ri in r.items)
                elif r.donation and r.donation.items:
                    month_items += sum(item.quantity for item in r.donation.items)
                else:
                    month_items += 1

        # Check received donations without explicit receipts in this month
        for d in received_donations:
            if d.id not in covered_donation_ids:
                d_date = d.updated_at or d.created_at or d.donation_date
                if d_date and d_date.month == target_month and d_date.year == target_year:
                    month_donations_count += 1
                    if d.items:
                        month_items += sum(item.quantity for item in d.items)
                    else:
                        month_items += 1
                        
        month_fulfilled = sum(1 for d in demands if d.updated_at and d.updated_at.month == target_month and d.updated_at.year == target_year and str(d.status.value if hasattr(d.status, 'value') else d.status).upper() == "FULFILLED")
        
        impact = month_items
        
        monthlyData.append({
            "month": month_abbr,
            "donations": month_donations_count,
            "items": month_items
        })
        
        monthlyBreakdown.append({
            "month": month_abbr,
            "donations": month_donations_count,
            "itemsReceived": month_items,
            "fulfilledNeeds": month_fulfilled,
            "impact": impact
        })
        
    # 4. Item Category Distribution
    categories = {}
    for d in received_donations:
        if d.items:
            for item in d.items:
                cat = item.category if item.category else "Others"
                categories[cat] = categories.get(cat, 0) + (item.quantity or 1)
                
    itemCategoryDistribution = [{"name": k, "value": v} for k, v in categories.items()]
    if not itemCategoryDistribution:
        itemCategoryDistribution = [{"name": "No Data", "value": 1}]
        
    # Map donation_id to DonationRequest.id
    don_to_req = {req.donation_id: req.id for req in db.query(DonationRequest).filter(DonationRequest.ngo_id == profile.id).all() if req.donation_id}

    # 5. Recent Activity (Receipts, Status updates, Requests)
    recentActivity = []
    seen_ids = set()

    # a) Confirmed Receipts (DonationReceipt)
    for r in all_receipts:
        d_id = r.donation_id
        formatted_don_id = f"DON-{d_id:03d}"
        donor_name = r.donation.donor.full_name if (r.donation and r.donation.donor) else "Donor"
        req_id = don_to_req.get(d_id, d_id)
        
        if r.items and len(r.items) > 0:
            qty = sum(ri.received_quantity for ri in r.items)
        elif r.donation and r.donation.items:
            qty = sum(item.quantity for item in r.donation.items)
        else:
            qty = 1
            
        date_dt = r.received_at or datetime.utcnow()
        date_str = date_dt.strftime("%b %d, %Y")
        
        seen_ids.add(d_id)
        
        recentActivity.append({
            "id": r.id + 10000,
            "donation_id": d_id,
            "request_id": req_id,
            "type": "received",
            "title": f"Received {qty} item{'s' if qty != 1 else ''} ({formatted_don_id})",
            "subtitle": f"From {donor_name} • Physical receipt confirmed",
            "date": date_str,
            "_dt": date_dt
        })

    # b) Other NGO Donations (e.g. RECEIVED, DELIVERED, COLLECTED, PICKUP_CONFIRMED, ACCEPTED, PENDING)
    for d in all_donations:
        if d.id in seen_ids:
            continue
            
        d_id = d.id
        formatted_don_id = f"DON-{d_id:03d}"
        donor_name = d.donor.full_name if d.donor else "Donor"
        qty = sum(item.quantity for item in d.items) if d.items else 1
        date_dt = d.updated_at or d.created_at or datetime.utcnow()
        date_str = date_dt.strftime("%b %d, %Y")
        req_id = don_to_req.get(d_id, d_id)
        
        status_str = str(d.status.value if hasattr(d.status, 'value') else d.status).upper()
        
        if status_str == 'RECEIVED':
            title_text = f"Received {qty} item{'s' if qty != 1 else ''} ({formatted_don_id})"
            subtitle_text = f"From {donor_name} • Physical receipt confirmed"
            act_type = "received"
        elif status_str == 'DELIVERED':
            title_text = f"Delivered {qty} item{'s' if qty != 1 else ''} ({formatted_don_id})"
            subtitle_text = f"From {donor_name} • Awaiting physical receipt"
            act_type = "received"
        elif status_str in ['COLLECTED', 'PICKUP_CONFIRMED', 'PICKUP_SCHEDULED']:
            title_text = f"Pickup Scheduled ({formatted_don_id})"
            subtitle_text = f"From {donor_name} • Status: {status_str.replace('_', ' ')}"
            act_type = "accepted"
        else:
            title_text = f"Donation Request ({formatted_don_id})"
            subtitle_text = f"From {donor_name} • Status: {status_str.replace('_', ' ')}"
            act_type = "accepted"

        recentActivity.append({
            "id": d.id + 20000,
            "donation_id": d_id,
            "request_id": req_id,
            "type": act_type,
            "title": title_text,
            "subtitle": subtitle_text,
            "date": date_str,
            "_dt": date_dt
        })

    # Sort all activity by date_dt descending
    recentActivity.sort(key=lambda x: x["_dt"], reverse=True)
    
    # Strip sort helper field
    for act in recentActivity:
        act.pop("_dt", None)
        
    recentActivity = recentActivity[:10]

    return {
        "totalDonationsReceived": totalDonationsReceived,
        "totalItemsReceived": totalItemsReceived,
        "activeNeeds": activeNeeds,
        "fulfilledNeeds": fulfilledNeeds,
        "monthlyData": monthlyData,
        "itemCategoryDistribution": itemCategoryDistribution,
        "monthlyBreakdown": monthlyBreakdown,
        "recentActivity": recentActivity
    }


@router.get("/donation-requests", response_model=List[DonationRequestResponse])
def get_donation_requests(db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    profile = get_or_create_ngo_profile(db, current_user)
    
    requests = db.query(DonationRequest).filter(DonationRequest.ngo_id == profile.id).order_by(DonationRequest.requested_at.desc()).all()
    
    # Manually construct response to evaluate properties for Pydantic
    response = []
    for req in requests:
        raw_items = req.donation.items if (req.donation and req.donation.items) else []
        scoped_items = get_ngo_scoped_items(db, raw_items, profile.id)
        ngo_pickup = db.query(Pickup).filter(Pickup.donation_id == req.donation_id, Pickup.ngo_id == profile.id).first()
        response.append({
            "id": req.id,
            "donation_id": req.donation_id,
            "ngo_id": req.ngo_id,
            "donor_id": req.donor_id,
            "match_id": req.match_id,
            "status": _get_resolved_status(req, ngo_pickup),
            "requested_at": req.requested_at,
            "reviewed_at": req.reviewed_at,
            "rejection_reason": req.rejection_reason,
            "donor_name": req.donor.full_name if req.donor else None,
            "created_at": req.requested_at,
            "match_score": req.match.overall_score * 100 if req.match else 0,
            "items": scoped_items,
            "pickup_scheduled_at": ngo_pickup.date if ngo_pickup else (req.donation.pickup_scheduled_at if req.donation else None),
            "pickup_address": ngo_pickup.address if ngo_pickup else (req.donation.pickup_address if req.donation else None),
            "pickup": ngo_pickup,
        })
    return response

@router.get("/donation-requests/statistics")
def get_donation_requests_statistics(db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    profile = get_or_create_ngo_profile(db, current_user)
    
    requests = db.query(DonationRequest).filter(DonationRequest.ngo_id == profile.id).all()
    
    total_requests = len(requests)
    pending_review = sum(1 for r in requests if r.status == DonationRequestStatus.PENDING)
    matched = sum(1 for r in requests if r.status == DonationRequestStatus.MATCHED)
    ready_for_pickup = sum(1 for r in requests if r.status == DonationRequestStatus.PICKUP_SCHEDULED)
    
    return {
        "total_requests": total_requests,
        "pending_review": pending_review,
        "matched": matched,
        "ready_for_pickup": ready_for_pickup
    }

def _get_resolved_status(req, ngo_pickup) -> str:
    status_val = req.status.value if req.status else (req.donation.status.value if (req.donation and req.donation.status) else None)
    if ngo_pickup:
        from app.services.donation_status import get_status_rank, RANK_TO_DONATION_STATUS
        pickup_rank = get_status_rank(ngo_pickup.status)
        # Pickup status COMPLETED indicates transit completion (DELIVERED, rank 8).
        # It must NOT prematurely elevate the request to COMPLETED before physical NGO receipt.
        if pickup_rank > 8:
            pickup_rank = 8
        req_rank = get_status_rank(status_val)
        if pickup_rank > req_rank:
            scoped_status = RANK_TO_DONATION_STATUS.get(pickup_rank)
            if scoped_status:
                status_val = scoped_status.value
    return status_val

@router.get("/donation-requests/{id}", response_model=DonationRequestResponse)
def get_donation_request(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    profile = get_or_create_ngo_profile(db, current_user)
    req = db.query(DonationRequest).filter(DonationRequest.id == id, DonationRequest.ngo_id == profile.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Look up delivery proof details if the donation has been delivered
    delivery_proof_url = req.donation.delivery_proof_url if req.donation else None
    delivery_verified_by = None
    delivery_verified_at = None
    delivery_otp_verified = None

    if req.donation:
        from app.db_models import DeliveryProof
        proof = db.query(DeliveryProof).filter(DeliveryProof.donation_id == req.donation_id).first()
        if proof:
            delivery_proof_url = delivery_proof_url or proof.photo_url
            delivery_verified_at = proof.verified_at
            delivery_otp_verified = True  # Proof only exists after OTP was verified
            if proof.verified_by:
                delivery_verified_by = proof.verified_by.full_name or proof.verified_by.email

    raw_items = req.donation.items if (req.donation and req.donation.items) else []
    scoped_items = get_ngo_scoped_items(db, raw_items, profile.id)
    ngo_pickup = db.query(Pickup).filter(Pickup.donation_id == req.donation_id, Pickup.ngo_id == profile.id).first()

    return {
        "id": req.id,
        "donation_id": req.donation_id,
        "ngo_id": req.ngo_id,
        "donor_id": req.donor_id,
        "match_id": req.match_id,
        "status": _get_resolved_status(req, ngo_pickup),
        "requested_at": req.requested_at,
        "reviewed_at": req.reviewed_at,
        "rejection_reason": req.rejection_reason,
        "donor_name": req.donor.full_name if req.donor else None,
        "donor_email": req.donor.email if req.donor else None,
        "donor_phone": req.donor.phone if req.donor else None,
        "ngo_name": profile.organization_name if profile else None,
        "delivery_proof_url": delivery_proof_url,
        "delivery_verified_by": delivery_verified_by,
        "delivery_verified_at": delivery_verified_at,
        "delivery_otp_verified": delivery_otp_verified,
        "created_at": req.requested_at,
        "match_score": req.match.overall_score * 100 if req.match else 0,
        "items": scoped_items,
        "pickup_scheduled_at": ngo_pickup.date if ngo_pickup else (req.donation.pickup_scheduled_at if req.donation else None),
        "pickup_address": ngo_pickup.address if ngo_pickup else (req.donation.pickup_address if req.donation else None),
        "pickup": ngo_pickup,
    }

def _update_request_status(id: int, db: Session, current_user: User, new_status: DonationRequestStatus, notification_msg: str = None):
    from datetime import datetime
    from app.services.donation_status import sync_donation_aggregate_status
    profile = get_or_create_ngo_profile(db, current_user)
    req = db.query(DonationRequest).filter(DonationRequest.id == id, DonationRequest.ngo_id == profile.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status == new_status:
        return req
        
    try:
        req.status = new_status
        req.reviewed_at = datetime.utcnow()
        req.reviewed_by = current_user.id
        
        donation = req.donation
        
        ngo_pickup = db.query(Pickup).filter(
            Pickup.donation_id == donation.id,
            Pickup.ngo_id == profile.id
        ).first()
        if not ngo_pickup and donation.pickup:
            ngo_pickup = donation.pickup

        if new_status == DonationRequestStatus.ACCEPTED:
            from app.db_models import DonationItemAllocation, AllocationStatus
            item_allocs = db.query(DonationItemAllocation).join(DonationItem).filter(
                DonationItem.donation_id == donation.id,
                DonationItemAllocation.ngo_id == profile.id
            ).all()
            for alloc in item_allocs:
                if alloc.status != AllocationStatus.FULFILLED:
                    alloc.status = AllocationStatus.ACCEPTED

            if req.match and req.match.demand:
                req.match.status = MatchStatus.ACCEPTED
                demand = req.match.demand
                matches = db.query(Match).filter(Match.demand_id == demand.id, Match.status == MatchStatus.ACCEPTED).all()
                total_fulfilled = sum(m.matched_quantity for m in matches)
                demand.quantity_fulfilled = min(demand.quantity_required, max(demand.quantity_fulfilled, total_fulfilled or demand.quantity_required))
                if demand.quantity_fulfilled >= demand.quantity_required:
                    demand.status = DemandStatus.fulfilled
                elif demand.quantity_fulfilled > 0:
                    demand.status = DemandStatus.partially_fulfilled
            elif donation and donation.items:
                for item in donation.items:
                    item_name_val = item.item_name or item.category
                    category_val = item.category
                    demands = db.query(Demand).filter(
                        Demand.ngo_id == profile.id,
                        (func.lower(Demand.item_name) == func.lower(item_name_val)) | (func.lower(Demand.category) == func.lower(category_val))
                    ).all()
                    for dem in demands:
                        dem.quantity_fulfilled = min(dem.quantity_required, (dem.quantity_fulfilled or 0) + item.quantity)
                        if dem.quantity_fulfilled >= dem.quantity_required:
                            dem.status = DemandStatus.fulfilled
                        elif dem.quantity_fulfilled > 0:
                            dem.status = DemandStatus.partially_fulfilled
        elif new_status == DonationRequestStatus.REJECTED:
            from app.db_models import DonationItemAllocation, AllocationStatus
            item_allocs = db.query(DonationItemAllocation).join(DonationItem).filter(
                DonationItem.donation_id == donation.id,
                DonationItemAllocation.ngo_id == profile.id
            ).all()
            for alloc in item_allocs:
                if alloc.status != AllocationStatus.FULFILLED:
                    alloc.status = AllocationStatus.REJECTED
            if req.match:
                req.match.status = MatchStatus.REJECTED
        elif new_status == DonationRequestStatus.COLLECTED:
            if ngo_pickup:
                ngo_pickup.status = PickupStatus.COLLECTED
            try:
                from app.services.delivery_otp import generate_delivery_otp
                generate_delivery_otp(db, donation.id, ngo_pickup.id if ngo_pickup else None)
            except Exception as otp_err:
                print(f"Delivery OTP generation warning: {otp_err}")
        elif new_status == DonationRequestStatus.DELIVERED:
            from app.services.delivery_proof import has_persisted_delivery_proof
            if not has_persisted_delivery_proof(db, donation.id):
                raise HTTPException(
                    status_code=400,
                    detail="Delivery verification is required. Please verify delivery with OTP first."
                )
            if ngo_pickup:
                ngo_pickup.status = PickupStatus.COMPLETED

        # Sync aggregate parent donation status without premature completion
        sync_donation_aggregate_status(
            db=db,
            donation_id=donation.id,
            changed_by_id=current_user.id,
            notes=notification_msg or f"Request status updated to {new_status.value} by {profile.organization_name}"
        )
                    
        # Log and Notify
        if notification_msg:
            create_idempotent_notification(
                db=db,
                user_id=donation.donor_id,
                title="Donation Update",
                message=notification_msg,
                type="donations",
                related_entity_type="donation",
                related_entity_id=donation.id,
                recipient_role="DONOR"
            )
            
            if new_status == DonationRequestStatus.DELIVERED:
                create_idempotent_notification(
                    db=db,
                    user_id=profile.user_id,
                    title="Donation Delivered",
                    message=f"Donation #{donation.id} items have been delivered to your location.",
                    type="donations",
                    related_entity_type="donation",
                    related_entity_id=donation.id,
                    recipient_role="NGO"
                )
            
        db.commit()
        db.refresh(req)
        return req
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/donation-requests/{id}/accept", response_model=DonationRequestResponse)
def accept_donation_request(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    return _update_request_status(id, db, current_user, DonationRequestStatus.ACCEPTED, "Your donation was accepted by the NGO.")

@router.post("/donation-requests/{id}/reject", response_model=DonationRequestResponse)
def reject_donation_request(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    return _update_request_status(id, db, current_user, DonationRequestStatus.REJECTED, "Your donation was rejected by the NGO.")

from app.schemas import NGOSchedulePickupRequest, PickupResponse
from app.db_models import Pickup, PickupStatus, DonationStatus

@router.post("/donation-requests/{id}/schedule-pickup", response_model=PickupResponse)
def schedule_pickup(id: int, request: NGOSchedulePickupRequest, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    from app.services.donation_status import sync_donation_aggregate_status
    req = db.query(DonationRequest).filter(DonationRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Donation request not found")
        
    ngo_profile = get_or_create_ngo_profile(db, current_user)
    if req.ngo_id != ngo_profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to schedule pickup for this request")
        
    donation = db.query(Donation).filter(Donation.id == req.donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    if donation.status not in [DonationStatus.MATCHED, DonationStatus.matched, DonationStatus.PACKAGING_NOTIFIED, DonationStatus.packaging_notified, DonationStatus.ACCEPTED, DonationStatus.accepted, DonationStatus.PENDING, DonationStatus.pending]:
        raise HTTPException(status_code=400, detail=f"Donation is in {donation.status}, cannot schedule pickup.")
        
    formatted_address = f"{donation.pickup_address}, {donation.pickup_city}, {donation.pickup_state} {donation.pickup_postal_code}".strip(", ")
    
    pickup_record = db.query(Pickup).filter(
        Pickup.donation_id == donation.id,
        Pickup.ngo_id == ngo_profile.id
    ).first()
    
    is_reschedule = pickup_record is not None
    if not pickup_record:
        pickup_record = Pickup(
            donation_id=donation.id,
            donor_id=donation.donor_id,
            ngo_id=ngo_profile.id,
            date=request.date,
            time_slot=request.time_slot,
            volunteer=request.volunteer,
            notes=request.notes,
            address=formatted_address,
            status=PickupStatus.SCHEDULED
        )
        db.add(pickup_record)
    else:
        pickup_record.date = request.date
        pickup_record.time_slot = request.time_slot
        pickup_record.volunteer = request.volunteer
        pickup_record.notes = request.notes
        pickup_record.address = formatted_address
        pickup_record.status = PickupStatus.SCHEDULED
        pickup_record.ngo_id = ngo_profile.id

    req.status = DonationRequestStatus.PICKUP_SCHEDULED
    
    scoped_items = get_ngo_scoped_items(db, donation.items, ngo_profile.id)
    items_desc = ", ".join([f"{it.item_name or it.category} (x{it.quantity})" for it in scoped_items]) if scoped_items else f"Donation #{donation.id}"

    # Sync aggregate parent donation status
    sync_donation_aggregate_status(
        db=db,
        donation_id=donation.id,
        changed_by_id=current_user.id,
        notes=f"Pickup scheduled by NGO for {items_desc} on {request.date.strftime('%b %d, %Y')}"
    )
    
    notif_title = "Pickup Schedule Changed" if is_reschedule else "Pickup Scheduled"
    notif_msg = f"Pickup for your {items_desc} has been {'rescheduled' if is_reschedule else 'scheduled'} by {ngo_profile.organization_name} for {request.date.strftime('%b %d, %Y')} at {request.time_slot}."

    create_idempotent_notification(
        db=db,
        user_id=donation.donor_id,
        title=notif_title,
        message=notif_msg,
        type="pickups",
        related_entity_type="pickup",
        related_entity_id=donation.id,
        recipient_role="DONOR"
    )
    
    create_idempotent_notification(
        db=db,
        user_id=current_user.id,
        title=notif_title,
        message=f"You have successfully {'rescheduled' if is_reschedule else 'scheduled'} pickup for {items_desc} on {request.date.strftime('%b %d, %Y')} at {request.time_slot}.",
        type="pickups",
        related_entity_type="pickup",
        related_entity_id=donation.id,
        recipient_role="NGO"
    )
    
    try:
        db.commit()
        db.refresh(pickup_record)
        return pickup_record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/donation-requests/{id}/mark-collected", response_model=DonationRequestResponse)
def mark_collected(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    return _update_request_status(id, db, current_user, DonationRequestStatus.COLLECTED, "Your donation has been collected.")

@router.post("/donation-requests/{id}/mark-delivered", response_model=DonationRequestResponse)
def mark_delivered(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    return _update_request_status(id, db, current_user, DonationRequestStatus.DELIVERED, "Your donation has been delivered.")

@router.post("/donation-requests/{id}/acknowledge", response_model=DonationRequestResponse)
def acknowledge_donation(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    return _update_request_status(id, db, current_user, DonationRequestStatus.ACKNOWLEDGED, "The NGO has acknowledged your donation. Thank you!")

from app.schemas import NGODonorResponse, NGODonorStatsResponse, NGODonorDetailResponse
from typing import Optional
from sqlalchemy import func

def _get_ngo_donor_ids(db: Session, ngo_id: int):
    donor_ids = set()

    # 1. Donors from DonationRequest for this NGO
    req_donors = db.query(DonationRequest.donor_id).filter(DonationRequest.ngo_id == ngo_id).all()
    for (did,) in req_donors:
        if did: donor_ids.add(did)

    # 2. Donors from Donation directly assigned to this NGO
    dir_donors = db.query(Donation.donor_id).filter(Donation.ngo_id == ngo_id).all()
    for (did,) in dir_donors:
        if did: donor_ids.add(did)

    # 3. Donors from Match linked to this NGO's demands
    from app.db_models import DonationItem
    matched_donors = db.query(Donation.donor_id)\
        .join(DonationItem, DonationItem.donation_id == Donation.id)\
        .join(Match, Match.donation_item_id == DonationItem.id)\
        .join(Demand, Demand.id == Match.demand_id)\
        .filter(Demand.ngo_id == ngo_id).all()
    for (did,) in matched_donors:
        if did: donor_ids.add(did)

    # 4. Donors from DonationReceipt
    rcpt_donors = db.query(Donation.donor_id)\
        .join(DonationReceipt, DonationReceipt.donation_id == Donation.id)\
        .filter(DonationReceipt.ngo_id == ngo_id).all()
    for (did,) in rcpt_donors:
        if did: donor_ids.add(did)

    # 5. Fallback: Include registered donors in system
    if not donor_ids:
        all_donors = db.query(User.id).filter(User.role.in_([RoleEnum.DONOR, RoleEnum.donor, "DONOR", "donor"])).all()
        for (did,) in all_donors:
            if did: donor_ids.add(did)

    return donor_ids

@router.get("/donors/statistics", response_model=NGODonorStatsResponse)
def get_ngo_donors_statistics(db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    profile = get_or_create_ngo_profile(db, current_user)
        
    from app.db_models import DonorProfile
    
    donor_ids = _get_ngo_donor_ids(db, profile.id)
    donors = db.query(User).filter(User.id.in_(list(donor_ids))).all() if donor_ids else []
        
    total_donors = len(donors)
    individuals = 0
    organizations = 0
    
    for d in donors:
        d_profile = db.query(DonorProfile).filter(DonorProfile.user_id == d.id).first()
        dtype = (d_profile.donor_type if d_profile and d_profile.donor_type else "Individual").strip()
        if dtype.lower() == "organization":
            organizations += 1
        else:
            individuals += 1
            
    if donor_ids:
        total_donations = db.query(Donation).filter(
            (Donation.ngo_id == profile.id) | (Donation.donor_id.in_(list(donor_ids)))
        ).count()
    else:
        total_donations = 0
        
    return {
        "total_donors": total_donors,
        "individuals": individuals,
        "organizations": organizations,
        "total_donations": total_donations
    }

@router.get("/donors", response_model=List[NGODonorResponse])
def get_ngo_donors(
    type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_ngo)
):
    profile = get_or_create_ngo_profile(db, current_user)
        
    from app.db_models import DonorProfile
    
    donor_ids = _get_ngo_donor_ids(db, profile.id)
    if not donor_ids:
        return []

    query = db.query(User).outerjoin(DonorProfile, DonorProfile.user_id == User.id)\
        .filter(User.id.in_(list(donor_ids)))
        
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            User.full_name.ilike(term) |
            User.email.ilike(term) |
            DonorProfile.city.ilike(term) |
            DonorProfile.state.ilike(term) |
            DonorProfile.address.ilike(term)
        )
        
    if type and type != "All":
        if type in ["Individual", "Individuals"]:
            query = query.filter(func.coalesce(DonorProfile.donor_type, 'Individual').ilike('Individual'))
        elif type in ["Organization", "Organizations"]:
            query = query.filter(DonorProfile.donor_type.ilike('Organization'))
            
    donors = query.offset(skip).limit(limit).all()
    
    response = []
    for d in donors:
        d_profile = db.query(DonorProfile).filter(DonorProfile.user_id == d.id).first()
        donor_type = (d_profile.donor_type if d_profile and d_profile.donor_type else "Individual").strip()
        
        location = "Not available"
        if d_profile:
            parts = [p for p in [d_profile.city, d_profile.state] if p]
            if parts:
                location = ", ".join(parts)
                
        donor_donations = db.query(Donation).filter(Donation.donor_id == d.id).all()
        total_donations = len(donor_donations)
        
        total_items = 0
        for don in donor_donations:
            if don.items:
                total_items += sum(item.quantity for item in don.items)
            else:
                total_items += 1
            
        last_donation = max([don.donation_date for don in donor_donations if don.donation_date]) if donor_donations else None
        
        from datetime import datetime, timedelta
        status = "Active"
        if last_donation and (datetime.utcnow() - last_donation) > timedelta(days=180):
            status = "Inactive"
            
        response.append({
            "id": d.id,
            "email": d.email,
            "full_name": d.full_name,
            "phone": d.phone,
            "role": d.role.value if hasattr(d.role, 'value') else str(d.role),
            "is_active": d.is_active,
            "donor_type": donor_type,
            "location": location,
            "total_donations": total_donations,
            "total_items": total_items,
            "last_donation": last_donation,
            "status": status
        })
    return response

@router.get("/donors/{donor_id}", response_model=NGODonorDetailResponse)
def get_ngo_donor_details(donor_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    profile = get_or_create_ngo_profile(db, current_user)
        
    from app.db_models import DonorProfile
    
    d = db.query(User).filter(User.id == donor_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Donor not found")
        
    d_profile = db.query(DonorProfile).filter(DonorProfile.user_id == d.id).first()
    location = "Not available"
    if d_profile:
        parts = [p for p in [d_profile.city, d_profile.state] if p]
        if parts:
            location = ", ".join(parts)
            
    donor_type = (d_profile.donor_type if d_profile and d_profile.donor_type else "Individual").strip()
    
    donor_donations = db.query(Donation).filter(Donation.donor_id == d.id).order_by(Donation.donation_date.desc()).all()
    total_donations = len(donor_donations)
    
    total_items = 0
    for don in donor_donations:
        if don.items:
            total_items += sum(item.quantity for item in don.items)
        else:
            total_items += 1
        
    last_donation = donor_donations[0].donation_date if donor_donations else None
    
    from datetime import datetime, timedelta
    status = "Active" if last_donation and (datetime.utcnow() - last_donation) < timedelta(days=180) else "Inactive"
    
    donations_list = []
    for don in donor_donations:
        items_count = sum(item.quantity for item in don.items) if don.items else 1
        donations_list.append({
            "id": don.id,
            "title": don.title or f"Donation DON-{don.id:03d}",
            "donation_date": don.donation_date,
            "status": don.status.value if hasattr(don.status, 'value') else str(don.status),
            "items_count": items_count,
            "matched_items_count": items_count
        })
        
    return {
        "id": d.id,
        "email": d.email,
        "full_name": d.full_name,
        "phone": d.phone,
        "role": d.role.value if hasattr(d.role, 'value') else str(d.role),
        "is_active": d.is_active,
        "donor_type": donor_type,
        "location": location,
        "total_donations": total_donations,
        "total_items": total_items,
        "last_donation": last_donation,
        "status": status,
        "donations": donations_list
    }




@router.get("/{ngo_id}", response_model=NGOProfileResponse)
def get_ngo_profile(ngo_id: int, db: Session = Depends(get_db)):
    profile = db.query(NGOProfile).filter(NGOProfile.id == ngo_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="NGO Profile not found")
    return profile

@router.patch("/{ngo_id}/verify", response_model=NGOProfileResponse)
def verify_ngo(
    ngo_id: int, 
    status: VerificationStatus,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    profile = db.query(NGOProfile).filter(NGOProfile.id == ngo_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="NGO Profile not found")
        
    profile.verification_status = status
    db.commit()
    db.refresh(profile)
    return profile
