from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.db_models import (
    User, Donation, DonationStatus, PackagingChecklist, 
    PackagingChecklistItem, DonationStatusHistory
)
from app.services.auth import get_current_user, require_donor
from app.schemas import PackagingChecklistResponse, PackagingChecklistItemUpdate
from app.services.notifications import create_idempotent_notification

router = APIRouter(prefix="/donations", tags=["Packaging"])

# ── Category-specific packaging requirements ──────────────────────────
# Keys MUST match the real category values produced by SUBCATEGORY_MAPPING
# in app/model.py (e.g. "Clothing", "Food & Grocery", "Electronics", …).
CATEGORY_CHECKLISTS = {
    "Clothing": [
        {"instruction": "Clean / wash all clothing items", "required": True},
        {"instruction": "Fold items neatly by size", "required": True},
        {"instruction": "Use suitable bags or boxes", "required": True},
        {"instruction": "Protect from moisture (wrap in plastic)", "required": True},
    ],
    "Footwear": [
        {"instruction": "Clean shoes / footwear thoroughly", "required": True},
        {"instruction": "Pair and tie shoes together", "required": True},
        {"instruction": "Place in individual bags to avoid scuffing", "required": False},
        {"instruction": "Use a sturdy box for transport", "required": True},
    ],
    "Books & Education": [
        {"instruction": "Check for damaged or torn pages", "required": True},
        {"instruction": "Stack books securely by size", "required": True},
        {"instruction": "Use an appropriate sturdy box", "required": True},
        {"instruction": "Protect from moisture (wrap in plastic)", "required": True},
    ],
    "Stationery": [
        {"instruction": "Bundle similar items together (pens, pencils, etc.)", "required": True},
        {"instruction": "Place in a zip-lock bag or small box", "required": True},
        {"instruction": "Prevent loose items from shifting", "required": True},
    ],
    "Electronics": [
        {"instruction": "Switch off and reset/wipe device if applicable", "required": True},
        {"instruction": "Protect fragile screens and components", "required": True},
        {"instruction": "Use bubble wrap or protective padding", "required": True},
        {"instruction": "Include all cables, chargers and accessories", "required": True},
        {"instruction": "Prevent movement inside the box", "required": True},
        {"instruction": "Mark package as FRAGILE", "required": True},
    ],
    "Appliances": [
        {"instruction": "Clean the appliance thoroughly", "required": True},
        {"instruction": "Disconnect and coil all power cables", "required": True},
        {"instruction": "Protect with bubble wrap or thick padding", "required": True},
        {"instruction": "Prevent movement inside packaging", "required": True},
        {"instruction": "Mark package as FRAGILE / HEAVY", "required": True},
    ],
    "Furniture": [
        {"instruction": "Secure all removable parts (screws, shelves, cushions)", "required": True},
        {"instruction": "Protect surfaces with wrapping or blankets", "required": True},
        {"instruction": "Disassemble if possible for safe transport", "required": False},
        {"instruction": "Ensure safe handling weight and size", "required": True},
        {"instruction": "Prepare for transport (clear pathway for pickup)", "required": True},
    ],
    # NOTE: "Food & Grocery" is handled per-subcategory below — not here.
    "Kitchenware": [
        {"instruction": "Clean all utensils and cookware", "required": True},
        {"instruction": "Wrap sharp items (knives, forks) safely", "required": True},
        {"instruction": "Prevent breakable items from shifting", "required": True},
        {"instruction": "Use padding between stacked items", "required": True},
    ],
    "Medical & Health": [
        {"instruction": "Verify expiration dates on all medical supplies", "required": True},
        {"instruction": "Ensure items are sealed and sterile where applicable", "required": True},
        {"instruction": "Separate medications from instruments", "required": True},
        {"instruction": "Label contents clearly", "required": True},
    ],
    "Household": [
        {"instruction": "Clean items thoroughly", "required": True},
        {"instruction": "Pack securely to avoid damage during transport", "required": True},
        {"instruction": "Bundle small items together", "required": False},
    ],
    "Accessories": [
        {"instruction": "Clean all accessory items", "required": True},
        {"instruction": "Place small items in individual pouches or bags", "required": True},
        {"instruction": "Protect fragile items with padding", "required": False},
    ],
}

