"""
Phase 3: Augment minority classes using geometric transformations.
Only augments training data; validation data is left untouched.
"""
import random
import shutil
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

DATASET_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\final_dataset_clean")
TRAIN_IMAGES = DATASET_DIR / "train" / "images"
TRAIN_LABELS = DATASET_DIR / "train" / "labels"

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}
TARGET_MIN_LABELS = 200  # Target minimum labels per class

# Classes to augment and their IDs
AUGMENT_CLASSES = {
    44: "scissors",
    37: "keyboard",
    46: "thermometer",
    47: "tweezers",
    56: "shoe rack",
    57: "fridge",
    58: "microwave",
    59: "oven",
    60: "watch",
    38: "earphones",
    39: "spoon",
}

def count_class_labels(class_id):
    """Count how many training labels exist for a class."""
    count = 0
    for lf in TRAIN_LABELS.glob("*.txt"):
        with open(lf) as f:
            for line in f:
                parts = line.strip().split()
                if parts and int(parts[0]) == class_id:
                    count += 1
    return count

def find_images_with_class(class_id):
    """Find all training images that contain the given class."""
    results = []
    for lf in TRAIN_LABELS.glob("*.txt"):
        with open(lf) as f:
            content = f.read()
        has_class = False
        for line in content.strip().split("\n"):
            parts = line.strip().split()
            if parts and int(parts[0]) == class_id:
                has_class = True
                break
        if has_class:
            stem = lf.stem
            for ext in IMAGE_EXTS:
                img_path = TRAIN_IMAGES / f"{stem}{ext}"
                if img_path.exists():
                    results.append((img_path, lf))
                    break
    return results

def augment_horizontal_flip(img, labels_content):
    """Flip image horizontally and adjust bounding boxes."""
    flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
    new_lines = []
    for line in labels_content.strip().split("\n"):
        parts = line.strip().split()
        if not parts or len(parts) < 5:
            continue
        cls_id = parts[0]
        x_center = float(parts[1])
        y_center = float(parts[2])
        w = parts[3]
        h = parts[4]
        # Mirror x_center
        new_x = 1.0 - x_center
        new_lines.append(f"{cls_id} {new_x:.6f} {y_center} {w} {h}")
    return flipped, "\n".join(new_lines) + "\n"

def augment_brightness(img, labels_content, factor=None):
    """Change brightness (labels unchanged for color-only augmentation)."""
    if factor is None:
        factor = random.uniform(0.7, 1.3)
    enhanced = ImageEnhance.Brightness(img).enhance(factor)
    return enhanced, labels_content

def augment_contrast(img, labels_content, factor=None):
    """Change contrast (labels unchanged for color-only augmentation)."""
    if factor is None:
        factor = random.uniform(0.7, 1.3)
    enhanced = ImageEnhance.Contrast(img).enhance(factor)
    return enhanced, labels_content

AUGMENTATIONS = [
    ("hflip", augment_horizontal_flip),
    ("bright", augment_brightness),
    ("contrast", augment_contrast),
]

print("=== PHASE 3: AUGMENTING MINORITY CLASSES ===")
print(f"Target minimum labels per class: {TARGET_MIN_LABELS}")
print()

# First count current labels
print("Current class counts:")
class_counts = {}
for cls_id, cls_name in AUGMENT_CLASSES.items():
    count = count_class_labels(cls_id)
    class_counts[cls_id] = count
    deficit = max(0, TARGET_MIN_LABELS - count)
    print(f"  {cls_id:>2} {cls_name:<18} {count:>4} labels  (need {deficit} more)")

print()

total_augmented = 0

for cls_id, cls_name in AUGMENT_CLASSES.items():
    current = class_counts[cls_id]
    if current >= TARGET_MIN_LABELS:
        print(f"  {cls_name}: already has {current} labels, skipping")
        continue
    
    deficit = TARGET_MIN_LABELS - current
    images = find_images_with_class(cls_id)
    
    if not images:
        print(f"  {cls_name}: NO source images found, cannot augment")
        continue
    
    print(f"  {cls_name}: augmenting {deficit} more from {len(images)} source images...")
    
    aug_count = 0
    aug_idx = 0
    
    while aug_count < deficit:
        # Cycle through source images
        img_path, lbl_path = images[aug_idx % len(images)]
        
        # Pick a random augmentation
        aug_name, aug_fn = AUGMENTATIONS[aug_count % len(AUGMENTATIONS)]
        
        try:
            img = Image.open(img_path).convert("RGB")
            with open(lbl_path) as f:
                lbl_content = f.read()
            
            aug_img, aug_lbl = aug_fn(img, lbl_content)
            
            # Save augmented image and label
            new_stem = f"aug_{cls_name}_{aug_count:04d}_{aug_name}"
            aug_img.save(TRAIN_IMAGES / f"{new_stem}.jpg", quality=95)
            with open(TRAIN_LABELS / f"{new_stem}.txt", 'w') as f:
                f.write(aug_lbl)
            
            aug_count += 1
            total_augmented += 1
        except Exception as e:
            pass
        
        aug_idx += 1
        # Safety: don't loop forever
        if aug_idx > deficit * 3 + len(images) * 10:
            break
    
    print(f"    Created {aug_count} augmented samples")

print()
print(f"TOTAL: Created {total_augmented} augmented training samples")
print()
print("Phase 3 complete.")
