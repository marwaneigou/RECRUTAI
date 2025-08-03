@echo off
echo ========================================
echo   Smart Recruitment Platform
echo   AI Services Quick Launcher
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org/
    pause
    exit /b 1
)

echo ✅ Python found
python --version
echo.

REM Check if services folder exists
if not exist "services" (
    echo ❌ ERROR: services folder not found
    echo Please make sure you're running this from the project root directory
    pause
    exit /b 1
)

echo ✅ Services folder found
echo.

REM Stop any existing Python processes
echo 🛑 Stopping any existing services...
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 🚀 Starting Analysis Service (Port 5002) - CV Improvements...
start "Analysis Service" cmd /k "cd services\analysis-service && echo 🚀 Starting Analysis Service for CV Improvements... && python app.py"
start "Analysis Service" cmd /k "cd services\matching-service && echo 🚀 Starting matching-service ... && python app.py"

echo.
echo ========================================
echo   🎉 Analysis Service Started Successfully!
echo ========================================
echo.
echo 🌐 Service available at: http://localhost:5002
echo.
pause >nul
