@echo off
REM Add MongoDB Admin Interface (Mongo Express)

echo 🍃 Adding MongoDB Admin Interface
echo =================================

cd /d "%~dp0\.."

echo.
echo 🔍 Checking if MongoDB is running...
echo ===================================
docker ps --filter "name=recrutia-mongodb" | findstr recrutia-mongodb >nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB container is not running
    echo Please start the services first: docker-compose up -d
    pause
    exit /b 1
)
echo ✅ MongoDB is running

echo.
echo 🚀 Starting Mongo Express...
echo ===========================
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
  mongo-express:latest

if %errorlevel% neq 0 (
    echo ❌ Failed to start Mongo Express
    echo Trying to remove existing container and retry...
    docker rm -f recrutia-mongo-express 2>nul
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
      mongo-express:latest
)

echo.
echo ✅ Mongo Express Setup Complete!
echo ===============================

echo.
echo 🌐 Database Management URLs:
echo ===========================
echo 📊 PostgreSQL (Adminer): http://localhost:8080
echo    Server: postgres
echo    Username: postgres
echo    Password: password123
echo    Database: recrutia
echo.
echo 🍃 MongoDB (Mongo Express): http://localhost:8081
echo    Username: admin
echo    Password: admin123
echo.
echo 💡 Access your databases:
echo ========================
echo 1. PostgreSQL: http://localhost:8080
echo 2. MongoDB: http://localhost:8081
echo 3. RecrutIA App: http://localhost:3000
echo.
pause
