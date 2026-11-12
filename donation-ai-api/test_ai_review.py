import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db_models import User, RoleEnum, AIDetection, Donation
import json
import os

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_ai_review_audit_trail():
    db = TestingSessionLocal()
    
    # 1. Login
    response = client.post("/api/auth/login", data={"username": "donor1@example.com", "password": "password"})
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    user = db.query(User).filter_by(email="donor1@example.com").first()

    # 2. Inject an AIDetection
    det1 = AIDetection(
        donor_id=user.id,
        detected_class="book",
        quantity=2,
        confidence=0.9,
        status="PENDING_REVIEW"
    )
    det2 = AIDetection(
        donor_id=user.id,
        detected_class="pen",
        quantity=5,
        confidence=0.8,
        status="PENDING_REVIEW"
    )
    db.add_all([det1, det2])
    db.commit()
    db.refresh(det1)
    db.refresh(det2)

    # 3. Simulate donor submitting the cart
    # det1 -> approved (donor keeps 2 books)
    # det2 -> converted (donor changes to 6 pens)
    
    payload = {
        "title": "Stationery Donation",
        "description": "",
        "items": [
            {
                "item_name": "book",
                "quantity": 2,
                "ai_detection_id": det1.id
            },
            {
                "item_name": "pen",
                "quantity": 6,
                "ai_detection_id": det2.id
            }
        ]
    }
    
    response = client.post("/api/donations/", json=payload, headers=headers)
    assert response.status_code == 200
    
    # 4. Verify AIDetection statuses
    db.refresh(det1)
    db.refresh(det2)
    
    assert det1.status == "APPROVED"
    assert det2.status == "CONVERTED"
    assert det1.donation_id == response.json()["id"]
    assert det2.donation_id == response.json()["id"]
    
    print("Test passed successfully!")
