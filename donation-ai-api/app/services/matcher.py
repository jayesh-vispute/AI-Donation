import math
import difflib
from datetime import datetime
from typing import Tuple, Optional, List
from sqlalchemy.orm import Session
from app.db_models import Donation, Demand, Match, DemandStatus, DonationStatus, DonationItemAllocation, AllocationStatus, MatchStatus

CATEGORY_TAXONOMY = {
    "ELECTRONICS": [
        "laptop", "computer", "pc", "desktop", "notebook", "keyboard", "mouse", "monitor", 
        "screen", "phone", "smartphone", "mobile", "tablet", "ipad", "charger", "cable",
        "tv", "television", "printer", "scanner", "camera", "headphones", "headset",
        "audio", "earphones", "earbuds", "speaker", "hard drive", "electronics", "electronic",
        "gadget", "power bank", "router", "modem", "smart watch"
    ],
    "BOOKS": [
        "book", "books", "textbook", "textbooks", "novel", "novels", "notebook", "notebooks",
        "dictionary", "magazine", "magazines", "stationery", "study material", "paper",
        "comics", "educational", "atlas", "encyclopedia", "reading book", "storybook"
    ],
    "CLOTHING": [
        "shirt", "t-shirt", "tee", "pants", "trousers", "jacket", "coat", "shoes", "shoe",
        "footwear", "dress", "clothes", "clothing", "sweater", "jeans", "socks", "blanket",
        "blankets", "apparel", "hoodie", "uniform", "scarf", "gloves", "belt", "sari", "kurta"
    ],
    "FURNITURE": [
        "chair", "chairs", "table", "tables", "desk", "desks", "dining table", "sofa",
        "couch", "bed", "cupboard", "shelf", "shelves", "cabinet", "bench", "mattress",
        "furniture", "wardrobe", "stool", "drawer", "bookshelf"
    ],
    "FOOD": [
        "food", "grain", "grains", "rice", "wheat", "canned", "groceries", "grocery",
        "ration", "meal", "meals", "fruit", "fruits", "vegetable", "vegetables", "flour",
        "pulse", "pulses", "oil", "snacks", "cereal", "edible", "spices"
    ],
    "KITCHENWARE": [
        "cup", "cups", "utensil", "utensils", "plate", "plates", "bowl", "bowls",
        "cookware", "pan", "pans", "pot", "pots", "spoon", "spoons", "fork", "forks",
        "cutlery", "mug", "mugs", "dish", "dishes", "bottle", "bottles", "kitchenware",
        "glass", "glasses", "kettle"
    ],
    "MEDICAL": [
        "medicine", "medicines", "wheelchair", "crutches", "first aid", "mask", "masks",
        "thermometer", "bandage", "bandages", "medical", "gloves", "syringes", "sanitizer",
        "health", "pharma", "pharmaceutical", "stethoscopes", "walker"
    ],
    "TOYS": [
        "toy", "toys", "board game", "puzzle", "puzzles", "doll", "dolls", "teddy",
        "lego", "games", "stuffed animal", "action figure", "play set"
    ],
    "SPORTS": [
        "ball", "football", "cricket", "racket", "sports", "bat", "fitness", "exercise",
        "basketball", "badminton", "tennis", "volleyball", "jersey", "dumbbell"
    ],
    "HOUSEHOLD": [
        "household", "cleaning", "lamp", "lamps", "bucket", "curtain", "curtains",
        "fan", "heater", "appliance", "iron", "clock", "bedsheet", "pillow", "towel"
    ]
}

def is_text_match(text1: Optional[str], text2: Optional[str], threshold: float = 0.8) -> bool:
    if not text1 or not text2:
        return False
    
    s1 = text1.strip().lower()
    s2 = text2.strip().lower()
    
    if s1 == s2:
        return True
        
    if s1.endswith('s') and s1[:-1] == s2: return True
    if s2.endswith('s') and s2[:-1] == s1: return True
    if s1.endswith('es') and s1[:-2] == s2: return True
    if s2.endswith('es') and s2[:-2] == s1: return True
        
    if s1 in s2 or s2 in s1:
        return True
        
    if difflib.SequenceMatcher(None, s1, s2).ratio() >= threshold:
        return True
        
    return False

def get_canonical_category(*text_elements: Optional[str]) -> Optional[str]:
    """Resolves arbitrary item or category strings to a canonical category group."""
    for elem in text_elements:
        if not elem:
            continue
        cleaned = elem.strip().lower()
        for cat_name, keywords in CATEGORY_TAXONOMY.items():
            if cleaned == cat_name.lower():
                return cat_name
            for kw in keywords:
                if kw == cleaned or f" {kw} " in f" {cleaned} " or cleaned.startswith(f"{kw} ") or cleaned.endswith(f" {kw}"):
                    return cat_name
    return None

