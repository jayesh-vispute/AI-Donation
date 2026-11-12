"""
Generates final dataset distribution CSV and checks for data leakage.
"""
import csv
from pathlib import Path

DATASET_DIR = Path(r"C:\Users\palla\Desktop\Donation_AI\final_dataset_clean")
CSV_PATH = Path(r"C:\Users\palla\Desktop\Donation_AI\dataset_distribution_final.csv")

def parse_yaml_names(yaml_path):
    names = []
    in_names = False
    with open(yaml_path, 'r') as f:
        for line in f:
            if line.strip().startswith("names:"):
                rest = line.split("names:")[1].strip()
                if rest.startswith("["):
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

classes = parse_yaml_names(DATASET_DIR / "data.yaml")
nc = len(classes)

stats = {}
for i, name in enumerate(classes):
    stats[i] = {"class_name": name, "train_images": set(), "validation_images": set(), "total_labels": 0}

print("=== CHECKING FOR TRAIN/VALID LEAKAGE ===")
train_imgs = set(f.name for f in (DATASET_DIR / "train" / "images").glob("*.*"))
valid_imgs = set(f.name for f in (DATASET_DIR / "valid" / "images").glob("*.*"))

intersection = train_imgs.intersection(valid_imgs)
if intersection:
    print(f"WARNING: Found {len(intersection)} images present in both train and validation sets (data leakage)!")
    for img in list(intersection)[:10]:
        print(f"  Leakage example: {img}")
else:
    print("SUCCESS: No exact filename leakage found between train and validation sets.")
print()

print("=== GENERATING CSV REPORT ===")

for split in ["train", "valid"]:
    lbl_dir = DATASET_DIR / split / "labels"
    if not lbl_dir.exists(): continue
    for lbl_file in lbl_dir.glob("*.txt"):
        seen_classes = set()
        with open(lbl_file) as f:
            for line in f:
                parts = line.strip().split()
                if parts:
                    try:
                        cid = int(parts[0])
                        stats[cid]["total_labels"] += 1
                        seen_classes.add(cid)
                    except: pass
        
        for cid in seen_classes:
            if split == "train":
                stats[cid]["train_images"].add(lbl_file.stem)
            else:
                stats[cid]["validation_images"].add(lbl_file.stem)

with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(["class_id", "class_name", "train_images", "validation_images", "total_labels"])
    for i in range(nc):
        s = stats[i]
        writer.writerow([i, s["class_name"], len(s["train_images"]), len(s["validation_images"]), s["total_labels"]])

print(f"CSV report successfully saved to: {CSV_PATH}")
