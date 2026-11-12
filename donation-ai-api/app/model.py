import logging
import os
from pathlib import Path
from typing import Dict, Any, List

# Redirect Ultralytics config to a writable local directory (avoids PermissionError on AppData)
_ultralytics_cfg = str(Path(__file__).resolve().parent.parent / ".ultralytics")
os.environ.setdefault("YOLO_CONFIG_DIR", _ultralytics_cfg)

from ultralytics import YOLO  # type: ignore
from PIL import Image

from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model variable
model = None

def load_model() -> None:
    """
    Loads the YOLO model globally on startup.
    """
    global model
    if model is None:
        # Resolve path relative to backend project root (donation-ai-api)
        base_dir = Path(__file__).resolve().parent.parent
        model_path = base_dir / settings.YOLO_MODEL_PATH
        
        try:
            logger.info("Loading custom YOLO model...")
            logger.info(f"Model path:\n{model_path}")
            
            if not model_path.exists():
                logger.error("Custom YOLO model failed to load.")
                logger.error(f"Expected path:\n{model_path}")
                logger.error("Custom YOLO model not found. Place best.pt inside donation-ai-api/models/")
                model = None
                return
                
            model = YOLO(str(model_path))
            
            # Additional logic to safely get model version, normally in model.info() or ckpt args
            model_version = getattr(model, 'version', 'unknown')
            if not isinstance(model_version, str):
                model_version = getattr(model.model, 'version', 'unknown')
                
            logger.info("[AI] Model loaded successfully")
            logger.info(f"[AI] Model: {model_path.name}")
            logger.info(f"[AI] Classes: {len(model.names)}")
            logger.info(f"[AI] Model version: {model_version}")
            logger.info(f"YOLO classes:\n{model.names}")
        except Exception as e:
            logger.error("Custom YOLO model failed to load.")
            logger.error(f"Expected path:\n{model_path}")
            logger.error(f"Internal exception: {e}", exc_info=True)
            model = None

def is_model_loaded() -> bool:
    """Check if the model has been loaded successfully."""
    return model is not None