def are_categories_compatible(
    item_category: Optional[str],
    item_subcategory: Optional[str],
    item_name: Optional[str],
    demand_category: Optional[str],
    demand_subcategory: Optional[str],
    demand_name: Optional[str]
) -> bool:
    """Enforces strict category matching: distinct categories must NEVER match."""
    cat1 = get_canonical_category(item_category, item_subcategory, item_name)
    cat2 = get_canonical_category(demand_category, demand_subcategory, demand_name)
    
    if cat1 and cat2:
        return cat1 == cat2
    
    # If neither belongs to standard taxonomy, fall back to safe text similarity
    if is_text_match(item_name, demand_name) or is_text_match(item_subcategory, demand_subcategory) or is_text_match(item_category, demand_category):
        return True
        
    return False

def are_items_compatible(
    item_name: Optional[str],
    item_subcat: Optional[str],
    item_cat: Optional[str],
    demand_name: Optional[str],
    demand_subcat: Optional[str],
    demand_cat: Optional[str]
) -> Tuple[bool, float, str]:
    """
    Determines if a donated item matches an NGO demand and returns (is_match, similarity_score, prefix).
    Enforces that specific requested items (e.g., 'keyboard' vs 'laptop', or 'dining table' vs 'chair')
    never match each other unless the demand was for the category as a whole.
    """
    if not are_categories_compatible(item_cat, item_subcat, item_name, demand_cat, demand_subcat, demand_name):
        return False, 0.0, ""

    # Check 1: Exact / fuzzy item name match
    if is_text_match(demand_name, item_name):
        return True, 1.00, f"Exact item match: {str(item_name).capitalize()}"

    # Check 2: Subcategory match if demand is generic or subcategory matches
    generic_names = ["general", "all", "any", "items", "supplies", "goods", "other", "item"]
    d_name_lower = str(demand_name).strip().lower() if demand_name else ""
    d_cat_lower = str(demand_cat).strip().lower() if demand_cat else ""
    d_subcat_lower = str(demand_subcat).strip().lower() if demand_subcat else ""

    is_demand_generic = (
        not d_name_lower or
        d_name_lower in generic_names or
        d_name_lower == d_cat_lower or
        d_name_lower == d_subcat_lower
    )

    if is_text_match(demand_subcat, item_subcat) and (is_demand_generic or is_text_match(demand_name, item_subcat)):
        return True, 0.85, f"Subcategory match: {item_subcat}"

    # Check 3: Category match if demand is generic or matches category
    if (is_text_match(demand_cat, item_cat) or is_text_match(demand_name, item_cat)) and is_demand_generic:
        return True, 0.70, f"Category-level match: {item_cat}"

    return False, 0.0, ""

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points on the Earth's surface
    using the Haversine formula. Returns distance in kilometers rounded to 2 decimal places.
    """
    R = 6371.0  # Earth's radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

def calculate_proximity(
    lat1: Optional[float], 
    lon1: Optional[float], 
    lat2: Optional[float], 
    lon2: Optional[float]
) -> Tuple[Optional[float], float]:
    """
    Computes real distance in kilometers and deterministic proximity score (0.0 to 1.0).
    Handles missing or invalid coordinates safely, returning (None, 0.5) default.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None, 0.5

    try:
        f_lat1, f_lon1, f_lat2, f_lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (ValueError, TypeError):
        return None, 0.5

    # Validate coordinate ranges
    if not (-90.0 <= f_lat1 <= 90.0 and -180.0 <= f_lon1 <= 180.0 and
            -90.0 <= f_lat2 <= 90.0 and -180.0 <= f_lon2 <= 180.0):
        return None, 0.5

    distance_km = calculate_haversine_distance(f_lat1, f_lon1, f_lat2, f_lon2)

    # Deterministic linear decay score mapping distance in km:
    # 0 km -> 1.0, 5 km -> 0.90, 25 km -> 0.50, 50+ km -> 0.0
    score = max(0.0, min(1.0, 1.0 - (distance_km / 50.0)))
    proximity_score = round(score, 2)

    return distance_km, proximity_score

