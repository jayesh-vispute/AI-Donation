import sys
sys.path.append('c:/Users/palla/Desktop/Donation_AI/donation-ai-api')
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.db_models import Donation, NGOProfile, User, DonationStatus, DonationRequestStatus, DonationRequest, DonationReceipt, DonationReceiptItem, DonationStatusHistory, Notification

client = TestClient(app)
db = SessionLocal()

donation_id = 34

donation = db.query(Donation).filter(Donation.id == donation_id).first()
if not donation:
    print(f"Error: Donation {donation_id} not found.")
    exit(1)

ngo = db.query(NGOProfile).filter(NGOProfile.id == donation.ngo_id).first()
user = db.query(User).filter(User.id == ngo.user_id).first()

print(f"1. Login as the correct NGO: {user.email}")
# We can bypass login and manually set current_user in dependencies, or just call the login endpoint
login_data = {"username": user.email, "password": "password123"}
# Let's override the auth dependency instead for TestClient
from app.services.auth import get_current_user
app.dependency_overrides[get_current_user] = lambda: user

print(f"2. Open Donation #{donation_id}")
print(f"Current Status: {donation.status.value}")

print("4. Verify Lamp and Sofa details")
items_payload = []
for item in donation.items:
    print(f" - {item.item_name}: Expected {item.quantity}")
    items_payload.append({
        "donation_item_id": item.id,
        "expected_quantity": item.quantity,
        "received_quantity": item.quantity,
        "condition": "GOOD"
    })

print("5. Submit receipt")
payload = {
    "items": items_payload,
    "notes": "End-to-End Test"
}

response = client.post(f"/status/donations/{donation_id}/receipt", json=payload)
print(f"6. Verify HTTP response: {response.status_code}")
print(response.json())

db.expire_all()
donation = db.query(Donation).filter(Donation.id == donation_id).first()

print("7. Verify receipt database record")
receipt = db.query(DonationReceipt).filter(DonationReceipt.donation_id == donation_id).first()
print(f" - Receipt Found: {receipt is not None}")

print("8. Verify receipt item records")
receipt_items = db.query(DonationReceiptItem).filter(DonationReceiptItem.receipt_id == receipt.id).all() if receipt else []
print(f" - Items Found: {len(receipt_items)}")

print("9. Verify Donation status")
print(f" - Donation Status: {donation.status.value}")

print("10. Verify status history")
history = db.query(DonationStatusHistory).filter(DonationStatusHistory.donation_id == donation_id).order_by(DonationStatusHistory.created_at.desc()).first()
print(f" - History Found: {history is not None}, Transition: {history.old_status} -> {history.new_status.value}")

print("11. Verify notification")
notif = db.query(Notification).filter(Notification.related_entity_id == donation_id, Notification.title == "Donation Received").first()
print(f" - Notification Found: {notif is not None}")

req = db.query(DonationRequest).filter(DonationRequest.donation_id == donation_id).first()
if req:
    print(f"12. Verify Request Status: {req.status.value}")

print("End-to-End test completed.")
