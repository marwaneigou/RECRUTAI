@echo off
echo ========================================
echo RecrutIA Mobile App Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo npm version:
npm --version

echo.
echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Checking Expo CLI...
npx expo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Expo CLI...
    npm install -g @expo/cli
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the development server:
echo   npm start
echo.
echo To run on specific platforms:
echo   npm run ios     (iOS Simulator)
echo   npm run android (Android Emulator)
echo   npm run web     (Web Browser)
echo.
echo Make sure to:
echo 1. Update API_BASE_URL in src/services/api.js
echo 2. Start your backend server
echo 3. Configure your development environment
echo.
pause
