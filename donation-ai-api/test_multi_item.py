import requests
import json
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

def test_multi_item():
    print("Testing multi-item demand creation...")
    
    # First need to login as NGO
    # Create NGO user if it doesn't exist
    email = f"test_ngo_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "testpassword123"
    
    register_data = {
        "email": email,
        "password": pwd,
        "role": "ngo",
        "full_name": "Test NGO"
    }
    
    r = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    if r.status_code != 200:
        print(f"Failed to register user: {r.text}")
        # Could already exist, try login anyway
        
    # Login
    login_data = {
        "username": email,
        "password": pwd
    }
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if r.status_code != 200:
        print(f"Failed to login: {r.text}")
        sys.exit(1)
        
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create NGO Profile
    ngo_profile = {
        "organization_name": "Test NGO Name",
        "description": "Test Desc",
        "contact_person": "Jane Doe",
        "phone": "1234567890",
        "email": email,
        "address": "123 Test St",
        "registration_number": f"REG-{uuid.uuid4().hex[:8]}",
        "city": "Test City",
        "state": "Test State",
        "postal_code": "12345"
    }
    
    r = requests.post(f"{BASE_URL}/ngos/", json=ngo_profile, headers=headers)
    if r.status_code != 200:
        print(f"Failed to create NGO profile: {r.status_code} - {r.text}")
    
    # Create Demand with multiple items
    demand_payload = {
        "items": [
            {"category": "Winter Blankets", "quantity": 50, "priority": "HIGH"},
            {"category": "Textbooks", "quantity": 30, "priority": "MEDIUM"},
            {"category": "Shoes", "quantity": 20, "priority": "LOW"}
        ],
        "general_notes": "Needed before December"
    }
    
    print(f"Sending demand payload: {json.dumps(demand_payload)}")
    r = requests.post(f"{BASE_URL}/demands/", json=demand_payload, headers=headers)
    
    if r.status_code != 200:
        print(f"Failed to create demands: {r.status_code} - {r.text}")
        sys.exit(1)
        
    response_data = r.json()
    print(f"Success! Created {len(response_data)} demands.")
    
    # Verify GET /demands/me returns the newly created items
    print("Verifying GET /demands/me...")
    r = requests.get(f"{BASE_URL}/demands/me", headers=headers)
    if r.status_code != 200:
        print(f"Failed to fetch my demands: {r.text}")
        sys.exit(1)
    
    my_demands = r.json()
    print(f"Found {len(my_demands)} demands for the NGO:")
    for d in my_demands:
        print(f"- ID: {d['id']}, Group: {d['group_id']}, Item: {d['item_name']}, Qty: {d['quantity_required']}, Status: {d['status']}")

if __name__ == "__main__":
    try:
        test_multi_item()
    except Exception as e:
        print(f"Exception during test: {e}")
