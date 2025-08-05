@echo off
setlocal

REM RecrutIA Stop Services Script for Windows

echo 🛑 Stopping RecrutIA services...

REM Change to project root directory
cd /d "%~dp0.."

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Services may already be stopped.
    echo Press any key to exit...
    pause >nul
    exit /b 0
)

echo 🐳 Stopping Docker containers...
docker-compose down

if errorlevel 1 (
    echo ⚠️  Some containers may have failed to stop properly
) else (
    echo ✅ All services stopped successfully
)

echo.
echo 🧹 To also remove volumes (⚠️  this will delete all data):
echo    docker-compose down -v
echo.
echo 🔄 To restart services:
echo    scripts\start.bat
echo.
echo Press any key to exit...
pause >nul
