import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.db_models import User, RoleEnum, NGOProfile
from app.services.auth import get_password_hash

def seed_demo_accounts():
    db = SessionLocal()
    try:
        print("Seeding demo accounts...")
        # Admin Demo
        if not db.query(User).filter(User.email == "admin@demo.com").first():
            admin = User(
                email="admin@demo.com",
                password_hash=get_password_hash("demo123"),
                full_name="Admin Demo",
                role=RoleEnum.ADMIN
            )
            db.add(admin)

        # Donor Demo
        if not db.query(User).filter(User.email == "donor@demo.com").first():
            donor = User(
                email="donor@demo.com",
                password_hash=get_password_hash("demo123"),
                full_name="Donor Demo",
                role=RoleEnum.DONOR
            )
            db.add(donor)

        # NGO Demo
        if not db.query(User).filter(User.email == "ngo@demo.com").first():
            ngo_user = User(
                email="ngo@demo.com",
                password_hash=get_password_hash("demo123"),
                full_name="NGO Demo",
                role=RoleEnum.NGO
            )
            db.add(ngo_user)
            db.commit() # Commit to get ID
            db.refresh(ngo_user)

            ngo_profile = NGOProfile(
                user_id=ngo_user.id,
                organization_name="Demo NGO Foundation"
            )
            db.add(ngo_profile)

        db.commit()
        print("Demo accounts seeded successfully!")
        print("You can now use the 'Admin Demo', 'NGO Demo', and 'Donor Demo' buttons on the login page.")
        
    except Exception as e:
        print(f"Failed to seed demo accounts: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_accounts()
