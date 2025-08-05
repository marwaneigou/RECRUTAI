@echo off
setlocal enabledelayedexpansion

REM RecrutIA Docker Deployment Script for Windows

echo 🚀 Starting RecrutIA deployment...

REM Change to project root directory
cd /d "%~dp0.."

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo 📝 Please edit .env file with your configuration before running again.
    ) else (
        echo ❌ .env.example file not found. Please create .env file manually.
    )
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Stop any existing containers first
echo 🛑 Stopping existing containers...
docker-compose down --remove-orphans 2>nul
docker container rm -f recrutia-mongo-express 2>nul

REM Clean up Docker system to fix read-only filesystem issues
echo 🧹 Cleaning Docker system...
docker system prune -f --volumes 2>nul
docker builder prune -f 2>nul
echo ✅ Cleanup complete

REM Restart Docker Desktop service to fix filesystem issues
echo 🔄 Restarting Docker service...
net stop "Docker Desktop Service" 2>nul
timeout /t 5 /nobreak >nul
net start "Docker Desktop Service" 2>nul
timeout /t 10 /nobreak >nul

REM Build and start services with increased resources
echo 🏗️  Building Docker images...
docker-compose build --no-cache --parallel
if errorlevel 1 (
    echo ❌ Failed to build Docker images
    echo 🔧 Trying alternative build approach...
    docker-compose build --no-cache
    if errorlevel 1 (
        echo ❌ Alternative build also failed
        goto :error
    )
)

echo 🗄️  Starting databases...
docker-compose up -d postgres mongodb redis
if errorlevel 1 (
    echo ❌ Failed to start databases
    goto :error
)

echo ⏳ Waiting for databases to be ready...
timeout /t 30 /nobreak >nul

echo 🔄 Running database migrations...
docker-compose run --rm backend npx prisma db push --force-reset
if errorlevel 1 (
    echo ⚠️  Database migration failed, continuing...
)

echo 🌱 Seeding database with demo data...
docker-compose run --rm backend node prisma/seed.js
if errorlevel 1 (
    echo ⚠️  Database seeding failed, continuing...
)

echo 🚀 Starting all application services...
docker-compose up -d backend frontend analysis-service matching-service
if errorlevel 1 (
    echo ❌ Failed to start application services
    goto :error
)

echo 🔧 Starting database admin tools...
docker-compose up -d adminer
if errorlevel 1 (
    echo ⚠️  Adminer failed to start, continuing...
)

echo 🍃 Starting MongoDB admin (Mongo Express)...
docker run -d ^
  --name recrutia-mongo-express ^
  --network recrutia_recrutia-network ^
  -p 8081:8081 ^
  -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin ^
  -e ME_CONFIG_MONGODB_ADMINPASSWORD=password123 ^
  -e ME_CONFIG_MONGODB_URL=mongodb://admin:password123@recrutia-mongodb:27017/ ^
  -e ME_CONFIG_BASICAUTH_USERNAME=admin ^
  -e ME_CONFIG_BASICAUTH_PASSWORD=admin123 ^
  -e ME_CONFIG_MONGODB_SERVER=recrutia-mongodb ^
  --restart unless-stopped ^
  mongo-express:latest 2>nul

if errorlevel 1 (
    echo ⚠️  Mongo Express failed to start, trying to remove existing and retry...
    docker rm -f recrutia-mongo-express 2>nul
    timeout /t 2 /nobreak >nul
    docker run -d ^
      --name recrutia-mongo-express ^
      --network recrutia_recrutia-network ^
      -p 8081:8081 ^
      -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin ^
      -e ME_CONFIG_MONGODB_ADMINPASSWORD=password123 ^
      -e ME_CONFIG_MONGODB_URL=mongodb://admin:password123@recrutia-mongodb:27017/ ^
      -e ME_CONFIG_BASICAUTH_USERNAME=admin ^
      -e ME_CONFIG_BASICAUTH_PASSWORD=admin123 ^
      -e ME_CONFIG_MONGODB_SERVER=recrutia-mongodb ^
      --restart unless-stopped ^
      mongo-express:latest 2>nul
)

echo ⏳ Waiting for services to be ready...
timeout /t 60 /nobreak >nul

REM Health checks
echo 🏥 Performing health checks...

set services=backend:3001 frontend:3000 analysis-service:5002 matching-service:5001

for %%s in (%services%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%s") do (
        set name=%%a
        set port=%%b
        
        curl -f http://localhost:!port!/health >nul 2>&1
        if errorlevel 1 (
            echo ❌ !name! health check failed
        ) else (
            echo ✅ !name! is healthy
        )
    )
)

echo.
echo 🎉 RecrutIA deployment completed successfully!
echo ===============================================
echo.
echo 🌐 Application URLs:
echo ==================
echo    🖥️  Frontend:              http://localhost:3000
echo    🔧 Backend API:           http://localhost:3001
echo    🤖 Analysis Service:      http://localhost:5002
echo    🎯 Matching Service:      http://localhost:5001
echo.
echo 📊 Database Admin URLs:
echo ======================
echo    🐘 PostgreSQL (Adminer):  http://localhost:8080
echo       Server: postgres ^| Username: postgres ^| Password: password123 ^| Database: recrutia
echo.
echo    🍃 MongoDB (Mongo Express): http://localhost:8081
echo       Username: admin ^| Password: admin123
echo.
echo 🧪 Demo Accounts:
echo ================
echo    👤 Candidate: ahmed.benali@example.com / candidate123
echo    🏢 Employer:  hr@techcorp-solutions.com / employer123
echo.
echo 📋 Sample Data Created:
echo ======================
echo    ✅ 2 Demo user accounts (candidate + employer)
echo    ✅ 3 Job postings from TechCorp Solutions
echo    ✅ 5 Skills in database (JavaScript, React, Node.js, Python, SQL)
echo.
echo 🗄️  Direct Database Access:
echo ==========================
echo    PostgreSQL: localhost:5432
echo    MongoDB:    localhost:27017
echo    Redis:      localhost:6379
echo.
echo 💡 Management Commands:
echo ======================
echo    📊 View logs: docker-compose logs -f [service-name]
echo    🛑 Stop all:  docker-compose down
echo    🔄 Restart:   docker-compose restart [service-name]
echo.
echo Press any key to exit...
pause >nul
exit /b 0

:error
echo.
echo ❌ Deployment failed! Check the error messages above.
echo.
echo 🔍 Troubleshooting:
echo ==================
echo    📊 View logs: docker-compose logs -f
echo    🔄 Retry: scripts\deploy.bat
echo    🛑 Clean up: docker-compose down --volumes
echo.
echo 💡 If databases started, you can still access:
echo    🐘 PostgreSQL Admin: http://localhost:8080
echo    🍃 MongoDB Admin: http://localhost:8081
echo.
echo Press any key to exit...
pause >nul
exit /b 1
