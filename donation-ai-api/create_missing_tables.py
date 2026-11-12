from app.database import engine
from app.db_models import Base

# This will create tables that don't exist yet, like donation_receipts and donation_receipt_items
Base.metadata.create_all(bind=engine)
print("Missing tables created successfully!")