# ── Food subcategory-specific checklists ──────────────────────────────
# These match the real subcategory values from SUBCATEGORY_MAPPING in model.py.
# Grouped into three food-handling types.

_FOOD_DRY_SHELF_STABLE = [
    {"instruction": "Check best-before / expiration dates", "required": True},
    {"instruction": "Ensure all packets and containers are sealed", "required": True},
    {"instruction": "Store in dry, airtight packaging", "required": True},
    {"instruction": "Keep away from strong-smelling items", "required": False},
    {"instruction": "Pack flat and stack neatly", "required": True},
]

_FOOD_PERISHABLE_FRESH = [
    {"instruction": "Verify expiration / use-by date is not passed", "required": True},
    {"instruction": "Ensure items are refrigerated or in insulated packaging", "required": True},
    {"instruction": "Seal tightly to prevent leaks", "required": True},
    {"instruction": "Label clearly as PERISHABLE", "required": True},
    {"instruction": "Arrange for same-day or next-day pickup", "required": True},
]

_FOOD_CANNED_PRESERVED = [
    {"instruction": "Check cans for dents, rust or bulging", "required": True},
    {"instruction": "Verify expiration date", "required": True},
    {"instruction": "Ensure lids and seals are intact", "required": True},
    {"instruction": "Pack cans upright and prevent rolling", "required": True},
    {"instruction": "Use a sturdy box (cans are heavy)", "required": True},
]

_FOOD_BAKERY_PREPARED = [
    {"instruction": "Confirm item was prepared in sanitary conditions", "required": True},
    {"instruction": "Use food-safe, leak-proof containers", "required": True},
    {"instruction": "Keep at appropriate temperature", "required": True},
    {"instruction": "Label clearly as PREPARED / BAKERY — PERISHABLE", "required": True},
    {"instruction": "Arrange for same-day pickup", "required": True},
]

# Map each real Food & Grocery subcategory to the right checklist
FOOD_SUBCATEGORY_CHECKLISTS = {
    # Dry / Shelf-stable
    "Grains & Pulses":          _FOOD_DRY_SHELF_STABLE,
    "Grains & Flours":          _FOOD_DRY_SHELF_STABLE,
    "Packaged Food":            _FOOD_DRY_SHELF_STABLE,
    "Pantry Essentials":        _FOOD_DRY_SHELF_STABLE,
    "Cooking Essentials":       _FOOD_DRY_SHELF_STABLE,
    "Beverages":                _FOOD_DRY_SHELF_STABLE,
    "Breakfast Foods":          _FOOD_DRY_SHELF_STABLE,
    "Snacks":                   _FOOD_DRY_SHELF_STABLE,
    "Snacks & Sweets":          _FOOD_DRY_SHELF_STABLE,
    "Snacks & Dry Fruits":      _FOOD_DRY_SHELF_STABLE,
    # Perishable / Fresh
    "Dairy & Beverages":        _FOOD_PERISHABLE_FRESH,
    # Prepared / Bakery
    "Bakery & Sweets":          _FOOD_BAKERY_PREPARED,
    # Canned / Preserved
    "Canned & Preserved Goods": _FOOD_CANNED_PRESERVED,
}

# Generic food fallback if subcategory is unknown
_FOOD_GENERIC = [
    {"instruction": "Check all expiration / best-before dates", "required": True},
    {"instruction": "Ensure items are sealed and unopened", "required": True},
    {"instruction": "Separate perishables from non-perishables", "required": True},
    {"instruction": "Use food-safe packaging or bags", "required": True},
    {"instruction": "Label perishable items clearly", "required": True},
]

# Fallback for categories not listed above
DEFAULT_CHECKLIST = [
    {"instruction": "Clean items thoroughly", "required": True},
    {"instruction": "Pack securely to avoid damage", "required": True},
]

# Final sealing items appended to EVERY checklist
SEALING_ITEMS = [
    {"instruction": "Place all items in a sturdy box or bag", "required": True},
    {"instruction": "Seal package securely with packing tape", "required": True},
    {"instruction": "Write Donation ID on the package", "required": True},
]


