from fastapi import APIRouter
from app.schemas import HealthResponse
from app.model import is_model_loaded

router = APIRouter()

@router.api_route("/", methods=["GET", "HEAD"])
async def root():
    """
    Root endpoint for a simple health check.
    """
    return {"status": "success", "message": "Donation AI API is running"}

@router.api_route("/health", methods=["GET", "HEAD"], response_model=HealthResponse)
async def health():
    """
    Health endpoint to check the API and model loading status.
    """
    model_status = is_model_loaded()
    return {
        "status": "healthy" if model_status else "unhealthy",
        "model_loaded": model_status
    }
