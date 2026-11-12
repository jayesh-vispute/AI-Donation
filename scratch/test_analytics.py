import sys
import os

sys.path.append(os.path.abspath("c:/Users/palla/Desktop/Donation_AI/donation-ai-api"))

from app.database import SessionLocal
from app.db_models import User, NGOProfile, DonationReceipt, Donation
from app.routes.ngos import get_ngo_analytics

db = SessionLocal()

try:
    profile = db.query(NGOProfile).first()
    if not profile:
        print("No NGO Profile found")
    else:
        ngo_user = db.query(User).filter(User.id == profile.user_id).first()
        print(f"Testing analytics for NGO Profile: '{profile.organization_name}' (User: {ngo_user.email}, user_id: {ngo_user.id})")
        res = get_ngo_analytics(db=db, current_user=ngo_user)
        print("SUCCESS! Analytics response:")
        print(f"  totalDonationsReceived: {res['totalDonationsReceived']}")
        print(f"  totalItemsReceived: {res['totalItemsReceived']}")
        print(f"  activeNeeds: {res['activeNeeds']}")
        print(f"  fulfilledNeeds: {res['fulfilledNeeds']}")
        print(f"  recentActivity count: {len(res['recentActivity'])}")
        for act in res['recentActivity']:
            print(f"    - {act['title']} | {act['subtitle']} | {act['date']}")
finally:
    db.close()
