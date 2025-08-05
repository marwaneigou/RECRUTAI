@echo off
setlocal enabledelayedexpansion

echo 📧 RecrutIA Email Configuration Setup
echo =====================================
echo.
echo This script will help you configure email settings for RecrutIA.
echo You'll need a Gmail account with App Password enabled.
echo.

REM Change to project root
cd /d "%~dp0.."

echo 📝 Current email configuration in .env:
echo.
findstr /C:"SMTP_" .env 2>nul
echo.

echo 🔧 To configure Gmail SMTP:
echo.
echo 1. Go to your Google Account (myaccount.google.com)
echo 2. Navigate to Security → 2-Step Verification (enable if not already)
echo 3. Go to Security → App passwords
echo 4. Generate an app password for "Mail"
echo 5. Use that 16-character password (not your regular Gmail password)
echo.

set /p email="Enter your Gmail address: "
set /p apppass="Enter your Gmail App Password (16 characters): "
set /p fromname="Enter sender name (default: RecrutIA Platform): "

if "%fromname%"=="" set fromname=RecrutIA Platform

echo.
echo 💾 Updating .env file...

REM Create a temporary file with updated SMTP settings
(
echo # Email Configuration ^(Required for sending emails^)
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_SECURE=false
echo SMTP_USER=%email%
echo SMTP_PASS=%apppass%
echo SMTP_FROM_NAME=%fromname%
echo SMTP_FROM_EMAIL=%email%
) > temp_smtp.txt

REM Read the current .env file and replace SMTP section
(
for /f "delims=" %%i in (.env) do (
    set "line=%%i"
    if "!line:~0,12!"=="# Email Conf" (
        type temp_smtp.txt
        REM Skip the old SMTP section
        for /l %%j in (1,1,7) do (
            set /p dummy=
        )
    ) else if "!line:~0,5!"=="SMTP_" (
        REM Skip old SMTP lines - they're replaced above
    ) else (
        echo !line!
    )
)
) < .env > .env.new

move .env.new .env >nul
del temp_smtp.txt >nul

echo ✅ Email configuration updated!
echo.
echo 🧪 Testing email configuration...

REM Test the email configuration by starting the backend briefly
echo Starting backend to test email...
cd backend
start /b npm start >nul 2>&1
timeout /t 5 /nobreak >nul

REM Kill the test backend
taskkill /f /im node.exe >nul 2>&1

echo.
echo 📋 Email configuration summary:
echo ===============================
echo SMTP Host: smtp.gmail.com
echo SMTP Port: 587
echo SMTP User: %email%
echo From Name: %fromname%
echo.
echo 💡 Next steps:
echo 1. Start your RecrutIA application
echo 2. Go to Employer Dashboard → Candidates
echo 3. Try changing a candidate's status to test email sending
echo.
echo 🔍 If emails still don't work:
echo - Verify your Gmail App Password is correct
echo - Check that 2-Factor Authentication is enabled on Gmail
echo - Make sure "Less secure app access" is disabled (use App Password instead)
echo.
pause
