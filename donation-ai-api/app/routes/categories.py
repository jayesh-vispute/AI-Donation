from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.db_models import Category, User, AuditLog
from app.services.auth import require_admin, get_current_user
from app.schemas import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).all()

@router.post("/", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
        
    db_cat = Category(**category.dict())
    db.add(db_cat)
    
    log = AuditLog(user_id=admin.id, action="CREATE_CATEGORY", module="Category", description=f"Created category {category.name}")
    db.add(log)
    
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(cat_id: int, category: CategoryUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    db_cat = db.query(Category).filter(Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = category.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_cat, k, v)
        
    log = AuditLog(user_id=admin.id, action="UPDATE_CATEGORY", module="Category", entity_id=cat_id, description=f"Updated category {cat_id}")
    db.add(log)
    
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    db_cat = db.query(Category).filter(Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    db_cat.is_active = False
    
    log = AuditLog(user_id=admin.id, action="DELETE_CATEGORY", module="Category", entity_id=cat_id, description=f"Soft deleted category {cat_id}")
    db.add(log)
    
    db.commit()
    return {"success": True, "message": "Category deactivated"}
