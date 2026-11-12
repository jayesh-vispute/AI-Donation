import secrets
import hashlib
import base64
import os
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.db_models import DeliveryOTP, Donation, Pickup, User, RoleEnum
from app.services.email import send_delivery_otp_email

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-for-donation-ai")

def _get_derived_key() -> bytes:
    return hashlib.sha256(SECRET_KEY.encode('utf-8')).digest()

def _encrypt_otp(otp_plain: str) -> str:
    key = _get_derived_key()
    data_bytes = otp_plain.encode('utf-8')
    cipher = bytes([b ^ key[i % len(key)] for i, b in enumerate(data_bytes)])
    return base64.b64encode(cipher).decode('utf-8')

def _decrypt_otp(otp_encrypted: str) -> str:
    key = _get_derived_key()
    cipher = base64.b64decode(otp_encrypted.encode('utf-8'))
    data_bytes = bytes([b ^ key[i % len(key)] for i, b in enumerate(cipher)])
    return data_bytes.decode('utf-8')

def _hash_otp(otp: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{otp}".encode('utf-8')).hexdigest()

def generate_delivery_otp(
    db: Session, 
    donation_id: int, 
    pickup_id: Optional[int] = None,
    expiry_minutes: int = 15,
    force_new: bool = False
) -> DeliveryOTP:
    """
    Generates a secure 6-digit delivery OTP using Python's secrets module.
    Reuses existing active OTP if one already exists for this verification cycle,
    UNLESS force_new is True, in which case old ones are invalidated and a new one is sent.
    """
    now = datetime.utcnow()
    
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation or not donation.donor:
        raise HTTPException(status_code=404, detail="Donation or donor not found")
        
    donor = donation.donor
    if not donor.email:
        raise HTTPException(status_code=400, detail="Donor email address is not available.")
    
    # Check if an active, unverified, unexpired OTP already exists
    existing_otps = db.query(DeliveryOTP).filter(
        DeliveryOTP.donation_id == donation_id,
        DeliveryOTP.is_verified == False,
        DeliveryOTP.expires_at > now,
        DeliveryOTP.attempt_count < DeliveryOTP.max_attempts
    ).order_by(DeliveryOTP.created_at.desc()).all()
    
    existing = existing_otps[0] if existing_otps else None

    if force_new and existing:
        # Check cooldown: if generated less than 60s ago, reject
        time_since_creation = (now - existing.created_at).total_seconds()
        if time_since_creation < 60:
            raise HTTPException(
                status_code=429,
                detail=f"Please wait before requesting another code. Available in {int(60 - time_since_creation)}s."
            )
            
        # Invalidate existing
        for otp in existing_otps:
            otp.expires_at = now
        existing = None # Force generation of new

    if existing and not force_new:
        otp_record = existing
        otp_code = _decrypt_otp(existing.otp_encrypted)
    else:
        # Generate cryptographically secure 6-digit OTP
        otp_code = f"{secrets.randbelow(1000000):06d}"
        salt = secrets.token_hex(16)
        otp_hash = _hash_otp(otp_code, salt)
        otp_encrypted = _encrypt_otp(otp_code)
        expires_at = now + timedelta(minutes=expiry_minutes)

        otp_record = DeliveryOTP(
            donation_id=donation_id,
            pickup_id=pickup_id,
            otp_hash=otp_hash,
            otp_encrypted=otp_encrypted,
            salt=salt,
            created_at=now,
            expires_at=expires_at,
            attempt_count=0,
            max_attempts=5,
            is_verified=False
        )
        db.add(otp_record)
        
    # Send email
    success, error_msg = send_delivery_otp_email(
        to_email=donor.email,
        donor_name=donor.full_name,
        donation_id=donation_id,
        otp=otp_code,
        expiry_minutes=expiry_minutes,
        is_resend=force_new
    )
    
    if not success:
        # Rollback the transaction since we failed to send the OTP
        db.rollback()
        raise HTTPException(status_code=500, detail=error_msg or "Unable to send delivery verification OTP. Please try again.")

    # Commit only after successful email sending
    db.commit()
    db.refresh(otp_record)

    return otp_record

def verify_delivery_otp(
    db: Session, 
    donation_id: int, 
    input_otp: str, 
    user_id: int, 
    pickup_id: Optional[int] = None
) -> Tuple[bool, str]:
    """
    Validates a submitted delivery OTP against the hashed value.
    Enforces expiration, single-use, max attempts, and correct donation/pickup linking.
    """
    if not input_otp or not isinstance(input_otp, str):
        return False, "Delivery verification code is required."

    cleaned_otp = input_otp.strip()
    if len(cleaned_otp) != 6 or not cleaned_otp.isdigit():
        return False, "Delivery verification code must be exactly 6 digits."

    now = datetime.utcnow()
    
    # Query the latest OTP for this donation
    otp_record = db.query(DeliveryOTP).filter(
        DeliveryOTP.donation_id == donation_id
    ).order_by(DeliveryOTP.created_at.desc()).first()

    if not otp_record:
        return False, "No delivery verification code found for this donation."

    # Validate pickup link if provided
    if pickup_id is not None and otp_record.pickup_id is not None:
        if otp_record.pickup_id != pickup_id:
            return False, "Delivery verification code does not match this pickup."

    # Prevent reuse
    if otp_record.is_verified or otp_record.used_at is not None:
        return False, "This delivery verification code has already been used."

    # Check brute-force attempts
    if otp_record.attempt_count >= otp_record.max_attempts:
        return False, "Maximum verification attempts exceeded. Please request a new delivery verification code."

    # Increment attempt count
    otp_record.attempt_count += 1

    # Check expiration
    if now > otp_record.expires_at:
        db.commit()
        return False, "Delivery verification code has expired."

    # Compare constant-time hash
    expected_hash = otp_record.otp_hash
    actual_hash = _hash_otp(cleaned_otp, otp_record.salt)

    if not secrets.compare_digest(expected_hash, actual_hash):
        db.commit()
        remaining = max(0, otp_record.max_attempts - otp_record.attempt_count)
        if remaining == 0:
            return False, "Invalid code. Maximum verification attempts reached."
        return False, f"Invalid delivery verification code. {remaining} attempt(s) remaining."

    # Mark as successfully verified
    otp_record.is_verified = True
    otp_record.used_at = now
    otp_record.verified_by_id = user_id
    db.commit()
    db.refresh(otp_record)
    
    return True, "Delivery verified successfully."

def get_active_otp_for_donor(db: Session, donation_id: int, current_user: User) -> Optional[dict]:
    """
    Returns active OTP details strictly for the authenticated donor who owns the donation.
    """
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    is_owner = donation.donor_id == current_user.id
    is_admin = current_user.role in [RoleEnum.ADMIN, RoleEnum.admin]

    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view delivery verification code for this donation.")

    now = datetime.utcnow()

    # Query latest active OTP
    record = db.query(DeliveryOTP).filter(
        DeliveryOTP.donation_id == donation_id,
        DeliveryOTP.is_verified == False,
        DeliveryOTP.expires_at > now,
        DeliveryOTP.attempt_count < DeliveryOTP.max_attempts
    ).order_by(DeliveryOTP.created_at.desc()).first()

    # If donation is COLLECTED and no active OTP exists, generate one
    status_str = donation.status.value if hasattr(donation.status, 'value') else str(donation.status)
    if not record and status_str.upper() == "COLLECTED":
        pickup_id = donation.pickup.id if donation.pickup else None
        record = generate_delivery_otp(db, donation_id, pickup_id)

    if not record:
        verified_record = db.query(DeliveryOTP).filter(
            DeliveryOTP.donation_id == donation_id,
            DeliveryOTP.is_verified == True
        ).first()
        is_used = verified_record is not None

        expired_record = db.query(DeliveryOTP).filter(
            DeliveryOTP.donation_id == donation_id,
            DeliveryOTP.expires_at <= now,
            DeliveryOTP.is_verified == False
        ).order_by(DeliveryOTP.created_at.desc()).first()
        is_expired = expired_record is not None and not is_used

        return {
            "donation_id": donation_id,
            "has_active_otp": False,
            "otp": None,
            "is_used": is_used,
            "is_expired": is_expired,
            "message": "Delivery verification code has already been redeemed." if is_used else ("Code has expired." if is_expired else "No active delivery verification code.")
        }

    otp_code = _decrypt_otp(record.otp_encrypted)
    seconds_remaining = max(0, int((record.expires_at - now).total_seconds()))

    return {
        "donation_id": donation_id,
        "pickup_id": record.pickup_id,
        "has_active_otp": True,
        "message": "Delivery verification OTP has been sent to your registered email address.",
        "expires_at": record.expires_at.isoformat(),
        "seconds_remaining": seconds_remaining,
        "time_remaining_seconds": seconds_remaining,
        "created_at": record.created_at.isoformat(),
        "is_verified": record.is_verified,
        "is_used": False,
        "is_expired": False
    }
