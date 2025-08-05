@echo off
setlocal

REM RecrutIA Quick Start Script for Windows

echo 🚀 Starting RecrutIA services...

REM Change to project root directory
cd /d "%~dp0.."
echo 📁 Working directory: %CD%

REM Check if Docker is running
echo 🔍 Checking Docker status...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo ✅ Docker is running

REM Check if .env file exists
echo 🔍 Checking for .env file...
if not exist ".env" (
    echo ❌ .env file not found. Please run deploy.bat first.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo ✅ .env file found

REM Check if docker-compose.yml exists
echo 🔍 Checking for docker-compose.yml...
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found. Make sure you're in the project root.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo ✅ docker-compose.yml found

echo 🐳 Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo ❌ Failed to start services
    echo 📊 Check logs with: docker-compose logs
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo 📊 Checking container status...
docker-compose ps

echo.
echo ✅ RecrutIA services started!
echo.
echo 📋 Available services:
echo    Frontend:              http://localhost:3000
echo    Backend API:           http://localhost:3001
echo    Analysis Service:      http://localhost:5002
echo    Matching Service:      http://localhost:5001
echo.
echo 📊 View logs: docker-compose logs -f
echo 🛑 Stop services: docker-compose down
echo.
echo Press any key to exit...
pause >nul
