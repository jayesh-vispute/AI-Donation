"""
Script to evaluate the newly trained YOLOv8 model against the validation dataset.
"""
from ultralytics import YOLO
import torch
import json
import os
from pathlib import Path

def evaluate_model():
    print("=== EVALUATING YOLOv8 MODEL ===")
    model_path = Path(r"C:\Users\palla\Desktop\Donation_AI\training\donation_yolov8s\weights\best.pt")
    data_yaml = Path(r"C:\Users\palla\Desktop\Donation_AI\final_dataset_clean\data.yaml")
    
    if not model_path.exists():
        print(f"Error: Model not found at {model_path}")
        return
        
    model = YOLO(str(model_path))
    print(f"Model loaded: {model_path}")
    
    # Run validation
    print("Running validation (this may take a few minutes)...")
    
    # Use CPU if GPU is busy training, but try GPU first
    device = "0" if torch.cuda.is_available() else "cpu"
    
    metrics = model.val(
        data=str(data_yaml),
        split="val",
        device=device,
        project="evaluation_results",
        name="val_run",
        exist_ok=True,
        save_json=True
    )
    
    print("\n=== OVERALL METRICS ===")
    print(f"Precision: {metrics.box.mp:.4f}")
    print(f"Recall: {metrics.box.mr:.4f}")
    print(f"mAP50: {metrics.box.map50:.4f}")
    print(f"mAP50-95: {metrics.box.map:.4f}")
    
    print("\n=== PER-CLASS METRICS ===")
    class_indices = metrics.box.ap_class_index
    names = metrics.names
    
    p = metrics.box.p
    r = metrics.box.r
    ap50 = metrics.box.ap50
    ap = metrics.box.ap
    
    # Focus classes
    focus_classes = {
        "book", "notebook", "pen", "pencil", "eraser", 
        "sharpener", "ruler", "scissors", "computer", "keyboard"
    }
    
    for i, c in enumerate(class_indices):
        name = names[c]
        if name in focus_classes:
            print(f"{name:15s} | P: {p[i]:.4f} | R: {r[i]:.4f} | mAP50: {ap50[i]:.4f} | mAP50-95: {ap[i]:.4f}")
            
    print("\nValidation plots and confusion matrix saved to evaluation_results/val_run/")

if __name__ == "__main__":
    evaluate_model()
