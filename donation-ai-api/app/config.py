import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "models/best.pt")
    YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", 0.05))
    YOLO_IMGSZ = int(os.getenv("YOLO_IMGSZ", 640))
    YOLO_MAX_DET = int(os.getenv("YOLO_MAX_DET", 100))
    YOLO_IOU = float(os.getenv("YOLO_IOU", 0.45))
    MAX_FILE_SIZE_MB = float(os.getenv("MAX_FILE_SIZE_MB", 10))

    # Database Configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "donation_db")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")

    from urllib.parse import quote_plus
    encoded_password = quote_plus(DB_PASSWORD)
    DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

settings = Settings()
