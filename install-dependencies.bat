@echo off
echo ========================================
echo Installing RECRUTAI AI Services Dependencies
echo ========================================

echo.
echo Installing Python dependencies for all services...
echo.

echo [1/4] Installing Analysis Service dependencies...
cd analysis-service
pip install -r requirements.txt
cd ..

echo [2/4] Installing Matching Service dependencies...
cd matching-service
pip install -r requirements.txt
cd ..

echo [3/4] Installing Document Service dependencies...
cd document-service
pip install -r requirements.txt
cd ..

echo [4/4] Installing Recommendation Service dependencies...
cd recommendation-service
pip install -r requirements.txt
cd ..

echo.
echo ========================================
echo ✅ All dependencies installed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Configure your OpenAI API key in .env.global
echo 2. Run: start-all-services.bat
echo.
pause
