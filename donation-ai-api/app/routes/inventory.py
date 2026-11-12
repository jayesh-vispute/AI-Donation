from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import pandas as pd
import io
import math
from datetime import datetime

from app.database import get_db
from app.db_models import User, Inventory, NGOProfile, InventoryStatus, Donation, DonationStatus, DonationItem, DonationReceipt, DonationReceiptItem, ItemCondition, Demand, DemandStatus
from app.services.auth import require_ngo
from app.services.ngo_service import get_or_create_ngo_profile
from app.schemas import InventoryCreate, InventoryUpdate, InventoryResponse, ImportSummary, InventoryStats

router = APIRouter(prefix="/inventory", tags=["Inventory"])

def get_ngo_id(user: User, db: Session):
    ngo = get_or_create_ngo_profile(db, user)
    return ngo.id

def sync_confirmed_receipts_to_inventory(ngo_id: int, db: Session):
    confirmed_receipts = db.query(DonationReceipt).filter(DonationReceipt.ngo_id == ngo_id).all()
    updated = False
    for receipt in confirmed_receipts:
        existing_inv = db.query(Inventory).filter(
            Inventory.ngo_id == ngo_id,
            Inventory.donation_id == receipt.donation_id
        ).first()

        if not existing_inv and receipt.items:
            for r_item in receipt.items:
                if r_item.received_quantity <= 0:
                    continue
                donation_item = db.query(DonationItem).filter(DonationItem.id == r_item.donation_item_id).first()
                item_name_val = donation_item.item_name if donation_item and donation_item.item_name else (donation_item.category if donation_item and donation_item.category else "General")
                cat_val = donation_item.category if donation_item and donation_item.category else "General"
                subcat_val = donation_item.subcategory if donation_item else None
                cat_id = donation_item.category_id if donation_item else None
                
                cond_raw = r_item.condition.value if hasattr(r_item.condition, 'value') else str(r_item.condition) if r_item.condition else "GOOD"
                cond_val = cond_raw.upper() if isinstance(cond_raw, str) else cond_raw

                inv = db.query(Inventory).filter(
                    Inventory.ngo_id == ngo_id,
                    func.lower(Inventory.item_name) == func.lower(item_name_val)
                ).first()
                if inv:
                    inv.quantity += r_item.received_quantity
                    inv.available_quantity += r_item.received_quantity
                    if cond_val:
                        inv.condition = cond_val
                else:
                    new_inv = Inventory(
                        ngo_id=ngo_id,
                        donation_id=receipt.donation_id,
                        category_id=cat_id,
                        category_name=cat_val,
                        item_name=item_name_val,
                        subcategory=subcat_val,
                        quantity=r_item.received_quantity,
                        available_quantity=r_item.received_quantity,
                        used_quantity=0,
                        condition=cond_val,
                        status=InventoryStatus.AVAILABLE
                    )
                    db.add(new_inv)
                updated = True

                from app.db_models import Match, MatchStatus
                match = db.query(Match).filter(
                    Match.donation_item_id == r_item.donation_item_id,
                    Match.status != MatchStatus.REJECTED
                ).first()
                
                matched_demands = []
                if match and match.demand and match.demand.ngo_id == ngo_id:
                    matched_demands = [match.demand]
                else:
                    matched_demands = db.query(Demand).filter(
                        Demand.ngo_id == ngo_id,
                        (func.lower(Demand.item_name) == func.lower(item_name_val)) | (func.lower(Demand.category) == func.lower(cat_val))
                    ).all()
                
                for dem in matched_demands:
                    dem.quantity_fulfilled = min(dem.quantity_required, (dem.quantity_fulfilled or 0) + r_item.received_quantity)
                    if dem.quantity_fulfilled >= dem.quantity_required:
                        dem.status = DemandStatus.fulfilled
                    elif dem.quantity_fulfilled > 0:
                        dem.status = DemandStatus.partially_fulfilled

    if updated:
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error syncing confirmed receipts to inventory: {e}")

