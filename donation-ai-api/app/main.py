import os
os.environ["YOLO_CONFIG_DIR"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".ultralytics"))
os.environ["ULTRALYTICS_CONFIG_DIR"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".ultralytics"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routes import health, prediction, demands, donations, matches, auth, ngos, status, admin, categories, inventory, notifications, donor, cart, pickup, packaging
from app.model import load_model
from app.database import engine, Base
import app.db_models as db_models

import sys
import os
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database.")
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        sys.exit(1)

    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate notifications table
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR"))
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_entity_id INTEGER"))
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_role VARCHAR"))
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS donation_id INTEGER"))
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ngo_id INTEGER"))
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS donor_id INTEGER"))
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS match_id INTEGER"))
            
            # NGO Profiles
            conn.execute(text("ALTER TABLE ngo_profiles ADD COLUMN IF NOT EXISTS website VARCHAR"))
            conn.execute(text("ALTER TABLE ngo_profiles ADD COLUMN IF NOT EXISTS organization_type VARCHAR"))
            conn.execute(text("ALTER TABLE ngo_profiles ADD COLUMN IF NOT EXISTS logo_url VARCHAR"))
            conn.execute(text("ALTER TABLE ngo_profiles ADD COLUMN IF NOT EXISTS registration_certificate_url VARCHAR"))
            conn.execute(text("ALTER TABLE ngo_profiles ADD COLUMN IF NOT EXISTS pan_card_url VARCHAR"))
            conn.execute(text("ALTER TABLE ngo_profiles ADD COLUMN IF NOT EXISTS address_proof_url VARCHAR"))

            # Subcategory auto-migrations
            conn.execute(text("ALTER TABLE ai_detections ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))
            conn.execute(text("ALTER TABLE donation_items ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))
            conn.execute(text("ALTER TABLE donation_items ADD COLUMN IF NOT EXISTS allocated_quantity INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE donation_items ADD COLUMN IF NOT EXISTS matching_status VARCHAR DEFAULT 'PENDING'"))
            conn.execute(text("ALTER TABLE donation_items ADD COLUMN IF NOT EXISTS ai_detection_id INTEGER REFERENCES ai_detections(id)"))
            conn.execute(text("ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))
            conn.execute(text("ALTER TABLE demands ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))
            conn.execute(text("ALTER TABLE inventory ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))
            conn.execute(text("ALTER TABLE matches ADD COLUMN IF NOT EXISTS distance_km DOUBLE PRECISION"))
            
            # Pickup migrations
            conn.execute(text("ALTER TABLE pickups ADD COLUMN IF NOT EXISTS volunteer VARCHAR"))
            conn.execute(text("ALTER TABLE pickups ADD COLUMN IF NOT EXISTS notes TEXT"))
            
            # Delivery proof migrations
            conn.execute(text("ALTER TABLE donations ADD COLUMN IF NOT EXISTS delivery_proof_url VARCHAR"))
            conn.execute(text("ALTER TABLE delivery_otps ADD COLUMN IF NOT EXISTS delivery_photo_url VARCHAR"))
            
            # Enum migrations
            conn.execute(text("ALTER TYPE donationstatus ADD VALUE IF NOT EXISTS 'RECEIVED'"))
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
    except Exception as e:
        logger.warning(f"Migration skipped/failed: {e}")

    # Startup Data Reconciliation to preserve existing completed workflows and sync item states
    try:
        from app.database import SessionLocal
        from app.db_models import Donation, DonationItem, DonationItemAllocation, AllocationStatus, DonationRequest, DonationStatus, DonationReceipt
        with SessionLocal() as db:
            # 1. Backfill donation.ngo_id if missing from active allocations or requests
            donations = db.query(Donation).filter(Donation.ngo_id == None).all()
            for don in donations:
                resolved_id = None
                alloc = db.query(DonationItemAllocation).join(DonationItem).filter(
                    DonationItem.donation_id == don.id,
                    DonationItemAllocation.allocated_quantity > 0
                ).first()
                if alloc:
                    resolved_id = alloc.ngo_id
                else:
                    req = db.query(DonationRequest).filter(DonationRequest.donation_id == don.id).first()
                    if req:
                        resolved_id = req.ngo_id
                if resolved_id:
                    don.ngo_id = resolved_id
            
            # 2. Backfill DonationItem allocated_quantity and matching_status
            items = db.query(DonationItem).all()
            for it in items:
                allocs = db.query(DonationItemAllocation).filter(DonationItemAllocation.donation_item_id == it.id).all()
                if allocs:
                    total_alloc = sum(a.allocated_quantity for a in allocs)
                    it.allocated_quantity = total_alloc
                    has_fulfilled = any(a.status == AllocationStatus.FULFILLED for a in allocs)
                    if has_fulfilled:
                        it.matching_status = "FULFILLED"
                    elif total_alloc >= (it.quantity or 1):
                        it.matching_status = "FULLY_MATCHED"
                    elif total_alloc > 0:
                        it.matching_status = "PARTIALLY_MATCHED"
            
            # 3. Preserve final status for donations that have physical receipt records
            receipt_donations = db.query(Donation).join(DonationReceipt, DonationReceipt.donation_id == Donation.id).all()
            for rdon in receipt_donations:
                if rdon.status not in [DonationStatus.RECEIVED, DonationStatus.COMPLETED]:
                    rdon.status = DonationStatus.RECEIVED

            db.commit()
    except Exception as e:
        logger.warning(f"Startup reconciliation skipped/failed: {e}")

    load_model()
    yield

app = FastAPI(
    title="Donation AI Backend API",
    description="API for Donation Management Platform with AI object detection.",
    version="1.0.0",
    lifespan=lifespan
)

from fastapi.staticfiles import StaticFiles
from app.database import engine
from app.db_models import Base

# Create missing tables (e.g., donation_receipts) automatically on startup
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs("uploads/logos", exist_ok=True)
os.makedirs("uploads/delivery_proofs", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/api/static/uploads", StaticFiles(directory="uploads"), name="api_static_uploads")

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"message": "Welcome to Donation AI Backend API"}

@app.api_route("/health", methods=["GET", "HEAD"])
async def root_health():
    from app.model import is_model_loaded
    model_status = is_model_loaded()
    return {
        "status": "healthy" if model_status else "unhealthy",
        "model_loaded": model_status
    }

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(prediction.router, prefix="/api/ai")
app.include_router(demands.router, prefix="/api")
app.include_router(donations.router, prefix="/api")
app.include_router(matches.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(ngos.router, prefix="/api")
app.include_router(status.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(donor.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(pickup.router, prefix="/api")
app.include_router(packaging.router, prefix="/api")
