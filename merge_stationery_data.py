"""
Phase 2: Merge the Stationary Items Dataset into final_dataset_clean.
Remaps class IDs from source to target and validates notebook labels.
"""
import shutil
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\datasets\Stationary Items Dataset.v8i.yolov8")
TARGET_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\final_dataset_clean")

# Source class IDs -> Target class IDs
# Source: 0=ball point, 1=book, 2=eraser, 3=notebook, 4=pencil, 5=pointer, 6=scale, 7=sharpener
CLASS_REMAP = {
    0: 31,   # ball point -> pen
    1: 29,   # book -> book
    2: 33,   # eraser -> eraser
    3: 30,   # notebook -> notebook
    4: 32,   # pencil -> pencil
    # 5: SKIP (pointer - no match)
    6: 35,   # scale -> ruler
    7: 34,   # sharpener -> sharpener
}

NOTEBOOK_AREA_THRESHOLD = 0.40
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}

def merge_split(source_split, target_split):
    src_images = SOURCE_DIR / source_split / "images"
    src_labels = SOURCE_DIR / source_split / "labels"
    tgt_images = TARGET_DIR / target_split / "images"
    tgt_labels = TARGET_DIR / target_split / "labels"
    
    if not src_labels.exists():
        print(f"  Source {source_split}/labels not found, skipping")
        return 0, 0, 0
    
    copied = 0
    skipped_pointer = 0
    skipped_notebook = 0
    
    for label_file in src_labels.glob("*.txt"):
        stem = label_file.stem
        
        # Find matching image
        src_img = None
        for ext in IMAGE_EXTS:
            candidate = src_images / f"{stem}{ext}"
            if candidate.exists():
                src_img = candidate
                break
        
        if not src_img:
            continue
        
        # Check if already exists in target (avoid duplicates)
        # Prefix source files to avoid name collisions
        new_stem = f"stationery_src_{stem}"
        if (tgt_labels / f"{new_stem}.txt").exists():
            continue
        
        # Read and remap labels
        with open(label_file, 'r') as f:
            lines = f.readlines()
        
        new_lines = []
        for line in lines:
            parts = line.strip().split()
            if not parts or len(parts) < 5:
                continue
            
            try:
                src_cls = int(parts[0])
            except ValueError:
                continue
            
            # Skip pointer class
            if src_cls == 5:
                skipped_pointer += 1
                continue
            
            if src_cls not in CLASS_REMAP:
                continue
            
            target_cls = CLASS_REMAP[src_cls]
            
            # Validate notebook labels for contamination
            if target_cls == 30:  # notebook
                try:
                    w = float(parts[3])
                    h = float(parts[4])
                    if w * h > NOTEBOOK_AREA_THRESHOLD:
                        skipped_notebook += 1
                        continue
                except (ValueError, IndexError):
                    continue
            
            new_lines.append(f"{target_cls} {' '.join(parts[1:])}\n")
        
        if not new_lines:
            continue
        
        # Copy image
        tgt_img_path = tgt_images / f"{new_stem}{src_img.suffix}"
        shutil.copy2(src_img, tgt_img_path)
        
        # Write remapped label
        with open(tgt_labels / f"{new_stem}.txt", 'w') as f:
            f.writelines(new_lines)
        
        copied += 1
    
    return copied, skipped_pointer, skipped_notebook

print("=== PHASE 2: MERGING STATIONERY SOURCE DATASET ===")
print(f"Source: {SOURCE_DIR}")
print(f"Target: {TARGET_DIR}")
print(f"Class remapping: {CLASS_REMAP}")
print()

# Map source splits to target splits
split_mapping = [
    ("train", "train"),
    ("valid", "valid"),
    ("test", "test"),
]

total_copied = 0
total_pointer = 0
total_notebook = 0

for src_split, tgt_split in split_mapping:
    c, p, n = merge_split(src_split, tgt_split)
    total_copied += c
    total_pointer += p
    total_notebook += n
    print(f"  {src_split} -> {tgt_split}: copied {c} images, skipped {p} pointer labels, skipped {n} contaminated notebook labels")

print()
print(f"TOTAL: Copied {total_copied} images with remapped labels")
print(f"TOTAL: Skipped {total_pointer} pointer labels (no target class)")
print(f"TOTAL: Skipped {total_notebook} contaminated notebook labels")
print()
print("Phase 2 complete.")
