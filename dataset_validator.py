"""
YOLO Dataset Validation & Quality Report Script
Inspects final_dataset_clean and the Stationary Items Dataset source.
"""
import os
import json
from pathlib import Path
from collections import defaultdict, Counter

# ============================================================
# CONFIG
# ============================================================
DATASET_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\final_dataset_clean")
STATIONERY_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\datasets\Stationary Items Dataset.v8i.yolov8")
REPORT_PATH = Path(r"C:\Users\palla\Desktop\Donation_AI\dataset_quality_report.txt")

STATIONERY_CLASS_IDS = {29, 30, 31, 32, 33, 34, 35, 44}  # book, notebook, pen, pencil, eraser, sharpener, ruler, scissors

def parse_yaml_names(yaml_path):
    names = []
    in_names = False
    with open(yaml_path, 'r') as f:
        for line in f:
            if line.strip().startswith("names:"):
                # Check inline list
                rest = line.split("names:")[1].strip()
                if rest.startswith("["):
                    # inline list like ['a', 'b']
                    items = rest.strip("[] \n\r")
                    for item in items.split(","):
                        names.append(item.strip().strip("'\""))
                    return names
                in_names = True
                continue
            if in_names:
                stripped = line.strip()
                if stripped.startswith("-"):
                    names.append(stripped[1:].strip())
                elif stripped == "":
                    continue
                else:
                    break
    return names

# ============================================================
# 1. PARSE data.yaml
# ============================================================
classes = parse_yaml_names(DATASET_DIR / "data.yaml")
nc = len(classes)
print(f"=== DATASET CONFIGURATION ===")
print(f"Dataset Path: {DATASET_DIR}")
print(f"Number of Classes (nc): {nc}")
print(f"Classes: {classes}")
print()

# ============================================================
# 2. COUNT IMAGES & LABELS
# ============================================================
splits = {}
for split_name in ["train", "valid", "test"]:
    img_dir = DATASET_DIR / split_name / "images"
    lbl_dir = DATASET_DIR / split_name / "labels"
    img_count = len(list(img_dir.glob("*.*"))) if img_dir.exists() else 0
    lbl_count = len(list(lbl_dir.glob("*.txt"))) if lbl_dir.exists() else 0
    splits[split_name] = {"images": img_count, "labels": lbl_count, "img_dir": img_dir, "lbl_dir": lbl_dir}
    print(f"{split_name}: {img_count} images, {lbl_count} label files")

print()

# ============================================================
# 3. FULL CLASS DISTRIBUTION ANALYSIS
# ============================================================
class_stats = {}
for i, name in enumerate(classes):
    class_stats[i] = {"name": name, "train_imgs": 0, "val_imgs": 0, "test_imgs": 0,
                       "train_labels": 0, "val_labels": 0, "test_labels": 0}

invalid_labels = []
suspicious_labels = []
missing_images = []
missing_labels = []
orphan_labels = []

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}