def calculate_matches(db: Session, donation_id: int) -> List[Match]:
    """
    Calculates item-level NGO matches for a donation with full idempotency,
    safeguards against over-allocation, and strict cross-category isolation.
    """
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation or not donation.items:
        return []

    demands = db.query(Demand).filter(
        Demand.status.in_([DemandStatus.OPEN, DemandStatus.active, DemandStatus.PARTIALLY_FULFILLED, DemandStatus.partially_fulfilled])
    ).all()
    
    matches_result = []
    pickup_lat = donation.pickup_latitude
    pickup_lon = donation.pickup_longitude

    for item in donation.items:
        # Rule 10: Safe zero/invalid quantity handling
        if not item.quantity or item.quantity <= 0:
            continue

        # Get existing allocations to compute remaining donor quantity accurately
        existing_allocations = db.query(DonationItemAllocation).filter(
            DonationItemAllocation.donation_item_id == item.id,
            DonationItemAllocation.status != AllocationStatus.REJECTED
        ).all()
        
        current_allocated_total = sum(a.allocated_quantity for a in existing_allocations)
        item.allocated_quantity = min(item.quantity, max(0, current_allocated_total))
        donation_item_remaining = max(0, item.quantity - item.allocated_quantity)

        # Clean up stale matches for this item where demand is missing or cancelled
        existing_matches = db.query(Match).filter(Match.donation_item_id == item.id).all()
        for em in existing_matches:
            if not em.demand or str(em.demand.status.value if hasattr(em.demand.status, 'value') else em.demand.status).upper() == "CANCELLED":
                try:
                    db.delete(em)
                except Exception:
                    pass

        item_demands = []
        for d in demands:
            # Rule 4: NGO cannot receive more than its current demand
            ngo_remaining_demand = d.quantity_required - d.quantity_fulfilled
            if ngo_remaining_demand <= 0:
                continue

            # Check item-level compatibility and similarity
            is_match, similarity_score, match_prefix = are_items_compatible(
                item.item_name, item.subcategory, item.category,
                d.item_name, d.subcategory, d.category
            )

            if not is_match or similarity_score <= 0:
                continue

            ngo_lat = d.ngo.latitude if d.ngo else None
            ngo_lon = d.ngo.longitude if d.ngo else None
            distance_km, proximity_score = calculate_proximity(pickup_lat, pickup_lon, ngo_lat, ngo_lon)
            
            p_val = str(d.priority.value).upper() if d.priority else "MEDIUM"
            priority_mapping = {"URGENT": 1.0, "HIGH": 0.8, "MEDIUM": 0.5, "LOW": 0.2}
            priority_score = priority_mapping.get(p_val, 0.5)
            
            overall_score = (similarity_score * 0.4) + (proximity_score * 0.2) + (priority_score * 0.1)
            item_demands.append((overall_score, d, similarity_score, match_prefix, distance_km, priority_score, proximity_score))

        item_demands.sort(key=lambda x: x[0], reverse=True)

        # Keep only the highest-scoring demand per NGO for this donation item
        seen_demand_ngos = set()
        deduped_item_demands = []
        for d_entry in item_demands:
            d_obj = d_entry[1]
            if d_obj.ngo_id not in seen_demand_ngos:
                seen_demand_ngos.add(d_obj.ngo_id)
                deduped_item_demands.append(d_entry)
        item_demands = deduped_item_demands

        for score, d, sim_score, prefix, dist_km, pri_score, prox_score in item_demands:
            ngo_remaining_demand = max(0, d.quantity_required - d.quantity_fulfilled)
            if ngo_remaining_demand <= 0:
                continue

            # Check if this match already exists (Rule 2, 8: Stable Match ID)
            existing_match = db.query(Match).filter(
                Match.donation_item_id == item.id,
                Match.demand_id == d.id
            ).first()

            # Rule 3 & 4: Matched quantity must never exceed detected quantity or NGO demand
            suggested_qty = min(max(1, donation_item_remaining if donation_item_remaining > 0 else 1), ngo_remaining_demand, item.quantity)

            # Check if an allocation already exists for (item.id, d.ngo_id)
            existing_alloc = db.query(DonationItemAllocation).filter(
                DonationItemAllocation.donation_item_id == item.id,
                DonationItemAllocation.ngo_id == d.ngo_id
            ).first()

            alloc_qty = existing_alloc.allocated_quantity if existing_alloc else 0
            matched_qty_for_record = alloc_qty if alloc_qty > 0 else suggested_qty

            match_reason = f"{prefix}. NGO Priority: {d.priority.value if d.priority else 'MEDIUM'}, Needs: {d.quantity_required - d.quantity_fulfilled}."
            if dist_km is not None:
                match_reason += f" Distance: {dist_km} km."

            if existing_match:
                # Rule 9: Update in-place
                existing_match.matched_quantity = matched_qty_for_record
                existing_match.item_similarity_score = sim_score
                existing_match.quantity_score = round(min(matched_qty_for_record / max(d.quantity_required, 1), 1.0), 2)
                existing_match.proximity_score = prox_score
                existing_match.priority_score = pri_score
                existing_match.overall_score = round(min(score, 1.0), 2)
                existing_match.distance_km = dist_km
                existing_match.match_reason = match_reason
                existing_match.updated_at = datetime.utcnow()
                matches_result.append(existing_match)
            else:
                # Rule 8: Create new Match with valid status
                new_match = Match(
                    donation_item_id=item.id,
                    demand_id=d.id,
                    matched_quantity=matched_qty_for_record,
                    item_similarity_score=sim_score,
                    quantity_score=round(min(matched_qty_for_record / max(d.quantity_required, 1), 1.0), 2),
                    proximity_score=prox_score,
                    priority_score=pri_score,
                    overall_score=round(min(score, 1.0), 2),
                    distance_km=dist_km,
                    match_reason=match_reason,
                    status=MatchStatus.active
                )
                db.add(new_match)
                matches_result.append(new_match)

    db.commit()
    for m in matches_result:
        db.refresh(m)
        
    return matches_result

