@echo off
echo ===================================================
echo Starting Donation AI Locally (Without Docker)
echo ===================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Donation AI Backend (FastAPI)" cmd /k "cd donation-ai-api && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite Frontend on http://localhost:3000 ...
start "Donation AI Frontend (React/Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started in separate terminal windows!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo API Docs: http://127.0.0.1:8000/docs
echo.
pause
