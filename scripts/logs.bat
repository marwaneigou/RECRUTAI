@echo off
setlocal

REM RecrutIA Logs Viewer Script for Windows

if "%1"=="" (
    echo 📊 Viewing logs for all RecrutIA services...
    echo Press Ctrl+C to stop viewing logs
    echo.
    docker-compose logs -f
) else (
    echo 📊 Viewing logs for service: %1
    echo Press Ctrl+C to stop viewing logs
    echo.
    docker-compose logs -f %1
)

if errorlevel 1 (
    echo.
    echo ❌ Failed to view logs. Make sure Docker is running and services are started.
    echo.
    echo 📋 Available services:
    echo    backend
    echo    frontend
    echo    analysis-service
    echo    matching-service
    echo    recommendation-service
    echo    postgres
    echo    mongodb
    echo.
    echo Usage: logs.bat [service-name]
    echo Example: logs.bat backend
    echo.
    echo Press any key to exit...
    pause >nul
)
