@echo off
echo ========================================
echo Starting RECRUTAI AI Services
echo ========================================

echo.
echo Starting all microservices...
echo.

echo [1/4] Starting Analysis Service on port 5002...
start "Analysis Service" cmd /k "cd analysis-service && python app.py"
timeout /t 2 /nobreak >nul

echo [2/4] Starting Matching Service on port 5001...
start "Matching Service" cmd /k "cd matching-service && python app.py"
timeout /t 2 /nobreak >nul

echo [3/4] Starting Document Service on port 5003...
start "Document Service" cmd /k "cd document-service && python app.py"
timeout /t 2 /nobreak >nul

echo [4/4] Starting Recommendation Service on port 5004...
start "Recommendation Service" cmd /k "cd recommendation-service && python app.py"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo ✅ All services started successfully!
echo ========================================
echo.
echo Service URLs:
echo • Analysis Service:      http://localhost:5002
echo • Matching Service:      http://localhost:5001
echo • Document Service:      http://localhost:5003
echo • Recommendation Service: http://localhost:5004
echo.
echo Health checks:
echo • curl http://localhost:5002/health
echo • curl http://localhost:5001/health
echo • curl http://localhost:5003/health
echo • curl http://localhost:5004/health
echo.
echo Press any key to continue...
pause >nul
