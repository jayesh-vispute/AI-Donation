import requests
import json

API_URL = "http://127.0.0.1:8000/api"

def print_res(res, label=""):
    print(f"\n--- {label} ---")
    print(f"Status: {res.status_code}")
    try:
        print(json.dumps(res.json(), indent=2))
    except:
        print(res.text)

def test_api():
    print("Testing Donation AI Auth & Role endpoints...")
    
    # 1. Test Auth / Auto-register
    headers_donor = {"Authorization": "Bearer mock_donor_1"}
    res = requests.get(f"{API_URL}/auth/me", headers=headers_donor)
    print_res(res, "Donor Auth")
    
    headers_ngo = {"Authorization": "Bearer mock_ngo_1"}
    res = requests.get(f"{API_URL}/auth/me", headers=headers_ngo)
    print_res(res, "NGO Auth")
    
    headers_admin = {"Authorization": "Bearer mock_admin_1"}
    res = requests.get(f"{API_URL}/auth/me", headers=headers_admin)
    print_res(res, "Admin Auth")
    
    # 2. Test NGO Profile
    ngo_data = {
        "organization_name": "Test NGO",
        "city": "Test City",
        "email": "testngo@example.com"
    }
    res = requests.post(f"{API_URL}/ngos/", headers=headers_ngo, json=ngo_data)
    print_res(res, "Create NGO Profile")
    
    # 3. Test Demands
    demand_data = {
        "item_name": "Books",
        "quantity_required": 50,
        "priority": "high"
    }
    res = requests.post(f"{API_URL}/demands/", headers=headers_ngo, json=demand_data)
    print_res(res, "Create Demand")
    
    # 4. Test Donation (as donor)
    donation_data = {
        "pickup_city": "Test City",
        "items": [
            {
                "item_name": "Books",
                "quantity": 30,
                "confidence": 0.95,
                "detection_source": "yolo"
            }
        ]
    }
    res = requests.post(f"{API_URL}/donations/", headers=headers_donor, json=donation_data)
    print_res(res, "Create Donation")
    
    if res.status_code == 200:
        donation_id = res.json()["id"]
        
        # 5. Check Matches for this donation
        res = requests.get(f"{API_URL}/donations/{donation_id}/matches", headers=headers_donor)
        print_res(res, "Matches for Donation")
        
        # 6. Check Status History
        res = requests.get(f"{API_URL}/status/donations/{donation_id}", headers=headers_donor)
        print_res(res, "Status History")

if __name__ == "__main__":
    test_api()
