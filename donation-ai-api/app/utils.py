import os
from fastapi import UploadFile, HTTPException
from typing import Optional

def validate_image(file: UploadFile) -> None:
    """
    Validates the uploaded image for its extension and size.
    Raises HTTPException if validation fails.
    """
    if not file:
        raise HTTPException(status_code=400, detail="Image file is required")

    # Check extension
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    # The actual file size validation is best done by reading the file,
    # but since reading consumes the stream, we will do it after validation in the route,
    # or rely on SpooledTemporaryFile size if available.
    # We will let the route handle reading and checking the length.
    return
