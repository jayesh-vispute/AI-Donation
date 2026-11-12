"""
Phase 1: Clean contaminated notebook labels from final_dataset_clean.
Moves notebook labels with bbox area > 40% to a quarantine directory.
"""
import shutil
from pathlib import Path

DATASET_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\final_dataset_clean")
QUARANTINE_DIR = DATASET_DIR / "quarantined_labels"
NOTEBOOK_CLASS_ID = 30
AREA_THRESHOLD = 0.40

def clean_split(split_name):
    labels_dir = DATASET_DIR / split_name / "labels"
    quarantine_split = QUARANTINE_DIR / split_name
    quarantine_split.mkdir(parents=True, exist_ok=True)
    
    cleaned = 0
    preserved = 0
    files_modified = 0
    
    if not labels_dir.exists():
        return cleaned, preserved, files_modified
    
    for label_file in labels_dir.glob("*.txt"):
        with open(label_file, 'r') as f:
            lines = f.readlines()
        
        new_lines = []
        removed_lines = []
        modified = False
        
        for line in lines:
            parts = line.strip().split()
            if not parts or len(parts) < 5:
                new_lines.append(line)
                continue
            
            try:
                cls_id = int(parts[0])
                width = float(parts[3])
                height = float(parts[4])
                area = width * height
            except (ValueError, IndexError):
                new_lines.append(line)
                continue
            
            if cls_id == NOTEBOOK_CLASS_ID and area > AREA_THRESHOLD:
                removed_lines.append(line)
                cleaned += 1
                modified = True
            else:
                new_lines.append(line)
                if cls_id == NOTEBOOK_CLASS_ID:
                    preserved += 1
        
        if modified:
            files_modified += 1
            # Save quarantined lines
            with open(quarantine_split / label_file.name, 'w') as f:
                f.writelines(removed_lines)
            
            # Overwrite original with cleaned version
            if new_lines and any(l.strip() for l in new_lines):
                with open(label_file, 'w') as f:
                    f.writelines(new_lines)
            else:
                # All labels were notebook contamination - write empty file
                with open(label_file, 'w') as f:
                    f.write("")
    
    return cleaned, preserved, files_modified

print("=== PHASE 1: CLEANING CONTAMINATED NOTEBOOK LABELS ===")
print(f"Dataset: {DATASET_DIR}")
print(f"Quarantine: {QUARANTINE_DIR}")
print(f"Notebook class ID: {NOTEBOOK_CLASS_ID}")
print(f"Area threshold: {AREA_THRESHOLD}")
print()

total_cleaned = 0
total_preserved = 0
total_modified = 0

for split in ["train", "valid", "test"]:
    c, p, m = clean_split(split)
    total_cleaned += c
    total_preserved += p
    total_modified += m
    print(f"  {split}: removed {c} contaminated, preserved {p} clean, modified {m} files")

print()
print(f"TOTAL: Removed {total_cleaned} contaminated notebook labels")
print(f"TOTAL: Preserved {total_preserved} clean notebook labels")
print(f"TOTAL: Modified {total_modified} label files")

# Also remove labels.cache files so YOLO rebuilds them
for split in ["train", "valid", "test"]:
    cache = DATASET_DIR / split / "labels.cache"
    if cache.exists():
        cache.unlink()
        print(f"Removed {cache}")

print()
print("Phase 1 complete.")
