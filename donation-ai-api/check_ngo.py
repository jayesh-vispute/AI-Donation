import asyncio
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import sys
sys.path.append('c:/Users/palla/Desktop/Donation_AI/donation-ai-api')
from app.db_models import Donation, NGOProfile, User
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

donation = db.query(Donation).filter(Donation.id == 34).first()
print(f"Donation Status: {donation.status}")
ngo = db.query(NGOProfile).filter(NGOProfile.id == donation.ngo_id).first()
user = db.query(User).filter(User.id == ngo.user_id).first()
print(f"NGO Email: {user.email}")
print(f"NGO Password: {user.hashed_password}")
