Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Starting Donation AI Locally (Without Docker)     " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Check if Python in venv exists (try multiple locations)
$pythonExe = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = Join-Path $PSScriptRoot "donation-ai-api\venv\Scripts\python.exe"
}
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}
Write-Host "Using Python: $pythonExe" -ForegroundColor Gray

Write-Host "Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "donation-ai-api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; & '$pythonExe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "Starting Vite Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host "`nBoth servers have been launched in separate windows!" -ForegroundColor Green
Write-Host "Backend API:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "Frontend App: http://localhost:3000" -ForegroundColor White
Write-Host "Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