def generate_checklist_items(donation: Donation) -> List[dict]:
    """Generate a category-aware packaging checklist based on real donation items.
    
    Food & Grocery items are further split by subcategory so that dry goods,
    perishables, bakery items and canned goods each receive distinct guidance.
    """
    items: List[dict] = []
    seen_categories: set = set()
    seen_food_subcats: set = set()

    for d_item in donation.items:
        cat = (d_item.category or "").strip()
        subcat = (d_item.subcategory or "").strip()
        if not cat:
            continue

        # ── Food & Grocery: handle per-subcategory ──
        is_food = cat.lower().startswith("food") or "grocery" in cat.lower()
        if is_food:
            if subcat and subcat not in seen_food_subcats:
                seen_food_subcats.add(subcat)
                food_entries = FOOD_SUBCATEGORY_CHECKLISTS.get(subcat, _FOOD_GENERIC)
                label = f"Food — {subcat}"
                for entry in food_entries:
                    items.append({
                        "instruction": f"[{label}] {entry['instruction']}",
                        "required": entry["required"],
                    })
            elif not subcat and cat not in seen_categories:
                # No subcategory available — use generic food checklist
                seen_categories.add(cat)
                for entry in _FOOD_GENERIC:
                    items.append({
                        "instruction": f"[{cat}] {entry['instruction']}",
                        "required": entry["required"],
                    })
            continue

        # ── All other categories ──
        if cat in seen_categories:
            continue
        seen_categories.add(cat)

        checklist_entries = CATEGORY_CHECKLISTS.get(cat)
        if checklist_entries is None:
            cat_lower = cat.lower()
            for key, entries in CATEGORY_CHECKLISTS.items():
                if key.lower() in cat_lower or cat_lower in key.lower():
                    checklist_entries = entries
                    break

        if checklist_entries is None:
            checklist_entries = DEFAULT_CHECKLIST

        for entry in checklist_entries:
            items.append({
                "instruction": f"[{cat}] {entry['instruction']}",
                "required": entry["required"],
            })

    # Always append sealing items
    for entry in SEALING_ITEMS:
        items.append({
            "instruction": entry["instruction"],
            "required": entry["required"],
        })

    return items

