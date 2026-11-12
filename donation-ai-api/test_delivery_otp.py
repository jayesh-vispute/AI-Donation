import pytest
import os
import secrets
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch

from app.database import Base
from app.db_models import User, RoleEnum, Donation, DonationStatus, Pickup, PickupStatus, DeliveryOTP
from app.services.delivery_otp import (
    generate_delivery_otp, 
    verify_delivery_otp, 
    get_active_otp_for_donor,
    _decrypt_otp
)

# In-memory SQLite for comprehensive unit tests
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        # Create test users
        donor = User(id=1, email="donor@example.com", full_name="Donor User", role=RoleEnum.DONOR)
        ngo_user = User(id=2, email="ngo@example.com", full_name="NGO User", role=RoleEnum.NGO)
        other_user = User(id=3, email="other@example.com", full_name="Other User", role=RoleEnum.DONOR)
        session.add_all([donor, ngo_user, other_user])

        # Create donations
        d1 = Donation(id=101, donor_id=1, status=DonationStatus.COLLECTED, title="Books & Toys")
        d2 = Donation(id=102, donor_id=1, status=DonationStatus.COLLECTED, title="Clothes")
        session.add_all([d1, d2])

        # Create pickups
        p1 = Pickup(id=201, donation_id=101, donor_id=1, date=datetime.utcnow(), status=PickupStatus.COLLECTED)
        p2 = Pickup(id=202, donation_id=102, donor_id=1, date=datetime.utcnow(), status=PickupStatus.COLLECTED)
        session.add_all([p1, p2])

        session.commit()
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_1_otp_generation(db_session):
    """1. OTP is exactly 6 digits, cryptographically random, expires in 15 minutes."""
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    
    assert record is not None
    assert record.donation_id == 101
    assert record.pickup_id == 201
    assert record.is_verified is False
    assert record.attempt_count == 0
    assert record.max_attempts == 5

    # Check plaintext decrypted length
    plain_otp = _decrypt_otp(record.otp_encrypted)
    assert len(plain_otp) == 6
    assert plain_otp.isdigit()

    # Check expiration (15 minutes from creation)
    time_diff = (record.expires_at - record.created_at).total_seconds()
    assert 895 <= time_diff <= 905


def test_2_idempotent_generation(db_session):
    """2. OTP is generated once per verification cycle; does not regenerate on every access."""
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        rec1 = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
        rec2 = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)

    assert rec1.id == rec2.id
    assert rec1.otp_hash == rec2.otp_hash


def test_3_successful_verification(db_session):
    """3. Correct OTP verifies successfully and marks OTP as used."""
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)

    success, msg = verify_delivery_otp(
        db=db_session,
        donation_id=101,
        input_otp=plain_otp,
        user_id=2,
        pickup_id=201
    )

    assert success is True
    assert "verified successfully" in msg.lower()

    # Check record state in DB
    db_record = db_session.query(DeliveryOTP).filter(DeliveryOTP.id == record.id).first()
    assert db_record.is_verified is True
    assert db_record.used_at is not None
    assert db_record.verified_by_id == 2


def test_4_invalid_otp(db_session):
    """4. Incorrect OTP fails and decrements remaining attempts."""
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)

    # Produce an intentionally wrong OTP
    wrong_otp = "000000" if plain_otp != "000000" else "111111"

    success, msg = verify_delivery_otp(
        db=db_session,
        donation_id=101,
        input_otp=wrong_otp,
        user_id=2,
        pickup_id=201
    )

    assert success is False
    assert "4 attempt(s) remaining" in msg

    db_record = db_session.query(DeliveryOTP).filter(DeliveryOTP.id == record.id).first()
    assert db_record.attempt_count == 1
    assert db_record.is_verified is False


def test_5_reused_otp(db_session):
    """5. Reusing a verified OTP is strictly prevented."""
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)

    # First verification passes
    s1, _ = verify_delivery_otp(db_session, 101, plain_otp, user_id=2, pickup_id=201)
    assert s1 is True

    # Second attempt with same OTP must be rejected
    s2, msg = verify_delivery_otp(db_session, 101, plain_otp, user_id=2, pickup_id=201)
    assert s2 is False
    assert "already been used" in msg.lower()


def test_6_excessive_attempts_lockout(db_session):
    """6. Maximum failed attempts locks out the OTP from brute-force."""
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)
    wrong_otp = "999999" if plain_otp != "999999" else "888888"

    for i in range(5):
        verify_delivery_otp(db_session, 101, wrong_otp, user_id=2, pickup_id=201)

    db_record = db_session.query(DeliveryOTP).filter(DeliveryOTP.id == record.id).first()
    assert db_record.attempt_count == 5

    # Even if correct OTP is provided now, it must be locked out
    success, msg = verify_delivery_otp(db_session, 101, plain_otp, user_id=2, pickup_id=201)
    assert success is False
    assert "maximum verification attempts" in msg.lower()


def test_7_otp_expiration(db_session):
    """7. Expired OTP is rejected."""
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)

    # Simulate past expiration
    record.expires_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    success, msg = verify_delivery_otp(db_session, 101, plain_otp, user_id=2, pickup_id=201)
    assert success is False
    assert "expired" in msg.lower()


def test_8_wrong_donation_and_pickup(db_session):
    """8. Verifying with mismatched donation or pickup fails."""
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)

    # Attempt against different donation
    s_diff_don, msg_don = verify_delivery_otp(db_session, 102, plain_otp, user_id=2, pickup_id=201)
    assert s_diff_don is False
    assert "no delivery verification code found" in msg_don.lower()

    # Attempt with wrong pickup ID
    s_wrong_pick, msg_pick = verify_delivery_otp(db_session, 101, plain_otp, user_id=2, pickup_id=999)
    assert s_wrong_pick is False
    assert "does not match this pickup" in msg_pick.lower()


def test_donor_authorized_access(db_session):
    """Verify only the authenticated donor owner can retrieve the OTP for their donation."""
    donor_user = db_session.query(User).filter(User.id == 1).first()
    other_user = db_session.query(User).filter(User.id == 3).first()

    # Owner donor gets OTP (but OTP is hidden from response now)
    with patch('app.services.delivery_otp.send_delivery_otp_email', return_value=True):
        donor_result = get_active_otp_for_donor(db_session, 101, donor_user)
    assert donor_result is not None
    assert donor_result["has_active_otp"] is True
    assert "otp" not in donor_result
    assert "sent to your registered email" in donor_result["message"]

    # Non-owner donor gets 403 Forbidden
    with pytest.raises(Exception) as exc:
        get_active_otp_for_donor(db_session, 101, other_user)
    assert "403" in str(exc.value)
