@echo off
REM Start Existing Database Containers

echo 🚀 Starting Existing Database Containers
echo ========================================

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is available

echo.
echo 🔍 Checking for existing containers...
echo ====================================

REM Check and start PostgreSQL
docker ps -a --filter "name=smart_recruit_postgres" --format "{{.Names}}" | findstr smart_recruit_postgres >nul
if %errorlevel% equ 0 (
    echo 📦 Found PostgreSQL container, starting...
    docker start smart_recruit_postgres
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL started successfully
    ) else (
        echo ❌ Failed to start PostgreSQL
    )
) else (
    echo ⚠️ PostgreSQL container not found
    echo    Run scripts\start-databases-docker.bat to create it
)

REM Check and start pgAdmin
docker ps -a --filter "name=smart_recruit_pgadmin" --format "{{.Names}}" | findstr smart_recruit_pgadmin >nul
if %errorlevel% equ 0 (
    echo 📦 Found pgAdmin container, starting...
    docker start smart_recruit_pgadmin
    if %errorlevel% equ 0 (
        echo ✅ pgAdmin started successfully
    ) else (
        echo ❌ Failed to start pgAdmin
    )
) else (
    echo ⚠️ pgAdmin container not found
)

REM Check and start MongoDB
docker ps -a --filter "name=smart_recruit_mongodb" --format "{{.Names}}" | findstr smart_recruit_mongodb >nul
if %errorlevel% equ 0 (
    echo 📦 Found MongoDB container, starting...
    docker start smart_recruit_mongodb
    if %errorlevel% equ 0 (
        echo ✅ MongoDB started successfully
    ) else (
        echo ❌ Failed to start MongoDB
    )
) else (
    echo ⚠️ MongoDB container not found
    echo    Run scripts\start-databases-docker.bat to create it
)

REM Check and start Mongo Express
docker ps -a --filter "name=smart_recruit_mongo_express" --format "{{.Names}}" | findstr smart_recruit_mongo_express >nul
if %errorlevel% equ 0 (
    echo 📦 Found Mongo Express container, starting...
    docker start smart_recruit_mongo_express
    if %errorlevel% equ 0 (
        echo ✅ Mongo Express started successfully
    ) else (
        echo ❌ Failed to start Mongo Express
    )
) else (
    echo ⚠️ Mongo Express container not found
)

REM Check and start Redis
docker ps -a --filter "name=smart_recruit_redis" --format "{{.Names}}" | findstr smart_recruit_redis >nul
if %errorlevel% equ 0 (
    echo 📦 Found Redis container, starting...
    docker start smart_recruit_redis
    if %errorlevel% equ 0 (
        echo ✅ Redis started successfully
    ) else (
        echo ❌ Failed to start Redis
    )
) else (
    echo ⚠️ Redis container not found
    echo    Run scripts\start-databases-docker.bat to create it
)

REM Check and start Redis Commander
docker ps -a --filter "name=smart_recruit_redis_commander" --format "{{.Names}}" | findstr smart_recruit_redis_commander >nul
if %errorlevel% equ 0 (
    echo 📦 Found Redis Commander container, starting...
    docker start smart_recruit_redis_commander
    if %errorlevel% equ 0 (
        echo ✅ Redis Commander started successfully
    ) else (
        echo ❌ Failed to start Redis Commander
    )
) else (
    echo ⚠️ Redis Commander container not found
)

echo.
echo ⏳ Waiting for services to initialize...
timeout /t 15 /nobreak >nul

echo.
echo 📊 Current Container Status:
echo ===========================
docker ps --filter "name=smart_recruit" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ✅ Container Startup Complete!
echo =============================

echo.
echo 📊 Access Information:
echo =====================
echo 🐘 PostgreSQL:
echo    - Database: localhost:5432
echo    - Username: smart_admin
echo    - Password: secret
echo    - Dashboard: http://localhost:8080 (pgAdmin)
echo      * Email: admin@smartrecruit.com
echo      * Password: admin123
echo.
echo 🍃 MongoDB:
echo    - Database: localhost:27017
echo    - Username: root
echo    - Password: secret
echo    - Dashboard: http://localhost:8081 (Mongo Express)
echo      * Username: admin
echo      * Password: admin123
echo.
echo 🔴 Redis:
echo    - Database: localhost:6379
echo    - Dashboard: http://localhost:8082 (Redis Commander)
echo.
echo 💡 Tips:
echo =======
echo - If containers don't exist, run: scripts\start-databases-docker.bat
echo - To stop all containers: scripts\stop-databases-docker.bat
echo - To check status: docker ps --filter "name=smart_recruit"
echo.
pause
