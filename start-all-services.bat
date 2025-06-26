@echo off
echo ========================================
echo Starting RECRUTAI AI Services Platform
echo ========================================

echo.
echo Starting all microservices...
echo.

echo [1/6] Starting Analysis Service on port 5002...
start "Analysis Service" cmd /k "cd services/analysis-service && python app.py"
timeout /t 2 /nobreak >nul

echo [2/6] Starting Matching Service on port 5001...
start "Matching Service" cmd /k "cd services/matching-service && python app.py"
timeout /t 2 /nobreak >nul

echo [3/6] Starting Document Service on port 5003...
start "Document Service" cmd /k "cd services/document-service && python app.py"
timeout /t 2 /nobreak >nul

echo [4/6] Starting Recommendation Service on port 5004...
start "Recommendation Service" cmd /k "cd services/recommendation-service && python app.py"
timeout /t 2 /nobreak >nul

echo [5/6] Starting User Management Service on port 5005...
start "User Management Service" cmd /k "cd services/user-management-service && python app.py"
timeout /t 2 /nobreak >nul

echo [6/6] Starting Notification Service on port 5006...
start "Notification Service" cmd /k "cd services/notification-service && python app.py"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo ✅ All RECRUTAI services started successfully!
echo ========================================
echo.
echo 🌐 Service URLs:
echo • Analysis Service:        http://localhost:5002
echo • Matching Service:        http://localhost:5001
echo • Document Service:        http://localhost:5003
echo • Recommendation Service:  http://localhost:5004
echo • User Management Service: http://localhost:5005
echo • Notification Service:    http://localhost:5006
echo.
echo 🔍 Health checks:
echo • curl http://localhost:5002/health
echo • curl http://localhost:5001/health
echo • curl http://localhost:5003/health
echo • curl http://localhost:5004/health
echo • curl http://localhost:5005/health
echo • curl http://localhost:5006/health
echo.
echo 🧪 Run tests:
echo • cd services && python run-all-tests.py
echo.
echo 📋 Features Available:
echo • CV/Job Analysis with OpenAI GPT-4
echo • AI-powered Matching Algorithms
echo • Document Generation & Customization
echo • Intelligent Recommendations
echo • User Authentication & Management
echo • Real-time Notifications
echo.
pause