for split_name in ["train", "valid", "test"]:
    split_info = splits[split_name]
    lbl_dir = split_info["lbl_dir"]
    img_dir = split_info["img_dir"]
    
    if not lbl_dir.exists():
        continue
    
    # Build image lookup (stem -> path)
    img_lookup = {}
    if img_dir.exists():
        for img_file in img_dir.iterdir():
            if img_file.suffix.lower() in IMAGE_EXTS:
                img_lookup[img_file.stem] = img_file
    
    for label_file in lbl_dir.glob("*.txt"):
        stem = label_file.stem
        
        # Check if corresponding image exists
        has_image = stem in img_lookup
        if not has_image:
            missing_images.append({"split": split_name, "label": str(label_file.name), "issue": "No matching image"})
        
        with open(label_file, 'r') as f:
            lines = f.readlines()
        
        if not lines or all(l.strip() == '' for l in lines):
            missing_labels.append({"split": split_name, "file": str(label_file.name), "issue": "Empty label file"})
            continue
        
        seen_classes_in_file = set()
        for line_num, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped:
                continue
            parts = stripped.split()
            if len(parts) < 5:
                invalid_labels.append({
                    "split": split_name, "file": str(label_file.name),
                    "line": line_num, "issue": f"Too few fields ({len(parts)})", "content": stripped
                })
                continue
            
            try:
                cls_id = int(parts[0])
                x_center = float(parts[1])
                y_center = float(parts[2])
                width = float(parts[3])
                height = float(parts[4])
            except ValueError:
                invalid_labels.append({
                    "split": split_name, "file": str(label_file.name),
                    "line": line_num, "issue": "Non-numeric values", "content": stripped
                })
                continue
            
            # Validate class ID
            if cls_id < 0 or cls_id >= nc:
                invalid_labels.append({
                    "split": split_name, "file": str(label_file.name),
                    "line": line_num, "issue": f"Invalid class ID {cls_id} (max {nc-1})", "content": stripped
                })
                continue
            
            # Validate coordinates
            issues = []
            if not (0 <= x_center <= 1): issues.append(f"x_center={x_center}")
            if not (0 <= y_center <= 1): issues.append(f"y_center={y_center}")
            if not (0 < width <= 1): issues.append(f"width={width}")
            if not (0 < height <= 1): issues.append(f"height={height}")
            if width <= 0.001: issues.append(f"near-zero width={width}")
            if height <= 0.001: issues.append(f"near-zero height={height}")
            
            # Check if bbox extends outside image
            x1 = x_center - width / 2
            y1 = y_center - height / 2
            x2 = x_center + width / 2
            y2 = y_center + height / 2
            if x1 < -0.01 or y1 < -0.01 or x2 > 1.01 or y2 > 1.01:
                issues.append(f"bbox outside image [{x1:.3f},{y1:.3f},{x2:.3f},{y2:.3f}]")
            
            if issues:
                invalid_labels.append({
                    "split": split_name, "file": str(label_file.name),
                    "line": line_num, "issue": "; ".join(issues), "content": stripped
                })
                continue
            
            # SUSPICIOUS: Notebook labels that are very large (covering >40% of image area)
            bbox_area = width * height
            if cls_id == 30 and bbox_area > 0.40:
                suspicious_labels.append({
                    "split": split_name, "file": str(label_file.name),
                    "line": line_num, "class": "notebook", "area": f"{bbox_area:.3f}",
                    "issue": f"VERY LARGE notebook bbox (area={bbox_area:.2%} of image) - likely covers multiple objects"
                })
            
            # SUSPICIOUS: Notebook labels that are very wide (aspect ratio > 3:1)
            if cls_id == 30 and width > 0 and height > 0:
                aspect = max(width/height, height/width)
                if aspect > 3.0:
                    suspicious_labels.append({
                        "split": split_name, "file": str(label_file.name),
                        "line": line_num, "class": "notebook", "area": f"{bbox_area:.3f}",
                        "issue": f"Unusual notebook aspect ratio ({aspect:.1f}:1)"
                    })
            
            # Count stats
            seen_classes_in_file.add(cls_id)
            if split_name == "train":
                class_stats[cls_id]["train_labels"] += 1
            elif split_name == "valid":
                class_stats[cls_id]["val_labels"] += 1
            else:
                class_stats[cls_id]["test_labels"] += 1
        
        for cls_id in seen_classes_in_file:
            if split_name == "train":
                class_stats[cls_id]["train_imgs"] += 1
            elif split_name == "valid":
                class_stats[cls_id]["val_imgs"] += 1
            else:
                class_stats[cls_id]["test_imgs"] += 1
    
    # Check for images without labels
    for stem, img_path in img_lookup.items():
        label_path = lbl_dir / f"{stem}.txt"
        if not label_path.exists():
            orphan_labels.append({"split": split_name, "image": img_path.name, "issue": "Image has no label file"})

# ============================================================
# 4. COMPUTE STATISTICS
# ============================================================
train_counts = [class_stats[i]["train_labels"] for i in range(nc)]
val_counts = [class_stats[i]["val_labels"] for i in range(nc)]
total_counts = [train_counts[i] + val_counts[i] for i in range(nc)]

min_total = min(total_counts)
max_total = max(total_counts)
avg_total = sum(total_counts) / nc
imbalance_ratio = max_total / min_total if min_total > 0 else float('inf')

min_class = classes[total_counts.index(min_total)]
max_class = classes[total_counts.index(max_total)]

# ============================================================
# 5. STATIONERY SOURCE DATASET ANALYSIS
# ============================================================
stationery_classes = parse_yaml_names(STATIONERY_DIR / "data.yaml")
stationery_stats = {}
for i, name in enumerate(stationery_classes):
    stationery_stats[i] = {"name": name, "train": 0, "valid": 0, "test": 0}

for split_name in ["train", "valid", "test"]:
    lbl_dir = STATIONERY_DIR / split_name / "labels"
    if not lbl_dir.exists(): continue
    for lf in lbl_dir.glob("*.txt"):
        seen = set()
        with open(lf) as f:
            for line in f:
                parts = line.strip().split()
                if parts:
                    try:
                        cid = int(parts[0])
                        if cid not in seen:
                            stationery_stats[cid][split_name] += 1
                            seen.add(cid)
                    except: pass

# ============================================================
# 6. GENERATE REPORT
# ============================================================
report = []
report.append("=" * 80)
report.append("YOLO DATASET QUALITY REPORT")
report.append("=" * 80)
report.append(f"Dataset: {DATASET_DIR}")
report.append(f"Total Classes: {nc}")
report.append("")

report.append("--- SPLIT SUMMARY ---")
for s, info in splits.items():
    report.append(f"  {s}: {info['images']} images, {info['labels']} label files")
report.append("")

report.append("--- FULL CLASS DISTRIBUTION ---")
report.append(f"{'ID':<4} {'CLASS NAME':<18} {'TRAIN IMG':<12} {'VAL IMG':<12} {'TRAIN LBL':<12} {'VAL LBL':<12} {'TOTAL LBL':<12}")
report.append("-" * 82)
for i in range(nc):
    s = class_stats[i]
    total = s["train_labels"] + s["val_labels"]
    flag = " [!] LOW" if total < 100 else ""
    report.append(f"{i:<4} {s['name']:<18} {s['train_imgs']:<12} {s['val_imgs']:<12} {s['train_labels']:<12} {s['val_labels']:<12} {total:<12}{flag}")

