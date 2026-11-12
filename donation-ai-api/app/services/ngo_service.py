from sqlalchemy.orm import Session
from app.db_models import User, NGOProfile, VerificationStatus, AccountStatus

def get_or_create_ngo_profile(db: Session, user: User) -> NGOProfile:
    """
    Retrieves the NGOProfile associated with the user.
    If no profile exists yet, provisions a valid default profile automatically
    so that dashboard, demands, inventory, and analytics work seamlessly.
    """
    profile = db.query(NGOProfile).filter(NGOProfile.user_id == user.id).first()
    if not profile:
        org_name = f"{user.full_name} Foundation" if user.full_name else "Community Care Foundation"
        profile = NGOProfile(
            user_id=user.id,
            organization_name=org_name,
            registration_number=f"REG-NGO-{user.id:04d}",
            description="Dedicated to resource distribution, community empowerment, and donation matching.",
            contact_person=user.full_name or "Program Coordinator",
            email=user.email,
            phone=user.phone or "9876543210",
            address="123 Community Outreach Center",
            city="Hyderabad",
            state="Telangana",
            postal_code="500001",
            latitude=17.3850,
            longitude=78.4867,
            verification_status=VerificationStatus.APPROVED,
            account_status=AccountStatus.ACTIVE,
            is_active=True
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile
