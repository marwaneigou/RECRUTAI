@echo off
setlocal enabledelayedexpansion

REM RecrutIA Health Check Script for Windows

echo 🏥 Checking RecrutIA service health...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running
    goto :end
)

REM Check container status
echo 📊 Container Status:
docker-compose ps

echo.
echo 🔍 Service Health Checks:

REM Define services and their health endpoints
set services=backend:3001:health frontend:3000: analysis-service:5002:health matching-service:5001:health

for %%s in (%services%) do (
    for /f "tokens=1,2,3 delims=:" %%a in ("%%s") do (
        set name=%%a
        set port=%%b
        set endpoint=%%c
        
        if "!endpoint!"=="" (
            set url=http://localhost:!port!
        ) else (
            set url=http://localhost:!port!/!endpoint!
        )
        
        curl -f -s -m 5 !url! >nul 2>&1
        if errorlevel 1 (
            echo ❌ !name! ^(!url!^) - Not responding
        ) else (
            echo ✅ !name! ^(!url!^) - Healthy
        )
    )
)

echo.
echo 🗄️  Database Connections:

REM Check PostgreSQL
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL - Not ready
) else (
    echo ✅ PostgreSQL - Ready
)

REM Check MongoDB
docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" --quiet >nul 2>&1
if errorlevel 1 (
    echo ❌ MongoDB - Not ready
) else (
    echo ✅ MongoDB - Ready
)

echo.
echo 📈 System Resources:
docker system df

:end
echo.
echo Press any key to exit...
pause >nul