# Category and Subcategory Mapping for model classes
SUBCATEGORY_MAPPING = {
    # Food & Grocery
    "rice": ("Food & Grocery", "Grains & Pulses"),
    "beans": ("Food & Grocery", "Grains & Pulses"),
    "flour": ("Food & Grocery", "Grains & Flours"),
    "pasta": ("Food & Grocery", "Packaged Food"),
    "sugar": ("Food & Grocery", "Pantry Essentials"),
    "salt": ("Food & Grocery", "Pantry Essentials"),
    "oil": ("Food & Grocery", "Cooking Essentials"),
    "milk": ("Food & Grocery", "Dairy & Beverages"),
    "water": ("Food & Grocery", "Beverages"),
    "juice": ("Food & Grocery", "Beverages"),
    "tea": ("Food & Grocery", "Beverages"),
    "coffee": ("Food & Grocery", "Beverages"),
    "cereal": ("Food & Grocery", "Breakfast Foods"),
    "chips": ("Food & Grocery", "Snacks"),
    "chocolate": ("Food & Grocery", "Snacks & Sweets"),
    "cake": ("Food & Grocery", "Bakery & Sweets"),
    "candy": ("Food & Grocery", "Snacks & Sweets"),
    "nuts": ("Food & Grocery", "Snacks & Dry Fruits"),
    "spices": ("Food & Grocery", "Pantry Essentials"),
    "fish": ("Food & Grocery", "Canned & Preserved Goods"),

    # Clothing & Footwear
    "shirt": ("Clothing", "Tops & Shirts"),
    "tshirt": ("Clothing", "Tops & Shirts"),
    "jacket": ("Clothing", "Outerwear & Coats"),
    "hoodie": ("Clothing", "Outerwear & Sweaters"),
    "pants": ("Clothing", "Bottoms & Trousers"),
    "shorts": ("Clothing", "Bottoms & Shorts"),
    "skirt": ("Clothing", "Bottoms & Dresses"),
    "shoes": ("Footwear", "Athletic & Everyday Shoes"),
    "sneakers": ("Footwear", "Athletic Shoes"),
    "slippers": ("Footwear", "Casual & Home Footwear"),
    "flats": ("Footwear", "Casual & Formal Footwear"),
    "high heels": ("Footwear", "Formal Footwear"),

    # Books, Educational & Stationery
    "book": ("Books & Education", "Books & Textbooks"),
    "notebook": ("Books & Education", "Notebooks & Writing Pads"),
    "pen": ("Stationery", "Writing Instruments"),
    "pencil": ("Stationery", "Writing Instruments"),
    "eraser": ("Stationery", "School & Office Supplies"),
    "sharpener": ("Stationery", "School & Office Supplies"),
    "marker": ("Stationery", "Writing Instruments"),
    "sticky note": ("Stationery", "School & Office Supplies"),
    "sticky notes": ("Stationery", "School & Office Supplies"),
    "ruler": ("Stationery", "School & Office Supplies"),
    "calculator": ("Electronics", "Calculators & Small Electronics"),

    # Electronics & Appliances
    "computer": ("Electronics", "Computers & Laptops"),
    "laptop": ("Electronics", "Computers & Laptops"),
    "keyboard": ("Electronics", "Computer Accessories"),
    "mouse": ("Electronics", "Computer Accessories"),
    "mobile phone": ("Electronics", "Phones & Mobile Devices"),
    "ipad": ("Electronics", "Tablets & E-Readers"),
    "screen": ("Electronics", "Monitors & Displays"),
    "headphones": ("Electronics", "Audio Equipment"),
    "earphones": ("Electronics", "Audio Equipment"),
    "charging cable": ("Electronics", "Cables & Accessories"),
    "camera": ("Electronics", "Cameras & Photography"),
    "printer": ("Electronics", "Office Equipment"),
    "fridge": ("Appliances", "Refrigerators & Freezers"),
    "freezer": ("Appliances", "Refrigerators & Freezers"),
    "microwave": ("Appliances", "Kitchen Appliances"),
    "oven": ("Appliances", "Kitchen Appliances"),
    "washing machine": ("Appliances", "Laundry Appliances"),
    "vacuum cleaner": ("Appliances", "Cleaning Appliances"),
    "watch": ("Accessories", "Watches & Jewelry"),

    # Furniture & Home Goods
    "chair": ("Furniture", "Chairs & Seating"),
    "table": ("Furniture", "Tables & Desks"),
    "sofa": ("Furniture", "Sofas & Couches"),
    "bed": ("Furniture", "Beds & Mattresses"),
    "desk": ("Furniture", "Tables & Desks"),
    "wardrobe": ("Furniture", "Storage & Cabinets"),
    "shelf": ("Furniture", "Shelving & Bookcases"),
    "cabinet": ("Furniture", "Storage & Cabinets"),
    "mirror": ("Furniture", "Home Decor & Mirrors"),
    "carpet": ("Furniture", "Rugs & Carpets"),
    "lamp": ("Furniture", "Lighting & Lamps"),
    "drawer": ("Furniture", "Storage & Cabinets"),
    "shoe rack": ("Furniture", "Storage & Racks"),

    # Kitchenware & Household
    "spoon": ("Kitchenware", "Cutlery & Utensils"),
    "fork": ("Kitchenware", "Cutlery & Utensils"),
    "bottle opener": ("Kitchenware", "Kitchen Tools"),
    "bag": ("Household", "Bags & Luggage"),
    "backpack": ("Household", "Bags & Luggage"),
    "bottle": ("Household", "Containers & Bottles"),
    "glasses": ("Accessories", "Eyewear"),
    "keys": ("Accessories", "Keychains & Keys"),
    "umbrella": ("Household", "Umbrellas & Gear"),

    # Health & Medical
    "band aid": ("Medical & Health", "First Aid & Bandages"),
    "bandages": ("Medical & Health", "First Aid & Bandages"),
    "medicine": ("Medical & Health", "Pharmaceuticals & Supplies"),
    "safety pin": ("Medical & Health", "First Aid & Accessories"),
    "scissors": ("Household", "Cutting Tools"),
    "surgical gloves": ("Medical & Health", "Protective Equipment"),
    "thermometer": ("Medical & Health", "Diagnostic Tools"),
    "tweezers": ("Medical & Health", "First Aid Tools")
}

# Legacy dictionary compatibility
CATEGORY_MAPPING = {k: v[0] for k, v in SUBCATEGORY_MAPPING.items()}

def get_category_and_subcategory_for_class(class_name: str) -> tuple[str, str]:
    """Returns the (category, subcategory) tuple for a given model class."""
    if not class_name:
        return ("General", "General Items")
    key = class_name.lower().strip()
    return SUBCATEGORY_MAPPING.get(key, ("General", "General Items"))

def get_category_for_class(class_name: str) -> str:
    """Returns the Donation AI category for a given model class."""
    return get_category_and_subcategory_for_class(class_name)[0]

def get_subcategory_for_class(class_name: str) -> str:
    """Returns the Donation AI subcategory for a given model class."""
    return get_category_and_subcategory_for_class(class_name)[1]

