@echo off
setlocal

REM RecrutIA Database Management Script for Windows

if "%1"=="" goto :help

if "%1"=="migrate" goto :migrate
if "%1"=="seed" goto :seed
if "%1"=="reset" goto :reset
if "%1"=="backup" goto :backup
if "%1"=="restore" goto :restore
if "%1"=="psql" goto :psql
if "%1"=="mongo" goto :mongo
goto :help

:migrate
echo 🔄 Running database migrations...
docker-compose exec backend npx prisma migrate deploy
if errorlevel 1 (
    echo ❌ Migration failed
) else (
    echo ✅ Migration completed
)
goto :end

:seed
echo 🌱 Seeding database...
docker-compose exec backend npx prisma db seed
if errorlevel 1 (
    echo ❌ Seeding failed
) else (
    echo ✅ Database seeded
)
goto :end

:reset
echo ⚠️  This will delete all data! Are you sure? (y/N)
set /p confirm=
if /i not "%confirm%"=="y" (
    echo Cancelled.
    goto :end
)
echo 🗑️  Resetting database...
docker-compose down -v
docker-compose up -d postgres mongodb
timeout /t 10 /nobreak >nul
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
echo ✅ Database reset completed
goto :end

:backup
echo 💾 Creating database backup...
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
mkdir backups 2>nul
docker-compose exec postgres pg_dump -U postgres recrutia > backups\postgres_backup_%timestamp%.sql
docker-compose exec mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/recrutia_ai?authSource=admin" --out=backups\mongodb_backup_%timestamp%
echo ✅ Backup created: backups\*_backup_%timestamp%
goto :end

:restore
if "%2"=="" (
    echo ❌ Please specify backup file
    echo Usage: database.bat restore backup_file.sql
    goto :end
)
echo 📥 Restoring database from %2...
docker-compose exec -T postgres psql -U postgres -d recrutia < %2
echo ✅ Database restored
goto :end

:psql
echo 🐘 Connecting to PostgreSQL...
docker-compose exec postgres psql -U postgres -d recrutia
goto :end

:mongo
echo 🍃 Connecting to MongoDB...
docker-compose exec mongodb mongosh -u admin -p password123 recrutia_ai
goto :end

:help
echo 🗄️  RecrutIA Database Management
echo.
echo Usage: database.bat [command]
echo.
echo Commands:
echo   migrate  - Run database migrations
echo   seed     - Seed database with sample data
echo   reset    - Reset database (⚠️  deletes all data)
echo   backup   - Create database backup
echo   restore  - Restore from backup file
echo   psql     - Connect to PostgreSQL shell
echo   mongo    - Connect to MongoDB shell
echo.
echo Examples:
echo   database.bat migrate
echo   database.bat seed
echo   database.bat backup
echo   database.bat restore backups\backup_20250131.sql

:end
echo.
echo Press any key to exit...
pause >nul
