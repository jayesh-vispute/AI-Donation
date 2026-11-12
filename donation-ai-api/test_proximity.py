from app.services.matcher import calculate_haversine_distance, calculate_proximity

def test_proximity_suite():
    print("="*60)
    print("      TESTING HAVERSINE DISTANCE & PROXIMITY SCORING        ")
    print("="*60)

    # Known Coordinates:
    # Point A: New Delhi (28.6139, 77.2090)
    # Point B: Noida (28.5355, 77.3910)
    # Known geodesic distance: ~19.8 km
    lat1, lon1 = 28.6139, 77.2090
    lat2, lon2 = 28.5355, 77.3910

    # 1. Haversine Distance Calculation
    dist = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    print(f"1. Delhi -> Noida Distance: {dist} km")
    assert 19.0 <= dist <= 21.0, f"Expected ~19.8 km, got {dist}"

    # 2. Proximity Score Calculation
    dist_km, score = calculate_proximity(lat1, lon1, lat2, lon2)
    print(f"2. Proximity Score (19.8km): distance_km={dist_km}, proximity_score={score}")
    assert dist_km == dist
    assert score == round(1.0 - (dist_km / 50.0), 2)

    # 3. Determinism Verification (100 repetitions)
    print("\n3. Verifying Determinism (100 Repetitions)...")
    for _ in range(100):
        d_rep, s_rep = calculate_proximity(lat1, lon1, lat2, lon2)
        assert d_rep == dist_km, "Distance returned different value on repeat!"
        assert s_rep == score, "Proximity score returned different value on repeat!"
    print("  -> PASSED: All 100 repetitions produced IDENTICAL results!")

    # 4. Same Location (0 km)
    print("\n4. Same Location Test...")
    d_zero, s_zero = calculate_proximity(28.6139, 77.2090, 28.6139, 77.2090)
    print(f"  -> distance_km={d_zero}, proximity_score={s_zero}")
    assert d_zero == 0.0
    assert s_zero == 1.0

    # 5. Far Location (> 50 km)
    print("\n5. Far Location Test (>50km)...")
    d_far, s_far = calculate_proximity(28.6139, 77.2090, 26.9124, 75.7873)  # Delhi to Jaipur ~240km
    print(f"  -> distance_km={d_far}, proximity_score={s_far}")
    assert d_far > 50.0
    assert s_far == 0.0

    # 6. Missing Coordinates Handling (None values)
    print("\n6. Missing Coordinates Handling (None)...")
    d_null, s_null = calculate_proximity(None, 77.2090, 28.5355, None)
    print(f"  -> distance_km={d_null}, proximity_score={s_null}")
    assert d_null is None
    assert s_null == 0.5

    # 7. Invalid Coordinate Values (Out of range lat > 90)
    print("\n7. Invalid Coordinates Range Test...")
    d_inv, s_inv = calculate_proximity(150.0, 77.2090, 28.5355, 77.3910)
    print(f"  -> distance_km={d_inv}, proximity_score={s_inv}")
    assert d_inv is None
    assert s_inv == 0.5

    print("\n" + "="*60)
    print("      ALL HAVERSINE & PROXIMITY TESTS PASSED CLEANLY!       ")
    print("="*60)

if __name__ == "__main__":
    test_proximity_suite()
