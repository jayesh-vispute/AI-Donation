import sys
from pathlib import Path
from PIL import Image

sys.path.append(str(Path(__file__).parent))
from app.model import load_model, predict_image, model

load_model()
if model:
    print(f"Model classes: {model.names}")
    
    img_path = Path("../test_images/cluttered-study-desk-stockcake.jpg")
    if not img_path.exists():
        print("Image not found")
    else:
        img = Image.open(img_path)
        try:
            res = predict_image(img)
            import json
            print(json.dumps(res, indent=2))
        except Exception as e:
            print(f"Error: {e}")
