import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.db_models import RoleEnum, Match, MatchStatus, NGOProfile, DonationRequest, DonationRequestStatus

# Set up test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_pickup.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_pickup_flow():
    # 1. Register Donor
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Donor",
            "email": "donor@test.com",
            "password": "password123",
            "role": "DONOR"
        }
    )
    assert response.status_code == 200, response.text
    donor_token = response.json()["access_token"]
    donor_headers = {"Authorization": f"Bearer {donor_token}"}

    # 2. Register NGO
    response = client.post(
        "/api/auth/register/ngo",
        json={
            "full_name": "Test NGO User",
            "email": "ngo@test.com",
            "password": "password123",
            "role": "NGO",
            "organization_name": "Test NGO Org"
        }
    )
    assert response.status_code == 200, response.text
    ngo_token = response.json()["access_token"]
    ngo_headers = {"Authorization": f"Bearer {ngo_token}"}
    
    # Get NGO profile id
    response = client.get("/api/auth/me", headers=ngo_headers)
    ngo_user_id = response.json()["id"]
    
    db = TestingSessionLocal()
    ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == ngo_user_id).first()
    ngo_id = ngo_profile.id

    # 3. Create Donation
    response = client.post(
        "/api/donations",
        headers=donor_headers,
        json={
            "items": [
                {
                    "item_name": "Test Canned Beans",
                    "quantity": 5
                }
            ],
            "title": "Canned Food Donation",
            "pickup_address": "123 Test St",
            "pickup_city": "Test City",
            "pickup_state": "CA",
            "pickup_postal_code": "12345"
        }
    )
    assert response.status_code == 200, response.text
    donation_id = response.json()["id"]

    # 4. Simulate selecting an NGO (Create DonationRequest manually since usually this might be done via Match or frontend picking)
    # The API checks if there's a DonationRequest or Match. We'll just create a DonationRequest for the NGO.
    dr = DonationRequest(
        donation_id=donation_id,
        ngo_id=ngo_id,
        donor_id=response.json()["donor_id"],
        status=DonationRequestStatus.ACCEPTED
    )
    db.add(dr)
    db.commit()

    # 5. Schedule Pickup
    schedule_data = {
        "scheduled_at": "2026-10-01T10:00:00Z",
        "pickup_address": "123 Test St"
    }
    response = client.post(
        f"/api/pickup/donations/{donation_id}",
        headers=donor_headers,
        json=schedule_data
    )
    assert response.status_code == 200, response.text
    
    # Verify API Response
    donation_data = response.json()
    assert donation_data["status"] == "PICKUP_SCHEDULED"
    assert donation_data["ngo_id"] == ngo_id
    
    # 6. Get Donor's Pickups
    response = client.get("/api/pickup", headers=donor_headers)
    assert response.status_code == 200, response.text
    donor_pickups = response.json()
    assert len(donor_pickups) == 1
    pickup_id = donor_pickups[0]["id"]
    
    # 7. Login as NGO and verify Pickup appears
    response = client.get("/api/pickup", headers=ngo_headers)
    assert response.status_code == 200, response.text
    ngo_pickups = response.json()
    assert len(ngo_pickups) == 1
    assert ngo_pickups[0]["id"] == pickup_id
    assert ngo_pickups[0]["status"] == "SCHEDULED"

    # 8. Update Pickup (e.g. status to COLLECTED)
    response = client.patch(
        f"/api/pickup/{pickup_id}",
        headers=ngo_headers,
        json={"status": "COLLECTED"}
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "COLLECTED"
    
    print("TEST PASSED!")

if __name__ == "__main__":
    test_pickup_flow()
