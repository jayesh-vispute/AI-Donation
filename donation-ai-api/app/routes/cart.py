from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.db_models import User, CartItem, AIDetection
from app.schemas import CartItemResponse, CartItemCreate, CartItemUpdate
from app.services.auth import get_current_user, require_donor

router = APIRouter(prefix="/donation-cart", tags=["Cart"])

@router.get("", response_model=List[CartItemResponse])
@router.get("/", response_model=List[CartItemResponse])
def get_cart_items(db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    return db.query(CartItem).filter(CartItem.user_id == current_user.id).order_by(CartItem.created_at.desc()).all()

@router.post("/items", response_model=CartItemResponse)
def add_to_cart(item: CartItemCreate, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    if item.detection_id:
        # Validate detection exists
        detection = db.query(AIDetection).filter(AIDetection.id == item.detection_id).first()
        if not detection:
            raise HTTPException(status_code=404, detail="AI Detection not found")

    new_item = CartItem(
        user_id=current_user.id,
        detection_id=item.detection_id,
        item_name=item.item_name,
        category=item.category,
        quantity=item.quantity,
        image_url=item.image_url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/items/{item_id}", response_model=CartItemResponse)
def update_cart_item(item_id: int, item_update: CartItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if cart_item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this item")
        
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cart_item, key, value)
        
    db.commit()
    db.refresh(cart_item)
    return cart_item

@router.delete("/items/{item_id}")
def remove_cart_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if cart_item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this item")
        
    db.delete(cart_item)
    db.commit()
    return {"success": True, "message": "Item removed from cart"}
