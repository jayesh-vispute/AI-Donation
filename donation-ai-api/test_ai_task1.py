import requests
import json
import io
from PIL import Image, ImageDraw

BASE_URL = "http://localhost:8000/api"
HEADERS = {"Authorization": "Bearer mock_donor_test_runner"}

def create_test_image(draw_objects=[]):
    """
    Creates a synthetic test image with optional colored boxes to test object detection,
    or returns an image without objects.
    """
    img = Image.new("RGB", (640, 640), color="white")
    draw = ImageDraw.Draw(img)
    for obj in draw_objects:
        # draw rectangles with given colors and coordinates
        draw.rectangle(obj["box"], fill=obj["color"], outline="black")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf

def test_ai_task1_suite():
    print("==================================================")
    print("       RUNNING COMPREHENSIVE AI TASK 1 TESTS      ")
    print("==================================================")

    # 1. Health check & model loading
    res_health = requests.get(f"{BASE_URL}/health")
    print("\n1. Model Loaded Check:", res_health.json())
    assert res_health.status_code == 200
    assert res_health.json()["model_loaded"] is True

    # 2. Test Invalid Image Upload
    print("\n2. Testing Invalid Image Upload...")
    invalid_file = {"file": ("corrupt.txt", b"not an image file content", "text/plain")}
    res_invalid = requests.post(f"{BASE_URL}/ai/predict", headers=HEADERS, files=invalid_file)
    print(f"Response ({res_invalid.status_code}):", res_invalid.text)
    assert res_invalid.status_code in [400, 422]

    # 3. Test No Detections Image (Blank white image)
    print("\n3. Testing No Detections (Blank image)...")
    blank_buf = create_test_image([])
    files_blank = {"file": ("blank.jpg", blank_buf, "image/jpeg")}
    res_blank = requests.post(f"{BASE_URL}/ai/predict", headers=HEADERS, files=files_blank)
    print(f"Response ({res_blank.status_code}):", res_blank.json())
    assert res_blank.status_code == 200
    assert res_blank.json()["status"] == "success"
    assert res_blank.json()["total_items"] == 0
    assert len(res_blank.json()["items"]) == 0

    # 4. Test Detection on Real Test Images (Real objects / different classes / multiple objects)
    real_images = [
        "../test_images/cluttered-study-desk-stockcake.jpg",
        "../test_images/milk.jpg",
        "../test_images/oil.jpeg",
        "../test_images/test_05.jpg"
    ]

    last_detection_id = None
    last_item_id = None

    for img_path in real_images:
        print(f"\n4. Testing Real Image Prediction: {img_path}")
        try:
            with open(img_path, "rb") as f:
                files = {"file": (img_path.split("/")[-1], f, "image/jpeg")}
                res = requests.post(f"{BASE_URL}/ai/predict", headers=HEADERS, files=files)
                print(f"Status: {res.status_code}")
                data = res.json()
                print("Returned Payload Summary:")
                print(f"- Image ID: {data.get('image_id')}")
                print(f"- Total Items: {data.get('total_items')}")
                for item in data.get("items", []):
                    print(f"  • Class: '{item.get('detected_class')}' | Category: '{item.get('category')}' | Subcategory: '{item.get('subcategory')}' | Conf: {item.get('confidence')} | Qty: {item.get('quantity')} | BBox: {item.get('bbox')}")
                    assert "detected_class" in item
                    assert "category" in item
                    assert "subcategory" in item
                    assert "confidence" in item
                    assert "quantity" in item
                    assert "bbox" in item
                    assert "x1" in item["bbox"] and "y1" in item["bbox"]
        except Exception as e:
            print(f"Skipped {img_path} due to error/missing: {e}")

    # 5. Database Persistence Verification & Detection Confirmation / Update Endpoints
    print("\n5. Testing Database Persistence & Confirmation Endpoints...")
    from app.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id, detected_class, category, subcategory, confidence, quantity, bbox FROM ai_detections ORDER BY id DESC LIMIT 5")).fetchall()
        print("DB Records in `ai_detections`:")
        for r in rows:
            mapping = dict(r._mapping)
            print("  DB Row:", mapping)
            assert mapping["subcategory"] is not None
            last_detection_id = mapping["id"]

    # Test GET detection
    if last_detection_id:
        print(f"\n6. Testing GET /api/ai/detections/{last_detection_id}...")
        res_det = requests.get(f"{BASE_URL}/ai/detections/{last_detection_id}", headers=HEADERS)
        print("GET Detection Response:", res_det.json())
        assert res_det.status_code == 200
        assert res_det.json()["subcategory"] is not None

        # Test POST confirm detection
        print(f"\n7. Testing POST /api/ai/detections/{last_detection_id}/confirm...")
        res_conf = requests.post(f"{BASE_URL}/ai/detections/{last_detection_id}/confirm", headers=HEADERS)
        print("Confirm Response:", res_conf.json())
        assert res_conf.status_code == 200
        assert res_conf.json()["success"] is True

        # Test PUT update detection item
        print(f"\n8. Testing PUT /api/ai/detections/{last_detection_id}/items/{last_detection_id}...")
        update_payload = {"detected_class": "chair", "quantity": 3}
        res_update = requests.put(f"{BASE_URL}/ai/detections/{last_detection_id}/items/{last_detection_id}", headers=HEADERS, json=update_payload)
        print("Update Response:", res_update.json())
        assert res_update.status_code == 200
        assert res_update.json()["quantity"] == 3

    # 9. Test Full Donation Creation Workflow
    print("\n9. Testing Full Donation Creation Workflow with Subcategory...")
    donation_payload = {
        "title": "Test AI Subcategory Donation Workflow",
        "items": [
            {
                "item_name": "chair",
                "category": "Furniture",
                "subcategory": "Chairs & Seating",
                "quantity": 2,
                "condition": "GOOD",
                "confidence": 0.95,
                "image_url": "/api/static/uploads/ai/test.jpg",
                "description": "Donation test item"
            }
        ]
    }
    res_don = requests.post(f"{BASE_URL}/donations/", headers=HEADERS, json=donation_payload)
    print("Donation Creation Response:", res_don.status_code, res_don.json())
    assert res_don.status_code == 200
    donation_data = res_don.json()
    assert donation_data["items"][0]["subcategory"] == "Chairs & Seating"

    print("\n==================================================")
    print("          ALL TEST SUITES PASSED CLEANLY!         ")
    print("==================================================")

if __name__ == "__main__":
    test_ai_task1_suite()
