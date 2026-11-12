from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.db_models import User, NGOProfile, Donation, Match, MatchStatus, DonationStatus, RoleEnum, Demand, DonationItem, VerificationStatus, DeliveryOTP
import uuid

# Use the actual DB for testing or sqlite? We'll just insert and delete.
client = TestClient(app)

def get_token(user):
    from app.services.auth import create_access_token
    from datetime import timedelta
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=timedelta(minutes=30)
    )
    return access_token

def run_tests():
    from app.database import SessionLocal
    db = SessionLocal()
    
    # 1. Setup mock user and NGO
    donor = User(email=f"donor_{uuid.uuid4().hex[:6]}@test.com", password_hash="hash", full_name="Donor", role=RoleEnum.DONOR)
    ngo_user = User(email=f"ngo_{uuid.uuid4().hex[:6]}@test.com", password_hash="hash", full_name="NGO", role=RoleEnum.NGO)
    db.add(donor)
    db.add(ngo_user)
    db.commit()
    
    ngo_profile = NGOProfile(user_id=ngo_user.id, organization_name="Test NGO", verification_status=VerificationStatus.APPROVED)
    db.add(ngo_profile)
    db.commit()
    
    # 2. Setup donation and match
    donation = Donation(donor_id=donor.id, status=DonationStatus.COLLECTED, pickup_address="123")
    db.add(donation)
    db.commit()
    
    item = DonationItem(donation_id=donation.id, item_name="Food", quantity=10, condition="NEW")
    db.add(item)
    db.commit()
    
    demand = Demand(ngo_id=ngo_profile.id, item_name="Food", quantity_required=10, quantity_fulfilled=0, priority="HIGH")
    db.add(demand)
    db.commit()
    
    match = Match(donation_item_id=item.id, demand_id=demand.id, matched_quantity=10, overall_score=1.0, status=MatchStatus.ACCEPTED)
    db.add(match)
    db.commit()

    # Generate OTP
    import pyotp
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret, interval=300)
    otp_code = totp.now()
    
    otp_record = DeliveryOTP(
        donation_id=donation.id,
        otp_secret=secret,
        otp_hash=otp_code,  # in real code this is hashed, but we'll mock it if needed. Wait, in delivery_proof it hashes it? Let's check verify_and_record_delivery.
    )
    # Wait, delivery_proof uses pwd_context.verify(otp, otp_record.otp_hash).
    from app.services.auth import pwd_context
    otp_record.otp_hash = pwd_context.hash(otp_code)
    db.add(otp_record)
    db.commit()

    ngo_token = get_token(ngo_user)
    ngo_headers = {"Authorization": f"Bearer {ngo_token}"}
    
    donor_token = get_token(donor)
    donor_headers = {"Authorization": f"Bearer {donor_token}"}
    
    # TEST 1: Try Delivered before COLLECTED
    donation.status = DonationStatus.PICKUP_CONFIRMED
    db.commit()
    res = client.post(f"/api/donations/{donation.id}/verify-delivery", data={"otp": otp_code}, files={"file": ("photo.jpg", b"fake photo", "image/jpeg")}, headers=ngo_headers)
    print("TEST 1", res.status_code, res.json())
    
    # TEST 2: COLLECTED + valid OTP + valid photo
    donation.status = DonationStatus.COLLECTED
    db.commit()
    res = client.post(f"/api/donations/{donation.id}/verify-delivery", data={"otp": otp_code}, files={"file": ("photo.jpg", b"fake photo", "image/jpeg")}, headers=ngo_headers)
    print("TEST 2", res.status_code, res.json())
    
    # TEST 3: NGO confirms receipt
    res = client.post(f"/api/status/donations/{donation.id}/ngo-received", json={"notes": "All good", "received_items": []}, headers=ngo_headers)
    print("TEST 3", res.status_code, res.json())
    
    # Clean up
    db.close()

if __name__ == "__main__":
    run_tests()
