from typing import Optional
from sqlalchemy.orm import Session
from app.db_models import Notification

def create_idempotent_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str,
    related_entity_type: str,
    related_entity_id: Optional[int] = None,
    recipient_role: Optional[str] = None,
    donation_id: Optional[int] = None
):
    """
    Creates a notification if an exact match (user_id + title + related_entity_id/donation_id) 
    does not already exist for this user. This prevents duplicate 
    notifications when API requests are retried or pages are refreshed.
    """
    if not user_id:
        return None

    resolved_donation_id = donation_id or (related_entity_id if related_entity_type == "donation" else None)

    query = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.title == title
    )
    if related_entity_type and related_entity_id is not None:
        query = query.filter(
            Notification.related_entity_type == related_entity_type,
            Notification.related_entity_id == related_entity_id
        )
    elif resolved_donation_id is not None:
        query = query.filter(Notification.donation_id == resolved_donation_id)

    existing = query.first()
    if existing:
        return existing
        
    new_notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        donation_id=resolved_donation_id,
        recipient_role=recipient_role
    )
    db.add(new_notif)
    return new_notif
