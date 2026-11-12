import os
from collections import defaultdict
from pathlib import Path

dataset_dir = Path(r"C:\Users\palla\Desktop\Donation_AI\final_dataset_clean")

def parse_yaml(yaml_path):
    with open(yaml_path, 'r') as f:
        lines = f.readlines()
    names = []
    in_names = False
    for line in lines:
        if line.startswith("names:"):
            in_names = True
            continue
        if in_names:
            if line.strip().startswith("-"):
                names.append(line.replace("-", "").strip())
            elif line.strip() != "":
                in_names = False
    return names

classes = parse_yaml(dataset_dir / "data.yaml")

train_labels = dataset_dir / "train" / "labels"
valid_labels = dataset_dir / "valid" / "labels"

class_stats = {i: {"name": name, "train_imgs": 0, "val_imgs": 0, "labels": 0} for i, name in enumerate(classes)}

def process_dir(labels_dir, is_train=True):
    if not labels_dir.exists(): return
    for label_file in labels_dir.glob("*.txt"):
        with open(label_file, "r") as f:
            lines = f.readlines()
        
        found_in_img = set()
        for line in lines:
            parts = line.strip().split()
            if not parts: continue
            cls_id = int(parts[0])
            if cls_id in class_stats:
                class_stats[cls_id]["labels"] += 1
                found_in_img.add(cls_id)
                
        for cls_id in found_in_img:
            if is_train:
                class_stats[cls_id]["train_imgs"] += 1
            else:
                class_stats[cls_id]["val_imgs"] += 1

process_dir(train_labels, is_train=True)
process_dir(valid_labels, is_train=False)

print("ID | CLASS NAME | TRAIN IMAGES | VALID IMAGES | TOTAL LABELS")
print("-" * 70)
for i, stat in class_stats.items():
    print(f"{i:<2} | {stat['name']:<15} | {stat['train_imgs']:<12} | {stat['val_imgs']:<12} | {stat['labels']}")
