@echo off
echo ========================================
echo Installing RECRUTAI AI Services Dependencies
echo ========================================

echo.
echo Installing Python dependencies for all services...
echo.

echo [1/6] Installing Analysis Service dependencies...
cd services/analysis-service
pip install -r requirements.txt
cd ../..

echo [2/6] Installing Matching Service dependencies...
cd services/matching-service
pip install -r requirements.txt
cd ../..

echo [3/6] Installing Document Service dependencies...
cd services/document-service
pip install -r requirements.txt
cd ../..

echo [4/6] Installing Recommendation Service dependencies...
cd services/recommendation-service
pip install -r requirements.txt
cd ../..

echo [5/6] Installing User Management Service dependencies...
cd services/user-management-service
pip install -r requirements.txt
cd ../..

echo [6/6] Installing Notification Service dependencies...
cd services/notification-service
pip install -r requirements.txt
cd ../..

echo.
echo ========================================
echo ✅ All dependencies installed successfully!
echo ========================================
echo.
echo 📋 Next steps:
echo 1. Configure your OpenAI API key in services/.env.global
echo 2. Run: start-all-services.bat
echo 3. Test: cd services && python run-all-tests.py
echo.
echo 🚀 RECRUTAI Platform Ready!
echo • 6 Microservices with OpenAI GPT-4 Integration
echo • Complete recruitment automation solution
echo • Ready for production deployment
echo.
pause