@router.get("/{id}/packaging", response_model=PackagingChecklistResponse)
def get_packaging_checklist(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    donation = db.query(Donation).filter(Donation.id == id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    # Authorize
    if current_user.role.value.lower() == "donor" and donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Note: NGOs might also query this, but they are authorized via the `/status/donations/` route typically.
    # For simplicity, we just allow the user to view if they are donor or admin. If they are NGO, we skip strict check here or add it.

    checklist = db.query(PackagingChecklist).filter(PackagingChecklist.donation_id == id).first()
    
    if not checklist:
        checklist = PackagingChecklist(
            donation_id=id,
            status="IN_PROGRESS"
        )
        db.add(checklist)
        db.commit()
        db.refresh(checklist)

        generated_items = generate_checklist_items(donation)
        for item_data in generated_items:
            db_item = PackagingChecklistItem(
                checklist_id=checklist.id,
                item_instruction=item_data["instruction"],
                is_required=item_data["required"]
            )
            db.add(db_item)
        db.commit()
        db.refresh(checklist)
        
    return checklist

@router.patch("/{id}/packaging/items/{item_id}", response_model=PackagingChecklistResponse)
def update_checklist_item(id: int, item_id: int, update: PackagingChecklistItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    donation = db.query(Donation).filter(Donation.id == id, Donation.donor_id == current_user.id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found or not authorized")
        
    item = db.query(PackagingChecklistItem).join(PackagingChecklist).filter(
        PackagingChecklistItem.id == item_id,
        PackagingChecklist.donation_id == id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
        
    item.is_completed = update.is_completed
    item.completed_at = datetime.utcnow() if update.is_completed else None
    
    db.commit()
    
    checklist = db.query(PackagingChecklist).filter(PackagingChecklist.donation_id == id).first()
    return checklist

@router.post("/{id}/packaging/mark-packed")
def mark_packed(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    from app.db_models import DonationRequest, DonationRequestStatus
    from app.services.donation_status import sync_donation_aggregate_status, get_status_rank

    donation = db.query(Donation).filter(Donation.id == id, Donation.donor_id == current_user.id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    checklist = db.query(PackagingChecklist).filter(PackagingChecklist.donation_id == id).first()
    if not checklist:
        raise HTTPException(status_code=400, detail="Packaging checklist not initialized")
        
    for item in checklist.items:
        if item.is_required and not item.is_completed:
            if "seal" not in item.item_instruction.lower():
                import re
                clean_label = re.sub(r'^\[.+?\]\s*', '', item.item_instruction)
                raise HTTPException(status_code=400, detail=f"Required item incomplete: {clean_label}")

    checklist.status = "PACKED"
    
    # Update all active donation requests to PACKED
    requests = db.query(DonationRequest).filter(
        DonationRequest.donation_id == donation.id,
        DonationRequest.status != DonationRequestStatus.REJECTED,
        DonationRequest.status != DonationRequestStatus.CANCELLED
    ).all()
    for req in requests:
        if get_status_rank(req.status) < 3:
            req.status = DonationRequestStatus.PACKED

    # Sync aggregate parent donation status
    sync_donation_aggregate_status(
        db=db,
        donation_id=donation.id,
        changed_by_id=current_user.id,
        notes="Donation packed by donor."
    )
    db.commit()
        
    return {"status": "success", "message": "Donation marked as packed"}

@router.post("/{id}/packaging/mark-sealed")
def mark_sealed(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    from app.db_models import DonationRequest, DonationRequestStatus
    from app.services.donation_status import sync_donation_aggregate_status, get_status_rank

    donation = db.query(Donation).filter(Donation.id == id, Donation.donor_id == current_user.id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    if donation.status not in [DonationStatus.PACKED, DonationStatus.SEALED]:
        raise HTTPException(status_code=400, detail="Donation must be packed before it can be sealed")
        
    checklist = db.query(PackagingChecklist).filter(PackagingChecklist.donation_id == id).first()
    for item in checklist.items:
        if item.is_required and not item.is_completed:
            import re
            clean_label = re.sub(r'^\[.+?\]\s*', '', item.item_instruction)
            raise HTTPException(status_code=400, detail=f"Required item incomplete: {clean_label}")
            
    checklist.status = "SEALED"
    
    # Update all active requests to SEALED
    requests = db.query(DonationRequest).filter(
        DonationRequest.donation_id == donation.id,
        DonationRequest.status != DonationRequestStatus.REJECTED,
        DonationRequest.status != DonationRequestStatus.CANCELLED
    ).all()
    
    for req in requests:
        if get_status_rank(req.status) < 4:
            req.status = DonationRequestStatus.SEALED
            
        # Notify all allocated NGOs that the donor has sealed and is ready for pickup
        if req.ngo and req.ngo.user_id:
            create_idempotent_notification(
                db=db,
                user_id=req.ngo.user_id,
                title="Donation Ready for Pickup",
                message=f"Donation #{donation.id} has been sealed and is ready for pickup scheduling.",
                type="donations",
                related_entity_type="donation",
                related_entity_id=donation.id,
                recipient_role="NGO"
            )

    if not requests and donation.ngo_id:
        ngo_profile = donation.ngo
        if ngo_profile and ngo_profile.user_id:
            create_idempotent_notification(
                db=db,
                user_id=ngo_profile.user_id,
                title="Donation Ready for Pickup",
                message=f"Donation #{donation.id} has been sealed and is ready for pickup scheduling.",
                type="donations",
                related_entity_type="donation",
                related_entity_id=donation.id,
                recipient_role="NGO"
            )

    # Sync aggregate parent donation status
    sync_donation_aggregate_status(
        db=db,
        donation_id=donation.id,
        changed_by_id=current_user.id,
        notes="Donation sealed and ready for pickup."
    )
    
    db.commit()

    return {"status": "success", "message": "Donation marked as sealed"}
