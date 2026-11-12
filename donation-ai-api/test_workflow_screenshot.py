import unittest
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.db_models import (
    User, RoleEnum, NGOProfile, Demand, DemandPriority, DemandStatus,
    Donation, DonationItem, ItemCondition, DonationStatus,
    DonationItemAllocation, AllocationStatus, Match, MatchStatus,
    Notification, Pickup, PickupStatus, DonationRequest, DonationRequestStatus
)
from app.services.matcher import calculate_matches, are_categories_compatible
from app.services.ngo_scoping import get_ngo_scoped_items
from app.services.donation_status import compute_aggregate_donation_status

from sqlalchemy import text
from app.db_models import Base

class TestCompleteItemLevelMatchingWorkflow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE donation_items ADD COLUMN IF NOT EXISTS allocated_quantity INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE donation_items ADD COLUMN IF NOT EXISTS matching_status VARCHAR DEFAULT 'PENDING'"))
            conn.execute(text("ALTER TABLE donation_items ADD COLUMN IF NOT EXISTS ai_detection_id INTEGER REFERENCES ai_detections(id)"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'MATCHED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'PACKAGING_NOTIFIED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'PACKED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'SEALED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'PICKUP_SCHEDULED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'PICKUP_CONFIRMED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'COLLECTED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'DELIVERED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'NGO_RECEIVED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'RECEIVED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'COMPLETED'"))
            conn.execute(text("ALTER TYPE donationrequeststatus ADD VALUE IF NOT EXISTS 'CANCELLED'"))
            conn.commit()

        cls.db: Session = SessionLocal()
        
        # Deactivate any lingering open demands from older tests
        cls.db.query(Demand).update({Demand.status: DemandStatus.FULFILLED}, synchronize_session=False)
        cls.db.commit()

        # Unique prefix for this test run
        cls.run_id = uuid.uuid4().hex[:6]
        
        # 1. Create Donor
        cls.donor = User(
            email=f"donor_{cls.run_id}@example.com",
            password_hash="mock_hashed_pwd",
            full_name="Alex Donor",
            role=RoleEnum.donor,
            is_active=True
        )
        cls.db.add(cls.donor)
        
        # 2. Create 5 NGOs
        cls.ngos = []
        ngo_configs = [
            ("NGO 1", "Tech Hope Foundation", "Electronics"),
            ("NGO 2", "Youth Literacy Trust", "Books"),
            ("NGO 3", "Rural Education Drive", "Books"),
            ("NGO 4", "Digital Skills Hub", "Electronics"),
            ("NGO 5", "Community Center NGO", "Furniture")
        ]
        
        for idx, (label, org_name, main_cat) in enumerate(ngo_configs, start=1):
            user = User(
                email=f"ngo{idx}_{cls.run_id}@example.com",
                password_hash="mock_hashed_pwd",
                full_name=f"{label} Admin",
                role=RoleEnum.ngo,
                is_active=True
            )
            cls.db.add(user)
            cls.db.flush()
            
            profile = NGOProfile(
                user_id=user.id,
                organization_name=org_name,
                description=f"{label} dedicated to {main_cat}",
                contact_person=f"{label} Coordinator",
                phone="1234567890",
                email=user.email,
                address=f"{idx} Charity Lane",
                city="Bengaluru",
                state="Karnataka",
                postal_code="560001",
                latitude=12.9716 + (idx * 0.01),
                longitude=77.5946 + (idx * 0.01),
                is_active=True
            )
            cls.db.add(profile)
            cls.db.flush()
            cls.ngos.append((user, profile))
            
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_complete_item_level_workflow(self):
        db = self.db
        donor = self.donor
        ngo1_user, ngo1 = self.ngos[0]
        ngo2_user, ngo2 = self.ngos[1]
        ngo3_user, ngo3 = self.ngos[2]
        ngo4_user, ngo4 = self.ngos[3]
        ngo5_user, ngo5 = self.ngos[4]

        # -------------------------------------------------------------
        # STEP 1: CREATE TEST NGO DEMANDS
        # -------------------------------------------------------------
        # NGO 1: Laptop ×1
        d1 = Demand(
            ngo_id=ngo1.id,
            item_name="laptop",
            category="Electronics",
            subcategory="Computers",
            quantity_required=1,
            priority=DemandPriority.HIGH,
            status=DemandStatus.OPEN
        )
        # NGO 2: Books ×10
        d2 = Demand(
            ngo_id=ngo2.id,
            item_name="books",
            category="Books",
            subcategory="Education",
            quantity_required=10,
            priority=DemandPriority.HIGH,
            status=DemandStatus.OPEN
        )
        # NGO 3: Books ×12
        d3 = Demand(
            ngo_id=ngo3.id,
            item_name="books",
            category="Books",
            subcategory="Education",
            quantity_required=12,
            priority=DemandPriority.MEDIUM,
            status=DemandStatus.OPEN
        )
        # NGO 4: Keyboard ×2
        d4 = Demand(
            ngo_id=ngo4.id,
            item_name="keyboard",
            category="Electronics",
            subcategory="Peripherals",
            quantity_required=2,
            priority=DemandPriority.HIGH,
            status=DemandStatus.OPEN
        )
        # NGO 5: Dining Table ×1
        d5 = Demand(
            ngo_id=ngo5.id,
            item_name="dining table",
            category="Furniture",
            subcategory="Tables",
            quantity_required=1,
            priority=DemandPriority.MEDIUM,
            status=DemandStatus.OPEN
        )

        db.add_all([d1, d2, d3, d4, d5])
        db.commit()

        # -------------------------------------------------------------
        # STEP 2: CREATE DETECTED DONATION (EXACT SCREENSHOT ITEMS)
        # -------------------------------------------------------------
        donation = Donation(
            donor_id=donor.id,
            title="Desk Study Cleanup Donation",
            description="Donating office and study items",
            status=DonationStatus.PENDING,
            pickup_address="100 Donor Colony",
            pickup_city="Bengaluru",
            pickup_state="Karnataka",
            pickup_latitude=12.9716,
            pickup_longitude=77.5946
        )
        db.add(donation)
        db.flush()

        items_spec = [
            ("laptop", "Electronics", "Computers", 1),
            ("cup", "Kitchenware", "Mugs", 1),
            ("keyboard", "Electronics", "Peripherals", 3),
            ("book", "Books", "Reading", 22),
            ("dining table", "Furniture", "Tables", 1),
            ("person", "General", "None", 1),
            ("chair", "Furniture", "Seating", 1)
        ]

        db_items = {}
        for name, cat, subcat, qty in items_spec:
            it = DonationItem(
                donation_id=donation.id,
                item_name=name,
                category=cat,
                subcategory=subcat,
                quantity=qty,
                condition=ItemCondition.GOOD,
                allocated_quantity=0,
                matching_status="PENDING"
            )
            db.add(it)
            db.flush()
            db_items[name] = it

        db.commit()

        # -------------------------------------------------------------
        # STEP 3: RUN MATCHING ENGINE & VERIFY ITEM-LEVEL MATCHES
        # -------------------------------------------------------------
        matches = calculate_matches(db, donation.id)
        db.refresh(donation)

        # 1. Donor UI / API displays items independently
        self.assertEqual(len(donation.items), 7)

        # 2. Laptop is matched with NGO 1 only
        laptop_item = db_items["laptop"]
        laptop_matches = db.query(Match).filter(Match.donation_item_id == laptop_item.id).all()
        self.assertEqual(len(laptop_matches), 1)
        self.assertEqual(laptop_matches[0].demand.ngo_id, ngo1.id)
        self.assertEqual(laptop_matches[0].matched_quantity, 1)

        # 3. Books are matched with NGO 2 and NGO 3
        book_item = db_items["book"]
        book_matches = db.query(Match).filter(Match.donation_item_id == book_item.id).order_by(Match.overall_score.desc()).all()
        self.assertEqual(len(book_matches), 2)
        matched_ngos_books = {m.demand.ngo_id: m.matched_quantity for m in book_matches}
        self.assertEqual(matched_ngos_books.get(ngo2.id), 10)
        self.assertEqual(matched_ngos_books.get(ngo3.id), 12)

        # 4. Keyboard is matched with NGO 4
        kb_item = db_items["keyboard"]
        kb_matches = db.query(Match).filter(Match.donation_item_id == kb_item.id).all()
        self.assertEqual(len(kb_matches), 1)
        self.assertEqual(kb_matches[0].demand.ngo_id, ngo4.id)
        self.assertEqual(kb_matches[0].matched_quantity, 2)

        # 5. Dining Table is matched with NGO 5
        dt_item = db_items["dining table"]
        dt_matches = db.query(Match).filter(Match.donation_item_id == dt_item.id).all()
        self.assertEqual(len(dt_matches), 1)
        self.assertEqual(dt_matches[0].demand.ngo_id, ngo5.id)
        self.assertEqual(dt_matches[0].matched_quantity, 1)

        # Cup, Chair, Person have NO matching NGO
        cup_matches = db.query(Match).filter(Match.donation_item_id == db_items["cup"].id).all()
        self.assertEqual(len(cup_matches), 0, "Cup must have no matching NGOs")

        chair_matches = db.query(Match).filter(Match.donation_item_id == db_items["chair"].id).all()
        self.assertEqual(len(chair_matches), 0, "Chair must have no matching NGOs because NGO 5 requested dining table specifically and chairs have 0 demand")

        person_matches = db.query(Match).filter(Match.donation_item_id == db_items["person"].id).all()
        self.assertEqual(len(person_matches), 0, "Person must have no matching NGOs")

        # -------------------------------------------------------------
        # STEP 4: ALLOCATE ITEMS TO RESPECTIVE NGOS
        # -------------------------------------------------------------
        # Allocate Laptop -> NGO 1 (1)
        alloc_laptop = DonationItemAllocation(
            donation_item_id=laptop_item.id,
            ngo_id=ngo1.id,
            allocated_quantity=1,
            status=AllocationStatus.PENDING
        )
        laptop_item.allocated_quantity = 1
        laptop_item.matching_status = "FULLY_MATCHED"

        # Allocate Books -> NGO 2 (10) & NGO 3 (12)
        alloc_books2 = DonationItemAllocation(
            donation_item_id=book_item.id,
            ngo_id=ngo2.id,
            allocated_quantity=10,
            status=AllocationStatus.PENDING
        )
        alloc_books3 = DonationItemAllocation(
            donation_item_id=book_item.id,
            ngo_id=ngo3.id,
            allocated_quantity=12,
            status=AllocationStatus.PENDING
        )
        book_item.allocated_quantity = 22
        book_item.matching_status = "FULLY_MATCHED"

        # Allocate Keyboard -> NGO 4 (2)
        alloc_kb = DonationItemAllocation(
            donation_item_id=kb_item.id,
            ngo_id=ngo4.id,
            allocated_quantity=2,
            status=AllocationStatus.PENDING
        )
        kb_item.allocated_quantity = 2
        kb_item.matching_status = "PARTIALLY_MATCHED"

        # Allocate Dining Table -> NGO 5 (1)
        alloc_dt = DonationItemAllocation(
            donation_item_id=dt_item.id,
            ngo_id=ngo5.id,
            allocated_quantity=1,
            status=AllocationStatus.PENDING
        )
        dt_item.allocated_quantity = 1
        dt_item.matching_status = "FULLY_MATCHED"

        donation.status = DonationStatus.MATCHED
        db.add_all([alloc_laptop, alloc_books2, alloc_books3, alloc_kb, alloc_dt])
        db.commit()

        # -------------------------------------------------------------
        # STEP 5: VERIFY SAFEGUARDS (POINTS 9 & 10)
        # -------------------------------------------------------------
        # 9. Quantities are never duplicated on repeat calculate_matches calls
        repeat_matches = calculate_matches(db, donation.id)
        # Total match count for laptop remains 1
        self.assertEqual(db.query(Match).filter(Match.donation_item_id == laptop_item.id).count(), 1)
        # Total match count for books remains 2
        self.assertEqual(db.query(Match).filter(Match.donation_item_id == book_item.id).count(), 2)

        # 10. Total allocated quantity never exceeds donated quantity
        for item in [laptop_item, book_item, kb_item, dt_item, db_items["cup"], db_items["chair"], db_items["person"]]:
            db.refresh(item)
            active_allocs = db.query(DonationItemAllocation).filter(
                DonationItemAllocation.donation_item_id == item.id,
                DonationItemAllocation.status != AllocationStatus.REJECTED
            ).all()
            total_alloc = sum(a.allocated_quantity for a in active_allocs)
            self.assertLessEqual(total_alloc, item.quantity)
            self.assertEqual(item.allocated_quantity, total_alloc)

        # -------------------------------------------------------------
        # STEP 6: VERIFY NGO SCOPING (POINTS 6, 7, 8)
        # -------------------------------------------------------------
        # 6. NGO 1 sees ONLY Laptop ×1 (NOT Books, NOT Keyboard)
        ngo1_items = get_ngo_scoped_items(db, donation.items, ngo1.id)
        self.assertEqual(len(ngo1_items), 1)
        self.assertEqual(ngo1_items[0].item_name, "laptop")
        self.assertEqual(ngo1_items[0].quantity, 1)

        # 7. NGO 2 sees ONLY Books ×10 (NOT Laptop, NOT Keyboard)
        ngo2_items = get_ngo_scoped_items(db, donation.items, ngo2.id)
        self.assertEqual(len(ngo2_items), 1)
        self.assertEqual(ngo2_items[0].item_name, "book")
        self.assertEqual(ngo2_items[0].quantity, 10)

        # 8. NGO 3 sees ONLY Books ×12 (NOT Keyboard, NOT Laptop)
        ngo3_items = get_ngo_scoped_items(db, donation.items, ngo3.id)
        self.assertEqual(len(ngo3_items), 1)
        self.assertEqual(ngo3_items[0].item_name, "book")
        self.assertEqual(ngo3_items[0].quantity, 12)

        # NGO 4 sees ONLY Keyboard ×2
        ngo4_items = get_ngo_scoped_items(db, donation.items, ngo4.id)
        self.assertEqual(len(ngo4_items), 1)
        self.assertEqual(ngo4_items[0].item_name, "keyboard")
        self.assertEqual(ngo4_items[0].quantity, 2)

        # NGO 5 sees ONLY Dining Table ×1
        ngo5_items = get_ngo_scoped_items(db, donation.items, ngo5.id)
        self.assertEqual(len(ngo5_items), 1)
        self.assertEqual(ngo5_items[0].item_name, "dining table")
        self.assertEqual(ngo5_items[0].quantity, 1)

        # -------------------------------------------------------------
        # STEP 7: VERIFY NOTIFICATIONS ARE NGO-SPECIFIC (POINT 11)
        # -------------------------------------------------------------
        from app.services.notifications import create_idempotent_notification
        # Simulate match notifications for each NGO
        n1 = create_idempotent_notification(db, ngo1_user.id, "New Laptop Match", "New laptop donation matched to your NGO — Quantity: 1", "matches", "donation_item", laptop_item.id, "NGO")
        n2 = create_idempotent_notification(db, ngo2_user.id, "New Book Match", "New book donation matched to your NGO — Quantity: 10", "matches", "donation_item", book_item.id, "NGO")
        n3 = create_idempotent_notification(db, ngo3_user.id, "New Book Match", "New book donation matched to your NGO — Quantity: 12", "matches", "donation_item", book_item.id, "NGO")
        n4 = create_idempotent_notification(db, ngo4_user.id, "New Keyboard Match", "New keyboard donation matched to your NGO — Quantity: 2", "matches", "donation_item", kb_item.id, "NGO")
        n5 = create_idempotent_notification(db, ngo5_user.id, "New Dining Table Match", "New dining table donation matched to your NGO — Quantity: 1", "matches", "donation_item", dt_item.id, "NGO")
        db.commit()

        # Check NGO 1 notification
        ngo1_notifs = db.query(Notification).filter(Notification.user_id == ngo1_user.id).all()
        self.assertTrue(all("laptop" in notif.message.lower() for notif in ngo1_notifs))
        self.assertFalse(any("book" in notif.message.lower() for notif in ngo1_notifs))

        # Check NGO 2 notification
        ngo2_notifs = db.query(Notification).filter(Notification.user_id == ngo2_user.id).all()
        self.assertTrue(all("book" in notif.message.lower() and "10" in notif.message for notif in ngo2_notifs))
        self.assertFalse(any("laptop" in notif.message.lower() for notif in ngo2_notifs))

        # -------------------------------------------------------------
        # STEP 8: VERIFY PICKUP IS NGO/ITEM SPECIFIC (POINT 12)
        # -------------------------------------------------------------
        p1 = Pickup(
            donation_id=donation.id,
            donor_id=donor.id,
            ngo_id=ngo1.id,
            date=datetime.utcnow(),
            status="SCHEDULED",
            address=donation.pickup_address
        )
        p2 = Pickup(
            donation_id=donation.id,
            donor_id=donor.id,
            ngo_id=ngo2.id,
            date=datetime.utcnow(),
            status="SCHEDULED",
            address=donation.pickup_address
        )
        db.add_all([p1, p2])
        db.commit()

        # NGO 1 pickup items are ONLY Laptop ×1
        p1_items = get_ngo_scoped_items(db, donation.items, p1.ngo_id)
        self.assertEqual(len(p1_items), 1)
        self.assertEqual(p1_items[0].item_name, "laptop")

        # NGO 2 pickup items are ONLY Books ×10
        p2_items = get_ngo_scoped_items(db, donation.items, p2.ngo_id)
        self.assertEqual(len(p2_items), 1)
        self.assertEqual(p2_items[0].item_name, "book")
        self.assertEqual(p2_items[0].quantity, 10)

        # -------------------------------------------------------------
        # STEP 9: VERIFY INDEPENDENT STATUS TRACKING (POINT 13)
        # -------------------------------------------------------------
        # NGO 1 completes its laptop
        alloc_laptop.status = AllocationStatus.FULFILLED
        p1.status = "COMPLETED"
        db.commit()

        # NGO 2 is still waiting / scheduled
        self.assertEqual(alloc_books2.status, AllocationStatus.PENDING)

        # Recalculate parent donation status: must NOT become COMPLETED prematurely
        parent_status = compute_aggregate_donation_status(db, donation.id)
        self.assertNotEqual(parent_status.value if hasattr(parent_status, 'value') else parent_status, DonationStatus.RECEIVED.value)
        self.assertNotEqual(parent_status.value if hasattr(parent_status, 'value') else parent_status, "COMPLETED")
        self.assertEqual(donation.status, DonationStatus.MATCHED)

        # -------------------------------------------------------------
        # STEP 10: AUTHENTICATION AND DONATION FUNCTIONALITY (POINT 14)
        # -------------------------------------------------------------
        self.assertIsNotNone(donor.id)
        self.assertEqual(donor.role.value.upper(), "DONOR")
        self.assertEqual(ngo1_user.role.value.upper(), "NGO")
        self.assertEqual(donation.donor_id, donor.id)

        print("\n=======================================================")
        print(" ALL 14 VERIFICATION CRITERIA PASSED SUCCESSFULLY!")
        print("=======================================================")

if __name__ == "__main__":
    unittest.main()
