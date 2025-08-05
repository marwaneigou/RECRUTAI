@echo off
setlocal

REM RecrutIA Environment Setup Script for Windows

echo 🔧 Setting up RecrutIA environment configuration...
echo.

REM Change to project root directory
cd /d "%~dp0.."

REM Check if .env already exists
if exist ".env" (
    echo ⚠️  .env file already exists. 
    echo Do you want to overwrite it? (y/N)
    set /p overwrite=
    if /i not "%overwrite%"=="y" (
        echo Cancelled. Existing .env file preserved.
        goto :end
    )
)

REM Create .env file with default values
echo 📝 Creating .env file with default configuration...

(
echo # RecrutIA Environment Configuration
echo.
echo # Database Configuration
echo DATABASE_URL=postgresql://postgres:password123@postgres:5432/recrutia
echo MONGODB_URI=mongodb://admin:password123@mongodb:27017/recrutia_ai?authSource=admin
echo.
echo # JWT Configuration
echo JWT_SECRET=recrutia-super-secret-jwt-key-change-in-production-%RANDOM%
echo.
echo # OpenAI Configuration ^(REQUIRED - Add your API key^)
echo OPENAI_API_KEY=your-openai-api-key-here
echo OPENAI_MODEL=gpt-4
echo OPENAI_TEMPERATURE=0.3
echo OPENAI_MAX_TOKENS=2000
echo.
echo # Service URLs ^(for Docker containers^)
echo ANALYSIS_SERVICE_URL=http://analysis-service:5002
echo MATCHING_SERVICE_URL=http://matching-service:5001
echo RECOMMENDATION_SERVICE_URL=http://recommendation-service:5003
echo.
echo # Frontend Configuration
echo REACT_APP_API_URL=http://localhost:3001/api
echo REACT_APP_BACKEND_URL=http://localhost:3001
echo.
echo # Application Configuration
echo NODE_ENV=production
echo PORT=3001
echo.
echo # Security Configuration
echo CORS_ORIGIN=http://localhost:3000
echo SESSION_SECRET=recrutia-session-secret-%RANDOM%
echo.
echo # File Upload Configuration
echo MAX_FILE_SIZE=10MB
echo UPLOAD_PATH=./uploads
echo.
echo # Logging Configuration
echo LOG_LEVEL=info
echo LOG_FILE=./logs/app.log
) > .env

echo ✅ .env file created successfully!
echo.
echo ⚠️  IMPORTANT: You need to add your OpenAI API key!
echo.
echo 📝 Please edit .env file and update:
echo    OPENAI_API_KEY=your-actual-openai-api-key-here
echo.
echo 💡 You can get an OpenAI API key from: https://platform.openai.com/api-keys
echo.
echo 🚀 After adding your API key, run: scripts\deploy.bat
echo.

REM Ask if user wants to open .env file for editing
echo Do you want to open .env file for editing now? (y/N)
set /p edit=
if /i "%edit%"=="y" (
    if exist "C:\Windows\System32\notepad.exe" (
        start notepad .env
    ) else (
        echo Please edit .env file with your preferred text editor
    )
)

:end
echo.
echo Press any key to exit...
pause >nul
