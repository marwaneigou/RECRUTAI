@echo off
REM Smart Database Startup - Handles existing containers

echo 🚀 Starting PostgreSQL and MongoDB with Dashboards (Smart Method)...
echo ===================================================================

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is available

REM Create a network for the databases (ignore if exists)
echo ℹ️  Creating database network...
docker network create smart_recruit_network 2>nul

REM Function to start or create PostgreSQL
echo ℹ️  Starting PostgreSQL...
docker ps -a --filter "name=smart_recruit_postgres" | findstr smart_recruit_postgres >nul
if %errorlevel% equ 0 (
    echo   📦 PostgreSQL container exists, starting it...
    docker start smart_recruit_postgres
) else (
    echo   📦 Creating new PostgreSQL container...
    docker run -d ^
      --name smart_recruit_postgres ^
      --network smart_recruit_network ^
      -e POSTGRES_DB=smart_recruit ^
      -e POSTGRES_USER=smart_admin ^
      -e POSTGRES_PASSWORD=secret ^
      -p 5432:5432 ^
      postgres:15-alpine
)

REM Function to start or create pgAdmin
echo ℹ️  Starting pgAdmin (PostgreSQL Dashboard)...
docker ps -a --filter "name=smart_recruit_pgadmin" | findstr smart_recruit_pgadmin >nul
if %errorlevel% equ 0 (
    echo   📦 pgAdmin container exists, starting it...
    docker start smart_recruit_pgadmin
) else (
    echo   📦 Creating new pgAdmin container...
    docker run -d ^
      --name smart_recruit_pgadmin ^
      --network smart_recruit_network ^
      -e PGADMIN_DEFAULT_EMAIL=admin@smartrecruit.com ^
      -e PGADMIN_DEFAULT_PASSWORD=admin123 ^
      -e PGADMIN_CONFIG_SERVER_MODE=False ^
      -p 8080:80 ^
      dpage/pgadmin4
)

REM Function to start or create MongoDB
echo ℹ️  Starting MongoDB...
docker ps -a --filter "name=smart_recruit_mongodb" | findstr smart_recruit_mongodb >nul
if %errorlevel% equ 0 (
    echo   📦 MongoDB container exists, starting it...
    docker start smart_recruit_mongodb
) else (
    echo   📦 Creating new MongoDB container...
    docker run -d ^
      --name smart_recruit_mongodb ^
      --network smart_recruit_network ^
      -e MONGO_INITDB_ROOT_USERNAME=root ^
      -e MONGO_INITDB_ROOT_PASSWORD=secret ^
      -e MONGO_INITDB_DATABASE=srp ^
      -p 27017:27017 ^
      mongo:6-jammy
)

REM Function to start or create Mongo Express
echo ℹ️  Starting Mongo Express (MongoDB Dashboard)...
docker ps -a --filter "name=smart_recruit_mongo_express" | findstr smart_recruit_mongo_express >nul
if %errorlevel% equ 0 (
    echo   📦 Mongo Express container exists, starting it...
    docker start smart_recruit_mongo_express
) else (
    echo   📦 Creating new Mongo Express container...
    docker run -d ^
      --name smart_recruit_mongo_express ^
      --network smart_recruit_network ^
      -e ME_CONFIG_MONGODB_ADMINUSERNAME=root ^
      -e ME_CONFIG_MONGODB_ADMINPASSWORD=secret ^
      -e ME_CONFIG_MONGODB_URL=mongodb://root:secret@smart_recruit_mongodb:27017/ ^
      -e ME_CONFIG_BASICAUTH_USERNAME=admin ^
      -e ME_CONFIG_BASICAUTH_PASSWORD=admin123 ^
      -p 8081:8081 ^
      mongo-express
)

REM Function to start or create Redis
echo ℹ️  Starting Redis...
docker ps -a --filter "name=smart_recruit_redis" | findstr smart_recruit_redis >nul
if %errorlevel% equ 0 (
    echo   📦 Redis container exists, starting it...
    docker start smart_recruit_redis
) else (
    echo   📦 Creating new Redis container...
    docker run -d ^
      --name smart_recruit_redis ^
      --network smart_recruit_network ^
      -p 6379:6379 ^
      redis:7-alpine redis-server --appendonly yes
)

REM Function to start or create Redis Commander
echo ℹ️  Starting Redis Commander (Redis Dashboard)...
docker ps -a --filter "name=smart_recruit_redis_commander" | findstr smart_recruit_redis_commander >nul
if %errorlevel% equ 0 (
    echo   📦 Redis Commander container exists, starting it...
    docker start smart_recruit_redis_commander
) else (
    echo   📦 Creating new Redis Commander container...
    docker run -d ^
      --name smart_recruit_redis_commander ^
      --network smart_recruit_network ^
      -e REDIS_HOSTS=local:smart_recruit_redis:6379 ^
      -p 8082:8081 ^
      rediscommander/redis-commander
)

REM Wait for services to start
echo ℹ️  Waiting for services to initialize...
timeout /t 30 /nobreak >nul

REM Check running containers
echo ℹ️  Checking running containers...
docker ps --filter "name=smart_recruit" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ✅ Databases and dashboards are starting up!
echo.
echo 📊 Access your dashboards:
echo.
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
echo    - Wait 1-2 minutes for all services to fully start
echo    - Use 'scripts\stop-databases-simple.bat' to stop all services
echo    - If a service fails to start, it might already be running
echo.
pause
