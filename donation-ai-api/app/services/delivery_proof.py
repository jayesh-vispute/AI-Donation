import os
import io
import uuid
from datetime import datetime
from typing import Optional, Tuple
from PIL import Image
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.db_models import (
    Donation, DonationStatus, Pickup, PickupStatus, 
    DeliveryOTP, DeliveryProof, DonationStatusHistory, 
    User, RoleEnum, NGOProfile, DonationRequest, DonationRequestStatus
)
from app.services.delivery_otp import verify_delivery_otp
from app.services.notifications import create_idempotent_notification

MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024  # 5 Megabytes
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


def validate_and_save_delivery_photo(file: UploadFile, donation_id: int) -> Tuple[str, str, int, str]:
    """
    Validates uploaded delivery proof image for format, size, corruption and stores it
    in the project's uploads/delivery_proofs directory.
    Returns: (photo_url, filename, file_size_bytes, mime_type)
    """
    if not file:
        raise HTTPException(status_code=400, detail="Delivery photo is required.")

    filename_raw = file.filename or ""
    ext = os.path.splitext(filename_raw)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP."
        )

    # Check content type if supplied
    content_type = getattr(file, "content_type", "") or ""
    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES and not content_type.lower().startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image MIME type: {content_type}. Must be a valid image."
        )

    # Read binary bytes
    try:
        contents = file.file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read delivery photo: {str(e)}")

    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded delivery photo is empty.")

    if len(contents) > MAX_PHOTO_SIZE_BYTES:
        raise HTTPException(
            status_code=400, 
            detail=f"Delivery photo size ({len(contents) // 1024} KB) exceeds maximum limit of 5MB."
        )

    # Verify image integrity using Pillow
    try:
        image_stream = io.BytesIO(contents)
        img = Image.open(image_stream)
        img.verify()
    except Exception:
        raise HTTPException(
            status_code=400, 
            detail="The uploaded file is corrupted or not a valid supported image."
        )

    # Store using collision-free unique filename
    os.makedirs("uploads/delivery_proofs", exist_ok=True)
    sanitized_ext = ext if ext else ".jpg"
    unique_filename = f"proof_{donation_id}_{uuid.uuid4().hex[:12]}{sanitized_ext}"
    disk_path = os.path.join("uploads/delivery_proofs", unique_filename)

    with open(disk_path, "wb") as f:
        f.write(contents)

    photo_url = f"/uploads/delivery_proofs/{unique_filename}"
    mime_type = content_type or f"image/{sanitized_ext.lstrip('.')}"

    return photo_url, unique_filename, len(contents), mime_type


def has_persisted_delivery_proof(db: Session, donation_id: int) -> bool:
    """
    Checks if a valid DeliveryProof record has been persisted for the given donation.
    """
    proof = db.query(DeliveryProof).filter(DeliveryProof.donation_id == donation_id).first()
    return proof is not None


