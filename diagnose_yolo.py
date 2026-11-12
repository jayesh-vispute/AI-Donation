import sys
import json
from pathlib import Path
from PIL import Image

sys.path.append(str(Path(__file__).parent / 'donation-ai-api'))
from app.model import load_model, model  # type: ignore
from app.config import settings  # type: ignore

def run_diagnostics():
    print("=== YOLO DIAGNOSTICS ===")
    
    # 1. & 2. YOLO model loading code and best.pt path
    base_dir = Path(__file__).parent / 'donation-ai-api'
    model_path = base_dir / settings.YOLO_MODEL_PATH
    print(f"Model Path: {model_path}")
    print(f"Model Exists: {model_path.exists()}")
    
    # 3. Model initialization
    load_model()
    import app.model as am  # type: ignore
    print(f"Model Loaded Successfully: {am.model is not None}")
    
    if am.model is None:
        return
        
    # 4. & 5. model.names and number of classes
    print(f"Number of Model Classes: {len(am.model.names)}")
    print("Complete Model Names:")
    for k, v in am.model.names.items():
        print(f"  {k}: {v}")
        
    # Configure inference settings
    conf_thresh = settings.YOLO_CONFIDENCE
    imgsz = settings.YOLO_IMGSZ
    max_det = settings.YOLO_MAX_DET
    iou_thresh = settings.YOLO_IOU
    
    print("\n=== INFERENCE SETTINGS ===")
    print(f"Confidence Threshold: {conf_thresh}")
    print(f"IoU Threshold: {iou_thresh}")
    print(f"Max Detections: {max_det}")
    print(f"Image Size (imgsz): {imgsz}")
    
    test_images_dir = Path(__file__).parent / 'test_images'
    for img_path in test_images_dir.glob('*.*'):
        if img_path.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.webp']: continue
        print(f"\n=== TESTING IMAGE: {img_path.name} ===")
        img = Image.open(img_path)
        print(f"Dimensions: {img.width}x{img.height}")
        results = am.model(img, conf=conf_thresh, imgsz=imgsz, max_det=max_det, iou=iou_thresh)
        result = results[0]
        for box in result.boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            class_name = result.names[cls_id]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            print(f"  Class: {class_name} (ID: {cls_id}), Conf: {conf:.4f}, BBox: [{x1}, {y1}, {x2}, {y2}]")
        
if __name__ == "__main__":
    run_diagnostics()
