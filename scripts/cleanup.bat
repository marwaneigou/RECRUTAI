@echo off
setlocal

REM RecrutIA Cleanup Script for Windows

echo 🧹 RecrutIA Cleanup Utility
echo.
echo This will clean up Docker resources used by RecrutIA.
echo.
echo Options:
echo   1. Stop services only
echo   2. Stop services and remove containers
echo   3. Full cleanup (containers + volumes + images)
echo   4. Cancel
echo.
set /p choice=Choose option (1-4): 

if "%choice%"=="1" goto :stop_only
if "%choice%"=="2" goto :remove_containers
if "%choice%"=="3" goto :full_cleanup
if "%choice%"=="4" goto :cancel
goto :invalid

:stop_only
echo 🛑 Stopping services...
docker-compose down
echo ✅ Services stopped
goto :end

:remove_containers
echo 🛑 Stopping services and removing containers...
docker-compose down --remove-orphans
echo ✅ Services stopped and containers removed
goto :end

:full_cleanup
echo ⚠️  WARNING: This will delete ALL data including databases!
echo Are you absolutely sure? Type 'DELETE' to confirm:
set /p confirm=
if not "%confirm%"=="DELETE" (
    echo Cancelled.
    goto :end
)

echo 🗑️  Performing full cleanup...
docker-compose down -v --remove-orphans
docker image rm recrutia-backend recrutia-frontend recrutia-analysis-service recrutia-matching-service recrutia-recommendation-service 2>nul
docker system prune -f
echo ✅ Full cleanup completed

echo.
echo 📊 Remaining Docker resources:
docker system df
goto :end

:invalid
echo ❌ Invalid choice. Please select 1-4.
goto :end

:cancel
echo Cancelled.
goto :end

:end
echo.
echo Press any key to exit...
pause >nul
