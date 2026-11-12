"""
Extract marker and sticky note labels and images from Objects dataset
and merge them into final_dataset_clean.
"""
import shutil
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\datasets\Objects -mainly toys- 2.v1i.yolov8")
TARGET_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\final_dataset_clean")

# 114: Marker, 216: markers -> 61
# 243: sticky notes -> 62
ID_MAP = {
    114: 61,
    216: 61,
    243: 62
}

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}

total_copied = 0

for split in ["train", "valid", "test"]:
    src_labels = SOURCE_DIR / split / "labels"
    src_images = SOURCE_DIR / split / "images"
    
    tgt_labels = TARGET_DIR / split / "labels"
    tgt_images = TARGET_DIR / split / "images"
    
    if not src_labels.exists(): continue
    
    for lbl_file in src_labels.glob("*.txt"):
        with open(lbl_file, "r") as f:
            lines = f.readlines()
        
        new_lines = []
        has_target = False
        
        for line in lines:
            parts = line.strip().split()
            if not parts: continue
            try:
                cid = int(parts[0])
                if cid in ID_MAP:
                    new_cid = ID_MAP[cid]
                    new_lines.append(f"{new_cid} " + " ".join(parts[1:]))
                    has_target = True
            except: pass
            
        if has_target:
            stem = lbl_file.stem
            img_path = None
            for ext in IMAGE_EXTS:
                p = src_images / f"{stem}{ext}"
                if p.exists():
                    img_path = p
                    break
            
            if img_path:
                # Need to use a unique prefix to avoid conflicts
                new_stem = f"missing_classes_src_{stem}"
                
                # Write new label
                with open(tgt_labels / f"{new_stem}.txt", "w") as f:
                    f.write("\n".join(new_lines) + "\n")
                    
                # Copy image
                shutil.copy2(img_path, tgt_images / f"{new_stem}{img_path.suffix}")
                total_copied += 1

print(f"Extraction complete! Copied {total_copied} images containing marker/sticky notes.")
