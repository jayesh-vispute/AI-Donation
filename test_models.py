import os
from pathlib import Path
from ultralytics import YOLO
import cv2

def test_model():
    print("=== TASK 9: REAL-WORLD YOLO MODEL TESTING ===")
    
    old_model_path = Path(r"C:\Users\palla\Desktop\Donation_AI\donation-ai-api\models\best.pt")
    new_model_path = Path(r"C:\Users\palla\Desktop\Donation_AI\training\donation_yolov8s\weights\best.pt")
    
    test_dir = Path(r"C:\Users\palla\Desktop\Donation_AI\test_images")
    output_dir = Path(r"C:\Users\palla\Desktop\Donation_AI\test_output")
    output_dir.mkdir(exist_ok=True)
    
    print(f"Loading OLD model: {old_model_path.name}")
    try:
        old_model = YOLO(str(old_model_path))
    except Exception as e:
        print(f"Failed to load old model: {e}")
        return
        
    print(f"Loading NEW model: {new_model_path.name}")
    try:
        new_model = YOLO(str(new_model_path))
    except Exception as e:
        print(f"Failed to load new model: {e}")
        return
        
    test_images = list(test_dir.glob("*.*"))
    test_images = [img for img in test_images if img.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]
    
    print(f"\nFound {len(test_images)} test images. Running inference...\n")
    
    for img_path in test_images:
        print("-" * 50)
        print(f"IMAGE: {img_path.name}")
        
        # Load image for annotation
        img_orig = cv2.imread(str(img_path))
        if img_orig is None:
            print("Failed to read image.")
            continue
            
        models = [("OLD", old_model), ("NEW", new_model)]
        
        for model_name, model in models:
            print(f"\n[{model_name} MODEL RESULTS]")
            results = model.predict(source=str(img_path), verbose=False)
            
            # Draw on a copy of the image
            annotated_img = results[0].plot()
            out_path = output_dir / f"{img_path.stem}_{model_name}.jpg"
            cv2.imwrite(str(out_path), annotated_img)
            
            result = results[0]
            if len(result.boxes) == 0:
                print("  No objects detected.")
                continue
                
            class_counts = {}
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                
                # Protect against index out of range if model names list is shorter
                # In old model, model.names only has 61 classes. In new model, 63.
                if cls_id < len(model.names):
                    class_name = model.names[cls_id]
                else:
                    class_name = f"Unknown_{cls_id}"
                    
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                bbox = (x1, y1, x2, y2)
                
                print(f"  - {class_name:15s} | Conf: {conf*100:.1f}% | BBox: {bbox}")
                
                class_counts[class_name] = class_counts.get(class_name, 0) + 1
                
            print(f"  Summary:")
            for cls, count in class_counts.items():
                print(f"    {cls}: Quantity {count}")
                
    print(f"\nTesting complete. Annotated images saved to {output_dir}")

if __name__ == "__main__":
    test_model()
