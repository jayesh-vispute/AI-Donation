from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.db_models import User, NGOProfile, DonationRequest, Donation, Pickup
from app.services.auth import create_access_token

client = TestClient(app)
db = SessionLocal()

req = db.query(DonationRequest).filter(DonationRequest.id == 7).first()
if not req:
    print("Request 7 not found")
    exit()

ngo_profile = db.query(NGOProfile).filter(NGOProfile.id == req.ngo_id).first()
if not ngo_profile:
    print("NGO profile not found")
    exit()

user = db.query(User).filter(User.id == ngo_profile.user_id).first()
if not user:
    print("User not found")
    exit()

pickup = db.query(Pickup).filter(Pickup.donation_id == req.donation_id).first()
if not pickup:
    print("Pickup not found")
    exit()

print(f"Request ID: {req.id}")
print(f"Donation ID: {req.donation_id}")
print(f"Pickup ID: {pickup.id}")
print(f"Donor ID: {pickup.donor_id}")
print(f"NGO ID: {pickup.ngo_id}")
print(f"Current Pickup Status: {pickup.status}")

access_token = create_access_token(data={"sub": user.email})
headers = {"Authorization": f"Bearer {access_token}"}

response = client.patch(
    f"/pickup/{pickup.id}",
    json={"status": "CONFIRMED"},
    headers=headers
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
