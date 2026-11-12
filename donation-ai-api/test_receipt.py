from app.database import SessionLocal
from app.db_models import Donation, DonationStatus, NGOProfile, User, DonationReceipt, DonationReceiptItem, DonationRequest, DonationRequestStatus, DonationStatusHistory
from app.schemas import ReceiptCreate, ReceiptItemCreate
from app.db_models import ItemCondition
from sqlalchemy.orm import Session

def run_test():
    db = SessionLocal()
    try:
        donation_id = 7 # Based on the screenshot it says "Donation #7"
        
        donation = db.query(Donation).filter(Donation.id == donation_id).first()
        if not donation:
            print(f"Donation {donation_id} not found")
            return
            
        print(f"Found donation {donation.id} with status {donation.status}")
        print(f"Items:")
        for item in donation.items:
            print(f"  - {item.id}: {item.item_name}, qty: {item.quantity}")
            
        # Simulate NGO profile
        ngo_profile = db.query(NGOProfile).first()
        current_user = db.query(User).filter(User.id == ngo_profile.user_id).first()
        
        # Simulate payload
        class ItemData:
            def __init__(self, id, ex, recv, cond):
                self.donation_item_id = id
                self.expected_quantity = ex
                self.received_quantity = recv
                self.condition = cond
                
        class PayloadData:
            def __init__(self, items, notes):
                self.items = items
                self.notes = notes
                
        receipt_data = PayloadData(
            items=[ItemData(item.id, item.quantity, item.quantity, ItemCondition.GOOD) for item in donation.items],
            notes="Test"
        )
        
        print("Creating receipt...")
        receipt = DonationReceipt(
            donation_id=donation_id,
            ngo_id=ngo_profile.id,
            notes=receipt_data.notes,
            confirmed_by_id=current_user.id
        )
        db.add(receipt)
        db.flush()
        
        print(f"Receipt created with id {receipt.id}")
        
        for item in receipt_data.items:
            receipt_item = DonationReceiptItem(
                receipt_id=receipt.id,
                donation_item_id=item.donation_item_id,
                expected_quantity=item.expected_quantity,
                received_quantity=item.received_quantity,
                condition=item.condition.value if hasattr(item.condition, 'value') else item.condition
            )
            db.add(receipt_item)
            
        print("Receipt items created")
        
        # Update donation status
        old_status = donation.status
        donation.status = DonationStatus.RECEIVED
        
        # Update DonationRequest status
        req = db.query(DonationRequest).filter(DonationRequest.donation_id == donation.id).first()
        if req:
            req.status = DonationRequestStatus.RECEIVED
            
        print("Status updated")
        
        # Add history
        history = DonationStatusHistory(
            donation_id=donation.id,
            old_status=old_status.value if hasattr(old_status, 'value') else str(old_status),
            new_status=DonationStatus.RECEIVED,
            changed_by_id=current_user.id,
            notes="NGO confirmed receipt via Verification Form."
        )
        db.add(history)
        
        print("History created")
        
        # Try commit
        db.commit()
        print("SUCCESS!")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR OCCURRED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
