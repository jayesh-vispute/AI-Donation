from app.database import SessionLocal
from sqlalchemy import text

def add_enum_values():
    db = SessionLocal()
    try:
        # For donationstatus
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'MATCHED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'PACKAGING_NOTIFIED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'PACKED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'SEALED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'PICKUP_SCHEDULED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'PICKUP_CONFIRMED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'COLLECTED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'PICKED_UP'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'DELIVERED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'RECEIVED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'DISTRIBUTED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'COMPLETED'"))
        db.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'CANCELLED'"))
        
        # For donationrequeststatus
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'MATCHED'"))
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'PICKUP_SCHEDULED'"))
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'PICKUP_CONFIRMED'"))
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'COLLECTED'"))
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'DELIVERED'"))
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'RECEIVED'"))
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED'"))
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'DISTRIBUTED'"))
        db.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'COMPLETED'"))
        
        db.commit()
        print("Successfully added enum values to PostgreSQL.")
    except Exception as e:
        print("Error:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_enum_values()