report.append("")
report.append("--- DATASET STATISTICS ---")
report.append(f"  Minimum class count: {min_total} ({min_class})")
report.append(f"  Maximum class count: {max_total} ({max_class})")
report.append(f"  Average class count: {avg_total:.1f}")
report.append(f"  Class imbalance ratio: {imbalance_ratio:.1f}x")
report.append("")

report.append("--- STATIONERY CLASSES (FOCUS) ---")
report.append(f"{'ID':<4} {'CLASS NAME':<18} {'TRAIN LBL':<12} {'VAL LBL':<12} {'TOTAL':<12} {'STATUS':<15}")
report.append("-" * 73)
for i in sorted(STATIONERY_CLASS_IDS):
    s = class_stats[i]
    total = s["train_labels"] + s["val_labels"]
    if total < 50: status = "CRITICAL"
    elif total < 150: status = "LOW"
    elif total < 300: status = "MODERATE"
    else: status = "OK"
    report.append(f"{i:<4} {s['name']:<18} {s['train_labels']:<12} {s['val_labels']:<12} {total:<12} {status}")
report.append("")

report.append("--- INVALID LABELS ---")
if invalid_labels:
    for il in invalid_labels[:50]:
        report.append(f"  [{il['split']}] {il['file']}:{il.get('line','')} - {il['issue']}")
    if len(invalid_labels) > 50:
        report.append(f"  ... and {len(invalid_labels) - 50} more")
else:
    report.append("  None found")
report.append(f"  Total invalid: {len(invalid_labels)}")
report.append("")

report.append("--- SUSPICIOUS NOTEBOOK ANNOTATIONS ---")
if suspicious_labels:
    for sl in suspicious_labels[:50]:
        report.append(f"  [{sl['split']}] {sl['file']}:{sl.get('line','')} - {sl['issue']}")
    if len(suspicious_labels) > 50:
        report.append(f"  ... and {len(suspicious_labels) - 50} more")
else:
    report.append("  None found (all notebook bboxes appear reasonable)")
report.append(f"  Total suspicious: {len(suspicious_labels)}")
report.append("")

report.append("--- MISSING IMAGE/LABEL PAIRS ---")
if missing_images:
    for mi in missing_images[:20]:
        report.append(f"  [{mi['split']}] {mi['label']} - {mi['issue']}")
else:
    report.append("  All labels have matching images")
report.append(f"  Total missing images: {len(missing_images)}")
report.append("")

report.append("--- ORPHAN IMAGES (no labels) ---")
if orphan_labels:
    for ol in orphan_labels[:20]:
        report.append(f"  [{ol['split']}] {ol['image']} - {ol['issue']}")
    if len(orphan_labels) > 20:
        report.append(f"  ... and {len(orphan_labels) - 20} more")
else:
    report.append("  All images have matching labels")
report.append(f"  Total orphan images: {len(orphan_labels)}")
report.append("")

report.append("--- EMPTY LABEL FILES ---")
if missing_labels:
    for ml in missing_labels[:20]:
        report.append(f"  [{ml['split']}] {ml['file']} - {ml['issue']}")
else:
    report.append("  None found")
report.append(f"  Total empty: {len(missing_labels)}")
report.append("")

report.append("--- MISSING STATIONERY CLASSES ---")
missing_classes = ["marker", "sticky note", "writing pad", "highlighter", "tape", "glue"]
for mc in missing_classes:
    if mc not in classes:
        report.append(f"  [X] {mc} - NOT in dataset")
    else:
        report.append(f"  [OK] {mc} - present")
report.append("")

report.append("--- AVAILABLE STATIONERY SOURCE DATASET ---")
report.append(f"Source: {STATIONERY_DIR}")
report.append(f"License: CC BY 4.0")
report.append(f"Classes: {stationery_classes}")
for i, s in stationery_stats.items():
    total = s["train"] + s["valid"] + s["test"]
    report.append(f"  {i}: {s['name']:<15} train={s['train']:<5} valid={s['valid']:<5} test={s['test']:<5} total={total}")
report.append("")

report.append("--- STATIONERY SOURCE → FINAL DATASET CLASS MAPPING ---")
mapping = {
    "ball point": "pen (ID 31)",
    "book": "book (ID 29)",
    "eraser": "eraser (ID 33)",
    "notebook": "notebook (ID 30)",
    "pencil": "pencil (ID 32)",
    "pointer": "NO MATCH (new class or ignore)",
    "scale": "ruler (ID 35)",
    "sharpener": "sharpener (ID 34)"
}
for src_cls, dest in mapping.items():
    report.append(f"  {src_cls:<15} → {dest}")
report.append("")

report.append("=" * 80)
report.append("END OF REPORT")
report.append("=" * 80)

report_text = "\n".join(report)

with open(REPORT_PATH, 'w', encoding='utf-8') as f:
    f.write(report_text)
print(f"Report saved to: {REPORT_PATH}")
