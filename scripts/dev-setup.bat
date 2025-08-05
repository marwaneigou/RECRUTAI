@echo off
setlocal enabledelayedexpansion

REM RecrutIA Development Setup Script for Windows

echo 🛠️  Setting up RecrutIA for development...

REM Change to project root directory
cd /d "%~dp0.."

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo 📝 Please edit .env file with your configuration.
    ) else (
        echo ❌ .env.example file not found. Please create .env file manually.
    )
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Start databases only
echo 🗄️  Starting databases...
docker-compose up -d postgres mongodb
if errorlevel 1 (
    echo ❌ Failed to start databases
    goto :error
)

echo ⏳ Waiting for databases to be ready...
timeout /t 30 /nobreak >nul

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Node.js not found. Please install Node.js to continue with local development.
    echo You can still use Docker for development: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
    goto :docker_dev
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
if exist "package.json" (
    call npm install
    if errorlevel 1 (
        echo ⚠️  Failed to install backend dependencies
    ) else (
        echo ✅ Backend dependencies installed
    )
) else (
    echo ⚠️  Backend package.json not found
)
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend\smart-recruit-app
if exist "package.json" (
    call npm install
    if errorlevel 1 (
        echo ⚠️  Failed to install frontend dependencies
    ) else (
        echo ✅ Frontend dependencies installed
    )
) else (
    echo ⚠️  Frontend package.json not found
)
cd ..\..

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Python not found. Skipping Python service dependencies.
    echo You can use Docker for AI services: docker-compose up -d analysis-service matching-service recommendation-service
    goto :database_setup
)

REM Install Python service dependencies
echo 📦 Installing Python service dependencies...

cd services\analysis-service
if exist "requirements.txt" (
    pip install -r requirements.txt >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Failed to install analysis-service dependencies
    ) else (
        echo ✅ Analysis service dependencies installed
    )
)
cd ..\..

cd services\matching-service
if exist "requirements.txt" (
    pip install -r requirements.txt >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Failed to install matching-service dependencies
    ) else (
        echo ✅ Matching service dependencies installed
    )
)
cd ..\..

:database_setup
REM Database setup
echo 🔄 Setting up database...
cd backend
if exist "prisma\schema.prisma" (
    call npx prisma generate
    if errorlevel 1 (
        echo ⚠️  Failed to generate Prisma client
    ) else (
        echo ✅ Prisma client generated
    )
    
    call npx prisma migrate deploy
    if errorlevel 1 (
        echo ⚠️  Failed to run database migrations
    ) else (
        echo ✅ Database migrations completed
    )
    
    call npx prisma db seed
    if errorlevel 1 (
        echo ⚠️  Failed to seed database
    ) else (
        echo ✅ Database seeded
    )
) else (
    echo ⚠️  Prisma schema not found
)
cd ..

:docker_dev
echo.
echo 🎉 Development setup completed!
echo.
echo 🚀 To start development servers manually:
echo    Backend:               cd backend ^&^& npm run dev
echo    Frontend:              cd frontend\smart-recruit-app ^&^& npm start
echo    Analysis Service:      cd services\analysis-service ^&^& python app.py
echo    Matching Service:      cd services\matching-service ^&^& python app.py
echo.
echo 🐳 Or use Docker for development:
echo    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
echo.
echo Press any key to exit...
pause >nul
exit /b 0

:error
echo.
echo ❌ Development setup failed! Check the error messages above.
echo.
echo Press any key to exit...
pause >nul
exit /b 1
