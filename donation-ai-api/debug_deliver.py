from app.database import SessionLocal
from app.db_models import Donation, DonationStatus, DonationRequest, DonationRequestStatus
from sqlalchemy.orm import Session

def debug_status_update():
    db = SessionLocal()
    try:
        # Find donation 34 (from request 7)
        donation = db.query(Donation).filter(Donation.id == 34).first()
        if not donation:
            print("Donation not found")
            return
            
        print(f"Current Donation Status: {donation.status}")
        
        req = db.query(DonationRequest).filter(DonationRequest.donation_id == donation.id).first()
        if req:
            print(f"Current Request Status: {req.status}")
            
        # Try to execute exactly what the route does
        donation.status = DonationStatus.DELIVERED
        if req:
            req.status = DonationRequestStatus.DELIVERED
            
        db.commit()
        print("Success!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    debug_status_update()
