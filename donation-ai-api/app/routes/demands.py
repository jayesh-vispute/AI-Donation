import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from app.database import get_db
from app.db_models import Demand, DemandStatus, User, NGOProfile
from app.schemas import DemandCreate, DemandResponse, DemandUpdate
from app.services.auth import require_ngo
from app.services.ngo_service import get_or_create_ngo_profile

router = APIRouter(prefix="/demands", tags=["Demands"])

@router.post("", response_model=Union[DemandResponse, List[DemandResponse]])
@router.post("/", response_model=Union[DemandResponse, List[DemandResponse]])
def create_demand(
    demand: DemandCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_ngo)
):
    ngo = get_or_create_ngo_profile(db, current_user)
        
    created_demands = []
    group_id = f"DEM-{uuid.uuid4().hex[:8].upper()}"
    
    if demand.items and len(demand.items) > 0:
        for item in demand.items:
            category_str = item.category or item.item_name or "General"
            item_name_str = item.item_name or item.category or "General"
            qty = item.quantity or item.quantity_required or 1
            prio = (item.priority or "MEDIUM").upper()
            notes_str = item.notes or item.description or ""
            
            combined_desc = f"{notes_str}\n[General Notes: {demand.general_notes}]" if demand.general_notes and notes_str else (notes_str or demand.general_notes)
            
            db_demand = Demand(
                ngo_id=ngo.id,
                group_id=group_id,
                item_name=item_name_str,
                category=category_str,
                subcategory=item.subcategory or category_str,
                quantity_required=qty,
                priority=prio,
                expiry_date=demand.expiry_date,
                description=combined_desc,
                status=DemandStatus.active
            )
            db.add(db_demand)
            created_demands.append(db_demand)
    else:
        # Legacy single item support
        db_demand = Demand(
            ngo_id=ngo.id,
            group_id=group_id,
            item_name=demand.item_name or demand.category or "General",
            category=demand.category or demand.item_name or "General",
            subcategory=demand.subcategory or demand.category,
            quantity_required=demand.quantity_required or 1,
            priority=demand.priority,
            expiry_date=demand.expiry_date,
            description=demand.description,
            status=DemandStatus.active
        )
        db.add(db_demand)
        created_demands.append(db_demand)
        
    db.commit()
    for d in created_demands:
        db.refresh(d)
        
    return created_demands[0] if len(created_demands) == 1 and not demand.items else created_demands

@router.get("/", response_model=List[DemandResponse])
def get_demands(
    item_type: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[DemandStatus] = DemandStatus.active,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(Demand)
    if status:
        query = query.filter(Demand.status == status)
    else:
        query = query.filter(Demand.status != DemandStatus.cancelled)
    if item_type:
        query = query.filter(Demand.item_name.ilike(f"%{item_type}%"))
    if priority:
        query = query.filter(Demand.priority == priority)
        
    demands = query.offset(skip).limit(limit).all()
    for d in demands:
        status_str = d.status.value if hasattr(d.status, 'value') else str(d.status)
        if status_str.upper() in ["FULFILLED", "COMPLETED"]:
            if (d.quantity_fulfilled or 0) < (d.quantity_required or 0):
                d.quantity_fulfilled = d.quantity_required
    return demands

@router.get("/me", response_model=List[DemandResponse])
def get_my_demands(
    include_cancelled: bool = False,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_ngo)
):
    ngo = get_or_create_ngo_profile(db, current_user)
    query = db.query(Demand).filter(Demand.ngo_id == ngo.id)
    if not include_cancelled:
        query = query.filter(Demand.status != DemandStatus.cancelled)
    raw_demands = query.offset(skip).limit(limit).all()

    demands = []
    for d in raw_demands:
        s = str(d.status.value if hasattr(d.status, 'value') else d.status).upper()
        if not include_cancelled and s == "CANCELLED":
            continue
        demands.append(d)

    dirty = False
    for d in demands:
        status_str = d.status.value if hasattr(d.status, 'value') else str(d.status)
        if status_str.upper() in ["FULFILLED", "COMPLETED"]:
            if (d.quantity_fulfilled or 0) < (d.quantity_required or 0):
                d.quantity_fulfilled = d.quantity_required
                dirty = True
    if dirty:
        try:
            db.commit()
        except Exception:
            db.rollback()
    return demands

@router.get("/{demand_id}", response_model=DemandResponse)
def get_demand(demand_id: int, db: Session = Depends(get_db)):
    demand = db.query(Demand).filter(Demand.id == demand_id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    return demand

@router.put("/{demand_id}", response_model=DemandResponse)
def update_demand(
    demand_id: int, 
    demand_update: DemandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_ngo)
):
    ngo = get_or_create_ngo_profile(db, current_user)
    demand = db.query(Demand).filter(Demand.id == demand_id).first()
    
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    if demand.ngo_id != ngo.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this demand")
        
    update_data = demand_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(demand, key, value)
        
    db.commit()
    db.refresh(demand)
    return demand

@router.delete("/{demand_id}")
def delete_demand(
    demand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_ngo)
):
    ngo = get_or_create_ngo_profile(db, current_user)
    demand = db.query(Demand).filter(Demand.id == demand_id).first()
    
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    if demand.ngo_id != ngo.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this demand")
        
    try:
        from app.db_models import Match, Notification, DonationRequest
        matches = db.query(Match).filter(Match.demand_id == demand.id).all()
        if matches:
            match_ids = [m.id for m in matches]
            db.query(Notification).filter(Notification.match_id.in_(match_ids)).update({"match_id": None}, synchronize_session=False)
            db.query(DonationRequest).filter(DonationRequest.match_id.in_(match_ids)).update({"match_id": None}, synchronize_session=False)
            db.query(Match).filter(Match.demand_id == demand.id).delete(synchronize_session=False)
            
        db.delete(demand)
        db.commit()
        return {"status": "success", "message": "Demand deleted successfully"}
    except Exception as e:
        db.rollback()
        demand = db.query(Demand).filter(Demand.id == demand_id).first()
        if demand:
            demand.status = DemandStatus.cancelled
            db.commit()
        return {"status": "success", "message": "Demand cancelled"}
