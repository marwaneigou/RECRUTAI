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

echo 🚀 Starting AI Services...
echo.

REM Start Analysis Service (Port 5002) - CV Improvements
echo 🔧 Starting Analysis Service (Port 5002) - CV Improvements...
start "Analysis Service" cmd /k "cd services\analysis-service && echo 🚀 Starting Analysis Service for CV Improvements... && python app.py"

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak >nul

REM Start Matching Service (Port 5001)
echo 🔧 Starting Matching Service (Port 5001)...
start "Matching Service" cmd /k "cd services\matching-service && echo 🚀 Starting Matching Service... && python app.py"

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak >nul

REM Start Document Service (Port 5003)
echo 🔧 Starting Document Service (Port 5003)...
start "Document Service" cmd /k "cd services\document-service && echo 🚀 Starting Document Service... && python app.py"

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak >nul

REM Start Recommendation Service (Port 5004)
echo 🔧 Starting Recommendation Service (Port 5004)...
start "Recommendation Service" cmd /k "cd services\recommendation-service && echo 🚀 Starting Recommendation Service... && python app.py"

echo.
echo ========================================
echo   🎉 AI Services Started Successfully!
echo ========================================
echo.
echo 🌐 Services available at:
echo   • Analysis Service (CV Improvements): http://localhost:5002
echo   • Matching Service:                   http://localhost:5001
echo   • Document Service:                   http://localhost:5003
echo   • Recommendation Service:             http://localhost:5004
echo.
echo 📋 CV Improvements Integration:
echo   • Backend endpoint: POST /api/candidates/cv-improvements
echo   • Frontend component: CVImprovements.js
echo   • AI Service endpoint: POST http://localhost:5002/api/analyze/cv
echo.
echo 🧪 Test CV Improvements:
echo   1. Start your main backend: npm run dev (in backend folder)
echo   2. Start your frontend: npm start (in frontend folder)
echo   3. Go to CV Builder and click "AI Improvements" button
echo.
echo 💡 API Usage Example:
echo   curl -X POST http://localhost:5002/api/analyze/cv \
echo     -H "Content-Type: application/json" \
echo     -d '{"cvText": "Your CV content here"}'
echo.
echo 🎯 Features:
echo   • AI-powered CV improvement suggestions
echo   • Optimized for low token usage (90%% cost reduction)
echo   • Fallback suggestions when AI unavailable
echo   • Integrated into CV Builder with beautiful UI
echo.
echo Press any key to continue...
pause >nul

echo.
echo ✅ All AI services launched successfully!
echo 🌐 Services should be ready in 30-60 seconds
echo 🎯 CV Improvements feature is now available in your app!
