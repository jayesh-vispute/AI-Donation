import requests
import json

BASE_URL = "http://localhost:8000/api"
HEADERS_DONOR = {"Authorization": "Bearer mock_donor_test_runner"}
HEADERS_NGO = {"Authorization": "Bearer mock_ngo_test_runner"}
HEADERS_ADMIN = {"Authorization": "Bearer mock_admin_test_runner"}

def test_ai_task2_suite():
    print("="*60)
    print("       RUNNING COMPREHENSIVE AI TASK 2 MATCHING TESTS      ")
    print("="*60)

    # 1. Create a test demand for an NGO with Subcategory
    print("\n1. Seeding/Creating NGO Demand with Subcategory...")
    demand_payload = {
        "item_name": "chair",
        "category": "Furniture",
        "subcategory": "Chairs & Seating",
        "quantity_required": 10,
        "priority": "HIGH",
        "description": "Seeding demand for AI Task 2 verification"
    }
    res_dem = requests.post(f"{BASE_URL}/demands/", headers=HEADERS_NGO, json=demand_payload)
    print(f"Demand Creation ({res_dem.status_code}):", res_dem.json())
    assert res_dem.status_code == 200
    demand_data = res_dem.json()
    assert demand_data["subcategory"] == "Chairs & Seating"

    # 2. Create a test donation with matching Subcategory
    print("\n2. Creating Donor Donation with Subcategory...")
    donation_payload = {
        "title": "Subcategory Recommendation Test Donation",
        "pickup_latitude": 28.6139,
        "pickup_longitude": 77.2090,
        "items": [
            {
                "item_name": "executive desk chair",
                "category": "Furniture",
                "subcategory": "Chairs & Seating",
                "quantity": 3,
                "condition": "GOOD",
                "confidence": 0.91,
                "image_url": "/api/static/uploads/ai/chair.jpg"
            }
        ]
    }
    res_don = requests.post(f"{BASE_URL}/donations/", headers=HEADERS_DONOR, json=donation_payload)
    print(f"Donation Creation ({res_don.status_code}):", res_don.json())
    assert res_don.status_code == 200
    donation_id = res_don.json()["id"]

    # 3. Test GET /api/donations/{id}/matches
    print(f"\n3. Testing GET /api/donations/{donation_id}/matches...")
    res_matches = requests.get(f"{BASE_URL}/donations/{donation_id}/matches", headers=HEADERS_DONOR)
    print(f"Status: {res_matches.status_code}")
    matches = res_matches.json()
    print("Matches Payload:", json.dumps(matches, indent=2))
    assert res_matches.status_code == 200
    assert len(matches) >= 1

    first_match = matches[0]
    required_fields = [
        "id", "ngo_id", "ngo_name", "matched_item", "category", "subcategory",
        "matched_quantity", "remaining_demand", "item_similarity_score",
        "quantity_score", "proximity_score", "priority_score", "overall_score",
        "distance_km", "match_reason", "status"
    ]
    for field in required_fields:
        assert field in first_match, f"Missing field in response: {field}"
        print(f"  [OK] Field '{field}': {first_match.get(field)}")

    assert "Exact subcategory match" in first_match["match_reason"]
    assert first_match["subcategory"] == "Chairs & Seating"
    assert first_match["item_similarity_score"] == 0.85

    # 4. Test POST /api/matches/find
    print(f"\n4. Testing POST /api/matches/find...")
    find_payload = {"donation_id": donation_id}
    res_find = requests.post(f"{BASE_URL}/matches/find", headers=HEADERS_DONOR, json=find_payload)
    print(f"Find Matches Status: {res_find.status_code}")
    assert res_find.status_code == 200
    assert len(res_find.json()) >= 1

    # 5. Test Match Selection (Donor selects match)
    match_id = first_match["id"]
    print(f"\n5. Testing Match Selection POST /api/matches/{match_id}/select...")
    res_select = requests.post(f"{BASE_URL}/matches/{match_id}/select", headers=HEADERS_DONOR)
    print("Select Response:", res_select.json())
    assert res_select.status_code == 200
    assert res_select.json()["success"] is True

    # 6. Test Match Accept (NGO accepts match)
    print(f"\n6. Testing NGO Accept PATCH /api/matches/{match_id}/accept...")
    res_accept = requests.patch(f"{BASE_URL}/matches/{match_id}/accept", headers=HEADERS_NGO)
    print("Accept Response:", res_accept.json())
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "accepted"

    print("\n==================================================")
    print("       ALL AI TASK 2 MATCHING TESTS PASSED!       ")
    print("==================================================")

if __name__ == "__main__":
    test_ai_task2_suite()
