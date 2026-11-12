import torch
from ultralytics import YOLO
import os
from pathlib import Path

def train_model():
    print("=== STARTING YOLOv8 TRAINING ===")
    
    # 1. Check GPU resources
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"Device selected: {device}")
    
    model_size = "yolov8s.pt" # Default to small for reasonable training time
    batch_size = 16
    workers = 4
    
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        mem_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"GPU Name: {gpu_name}")
        print(f"GPU Memory: {mem_gb:.2f} GB")
        
        # Adjust batch and workers based on GPU
        if mem_gb > 12:
            model_size = "yolov8m.pt"
            batch_size = 32
            workers = 8
        elif mem_gb > 6:
            model_size = "yolov8m.pt"
            batch_size = 16
            workers = 4
        else:
            model_size = "yolov8s.pt"
            batch_size = 8
            workers = 2
            
    print(f"Selected model: {model_size}")
    print(f"Batch size: {batch_size}")
    print(f"Workers: {workers}")
    
    # 2. Define Dataset and Paths
    base_dir = Path(__file__).resolve().parent
    data_yaml = base_dir / "final_dataset_clean" / "data.yaml"
    project_dir = base_dir / "training_output"
    
    if not data_yaml.exists():
        print(f"ERROR: {data_yaml} not found!")
        return

    # 3. Load Model
    model = YOLO(model_size)
    
    # 4. Train Model
    print(f"Training using dataset: {data_yaml}")
    
    results = model.train(
        data=str(data_yaml),
        epochs=100,
        patience=20,     # Early stopping
        batch=batch_size,
        imgsz=640,
        device=device,
        workers=workers,
        project=str(project_dir),
        name="donation_yolov8_run",
        exist_ok=True,   # Overwrite if exists
        save=True,       # Save best.pt and last.pt
        plots=True,      # Save confusion matrix, PR curves, etc.
        val=True         # Run validation
    )
    
    print("\n=== TRAINING COMPLETE ===")
    
    # Print metrics
    print(f"Model Path: {project_dir / 'donation_yolov8_run' / 'weights' / 'best.pt'}")
    
    # Attempt to print final metrics if available
    try:
        metrics = model.metrics
        print(f"Classes: {len(metrics.names)}")
        print(f"mAP50: {metrics.box.map50:.4f}")
        print(f"mAP50-95: {metrics.box.map:.4f}")
        
        # We can extract precision/recall from the results dict if needed
    except Exception as e:
        print(f"Could not print detailed metrics directly: {e}")

if __name__ == "__main__":
    train_model()
