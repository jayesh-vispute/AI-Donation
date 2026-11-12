import json
import logging
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import SessionLocal
from app.db_models import User, AIDetection, DonationItem, Donation

# 1. Setup TestClient
client = TestClient(app)

def run_trace():
    db = SessionLocal()
    try:
        # Get donor token
        donor_user = db.query(User).filter_by(email="donor@demo.com").first()
        if not donor_user:
            print("Donor user not found")
            return
            
        token_res = client.post("/api/auth/login", data={"username": "donor@demo.com", "password": "demo123"})
        token = token_res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Simulate YOLO prediction (Instead of hitting predict which requires a real image and model load, 
        #    we can inject a mock AIDetection or just rely on the test_ai_review mechanism if we want to hit the DB directly. 
        #    But wait, we can just hit /predict with a dummy image if we mock `predict_image`).
        # Since we just want to verify persistence logic handled by the routes:
        
        print("\n--- STEP 1: AI DETECTION (PENDING_REVIEW) ---")
        detection = AIDetection(
            donor_id=donor_user.id,
            image_path="/api/static/uploads/ai/test.jpg",
            detected_class="notebook",
            category="Books & Education",
            subcategory="Notebooks & Writing Pads",
            confidence=0.92,
            quantity=1,
            condition="GOOD",
            bbox=json.dumps([{"x1":10, "y1":10, "x2":100, "y2":100}]),
            status="PENDING_REVIEW",
            model_name="yolov8"
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)
        
        print(f"Created AIDetection ID: {detection.id}")
        print(f"Class: {detection.detected_class} | Confidence: {detection.confidence} | Status: {detection.status}")

        print("\n--- STEP 2: DONOR REVIEW (Modifying Quantity) ---")
        payload = {
            "title": "Donation from AI Trace",
            "items": [
                {
                    "item_name": "notebook",
                    "category": "Books & Education",
                    "subcategory": "Notebooks & Writing Pads",
                    "quantity": 3,  # Donor changed from 1 to 3
                    "condition": "GOOD",
                    "confidence": 0.92,
                    "ai_detection_id": detection.id
                }
            ]
        }
        
        res = client.post("/api/donations/", json=payload, headers=headers)
        assert res.status_code == 200
        donation_id = res.json()["id"]
        
        print("\n--- STEP 3: DATABASE VERIFICATION ---")
        
        db.refresh(detection)
        print("TABLE: ai_detections")
        print(f"- ID: {detection.id}")
        print(f"- Donation ID: {detection.donation_id}")
        print(f"- Detected Class: {detection.detected_class}")
        print(f"- Category: {detection.category}")
        print(f"- Subcategory: {detection.subcategory}")
        print(f"- Confidence: {detection.confidence}")
        print(f"- Original AI Quantity: {detection.quantity}")
        print(f"- Status: {detection.status}")
        print(f"- BBox: {detection.bbox}")
        print(f"- Created At: {detection.created_at}")

        don_item = db.query(DonationItem).filter_by(donation_id=donation_id).first()
        print("\nTABLE: donation_items")
        print(f"- ID: {don_item.id}")
        print(f"- Donation ID: {don_item.donation_id}")
        print(f"- Item Name: {don_item.item_name}")
        print(f"- Category: {don_item.category}")
        print(f"- Subcategory: {don_item.subcategory}")
        print(f"- Confirmed Quantity: {don_item.quantity}")

        print("\nTrace completed successfully.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_trace()
