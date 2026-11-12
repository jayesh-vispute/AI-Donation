import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000/api"
HEADERS_DONOR = {"Authorization": "Bearer mock_donor_test_runner"}
HEADERS_NGO = {"Authorization": "Bearer mock_ngo_test_runner"}

def main():
    print("Testing Pipeline: AI Detection -> Donor Review -> NGO Matches")
    
    # 1. Create NGO Demand for Notebooks
    demand_payload = {
        "item_name": "notebook",
        "category": "Books & Education",
        "subcategory": "Notebooks & Writing Pads",
        "quantity_required": 50,
        "priority": "HIGH",
        "description": "We need notebooks for students."
    }
    res_dem = requests.post(f"{BASE_URL}/demands/", headers=HEADERS_NGO, json=demand_payload)
    print("NGO Demand Creation:", res_dem.json())

    # 2. Simulate AI Detection (YOLO) payload mapped to Donation creation
    print("\nSimulating Donor Confirming YOLO Detection...")
    donation_payload = {
        "title": "Donation from AI",
        "items": [
            {
                "item_name": "notebook",
                "category": "Books & Education",
                "subcategory": "Notebooks & Writing Pads",
                "quantity": 3,
                "condition": "GOOD",
                "confidence": 0.95
            }
        ]
    }
    res_don = requests.post(f"{BASE_URL}/donations/", headers=HEADERS_DONOR, json=donation_payload)
    donation_id = res_don.json()["id"]
    print(f"Confirmed Donation ID: {donation_id}")

    # 3. Get Matches
    print(f"\nFetching matches for Donation {donation_id}...")
    res_matches = requests.get(f"{BASE_URL}/donations/{donation_id}/matches", headers=HEADERS_DONOR)
    matches = res_matches.json()
    
    print(f"\nFound {len(matches)} matches:")
    for match in matches:
        print(f" - NGO: {match.get('ngo_name')} | Reason: {match.get('match_reason')} | Score: {match.get('overall_score')}")

    # 4. Verify Donation Status
    res_status = requests.get(f"{BASE_URL}/donations/{donation_id}", headers=HEADERS_DONOR)
    print(f"\nFinal Donation Status: {res_status.json().get('status')}")

if __name__ == "__main__":
    main()
