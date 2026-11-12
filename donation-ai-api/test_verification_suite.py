import sys
import os
import requests
from datetime import datetime, timezone, timedelta

from app.database import SessionLocal
from app.db_models import (
    User, NGOProfile, Donation, DonationItem, DonationItemAllocation,
    DonationRequest, DonationRequestStatus, Pickup, PickupStatus,
    AllocationStatus, DonationStatus, Notification, Demand, DemandStatus,
    ItemCondition
)
from app.services.auth import create_access_token

BASE_URL = "http://localhost:8000/api"

def run_tests():
    print("=" * 70, flush=True)
    print("STARTING DONATION AI WORKFLOW VERIFICATION SUITE", flush=True)
    print("=" * 70, flush=True)

    results = {}

    with SessionLocal() as db:
        donor_user = db.query(User).filter(User.email == "pallamalasrisaiteja14@gmail.com").first()
        ngo_user = db.query(User).filter(User.email == "pallamalasai42@gmail.com").first()
        ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == ngo_user.id).first()
        ngo2_profile = db.query(NGOProfile).filter(NGOProfile.id == 2).first()
        ngo2_user = db.query(User).filter(User.id == ngo2_profile.user_id).first()

        donor_id = donor_user.id
        donor_email = donor_user.email
        ngo1_id = ngo_profile.id
        ngo1_user_id = ngo_user.id
        ngo1_email = ngo_user.email
        ngo2_id = ngo2_profile.id
        ngo2_user_id = ngo2_user.id
        ngo2_email = ngo2_user.email

    donor_token = create_access_token({"sub": donor_email})
    ngo_token = create_access_token({"sub": ngo1_email})
    ngo2_token = create_access_token({"sub": ngo2_email})

    donor_headers = {"Authorization": f"Bearer {donor_token}"}
    ngo_headers = {"Authorization": f"Bearer {ngo_token}"}
    ngo2_headers = {"Authorization": f"Bearer {ngo2_token}"}

    # -------------------------------------------------------------
    # TEST 6: Open a page without adding anything. No new donation or notification created.
    # -------------------------------------------------------------
    print("\n--- Running Test 6: Page load idempotency (no side-effects) ---", flush=True)
    with SessionLocal() as db:
        initial_donations_count = db.query(Donation).count()
        initial_notifs_count = db.query(Notification).count()

    r1 = requests.get(f"{BASE_URL}/donor/dashboard", headers=donor_headers)
    r2 = requests.get(f"{BASE_URL}/donor/donations", headers=donor_headers)
    r3 = requests.get(f"{BASE_URL}/notifications/", headers=donor_headers)
    r4 = requests.get(f"{BASE_URL}/ngos/dashboard", headers=ngo_headers)
    r5 = requests.get(f"{BASE_URL}/ngos/donation-requests", headers=ngo_headers)
    r6 = requests.get(f"{BASE_URL}/donations/1/item-matches", headers=donor_headers)

    with SessionLocal() as db:
        post_donations_count = db.query(Donation).count()
        post_notifs_count = db.query(Notification).count()

    if (post_donations_count == initial_donations_count and 
        post_notifs_count == initial_notifs_count and 
        all(r.status_code == 200 for r in [r1, r2, r3, r4, r5, r6])):
        results["Test 6: Page load idempotency"] = "PASS"
        print("PASS: Visiting pages did not generate any donations or notifications.", flush=True)
    else:
        results["Test 6: Page load idempotency"] = "FAIL"
        print(f"FAIL: Donations {initial_donations_count}->{post_donations_count}, Notifs {initial_notifs_count}->{post_notifs_count}", flush=True)

    # -------------------------------------------------------------
    # TEST 9: Multi-item donation independent tracking
    # -------------------------------------------------------------
    print("\n--- Running Test 9: Multi-item donation independent tracking ---", flush=True)
    with SessionLocal() as db:
        # Ensure demands exist for NGO 1 and NGO 2
        d1 = db.query(Demand).filter(Demand.ngo_id == ngo1_id, Demand.item_name == "Blanket", Demand.status == DemandStatus.OPEN).first()
        if not d1:
            db.add(Demand(ngo_id=ngo1_id, item_name="Blanket", category="Bedding", quantity_required=10, quantity_fulfilled=0, status=DemandStatus.OPEN))
        d2 = db.query(Demand).filter(Demand.ngo_id == ngo2_id, Demand.item_name == "Rice Bag", Demand.status == DemandStatus.OPEN).first()
        if not d2:
            db.add(Demand(ngo_id=ngo2_id, item_name="Rice Bag", category="Food", quantity_required=10, quantity_fulfilled=0, status=DemandStatus.OPEN))
        
        # Create multi-item donation: Item A (qty 2), Item B (qty 3), Item C (qty 1, unallocated)
        don9 = Donation(
            donor_id=donor_id,
            title="Multi-Item Test Donation",
            status=DonationStatus.PENDING,
            pickup_address="123 Test Street",
            pickup_city="Hyderabad"
        )
        db.add(don9)
        db.flush()

        item_a = DonationItem(
            donation_id=don9.id,
            item_name="Blanket",
            category="Bedding",
            quantity=2,
            allocated_quantity=0,
            matching_status="PENDING",
            condition=ItemCondition.GOOD
        )
        item_b = DonationItem(
            donation_id=don9.id,
            item_name="Rice Bag",
            category="Food",
            quantity=3,
            allocated_quantity=0,
            matching_status="PENDING",
            condition=ItemCondition.GOOD
        )
        item_c = DonationItem(
            donation_id=don9.id,
            item_name="Toy",
            category="Toys",
            quantity=1,
            allocated_quantity=0,
            matching_status="PENDING",
            condition=ItemCondition.GOOD
        )
        db.add(item_a)
        db.add(item_b)
        db.add(item_c)
        db.commit()
        don9_id = don9.id
        item_a_id = item_a.id
        item_b_id = item_b.id
        item_c_id = item_c.id

    # Allocate Item A to NGO 1
    alloc_a_res = requests.post(
        f"{BASE_URL}/donations/items/{item_a_id}/allocate",
        headers=donor_headers,
        json={"ngo_id": ngo1_id, "allocated_quantity": 2}
    )
    # Allocate Item B to NGO 1
    alloc_b_res = requests.post(
        f"{BASE_URL}/donations/items/{item_b_id}/allocate",
        headers=donor_headers,
        json={"ngo_id": ngo1_id, "allocated_quantity": 3}
    )

    # Schedule pickup for the donation
    sched_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    sched_res = requests.post(
        f"{BASE_URL}/pickup/donations/{don9_id}",
        headers=donor_headers,
        json={
            "scheduled_at": sched_time,
            "pickup_address": "123 Test Street",
            "time_slot": "10:00 AM - 12:00 PM",
            "notes": "Multi-item test pickup"
        }
    )

    with SessionLocal() as db:
        pickup_ngo1 = db.query(Pickup).filter(Pickup.donation_id == don9_id, Pickup.ngo_id == ngo1_id).first()
        pickup_id_1 = pickup_ngo1.id if pickup_ngo1 else None

    # NGO 1 marks pickup as COLLECTED
    requests.patch(
        f"{BASE_URL}/pickup/{pickup_id_1}",
        headers=ngo_headers,
        json={"status": "COLLECTED"}
    )

    # NGO 1 confirms physical receipt for Item A ONLY
    receipt_res_a = requests.post(
        f"{BASE_URL}/status/donations/{don9_id}/receipt",
        headers=ngo_headers,
        json={
            "notes": "Received Item A",
            "items": [
                {
                    "donation_item_id": item_a_id,
                    "expected_quantity": 2,
                    "received_quantity": 2,
                    "condition": "GOOD"
                }
            ]
        }
    )

    with SessionLocal() as db:
        it_a = db.query(DonationItem).filter(DonationItem.id == item_a_id).first()
        it_b = db.query(DonationItem).filter(DonationItem.id == item_b_id).first()
        al_a = db.query(DonationItemAllocation).filter(DonationItemAllocation.donation_item_id == item_a_id).first()
        al_b = db.query(DonationItemAllocation).filter(DonationItemAllocation.donation_item_id == item_b_id).first()
        parent_don = db.query(Donation).filter(Donation.id == don9_id).first()

        item_a_fulfilled = (al_a.status == AllocationStatus.FULFILLED and it_a.matching_status == "FULFILLED")
        item_b_not_fulfilled = (al_b.status != AllocationStatus.FULFILLED and it_b.matching_status != "FULFILLED")
        # Parent donation must NOT be marked RECEIVED yet because Item B is still incomplete!
        parent_not_premature = parent_don.status.value != "RECEIVED" and parent_don.status.value != "COMPLETED"

    if item_a_fulfilled and item_b_not_fulfilled and parent_not_premature:
        results["Test 9: Item-level independent completion"] = "PASS"
        print("PASS: Item A completion did not complete Item B, and parent donation did not prematurely complete.", flush=True)
    else:
        results["Test 9: Item-level independent completion"] = "FAIL"
        print(f"FAIL: Item A fulfilled={item_a_fulfilled}, Item B not fulfilled={item_b_not_fulfilled}, Parent not premature={parent_not_premature}", flush=True)

    # -------------------------------------------------------------
    # TEST 1: Preserve completed donation records upon revisit/previous page
    # -------------------------------------------------------------
    print("\n--- Running Test 1: Preserve completed donation records ---", flush=True)
    # Now complete Item B with NGO 1 as well
    receipt_res_b = requests.post(
        f"{BASE_URL}/status/donations/{don9_id}/receipt",
        headers=ngo_headers,
        json={
            "notes": "Received Item B",
            "items": [
                {
                    "donation_item_id": item_b_id,
                    "expected_quantity": 3,
                    "received_quantity": 3,
                    "condition": "GOOD"
                }
            ]
        }
    )

    with SessionLocal() as db:
        parent_don = db.query(Donation).filter(Donation.id == don9_id).first()
        final_status_before = parent_don.status.value if hasattr(parent_don.status, 'value') else str(parent_don.status)

    # Reopen multiple times (simulating navigating back, reopening)
    reopen1 = requests.get(f"{BASE_URL}/donations/{don9_id}", headers=donor_headers).json()
    reopen2 = requests.get(f"{BASE_URL}/donor/donations/{don9_id}", headers=donor_headers).json()
    reopen3 = requests.get(f"{BASE_URL}/donor/donations?filter_type=all", headers=donor_headers).json()
    don_in_list = next((d for d in reopen3 if d["id"] == don9_id), None)

    # Attempt to re-schedule pickup (simulating user clicking Back into schedule screen)
    re_sched = requests.post(
        f"{BASE_URL}/pickup/donations/{don9_id}",
        headers=donor_headers,
        json={
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "pickup_address": "123 Test Street",
            "time_slot": "02:00 PM - 04:00 PM"
        }
    )

    with SessionLocal() as db:
        parent_don = db.query(Donation).filter(Donation.id == don9_id).first()
        final_status_after = parent_don.status.value if hasattr(parent_don.status, 'value') else str(parent_don.status)

    if (final_status_before in ["RECEIVED", "COMPLETED"] and 
        final_status_after in ["RECEIVED", "COMPLETED"] and 
        reopen1["status"] in ["RECEIVED", "COMPLETED"] and 
        don_in_list and don_in_list["status"] in ["RECEIVED", "COMPLETED"]):
        results["Test 1: Preserve completed donation on revisit"] = "PASS"
        print(f"PASS: Final status remained '{final_status_after}' after reopening, navigating, and re-scheduling attempt.", flush=True)
    else:
        results["Test 1: Preserve completed donation on revisit"] = "FAIL"
        print(f"FAIL: Status regressed from {final_status_before} to {final_status_after}", flush=True)

    # -------------------------------------------------------------
    # TEST 2: Refresh page / fetch consistency
    # -------------------------------------------------------------
    print("\n--- Running Test 2: Refresh page consistency ---", flush=True)
    fetch1 = requests.get(f"{BASE_URL}/donations/{don9_id}", headers=donor_headers).json()
    fetch2 = requests.get(f"{BASE_URL}/donations/{don9_id}", headers=donor_headers).json()
    fetch3 = requests.get(f"{BASE_URL}/donations/{don9_id}", headers=donor_headers).json()

    f1_items = [(it["id"], it["allocated_quantity"], it.get("matching_status")) for it in fetch1["items"]]
    f2_items = [(it["id"], it["allocated_quantity"], it.get("matching_status")) for it in fetch2["items"]]
    f3_items = [(it["id"], it["allocated_quantity"], it.get("matching_status")) for it in fetch3["items"]]

    if fetch1["status"] == fetch2["status"] == fetch3["status"] and f1_items == f2_items == f3_items:
        results["Test 2: Refresh page consistency"] = "PASS"
        print("PASS: Same donation and item allocations remained completely identical across repeated fetches.", flush=True)
    else:
        results["Test 2: Refresh page consistency"] = "FAIL"
        print("FAIL: Fetches differed.", flush=True)

    # -------------------------------------------------------------
    # TEST 3: Open NGO Matches again - completed items do not revert
    # -------------------------------------------------------------
    print("\n--- Running Test 3: Completed items remain fulfilled in matches ---", flush=True)
    matches_res = requests.get(f"{BASE_URL}/donations/{don9_id}/item-matches", headers=donor_headers).json()
    item_a_match = next((it for it in matches_res["items"] if it["item_id"] == item_a_id), None)
    item_b_match = next((it for it in matches_res["items"] if it["item_id"] == item_b_id), None)

    if (item_a_match and item_a_match["allocated_quantity"] == 2 and 
        item_b_match and item_b_match["allocated_quantity"] == 3 and
        item_a_match.get("matching_status") == "FULFILLED" and
        item_b_match.get("matching_status") == "FULFILLED"):
        results["Test 3: Completed items do not revert to unmatched"] = "PASS"
        print("PASS: Completed items preserved allocated quantities and FULFILLED status.", flush=True)
    else:
        results["Test 3: Completed items do not revert to unmatched"] = "FAIL"
        print(f"FAIL: Matches response items: {matches_res.get('items')}", flush=True)

    # -------------------------------------------------------------
    # TEST 4: Reopen NGO portal - NGO sees only its allocated items
    # -------------------------------------------------------------
    print("\n--- Running Test 4: NGO portal item scoping ---", flush=True)
    ngo1_reqs = requests.get(f"{BASE_URL}/ngos/donation-requests", headers=ngo_headers).json()
    req_for_ngo1 = next((r for r in ngo1_reqs if r["donation_id"] == don9_id), None)

    if req_for_ngo1:
        req_detail = requests.get(f"{BASE_URL}/ngos/donation-requests/{req_for_ngo1['id']}", headers=ngo_headers).json()
        scoped_item_dict = {it["item_name"]: it["quantity"] for it in req_detail["items"]}
        if ("Blanket" in scoped_item_dict and scoped_item_dict["Blanket"] == 2 and
            "Rice Bag" in scoped_item_dict and scoped_item_dict["Rice Bag"] == 3 and
            "Toy" not in scoped_item_dict):
            results["Test 4: NGO portal item scoping"] = "PASS"
            print("PASS: NGO saw only its actual allocated items ('Blanket' x 2, 'Rice Bag' x 3) and not unallocated items ('Toy').", flush=True)
        else:
            results["Test 4: NGO portal item scoping"] = "FAIL"
            print(f"FAIL: Scoped items for NGO 1: {scoped_item_dict}", flush=True)
    else:
        results["Test 4: NGO portal item scoping"] = "FAIL"
        print("FAIL: Donation request not found for NGO 1.", flush=True)

    # -------------------------------------------------------------
    # TEST 5: Navigate between donor and NGO accounts - Consistent status
    # -------------------------------------------------------------
    print("\n--- Running Test 5: Donor and NGO status consistency ---", flush=True)
    donor_view = requests.get(f"{BASE_URL}/donations/{don9_id}", headers=donor_headers).json()
    ngo1_view = requests.get(f"{BASE_URL}/ngos/donation-requests/{req_for_ngo1['id']}", headers=ngo_headers).json()

    donor_status = donor_view["status"]
    ngo1_status = ngo1_view["status"]

    if donor_status in ["RECEIVED", "COMPLETED"] and ngo1_status in ["RECEIVED", "COMPLETED"]:
        results["Test 5: Cross-role status consistency"] = "PASS"
        print(f"PASS: Both donor ({donor_status}) and NGO ({ngo1_status}) see consistent persisted status.", flush=True)
    else:
        results["Test 5: Cross-role status consistency"] = "FAIL"
        print(f"FAIL: Donor sees {donor_status}, NGO sees {ngo1_status}", flush=True)

    # -------------------------------------------------------------
    # TEST 7: Submit unchanged status - No duplicate notification
    # -------------------------------------------------------------
    print("\n--- Running Test 7: Submit unchanged status (idempotency) ---", flush=True)
    with SessionLocal() as db:
        notifs_before = db.query(Notification).filter(Notification.user_id == donor_id).count()

    # Re-submit COLLECTED to pickup_id_1 (already COLLECTED or COMPLETED)
    requests.patch(
        f"{BASE_URL}/pickup/{pickup_id_1}",
        headers=ngo_headers,
        json={"status": "COLLECTED"}
    )

    with SessionLocal() as db:
        notifs_after = db.query(Notification).filter(Notification.user_id == donor_id).count()

    if notifs_before == notifs_after:
        results["Test 7: Unchanged status generates no duplicate notification"] = "PASS"
        print("PASS: Submitting unchanged status generated zero duplicate notifications.", flush=True)
    else:
        results["Test 7: Unchanged status generates no duplicate notification"] = "FAIL"
        print(f"FAIL: Notifications increased from {notifs_before} to {notifs_after}", flush=True)

    # -------------------------------------------------------------
    # TEST 8: Genuinely new status transition generates notification once
    # -------------------------------------------------------------
    print("\n--- Running Test 8: Genuine transition generates single notification ---", flush=True)
    with SessionLocal() as db:
        # Ensure demand for Winter Jacket exists
        d8 = db.query(Demand).filter(Demand.ngo_id == ngo1_id, Demand.item_name == "Winter Jacket", Demand.status == DemandStatus.OPEN).first()
        if not d8:
            db.add(Demand(ngo_id=ngo1_id, item_name="Winter Jacket", category="Clothing", quantity_required=5, quantity_fulfilled=0, status=DemandStatus.OPEN))

        don8 = Donation(
            donor_id=donor_id,
            title="Single Notification Test Donation",
            status=DonationStatus.PENDING,
            pickup_address="456 Event Street",
            pickup_city="Hyderabad"
        )
        db.add(don8)
        db.flush()

        item8 = DonationItem(
            donation_id=don8.id,
            item_name="Winter Jacket",
            category="Clothing",
            quantity=1,
            allocated_quantity=0,
            matching_status="PENDING",
            condition=ItemCondition.GOOD
        )
        db.add(item8)
        db.commit()
        don8_id = don8.id
        item8_id = item8.id

    # Allocate to NGO 1
    requests.post(
        f"{BASE_URL}/donations/items/{item8_id}/allocate",
        headers=donor_headers,
        json={"ngo_id": ngo1_id, "allocated_quantity": 1}
    )

    with SessionLocal() as db:
        donor_notif_count_start = db.query(Notification).filter(
            Notification.user_id == donor_id,
            Notification.related_entity_id == don8_id
        ).count()

    # Schedule pickup (genuinely new event)
    sched_res8 = requests.post(
        f"{BASE_URL}/pickup/donations/{don8_id}",
        headers=donor_headers,
        json={
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "pickup_address": "456 Event Street",
            "time_slot": "10:00 AM - 12:00 PM",
            "notes": "First scheduling"
        }
    )

    with SessionLocal() as db:
        donor_notif_count_after1 = db.query(Notification).filter(
            Notification.user_id == donor_id,
            Notification.related_entity_id == don8_id
        ).count()
    diff1 = donor_notif_count_after1 - donor_notif_count_start

    # Attempt to trigger the exact same pickup scheduled notification again
    sched_res8_dupe = requests.post(
        f"{BASE_URL}/pickup/donations/{don8_id}",
        headers=donor_headers,
        json={
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "pickup_address": "456 Event Street",
            "time_slot": "10:00 AM - 12:00 PM",
            "notes": "First scheduling"
        }
    )

    with SessionLocal() as db:
        donor_notif_count_after2 = db.query(Notification).filter(
            Notification.user_id == donor_id,
            Notification.related_entity_id == don8_id
        ).count()
    diff2 = donor_notif_count_after2 - donor_notif_count_after1

    if diff1 == 1 and diff2 == 0:
        results["Test 8: Genuine event notifies once; duplicate prevented"] = "PASS"
        print("PASS: Exactly 1 notification created on new event, and 0 duplicates on repeat.", flush=True)
    else:
        results["Test 8: Genuine event notifies once; duplicate prevented"] = "FAIL"
        print(f"FAIL: diff1={diff1}, diff2={diff2}", flush=True)

    # -------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------
    print("\n" + "=" * 70, flush=True)
    print("VERIFICATION SUITE SUMMARY:", flush=True)
    print("=" * 70, flush=True)
    all_passed = True
    for name, outcome in results.items():
        print(f"{name:60} : {outcome}", flush=True)
        if outcome != "PASS":
            all_passed = False

    print("=" * 70, flush=True)
    if all_passed:
        print("ALL 9 TEST SCENARIOS PASSED SUCCESSFULLY!", flush=True)
    else:
        print("SOME TESTS FAILED.", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    run_tests()
