# Donation AI FastAPI Backend

This is a production-ready FastAPI backend for the Donation AI Object Detection project. It exposes an API that accepts an image, runs a custom-trained YOLO model to detect objects, counts them, and returns a clean JSON response.

## Features
- **FastAPI**: High performance, easy to use, with automatic Swagger UI (`/docs`).
- **YOLO Integration**: Loads the model once on startup for efficient inference.
- **Image Validation**: Checks file extensions, sizes, and formats.
- **CORS Enabled**: Ready to be consumed by frontend applications.
- **Configurable**: Uses environment variables for paths, thresholds, and limits.

## Project Structure
- `app/main.py`: API routes and application configuration.
- `app/model.py`: YOLO loading and inference logic.
- `app/schemas.py`: Pydantic response models.
- `app/utils.py`: Helper functions (image validation).

## Setup Instructions (Windows)

### 1. Create a Virtual Environment
Navigate to this project directory and create a Python virtual environment:
```powershell
cd donation-ai-api
python -m venv venv
```

### 2. Activate the Virtual Environment
Activate the environment in Windows (PowerShell):
```powershell
.\venv\Scripts\Activate.ps1
```
*(If you use Command Prompt: `.\venv\Scripts\activate.bat`)*

### 3. Install Requirements
Install the required packages using `pip`:
```powershell
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and adjust the variables if necessary:
```powershell
cp .env.example .env
```
Ensure you have the following inside `.env`:
```env
YOLO_MODEL_PATH=models/best.pt
YOLO_CONFIDENCE=0.25
MAX_FILE_SIZE_MB=10
```

### 5. Place the YOLO Model
Ensure you place your trained YOLO model inside the `models` directory and name it `best.pt`:
```
models/best.pt
```
*(Note: Large model files are ignored by default. If you use version control, consider Git LFS for your model file).*

### 6. Start the API
Run the FastAPI application with Uvicorn:
```powershell
uvicorn app.main:app --reload
```
The server will start on `http://127.0.0.1:8000`.

## API Documentation
Once the server is running, you can explore the endpoints interactively:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Testing the API

### Test `/predict` Endpoint

You can test the prediction endpoint using the Swagger UI at `/docs` or by using a tool like Postman or cURL.

**Example JSON Response:**
```json
{
  "status": "success",
  "items": [
    {
      "name": "book",
      "confidence": 0.94,
      "quantity": 2,
      "boxes": [
        {"x1": 120, "y1": 80, "x2": 350, "y2": 420},
        {"x1": 400, "y1": 100, "x2": 600, "y2": 450}
      ]
    },
    {
      "name": "shirt",
      "confidence": 0.88,
      "quantity": 1,
      "boxes": [
        {"x1": 200, "y1": 300, "x2": 500, "y2": 700}
      ]
    }
  ],
  "total_items": 3
}
```

## Frontend Integration
To call the API from your frontend (e.g., React, Vue, Vanilla JS), use `FormData` to send the image as `multipart/form-data`.

**Example JavaScript snippet:**
```javascript
const formData = new FormData();
// 'imageFile' should be the File object from an <input type="file">
formData.append("file", imageFile);

try {
  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  console.log("Detection results:", data);
} catch (error) {
  console.error("Error connecting to the API:", error);
}
```
