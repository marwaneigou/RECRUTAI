@echo off
REM Clean Database Folder

echo 🧹 Cleaning Database Folder
echo ===========================

cd /d "%~dp0\.."

echo.
echo 🗑️ Removing old database folder...
echo =================================
if exist "database" (
    rmdir /s /q "database"
    echo ✅ Removed old database folder
) else (
    echo ✅ Database folder doesn't exist
)

echo.
echo 📁 Creating new database structure...
echo ====================================
mkdir "database"
mkdir "database\postgresql"
mkdir "database\mongodb" 
mkdir "database\seeds"
mkdir "database\migrations"
mkdir "database\scripts"

echo ✅ Created new database folder structure
echo.
pause
