Write-Host "Starting PostgreSQL..."
Write-Host "Starting FastAPI..."
Write-Host "Starting Frontend..."
Write-Host "Running docker compose up --build -d..."

# Start containers
docker compose up -d --build

Write-Host "Waiting for services..."
Write-Host "Waiting for frontend to become healthy..."

# Loop until frontend and backend are reachable
$healthy = $false
$max_attempts = 30
$attempt = 0
while (-not $healthy -and $attempt -lt $max_attempts) {
    try {
        $feResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -UseBasicParsing -ErrorAction Stop
        $beResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        if ($feResponse.StatusCode -eq 200) {
            $healthy = $true
        }
    } catch {
        Start-Sleep -Seconds 2
        $attempt++
        Write-Host "Still waiting... ($attempt/$max_attempts)"
    }
}

if ($healthy) {
    Write-Host "Donation AI backend and frontend are ready!"
    Write-Host "Opening Donation AI website (http://localhost:3000)..."
    Start-Process "http://localhost:3000"
} else {
    Write-Host "Services did not become healthy in time. Please check docker compose logs."
}
