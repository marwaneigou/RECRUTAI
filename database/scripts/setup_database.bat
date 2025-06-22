@echo off
REM Setup Database Script for Smart Recruitment Platform

echo 🗄️ Setting up Smart Recruitment Platform Database
echo =================================================

cd /d "%~dp0\..\.."

echo.
echo 🔍 Checking Database Containers...
echo =================================
docker ps --filter "name=smart_recruit_postgres" --filter "name=smart_recruit_mongodb" --format "table {{.Names}}\t{{.Status}}"

REM Check if PostgreSQL is running
docker ps --filter "name=smart_recruit_postgres" | findstr smart_recruit_postgres >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL container is not running
    echo Please start the databases first: scripts\setup-databases-robust.bat
    pause
    exit /b 1
)

REM Check if MongoDB is running
docker ps --filter "name=smart_recruit_mongodb" | findstr smart_recruit_mongodb >nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB container is not running
    echo Please start the databases first: scripts\setup-databases-robust.bat
    pause
    exit /b 1
)

echo ✅ Both databases are running

echo.
echo 🏗️ Setting up PostgreSQL Schema...
echo =================================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -f /tmp/schema.sql 2>nul
if %errorlevel% neq 0 (
    echo Running schema from local file...
    docker cp database\postgresql\schema.sql smart_recruit_postgres:/tmp/schema.sql
    docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -f /tmp/schema.sql
)

echo.
echo 🌱 Loading Demo Data...
echo ======================
docker cp database\seeds\demo_data.sql smart_recruit_postgres:/tmp/demo_data.sql
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -f /tmp/demo_data.sql

echo.
echo 🍃 Setting up MongoDB Schema...
echo ==============================
docker cp database\mongodb\schema.js smart_recruit_mongodb:/tmp/schema.js
docker exec smart_recruit_mongodb mongosh smart_recruit_docs /tmp/schema.js

echo.
echo 📊 Verifying Setup...
echo ====================
echo PostgreSQL Tables:
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "\dt"

echo.
echo PostgreSQL Data Counts:
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "SELECT 'Users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'Candidates', COUNT(*) FROM candidates UNION ALL SELECT 'Employers', COUNT(*) FROM employers UNION ALL SELECT 'Jobs', COUNT(*) FROM jobs UNION ALL SELECT 'Skills', COUNT(*) FROM skills;"

echo.
echo MongoDB Collections:
docker exec smart_recruit_mongodb mongosh smart_recruit_docs --eval "db.getCollectionNames()"

echo.
echo ✅ Database Setup Complete!
echo ==========================

echo.
echo 🧪 Demo Accounts Available:
echo ===========================
echo 👤 CANDIDATE: ahmed.benali@email.com / Password123
echo 👤 CANDIDATE: sophie.martin@email.com / Password123
echo 🏢 EMPLOYER: marie.dubois@techcorp.fr / Password123
echo 🏢 EMPLOYER: jean.dupont@innovtech.fr / Password123
echo ⚡ ADMIN: admin@smartrecruit.com / password
echo.
echo 📊 Sample Data:
echo ==============
echo ✅ 5 Demo users with profiles
echo ✅ 2 Employer companies
echo ✅ 4 Job postings
echo ✅ 15 Skills with candidate associations
echo ✅ MongoDB collections for AI features
echo.
pause
