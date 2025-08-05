@echo off
REM RecrutIA Database Reset and Seeding Script

echo 🎯 RecrutIA Database Reset and Seeding
echo =====================================

cd /d "%~dp0\.."

echo.
echo 🔍 Checking Prerequisites...
echo ===========================
docker ps --filter "name=recrutia-postgres" | findstr recrutia-postgres >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL container is not running
    echo Please start the services first: docker-compose up -d
    pause
    exit /b 1
)
echo ✅ PostgreSQL is running

echo.
echo 🗑️ Step 1: Resetting Database Schema...
echo ======================================
docker-compose exec backend npx prisma db push --force-reset
if %errorlevel% neq 0 (
    echo ❌ Database reset failed
    pause
    exit /b 1
)
echo ✅ Database schema reset complete

echo.
echo 🌱 Step 2: Seeding Database with Demo Data...
echo ============================================
docker-compose exec backend node prisma/seed.js
if %errorlevel% neq 0 (
    echo ❌ Database seeding failed
    pause
    exit /b 1
)
echo ✅ Database seeding complete

echo.
echo 📊 Step 3: Verifying Database Setup...
echo =====================================
docker-compose exec postgres psql -U postgres -d recrutia -c "SELECT 'Users' as table_name, COUNT(*) as count FROM \"User\" UNION ALL SELECT 'Skills', COUNT(*) FROM \"Skill\";"
echo ✅ Database verification complete

echo.
echo ✅ RecrutIA Database Reset Complete!
echo ==================================

echo.
echo 🧪 Demo Accounts Created:
echo ========================
echo 👤 CANDIDATE: ahmed.benali@example.com / candidate123
echo 🏢 EMPLOYER: hr@techcorp-solutions.com / employer123
echo.
echo 📊 Sample Data Created:
echo ======================
echo ✅ 1 Candidate profile (Ahmed Ben Ali)
echo ✅ 1 Employer profile (TechCorp Solutions)
echo ✅ 5 Sample skills (JavaScript, React, Node.js, Python, SQL)
echo.
echo 🌐 Database Management:
echo ======================
echo 📊 Adminer: http://localhost:8080
echo    Server: postgres
echo    Username: postgres
echo    Password: password123
echo    Database: recrutia
echo.
echo 💡 Next Steps:
echo =============
echo 1. Access RecrutIA: http://localhost:3000
echo 2. Login with demo accounts above
echo 3. Test job recommendation features
echo 4. View database in Adminer
echo.
pause
