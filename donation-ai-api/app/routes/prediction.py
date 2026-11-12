from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import io
import os
import json
from PIL import Image, ImageOps

from app.schemas import PredictionResponse, ErrorResponse
from app.model import is_model_loaded, predict_image
from app.utils import validate_image
from app.config import settings
from app.database import get_db
from app.db_models import AIDetection, DonationImage, User
from app.services.auth import require_donor

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse, responses={400: {"model": ErrorResponse}})
async def predict(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    import logging
    logger = logging.getLogger(__name__)
    
    validate_image(file)
    
    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"[Predict API] Failed to read uploaded file: {e}", exc_info=True)
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": {"code": "INVALID_IMAGE", "message": "Failed to read the uploaded file."}}
        )
        
    if not content:
        logger.warning("[Predict API] Empty file uploaded.")
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": {"code": "INVALID_IMAGE", "message": "Image file is empty."}}
        )
        
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        logger.warning(f"[Predict API] File size {len(content)} exceeds limit {settings.MAX_FILE_SIZE_MB}MB.")
        return JSONResponse(
            status_code=413,
            content={"success": False, "error": {"code": "IMAGE_TOO_LARGE", "message": f"Image file exceeds max size of {settings.MAX_FILE_SIZE_MB}MB."}}
        )
        
    try:
        image = Image.open(io.BytesIO(content))
        image.verify() # check for corruption
        image = Image.open(io.BytesIO(content)) # reopen after verify
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")
    except Exception as e:
        logger.error(f"[Predict API] Image opening or verification failed: {e}", exc_info=True)
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": {"code": "CORRUPTED_IMAGE", "message": "The uploaded file is corrupted or not a valid supported image."}}
        )

    if not is_model_loaded():
        logger.error("[Predict API] Model not loaded when prediction was requested.")
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": {"code": "MODEL_NOT_FOUND", "message": "AI detection model is currently unavailable."}}
        )

    try:
        result = predict_image(image)
        
        items = result.get("items", [])
        if not items:
            return {
                "success": True,
                "image_analyzed": True,
                "detections": [],
                "items": [],
                "summary": {
                    "total_items": 0
                },
                "message": "No items were detected with sufficient confidence."
            }
        
        # Save image to disk for persistence
        try:
            os.makedirs("uploads/ai", exist_ok=True)
            import uuid
            unique_filename = f"{uuid.uuid4()}_{file.filename}"
            image_path = f"uploads/ai/{unique_filename}"
            with open(image_path, "wb") as f:
                f.write(content)
        except Exception as e:
            logger.error(f"[Predict API] Failed to save image to disk: {e}", exc_info=True)
            # Not returning error here, we can continue without saving
            
        try:
            # Create DonationImage record
            donation_image = DonationImage(
                donor_id=current_user.id,
                image_url=f"/api/static/{image_path}",
                processing_status="processed"
            )
            db.add(donation_image)
            db.flush()
                
            # Store detections in database
            for item in items:
                detection = AIDetection(
                    donor_id=current_user.id,
                    image_id=donation_image.id,
                    image_path=f"/api/static/{image_path}",
                    detected_class=item["name"],
                    category=item.get("category", "General"),
                    subcategory=item.get("subcategory", "General Items"),
                    confidence=item["confidence"],
                    quantity=item["quantity"],
                    condition="GOOD",
                    bbox=json.dumps([b for b in item["boxes"]]),
                    model_name="yolov8",
                    status="PENDING_REVIEW"
                )
                db.add(detection)
                db.flush() # Flush to get the detection id
                item["id"] = detection.id # Attach id to return to frontend
                
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"[Predict API] Database error during detection save: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": {"code": "DATABASE_ERROR", "message": "An error occurred while saving the detection results."}}
            )
        
        return {
            "success": True,
            "image_analyzed": True,
            "image_id": donation_image.id,
            "image_url": donation_image.image_url,
            "detections": result.get("raw_detections", []),
            "items": items,
            "summary": {
                "total_items": result.get("total_items", 0)
            }
        }
    except ValueError as e:
        error_msg = str(e)
        logger.error(f"[Predict API] Inference value error: {error_msg}", exc_info=True)
        if "INVALID_CLASS" in error_msg:
            return JSONResponse(status_code=400, content={"success": False, "error": {"code": "INVALID_CLASS", "message": "Model detected an unrecognized class."}})
        elif "MAPPING_FAILED" in error_msg:
            return JSONResponse(status_code=500, content={"success": False, "error": {"code": "MAPPING_FAILED", "message": "Failed to map AI detections to system categories."}})
        elif "LOW_CONFIDENCE" in error_msg:
            return JSONResponse(status_code=400, content={"success": False, "error": {"code": "LOW_CONFIDENCE", "message": "Detections were too low confidence to proceed."}})
        else:
            return JSONResponse(status_code=400, content={"success": False, "error": {"code": "INFERENCE_FAILED", "message": "AI analysis could not be completed. Please try again."}})
    except RuntimeError as e:
        logger.error(f"[Predict API] Model execution error: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"success": False, "error": {"code": "MODEL_LOAD_FAILED", "message": "AI model encountered a runtime failure."}})
    except ConnectionError as e:
        logger.error(f"[Predict API] Network error during processing: {e}", exc_info=True)
        return JSONResponse(status_code=502, content={"success": False, "error": {"code": "NETWORK_ERROR", "message": "A network error occurred while processing the request."}})
    except Exception as e:
        logger.error(f"[Predict API] Unexpected inference error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected server error occurred during AI analysis."}}
        )

from app.schemas import AIDetectionResponse
from typing import List
from pydantic import BaseModel

class AIDetectionUpdate(BaseModel):
    detected_class: str
    quantity: int

@router.get("/detections/{id}", response_model=AIDetectionResponse)
def get_detection(id: int, db: Session = Depends(get_db)):
    detection = db.query(AIDetection).filter(AIDetection.id == id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection

@router.post("/detections/{id}/confirm")
def confirm_detection(id: int, db: Session = Depends(get_db)):
    detection = db.query(AIDetection).filter(AIDetection.id == id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    # Mark as confirmed or process it. For now just returning success.
    return {"success": True, "message": "Detection confirmed"}

@router.put("/detections/{id}/items/{item_id}", response_model=AIDetectionResponse)
def update_detection_item(id: int, item_id: int, update_data: AIDetectionUpdate, db: Session = Depends(get_db)):
    # Assuming id and item_id are the same for our simple model, or id is the session and item_id is the detection.
    # We will use item_id as the AIDetection.id
    detection = db.query(AIDetection).filter(AIDetection.id == item_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection item not found")
    
    detection.detected_class = update_data.detected_class
    detection.quantity = update_data.quantity
    db.commit()
    db.refresh(detection)
    return detection
