import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "donation-ai-api")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.db_models import User, NGOProfile, Donation, DonationRequest, DonationItem, Match, Pickup, DonationStatusHistory, Notification, DonationStatus, DonationRequestStatus
from datetime import datetime

client = TestClient(app)

def test_schedule_pickup():
    db = SessionLocal()
    try:
        # 1. Find an NGO user
        ngo_user = db.query(User).filter(User.role == "NGO").first()
        if not ngo_user:
            print("No NGO user found.")
            return

        print(f"Testing with NGO: {ngo_user.email}")
        ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == ngo_user.id).first()

        # 2. Find a donation request belonging to this NGO
        req = db.query(DonationRequest).filter(DonationRequest.ngo_id == ngo_profile.id).first()
        if not req:
            print(f"No donation requests found for NGO {ngo_user.email}.")
            return
            
        print(f"Testing with DonationRequest ID: {req.id}")

        donation = db.query(Donation).filter(Donation.id == req.donation_id).first()
        # Set status to something valid for pickup scheduling
        donation.status = DonationStatus.PACKAGING_NOTIFIED
        db.commit()

        # 3. Get JWT token
        response = client.post("/auth/login", data={"username": ngo_user.email, "password": "password123"})
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 4. Schedule pickup
        payload = {
            "date": "2026-10-01T00:00:00",
            "time_slot": "10:00 AM - 12:00 PM",
            "volunteer": "John Doe",
            "notes": "Please leave at front desk."
        }
        
        resp = client.post(f"/ngos/donation-requests/{req.id}/schedule-pickup", json=payload, headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            print("SUCCESS! Response data:")
            print(data)
            
            # Verify DB states
            pickup = db.query(Pickup).filter(Pickup.id == data["id"]).first()
            print(f"DB Pickup volunteer: {pickup.volunteer}, notes: {pickup.notes}")
            
            history = db.query(DonationStatusHistory).filter(DonationStatusHistory.donation_id == donation.id).order_by(DonationStatusHistory.id.desc()).first()
            print(f"DB History new_status: {history.new_status}")
            
            notif = db.query(Notification).filter(Notification.user_id == donation.donor_id).order_by(Notification.id.desc()).first()
            print(f"DB Donor Notification: {notif.message if notif else 'None'}")
        else:
            print(f"Failed with {resp.status_code}: {resp.text}")

    finally:
        db.close()

if __name__ == "__main__":
    test_schedule_pickup()
