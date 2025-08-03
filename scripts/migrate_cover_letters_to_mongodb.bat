@echo off
echo 🔄 Migrating Cover Letters from PostgreSQL to MongoDB
echo =====================================================

echo.
echo Step 1: Navigating to project root and backend directory...
cd /d "%~dp0.."
echo Current directory: %CD%

echo.
echo Step 2: Running Prisma migration to update schema...
cd backend
if not exist "prisma\schema.prisma" (
    echo ❌ Error: Prisma schema not found in backend\prisma\schema.prisma
    echo Please make sure you're running this from the project root
    pause
    exit /b 1
)

npx prisma migrate dev --name remove_cover_letter_add_reference

echo.
echo Step 3: Generating new Prisma client...
npx prisma generate

echo.
echo Step 4: Running database migration script manually...
echo Please run this SQL manually in your PostgreSQL database:
echo.
echo -- Remove cover_letter column and add cover_letter_id
echo ALTER TABLE applications DROP COLUMN IF EXISTS cover_letter;
echo ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter_id VARCHAR(255);
echo CREATE INDEX IF NOT EXISTS idx_applications_cover_letter_id ON applications(cover_letter_id);
echo.

echo.
echo Step 5: Testing database connections...
echo Testing PostgreSQL connection...
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "SELECT version();" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL container not running or not accessible
) else (
    echo ✅ PostgreSQL connection successful
)

echo.
echo Testing MongoDB connection...
docker exec smart_recruit_mongo mongosh --eval "db.adminCommand('ping')" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB container not running or not accessible
) else (
    echo ✅ MongoDB connection successful
)

echo.
echo 📋 Manual Steps Required:
echo ========================
echo 1. Run the SQL commands shown above in your PostgreSQL database
echo 2. Restart your backend server: npm run dev (in backend directory)
echo 3. Test job application at: http://localhost:3001/candidate/jobs
echo 4. Verify cover letters are saved to MongoDB
echo.
echo 🔍 To verify the migration worked:
echo   PostgreSQL: SELECT id, job_id, candidate_id, cover_letter_id FROM applications;
echo   MongoDB: db.cover_letters.find().pretty()

pause
