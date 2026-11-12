import os
import io
import pytest
from datetime import datetime, timedelta
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import UploadFile, HTTPException

from app.database import Base
from app.db_models import (
    User, RoleEnum, Donation, DonationStatus, Pickup, PickupStatus,
    DeliveryOTP, DeliveryProof, NGOProfile
)
from app.services.delivery_otp import generate_delivery_otp, _decrypt_otp
from app.services.delivery_proof import (
    validate_and_save_delivery_photo,
    verify_and_record_delivery,
    has_persisted_delivery_proof
)

# In-memory SQLite engine
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_dummy_image(format="JPEG", size=(100, 100), color=(255, 0, 0)) -> bytes:
    """Creates in-memory valid image bytes using Pillow."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


class MockUploadFile:
    def __init__(self, filename: str, content: bytes, content_type: str = "image/jpeg"):
        self.filename = filename
        self.content = content
        self.content_type = content_type
        self.file = io.BytesIO(content)

    def read(self):
        return self.content


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        # Create users
        donor = User(id=1, email="donor@example.com", full_name="Donor User", role=RoleEnum.DONOR)
        ngo_user = User(id=2, email="ngo@example.com", full_name="NGO User", role=RoleEnum.NGO)
        ngo_profile = NGOProfile(id=10, user_id=2, organization_name="Helping Hands Foundation")
        other_user = User(id=3, email="other@example.com", full_name="Other User", role=RoleEnum.DONOR)
        session.add_all([donor, ngo_user, ngo_profile, other_user])

        # Create donations
        d1 = Donation(id=101, donor_id=1, ngo_id=10, status=DonationStatus.COLLECTED, title="Warm Blankets")
        d2 = Donation(id=102, donor_id=1, ngo_id=10, status=DonationStatus.MATCHED, title="Books")
        session.add_all([d1, d2])

        # Create pickups
        p1 = Pickup(id=201, donation_id=101, donor_id=1, ngo_id=10, date=datetime.utcnow(), status=PickupStatus.COLLECTED)
        session.add(p1)

        session.commit()
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_successful_delivery_verification_with_photo(db_session):
    """1. Valid OTP + valid JPEG photo successfully transitions to DELIVERED and records proof."""
    otp_record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(otp_record.otp_encrypted)

    image_bytes = create_dummy_image(format="JPEG")
    mock_file = MockUploadFile(filename="delivery_photo.jpg", content=image_bytes, content_type="image/jpeg")

    ngo_user = db_session.query(User).filter(User.id == 2).first()

    result = verify_and_record_delivery(
        db=db_session,
        donation_id=101,
        otp_code=plain_otp,
        file=mock_file,
        current_user=ngo_user,
        notes="Delivered to reception"
    )

    assert result["success"] is True
    assert result["status"] == DonationStatus.DELIVERED.value
    assert "/uploads/delivery_proofs/" in result["photo_url"]

    # Check DB state
    donation = db_session.query(Donation).filter(Donation.id == 101).first()
    assert donation.status == DonationStatus.DELIVERED
    assert donation.delivery_proof_url is not None

    pickup = db_session.query(Pickup).filter(Pickup.id == 201).first()
    assert pickup.status == PickupStatus.COMPLETED

    proof = db_session.query(DeliveryProof).filter(DeliveryProof.donation_id == 101).first()
    assert proof is not None
    assert proof.verified_by_id == 2
    assert proof.file_size_bytes == len(image_bytes)
    assert has_persisted_delivery_proof(db_session, 101) is True


def test_successful_delivery_verification_without_photo(db_session):
    """1b. Valid OTP without photo (optional) successfully transitions to DELIVERED and records proof."""
    otp_record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(otp_record.otp_encrypted)

    ngo_user = db_session.query(User).filter(User.id == 2).first()

    result = verify_and_record_delivery(
        db=db_session,
        donation_id=101,
        otp_code=plain_otp,
        file=None,
        current_user=ngo_user,
        notes="Delivered without photo"
    )

    assert result["success"] is True
    assert result["status"] == DonationStatus.DELIVERED.value
    assert result["photo_url"] is None

    # Check DB state
    donation = db_session.query(Donation).filter(Donation.id == 101).first()
    assert donation.status == DonationStatus.DELIVERED
    assert donation.delivery_proof_url is None

    pickup = db_session.query(Pickup).filter(Pickup.id == 201).first()
    assert pickup.status == PickupStatus.COMPLETED

    proof = db_session.query(DeliveryProof).filter(DeliveryProof.donation_id == 101).first()
    assert proof is not None
    assert proof.photo_url is None
    assert proof.verified_by_id == 2
    assert has_persisted_delivery_proof(db_session, 101) is True


def test_invalid_file_extension(db_session):
    """2. Non-image file extensions (e.g. .txt, .pdf) are rejected."""
    otp_record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(otp_record.otp_encrypted)

    mock_file = MockUploadFile(filename="malicious.txt", content=b"Hello text file", content_type="text/plain")
    ngo_user = db_session.query(User).filter(User.id == 2).first()

    with pytest.raises(HTTPException) as exc:
        verify_and_record_delivery(db_session, 101, plain_otp, mock_file, ngo_user)
    assert exc.value.status_code == 400
    assert "Unsupported image format" in exc.value.detail


def test_corrupted_image_rejection(db_session):
    """3. Corrupted image bytes with a .jpg name are caught and rejected by Pillow verify."""
    otp_record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(otp_record.otp_encrypted)

    fake_bytes = b"NOT_A_REAL_JPEG_IMAGE_BINARY_CONTENT"
    mock_file = MockUploadFile(filename="fake_image.jpg", content=fake_bytes, content_type="image/jpeg")
    ngo_user = db_session.query(User).filter(User.id == 2).first()

    with pytest.raises(HTTPException) as exc:
        verify_and_record_delivery(db_session, 101, plain_otp, mock_file, ngo_user)
    assert exc.value.status_code == 400
    assert "corrupted" in exc.value.detail.lower()


def test_empty_image_rejection(db_session):
    """4. 0-byte empty file is rejected."""
    otp_record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(otp_record.otp_encrypted)

    mock_file = MockUploadFile(filename="empty.jpg", content=b"", content_type="image/jpeg")
    ngo_user = db_session.query(User).filter(User.id == 2).first()

    with pytest.raises(HTTPException) as exc:
        verify_and_record_delivery(db_session, 101, plain_otp, mock_file, ngo_user)
    assert exc.value.status_code == 400
    assert "empty" in exc.value.detail.lower()


def test_oversized_image_rejection(db_session):
    """5. Files exceeding 5MB are rejected."""
    otp_record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(otp_record.otp_encrypted)

    # 6MB dummy content
    oversized_bytes = b"0" * (6 * 1024 * 1024)
    mock_file = MockUploadFile(filename="huge.jpg", content=oversized_bytes, content_type="image/jpeg")
    ngo_user = db_session.query(User).filter(User.id == 2).first()

    with pytest.raises(HTTPException) as exc:
        verify_and_record_delivery(db_session, 101, plain_otp, mock_file, ngo_user)
    assert exc.value.status_code == 400
    assert "exceeds maximum limit" in exc.value.detail.lower()


def test_invalid_otp_with_photo(db_session):
    """6. Invalid OTP fails verification and does NOT persist the photo or mark DELIVERED."""
    generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    wrong_otp = "000000"

    image_bytes = create_dummy_image(format="PNG")
    mock_file = MockUploadFile(filename="proof.png", content=image_bytes, content_type="image/png")
    ngo_user = db_session.query(User).filter(User.id == 2).first()

    with pytest.raises(HTTPException) as exc:
        verify_and_record_delivery(db_session, 101, wrong_otp, mock_file, ngo_user)
    assert exc.value.status_code == 400
    assert "Invalid delivery verification code" in exc.value.detail or "Invalid OTP" in exc.value.detail

    # Donation must remain COLLECTED
    donation = db_session.query(Donation).filter(Donation.id == 101).first()
    assert donation.status == DonationStatus.COLLECTED
    assert has_persisted_delivery_proof(db_session, 101) is False


def test_expired_otp_with_photo(db_session):
    """7. Expired OTP fails verification and does NOT mark DELIVERED."""
    record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)

    # Expire the record
    record.expires_at = datetime.utcnow() - timedelta(minutes=5)
    db_session.commit()

    image_bytes = create_dummy_image()
    mock_file = MockUploadFile(filename="proof.jpg", content=image_bytes)
    ngo_user = db_session.query(User).filter(User.id == 2).first()

    with pytest.raises(HTTPException) as exc:
        verify_and_record_delivery(db_session, 101, plain_otp, mock_file, ngo_user)
    assert exc.value.status_code == 400
    assert "expired" in exc.value.detail.lower()


def test_unauthorized_user_rejection(db_session):
    """8. Unrelated user (not matched NGO, not admin) cannot verify delivery."""
    record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)

    image_bytes = create_dummy_image()
    mock_file = MockUploadFile(filename="proof.jpg", content=image_bytes)
    unauth_user = db_session.query(User).filter(User.id == 3).first()

    with pytest.raises(HTTPException) as exc:
        verify_and_record_delivery(db_session, 101, plain_otp, mock_file, unauth_user)
    assert exc.value.status_code == 403


def test_status_endpoint_direct_bypass_prevention(db_session):
    """9. Confirm has_persisted_delivery_proof correctly flags missing proof."""
    assert has_persisted_delivery_proof(db_session, 101) is False
    assert has_persisted_delivery_proof(db_session, 102) is False


def test_ngo_request_status_requires_proof(db_session):
    """10. Confirm _update_request_status rejects DELIVERED when proof is absent, but accepts it after proof exists."""
    from app.routes.ngos import _update_request_status
    from app.db_models import DonationRequest, DonationRequestStatus

    # Create dummy DonationRequest for donation 101
    req = DonationRequest(
        id=501,
        donation_id=101,
        ngo_id=10,
        donor_id=1,
        status=DonationRequestStatus.COLLECTED
    )
    db_session.add(req)
    db_session.commit()

    ngo_user = db_session.query(User).filter(User.id == 2).first()

    # Attempt to mark DELIVERED without proof -> must fail with 400
    with pytest.raises(HTTPException) as exc:
        _update_request_status(501, db_session, ngo_user, DonationRequestStatus.DELIVERED)
    assert exc.value.status_code == 400
    assert "delivery verification proof is required" in exc.value.detail.lower()

    # Now verify delivery with OTP and photo proof
    record = generate_delivery_otp(db_session, donation_id=101, pickup_id=201)
    plain_otp = _decrypt_otp(record.otp_encrypted)
    image_bytes = create_dummy_image()
    mock_file = MockUploadFile(filename="verified_handover.jpg", content=image_bytes)

    res = verify_and_record_delivery(db_session, 101, plain_otp, mock_file, ngo_user)
    assert res["success"] is True

    # Now _update_request_status must succeed
    updated_req = _update_request_status(501, db_session, ngo_user, DonationRequestStatus.DELIVERED)
    assert updated_req.status == DonationRequestStatus.DELIVERED
