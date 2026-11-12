from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional

from app.database import get_db
from app.db_models import User, Notification
from app.services.auth import get_current_user
from app.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    type: Optional[str] = None,
    unread_only: bool = False,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if type and type.lower() != "all":
        query = query.filter(Notification.type == type)
        
    if unread_only:
        query = query.filter(Notification.is_read == False)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Notification.title.ilike(search_term),
                Notification.message.ilike(search_term)
            )
        )
        
    return query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).count()
    return {"count": count}

@router.patch("/{notif_id}/read")
def mark_as_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"success": True}

@router.patch("/read-all")
def mark_all_as_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"success": True}

@router.delete("/{notif_id}")
def delete_notification(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.delete(notif)
    db.commit()
    return {"success": True}

@router.get("/util/migrate")
def migrate_db(db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        db.execute(text("ALTER TABLE notifications ADD COLUMN related_entity_type VARCHAR"))
        db.execute(text("ALTER TABLE notifications ADD COLUMN related_entity_id INTEGER"))
        db.execute(text("ALTER TABLE notifications ADD COLUMN recipient_role VARCHAR"))
        db.commit()
        return {"status": "migrated"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