def calculate_iou(box1: Dict[str, int], box2: Dict[str, int]) -> float:
    # box format: {"x1": int, "y1": int, "x2": int, "y2": int}
    x_left = max(box1['x1'], box2['x1'])
    y_top = max(box1['y1'], box2['y1'])
    x_right = min(box1['x2'], box2['x2'])
    y_bottom = min(box1['y2'], box2['y2'])
    
    if x_right < x_left or y_bottom < y_top:
        return 0.0
        
    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    
    box1_area = (box1['x2'] - box1['x1']) * (box1['y2'] - box1['y1'])
    box2_area = (box2['x2'] - box2['x1']) * (box2['y2'] - box2['y1'])
    
    iou = intersection_area / float(box1_area + box2_area - intersection_area)
    return iou

def predict_image(image: Image.Image) -> Dict[str, Any]:
    """
    Runs YOLO inference on the provided image and formats the result.
    """
    if model is None:
        raise ValueError("Model is not loaded")

    conf_thresh = settings.YOLO_CONFIDENCE
    imgsz = settings.YOLO_IMGSZ
    max_det = settings.YOLO_MAX_DET
    iou_thresh = settings.YOLO_IOU

    try:
        # Run inference with explicit parameters
        results = model(
            image,
            conf=conf_thresh,
            imgsz=imgsz,
            max_det=max_det,
            iou=iou_thresh
        )
        
        # We only process the first result as we passed a single image
        result = results[0]
        
        detected_objects: Dict[str, Dict[str, Any]] = {}
        total_items = 0
        
        # Custom NMS IoU threshold for heavily overlapping boxes of same class
        # (in case YOLO's internal NMS doesn't catch them due to agnostic=False or threshold)
        POST_NMS_IOU = 0.30
        
        logger.info(f"[AI] Raw detections count: {len(result.boxes)}")
        
        raw_detections = []
        
        # Iterate over each detected bounding box
        for box in result.boxes:
            conf = float(box.conf[0])
            
            # Filter by confidence threshold
            if conf < conf_thresh:
                continue
                
            # Get class name
            cls_id = int(box.cls[0])
            try:
                class_name = result.names[cls_id]
            except (IndexError, KeyError):
                logger.error(f"Invalid class ID {cls_id} detected.")
                raise ValueError(f"INVALID_CLASS: Detected class ID {cls_id} is not in model names.")
            
            # Get bounding box coordinates as integers
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            bbox = {"x1": x1, "y1": y1, "x2": x2, "y2": y2, "confidence": conf}
            
            raw_detections.append({
                "class_id": cls_id,
                "class_name": class_name,
                "confidence": conf,
                "bbox": bbox
            })
            
            # Check for overlapping duplicates (same class)
            is_duplicate = False
            if class_name in detected_objects:
                for existing_box in detected_objects[class_name]["boxes"]:
                    iou_val = calculate_iou(bbox, existing_box)
                    if iou_val > POST_NMS_IOU:
                        is_duplicate = True
                        break
            
            if is_duplicate:
                continue
                
            # Group by class name
            if class_name not in detected_objects:
                detected_objects[class_name] = {
                    "name": class_name,
                    "confidence_sum": conf,
                    "quantity": 1,
                    "boxes": [bbox]
                }
            else:
                detected_objects[class_name]["confidence_sum"] += conf
                detected_objects[class_name]["quantity"] += 1
                detected_objects[class_name]["boxes"].append(bbox)
                
            total_items += 1
            
        logger.info(f"[AI] Final non-duplicate detections: {total_items}")
            
        # Format output items, calculating average confidence & mapping category and subcategory
        formatted_items = []
        for class_name, data in detected_objects.items():
            avg_conf = data["confidence_sum"] / data["quantity"]
            conf_rounded = round(avg_conf, 2)
            category, subcategory = get_category_and_subcategory_for_class(class_name)
            primary_bbox = data["boxes"][0] if data["boxes"] else {"x1": 0, "y1": 0, "x2": 0, "y2": 0}
            
            formatted_items.append({
                "detected_class": data["name"],
                "name": data["name"],
                "category": category,
                "subcategory": subcategory,
                "confidence": conf_rounded,
                "quantity": data["quantity"],
                "condition": "GOOD",
                "requires_review": conf_rounded < 0.70,
                "bbox": primary_bbox,
                "boxes": data["boxes"]
            })
            
        return {
            "status": "success",
            "items": formatted_items,
            "raw_detections": raw_detections,
            "total_items": total_items
        }
        
    except Exception as e:
        logger.error(f"[AI] Inference failed: {e}")
        raise ValueError("Object detection failed")
