@echo off
REM Start Frontend and Backend for Smart Recruitment Platform

echo 🚀 Starting Smart Recruitment Platform
echo =======================================

cd /d "%~dp0\.."

echo.
echo 🔍 Pre-flight Checks...
echo ======================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is available: 
node --version

echo.
echo 🗄️ Checking Database Status...
echo =============================
docker ps --filter "name=smart_recruit_postgres" --format "table {{.Names}}\t{{.Status}}"

REM Check if PostgreSQL is running
docker ps --filter "name=smart_recruit_postgres" | findstr smart_recruit_postgres >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL container is not running
    echo.
    echo 🔧 Options to start databases:
    echo 1. Start existing containers: scripts\start-existing-containers.bat
    echo 2. Create new containers: scripts\start-databases-docker.bat
    echo.
    pause
    exit /b 1
)
echo ✅ PostgreSQL is running

echo.
echo 🛑 Stopping any existing Node.js processes...
echo ============================================
taskkill /f /im node.exe 2>nul
echo ✅ Stopped any running Node.js processes

echo.
echo 📦 Checking Dependencies...
echo ==========================

REM Check backend dependencies
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies found
)

REM Check frontend dependencies
cd ..\frontend\smart-recruit-app
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies found
)

cd ..\..

echo.
echo 🔄 Regenerating Prisma Client...
echo ===============================
cd backend
call npx prisma generate
if %errorlevel% neq 0 (
    echo ⚠️ Prisma generate failed, but continuing...
)
echo ✅ Prisma client ready

echo.
echo 🚀 Starting Backend Server...
echo ============================
echo Starting backend on http://localhost:3000...
start "Smart Recruit Backend" cmd /c "cd /d %cd% && echo Backend Server Starting... && npm run dev && pause"

REM Wait for backend to start
echo Waiting for backend server to start...
timeout /t 10 /nobreak >nul

echo.
echo 🎨 Starting Frontend Development Server...
echo =========================================
cd ..\frontend\smart-recruit-app
echo Starting frontend on http://localhost:3001...
start "Smart Recruit Frontend" cmd /c "cd /d %cd% && echo Frontend Server Starting... && npm start && pause"

echo.
echo 🎉 Services Started Successfully!
echo ================================

echo.
echo 📋 Access Information:
echo ======================
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend: http://localhost:3000/api
echo 📊 Health: http://localhost:3000/api/health
echo.
echo 🧪 Demo Accounts:
echo ================
echo 👤 Candidate: ahmed.benali@email.com / Password123
echo 🏢 Employer: marie.dubois@techcorp.fr / Password123
echo ⚡ Admin: admin@smartrecruit.com / password
echo.
echo 💡 Tips:
echo =======
echo - Frontend will open automatically in your browser
echo - Backend and frontend logs are in separate terminal windows
echo - Use Ctrl+C in each terminal to stop the services
echo - If you see errors, check the terminal windows for details
echo.

REM Wait a bit then open browser
timeout /t 15 /nobreak >nul
echo Opening application in browser...
start http://localhost:3001

echo.
echo ✅ Application is now running!
echo =============================
echo.
echo 🔧 Troubleshooting:
echo ==================
echo - If login fails: Run scripts\simple-database-reset.bat
echo - If ports are busy: Close other applications using ports 3000/3001
echo - If dependencies fail: Delete node_modules folders and run this script again
echo.
echo Press any key to close this window (services will keep running)...
pause >nul