def verify_and_record_delivery(
    db: Session,
    donation_id: int,
    otp_code: str,
    file: Optional[UploadFile] = None,
    current_user: Optional[User] = None,
    notes: Optional[str] = None
) -> dict:
    """
    Combines OTP verification, optional photo validation/storage, and atomic
    database persistence to transition a donation from COLLECTED to DELIVERED.
    """
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    # Verify authorization (Matched NGO user, Admin, Donor who owns it, or authorized delivery user)
    from app.db_models import DonationItemAllocation, DonationItem
    from app.services.ngo_scoping import get_ngo_scoped_items
    from app.services.donation_status import sync_donation_aggregate_status

    user_role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    is_admin = user_role_str.upper() == 'ADMIN'
    is_donor_owner = donation.donor_id == current_user.id
    is_matched_ngo = False
    target_ngo_id = None
    target_ngo_profile = None

    if user_role_str.upper() == 'NGO':
        ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == current_user.id).first()
        if ngo_profile:
            if donation.ngo_id == ngo_profile.id:
                is_matched_ngo = True
                target_ngo_id = ngo_profile.id
                target_ngo_profile = ngo_profile
            elif db.query(DonationRequest).filter(DonationRequest.donation_id == donation.id, DonationRequest.ngo_id == ngo_profile.id).first():
                is_matched_ngo = True
                target_ngo_id = ngo_profile.id
                target_ngo_profile = ngo_profile
            elif db.query(DonationItemAllocation).join(DonationItem).filter(DonationItem.donation_id == donation.id, DonationItemAllocation.ngo_id == ngo_profile.id).first():
                is_matched_ngo = True
                target_ngo_id = ngo_profile.id
                target_ngo_profile = ngo_profile
    
    if not (is_admin or is_matched_ngo or is_donor_owner):
        raise HTTPException(status_code=403, detail="Not authorized to perform delivery verification for this donation.")

    # Find the relevant pickup for OTP verification
    target_pickup = None
    if target_ngo_id:
        target_pickup = db.query(Pickup).filter(Pickup.donation_id == donation.id, Pickup.ngo_id == target_ngo_id).first()
    if not target_pickup and donation.pickup:
        target_pickup = donation.pickup

    pickup_id = target_pickup.id if target_pickup else None

    # 1. First, verify the OTP (fail-fast without storing files if OTP is wrong)
    is_otp_valid, err_msg = verify_delivery_otp(
        db=db,
        donation_id=donation_id,
        input_otp=otp_code.strip() if otp_code else "",
        user_id=current_user.id,
        pickup_id=pickup_id
    )

    if not is_otp_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    # 2. Optional: Validate and save the delivery photo proof if provided
    photo_url = None
    file_name = None
    file_size_bytes = None
    mime_type = None

    if file is not None and getattr(file, "filename", None):
        photo_url, file_name, file_size_bytes, mime_type = validate_and_save_delivery_photo(file, donation_id)

    # Query active OTP record to link
    active_otp = db.query(DeliveryOTP).filter(
        DeliveryOTP.donation_id == donation_id,
        DeliveryOTP.is_verified == True
    ).order_by(DeliveryOTP.used_at.desc()).first()

    now = datetime.utcnow()

    # 3. Create persistent DeliveryProof record
    proof = DeliveryProof(
        donation_id=donation_id,
        pickup_id=pickup_id,
        otp_id=active_otp.id if active_otp else None,
        photo_url=photo_url,
        file_name=file_name,
        file_size_bytes=file_size_bytes,
        mime_type=mime_type,
        verified_by_id=current_user.id,
        verified_at=now,
        notes=notes
    )
    db.add(proof)

    # Update OTP record if found and photo exists
    if active_otp and photo_url:
        active_otp.delivery_photo_url = photo_url

    if photo_url:
        donation.delivery_proof_url = photo_url

    # Update the target pickup status
    if target_pickup:
        target_pickup.status = PickupStatus.COMPLETED

    # Update associated DonationRequest
    req = None
    if target_ngo_id:
        req = db.query(DonationRequest).filter(
            DonationRequest.donation_id == donation.id,
            DonationRequest.ngo_id == target_ngo_id
        ).first()
    if not req:
        req = db.query(DonationRequest).filter(DonationRequest.donation_id == donation.id).first()

    if req:
        req.status = DonationRequestStatus.DELIVERED
        req.reviewed_at = now
        req.reviewed_by = current_user.id
        if not target_ngo_profile and req.ngo:
            target_ngo_profile = req.ngo
            target_ngo_id = req.ngo_id

    # 4. Sync aggregate parent donation status top-down without premature completion
    remarks_text = f"Delivery verified with secure OTP and photo proof ({file_name})" if file_name else "Delivery verified with secure OTP"
    sync_donation_aggregate_status(
        db=db,
        donation_id=donation.id,
        changed_by_id=current_user.id,
        notes=remarks_text
    )

    # 5. Scoped notifications for Donor and NGO
    try:
        scoped_items = get_ngo_scoped_items(db, donation.items, target_ngo_id) if target_ngo_id else donation.items
        items_desc = ", ".join([f"{it.item_name or it.category} (x{it.quantity})" for it in scoped_items]) if scoped_items else f"Donation #{donation.id}"
        ngo_title = target_ngo_profile.organization_name if target_ngo_profile else "the NGO"
        
        create_idempotent_notification(
            db=db,
            user_id=donation.donor_id,
            title="Donation Delivered",
            message=f"Your {items_desc} (Donation DON-{donation.id}) has been successfully delivered to {ngo_title}.",
            type="donations",
            related_entity_type="donation",
            related_entity_id=donation.id,
            recipient_role="DONOR"
        )
        if target_ngo_profile and target_ngo_profile.user_id:
            create_idempotent_notification(
                db=db,
                user_id=target_ngo_profile.user_id,
                title="Donation Delivered",
                message=f"Donation #{donation.id} ({items_desc}) has been successfully delivered to your location.",
                type="donations",
                related_entity_type="donation",
                related_entity_id=donation.id,
                recipient_role="NGO"
            )
    except Exception as notif_err:
        print(f"Delivery notification notice: {notif_err}")

    db.commit()
    db.refresh(donation)
    db.refresh(proof)

    return {
        "success": True,
        "message": "Delivery verified successfully with photo proof." if photo_url else "Delivery verified successfully with OTP.",
        "donation_id": donation.id,
        "status": donation.status.value if hasattr(donation.status, 'value') else str(donation.status),
        "photo_url": photo_url,
        "verified_at": proof.verified_at.isoformat(),
        "verified_by_id": current_user.id
    }