@router.get("/stats", response_model=InventoryStats)
def get_inventory_stats(db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    ngo_id = get_ngo_id(current_user, db)
    sync_confirmed_receipts_to_inventory(ngo_id, db)
    items = db.query(Inventory).filter(Inventory.ngo_id == ngo_id).all()
    
    total = sum(i.available_quantity for i in items)
    ready = sum(i.available_quantity for i in items if i.status == InventoryStatus.AVAILABLE and i.condition in ["NEW", "GOOD"])
    allocated = sum(i.available_quantity for i in items if i.status == InventoryStatus.ALLOCATED)
    needs_attention = sum(i.available_quantity for i in items if i.status == InventoryStatus.NEEDS_ATTENTION or i.condition in ["FAIR", "POOR"])
    
    return InventoryStats(
        total_items=total,
        ready_to_distribute=ready,
        allocated=allocated,
        needs_attention=needs_attention
    )

@router.post("/import", response_model=ImportSummary)
async def import_inventory(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    ngo_id = get_ngo_id(current_user, db)
    
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
        
    required_cols = ['item_name', 'quantity']
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")
        
    success_count = 0
    skipped_count = 0
    duplicate_count = 0
    errors = []
    
    for idx, row in df.iterrows():
        try:
            item_name = str(row['item_name']).strip()
            if not item_name or pd.isna(row['item_name']):
                errors.append({"row": idx + 2, "error": "item_name is missing"})
                skipped_count += 1
                continue
                
            qty = row['quantity']
            if pd.isna(qty) or not str(qty).isdigit():
                qty = 1
            else:
                qty = int(qty)
                
            condition = str(row.get('condition', 'GOOD')).upper().strip() if not pd.isna(row.get('condition')) else 'GOOD'
            if condition not in ["NEW", "GOOD", "FAIR", "POOR"]:
                condition = "GOOD"
                
            category_name = str(row.get('category', 'General')).strip() if not pd.isna(row.get('category')) else 'General'
            status_raw = str(row.get('status', 'AVAILABLE')).upper().strip() if not pd.isna(row.get('status')) else 'AVAILABLE'
            status = status_raw if status_raw in ["AVAILABLE", "ALLOCATED", "NEEDS_ATTENTION"] else "AVAILABLE"
            
            location = str(row.get('storage_location', '')).strip() if not pd.isna(row.get('storage_location')) else None
            notes = str(row.get('notes', '')).strip() if not pd.isna(row.get('notes')) else None
            
            # Check for duplicates based on name and condition
            existing = db.query(Inventory).filter(
                Inventory.ngo_id == ngo_id, 
                func.lower(Inventory.item_name) == item_name.lower(),
                Inventory.condition == condition
            ).first()
            
            if existing:
                existing.quantity += qty
                existing.available_quantity += qty
                duplicate_count += 1
            else:
                new_item = Inventory(
                    ngo_id=ngo_id,
                    item_name=item_name,
                    category_name=category_name,
                    quantity=qty,
                    available_quantity=qty,
                    used_quantity=0,
                    condition=condition,
                    status=status,
                    storage_location=location,
                    notes=notes
                )
                db.add(new_item)
                success_count += 1
                
        except Exception as e:
            errors.append({"row": idx + 2, "error": str(e)})
            skipped_count += 1
            
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during import: {str(e)}")
        
    return ImportSummary(
        total_rows=len(df),
        success_count=success_count,
        skipped_count=skipped_count,
        duplicate_count=duplicate_count,
        errors=errors
    )

@router.get("", response_model=List[InventoryResponse])
@router.get("/", response_model=List[InventoryResponse])
def get_inventory(db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    ngo_id = get_ngo_id(current_user, db)
    sync_confirmed_receipts_to_inventory(ngo_id, db)
    return db.query(Inventory).filter(Inventory.ngo_id == ngo_id).order_by(Inventory.created_at.desc()).all()

@router.post("", response_model=InventoryResponse)
@router.post("/", response_model=InventoryResponse)
def add_inventory(item: InventoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    ngo_id = get_ngo_id(current_user, db)
    
    existing = db.query(Inventory).filter(
        Inventory.ngo_id == ngo_id, 
        Inventory.item_name == item.item_name,
        Inventory.condition == item.condition
    ).first()
    
    if existing:
        existing.quantity += item.quantity
        existing.available_quantity += item.available_quantity
        existing.used_quantity += item.used_quantity
        db.commit()
        db.refresh(existing)
        return existing
        
    db_item = Inventory(**item.dict(), ngo_id=ngo_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/from-donation/{donation_id}", response_model=List[InventoryResponse])
def add_donation_to_inventory(donation_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    ngo_id = get_ngo_id(current_user, db)
    # Get donation
    donation = db.query(Donation).filter(Donation.id == donation_id, Donation.ngo_id == ngo_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found or not matched to this NGO")
        
    if donation.status != DonationStatus.RECEIVED:
        raise HTTPException(status_code=400, detail="Donation must be marked as RECEIVED before adding to inventory")
        
    # Check if inventory already created
    existing = db.query(Inventory).filter(Inventory.donation_id == donation_id).all()
    if existing:
        return existing
        
    # Fetch donation items
    items = db.query(DonationItem).filter(DonationItem.donation_id == donation_id).all()
    if not items:
        raise HTTPException(status_code=400, detail="Donation has no items")
        
    inventory_items = []
    for d_item in items:
        item_name_val = getattr(d_item, "item_name", None) or getattr(d_item, "name", None) or getattr(d_item, "category", None) or "General"
        inv = Inventory(
            ngo_id=ngo_id,
            donation_id=donation_id,
            category_id=d_item.category_id,
            category_name=getattr(d_item, "category", "General"),
            item_name=item_name_val,
            subcategory=getattr(d_item, "subcategory", None),
            quantity=d_item.quantity,
            available_quantity=d_item.quantity,
            used_quantity=0,
            condition=d_item.condition.value if hasattr(d_item.condition, "value") else (str(d_item.condition) if d_item.condition else "GOOD"),
            status=InventoryStatus.AVAILABLE
        )
        db.add(inv)
        inventory_items.append(inv)
        
    db.commit()
    for inv in inventory_items:
        db.refresh(inv)
        
    return inventory_items

@router.put("/{item_id}", response_model=InventoryResponse)
def update_inventory(item_id: int, item: InventoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    ngo_id = get_ngo_id(current_user, db)
    db_item = db.query(Inventory).filter(Inventory.id == item_id, Inventory.ngo_id == ngo_id).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
        
    update_data = item.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_item, k, v)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_inventory(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_ngo)):
    ngo_id = get_ngo_id(current_user, db)
    db_item = db.query(Inventory).filter(Inventory.id == item_id, Inventory.ngo_id == ngo_id).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
        
    db.delete(db_item)
    db.commit()
    return {"success": True, "message": "Item deleted"}
