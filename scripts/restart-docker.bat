@echo off
echo 🔄 Restarting Docker Desktop to fix filesystem issues...

REM Stop Docker Desktop
echo 🛑 Stopping Docker Desktop...
taskkill /f /im "Docker Desktop.exe" 2>nul
taskkill /f /im "dockerd.exe" 2>nul

REM Stop Docker services
echo 🛑 Stopping Docker services...
net stop "Docker Desktop Service" 2>nul
net stop "com.docker.service" 2>nul

REM Wait a moment
echo ⏳ Waiting for services to stop...
timeout /t 10 /nobreak >nul

REM Start Docker services
echo 🚀 Starting Docker services...
net start "Docker Desktop Service" 2>nul
net start "com.docker.service" 2>nul

REM Start Docker Desktop
echo 🚀 Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

REM Wait for Docker to be ready
echo ⏳ Waiting for Docker to be ready...
timeout /t 30 /nobreak >nul

REM Check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo ⏳ Docker not ready yet, waiting...
    timeout /t 10 /nobreak >nul
    goto check_docker
)

echo ✅ Docker Desktop restarted successfully!
echo 💡 You can now run the deployment script again.
pause
