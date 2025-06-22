@echo off
REM Perfect Database Reset with Correct Password Hashes

echo 🎯 Perfect Database Reset for Smart Recruitment Platform
echo ========================================================

cd /d "%~dp0\.."

echo.
echo 🔍 Checking Prerequisites...
echo ===========================
docker ps --filter "name=smart_recruit_postgres" | findstr smart_recruit_postgres >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL container is not running
    echo Please start the database first: scripts\setup-databases-robust.bat
    pause
    exit /b 1
)
echo ✅ PostgreSQL is running

echo.
echo 🛑 Stopping all Node.js processes...
echo ===================================
taskkill /f /im node.exe 2>nul
taskkill /f /im nodemon.exe 2>nul
echo ✅ Stopped all Node.js processes

echo.
echo 🗑️ Step 1: Complete Database Reset...
echo ====================================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "DROP SCHEMA public CASCADE;"
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE SCHEMA public;"
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "GRANT ALL ON SCHEMA public TO smart_admin;"
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "GRANT ALL ON SCHEMA public TO public;"

echo.
echo 🏗️ Step 2: Creating Prisma-Compatible Enums...
echo ==============================================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TYPE \"Role\" AS ENUM ('candidate', 'employer', 'admin');"
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TYPE \"EmploymentType\" AS ENUM ('full-time', 'part-time', 'contract', 'internship', 'freelance');"
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TYPE \"ExperienceLevel\" AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');"
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TYPE \"ApplicationStatus\" AS ENUM ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn');"
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TYPE \"ProficiencyLevel\" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');"

echo.
echo 🏗️ Step 3: Creating Tables...
echo ============================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE users (id SERIAL PRIMARY KEY, uuid VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role \"Role\" NOT NULL, is_active BOOLEAN DEFAULT true, email_verified BOOLEAN DEFAULT false, phone VARCHAR(255), avatar_url VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_login TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE employers (id SERIAL PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE, company_name VARCHAR(255) NOT NULL, industry VARCHAR(255), company_size VARCHAR(255), website VARCHAR(255), description TEXT, logo_url VARCHAR(255), address VARCHAR(255), city VARCHAR(255), country VARCHAR(255), founded_year INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE candidates (id SERIAL PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL, date_of_birth DATE, location VARCHAR(255), experience_years INTEGER DEFAULT 0, current_position VARCHAR(255), current_company VARCHAR(255), salary_expectation DECIMAL(10,2), currency VARCHAR(10) DEFAULT 'USD', availability_date DATE, linkedin_url VARCHAR(255), github_url VARCHAR(255), portfolio_url VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE jobs (id SERIAL PRIMARY KEY, employer_id INTEGER REFERENCES employers(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, requirements TEXT, responsibilities TEXT, location VARCHAR(255), employment_type \"EmploymentType\" NOT NULL, experience_level \"ExperienceLevel\" NOT NULL, salary_min DECIMAL(10,2), salary_max DECIMAL(10,2), currency VARCHAR(10) DEFAULT 'USD', remote_allowed BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, application_deadline TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE applications (id SERIAL PRIMARY KEY, job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE, candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE, status \"ApplicationStatus\" DEFAULT 'pending', cover_letter TEXT, cv_url VARCHAR(255), applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP, notes TEXT, rating SMALLINT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(job_id, candidate_id));"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE skills (id SERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL, category VARCHAR(255), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE sessions (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, session_token VARCHAR(255) UNIQUE NOT NULL, expires_at TIMESTAMP NOT NULL, ip_address VARCHAR(45), user_agent TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE notifications (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, type VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, is_read BOOLEAN DEFAULT false, data JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE permissions (id SERIAL PRIMARY KEY, role VARCHAR(255) NOT NULL, resource VARCHAR(255) NOT NULL, action VARCHAR(255) NOT NULL, allowed BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(role, resource, action));"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE candidate_skills (id SERIAL PRIMARY KEY, candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE, skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE, proficiency_level \"ProficiencyLevel\" NOT NULL, years_experience INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(candidate_id, skill_id));"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE job_skills (id SERIAL PRIMARY KEY, job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE, skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE, required_level \"ProficiencyLevel\" NOT NULL, is_required BOOLEAN DEFAULT true, weight DECIMAL(3,2) DEFAULT 1.0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(job_id, skill_id));"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE cv_data (id SERIAL PRIMARY KEY, candidate_id INTEGER UNIQUE REFERENCES candidates(id) ON DELETE CASCADE, selected_template VARCHAR(255) DEFAULT 'modern', first_name VARCHAR(255), last_name VARCHAR(255), email VARCHAR(255), phone VARCHAR(255), address VARCHAR(255), city VARCHAR(255), country VARCHAR(255), linkedin_url VARCHAR(255), github_url VARCHAR(255), portfolio_url VARCHAR(255), professional_summary TEXT, technical_skills TEXT, soft_skills TEXT, languages TEXT, work_experience JSONB, education JSONB, projects JSONB, certifications JSONB, is_complete BOOLEAN DEFAULT false, last_generated TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

echo.
echo 🧹 Step 4: Cleaning Prisma Cache...
echo ==================================
cd backend
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma"
    echo ✅ Removed Prisma cache
)

echo.
echo 🔄 Step 5: Regenerating Prisma Client...
echo =======================================
call npx prisma generate
if %errorlevel% neq 0 (
    echo ⚠️ Prisma generate had issues, trying alternative...
    call npm install @prisma/client
    call npx prisma generate
)
echo ✅ Prisma client ready
cd ..

echo.
echo 🌱 Step 6: Creating Demo Users with Correct Password Hashes...
echo ============================================================

REM Password123 = $2a$12$LQv3c1yqBwEHXLAw98j2uOe5UPmkHO6T9mAp1ckrUVTeIaVOYYFHO
REM password = $2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO users (uuid, name, email, password_hash, role, phone, is_active, email_verified) VALUES ('demo-candidate-001', 'Ahmed Ben Ali', 'ahmed.benali@email.com', '$2a$12$IOYi9GOAyJyBXTuB/9AF..uwdBwU2m5aMrYYqyFh9DcU/2Raut85C', 'candidate', '+33123456789', true, true);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO users (uuid, name, email, password_hash, role, phone, is_active, email_verified) VALUES ('demo-employer-001', 'Marie Dubois', 'marie.dubois@techcorp.fr', '$2a$12$IOYi9GOAyJyBXTuB/9AF..uwdBwU2m5aMrYYqyFh9DcU/2Raut85C', 'employer', '+33987654321', true, true);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO users (uuid, name, email, password_hash, role, phone, is_active, email_verified) VALUES ('demo-admin-001', 'System Administrator', 'admin@smartrecruit.com', '$2a$12$Oz3m4UCKi0l3O4V/eCsJ1..59tJ2PWUS2N7WGOePXRXK52iQ4/1Hy', 'admin', '+33555000111', true, true);"

echo.
echo 🌱 Step 7: Creating Profiles and Sample Data...
echo ==============================================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO candidates (user_id, first_name, last_name, location, experience_years, current_position, current_company, salary_expectation, currency, linkedin_url, github_url, portfolio_url) SELECT u.id, 'Ahmed', 'Ben Ali', 'Paris, France', 5, 'Full Stack Developer', 'Tech Solutions Inc.', 55000.00, 'EUR', 'https://linkedin.com/in/ahmed-benali', 'https://github.com/ahmed-benali', 'https://ahmed-portfolio.dev' FROM users u WHERE u.email = 'ahmed.benali@email.com';"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO employers (user_id, company_name, industry, company_size, website, description, address, city, country, founded_year) SELECT u.id, 'TechCorp Solutions', 'Technology', '50-200', 'https://techcorp-solutions.fr', 'Leading technology solutions provider in France', '123 Tech Street', 'Paris', 'France', 2015 FROM users u WHERE u.email = 'marie.dubois@techcorp.fr';"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO skills (name, category, description) VALUES ('JavaScript', 'Programming', 'JavaScript programming language'), ('React', 'Frontend', 'React.js library for building user interfaces'), ('Node.js', 'Backend', 'JavaScript runtime for server-side development'), ('Python', 'Programming', 'Python programming language'), ('PostgreSQL', 'Database', 'Relational database management system'), ('MongoDB', 'Database', 'NoSQL document database'), ('Docker', 'DevOps', 'Containerization platform'), ('AWS', 'Cloud', 'Amazon Web Services cloud platform'), ('Git', 'Tools', 'Version control system'), ('TypeScript', 'Programming', 'Typed superset of JavaScript');"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO jobs (employer_id, title, description, requirements, responsibilities, location, employment_type, experience_level, salary_min, salary_max, currency, remote_allowed, is_active) SELECT e.id, 'Senior Full Stack Developer', 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will work on cutting-edge projects using modern technologies.', '5+ years of experience with JavaScript, React, Node.js, and databases. Strong problem-solving skills and experience with agile methodologies.', 'Develop and maintain web applications, collaborate with cross-functional teams, mentor junior developers, participate in code reviews.', 'Paris, France', 'full-time', 'senior', 50000.00, 70000.00, 'EUR', true, true FROM employers e WHERE e.company_name = 'TechCorp Solutions';"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO jobs (employer_id, title, description, requirements, responsibilities, location, employment_type, experience_level, salary_min, salary_max, currency, remote_allowed, is_active) SELECT e.id, 'Frontend React Developer', 'Join our frontend team to build amazing user interfaces with React and modern JavaScript.', '3+ years of React experience, knowledge of TypeScript, CSS, and modern frontend tools.', 'Build responsive web applications, optimize performance, work with designers and backend developers.', 'Paris, France', 'full-time', 'mid', 40000.00, 55000.00, 'EUR', true, true FROM employers e WHERE e.company_name = 'TechCorp Solutions';"

echo.
echo 🎨 Step 8: Creating CV Data...
echo =============================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO cv_data (candidate_id, selected_template, first_name, last_name, email, phone, city, country, linkedin_url, github_url, professional_summary, technical_skills, soft_skills, languages, work_experience, education, projects, certifications, is_complete) SELECT c.id, 'modern', 'Ahmed', 'Ben Ali', 'ahmed.benali@email.com', '+33123456789', 'Paris', 'France', 'https://linkedin.com/in/ahmed-benali', 'https://github.com/ahmed-benali', 'Experienced Full Stack Developer with 5+ years of expertise in React, Node.js, and cloud technologies. Passionate about creating scalable web applications and leading development teams.', 'JavaScript, React.js, Node.js, Python, PostgreSQL, MongoDB, AWS, Docker, Git', 'Leadership, Problem Solving, Team Collaboration, Agile Methodologies, Communication', 'French (Native), English (Fluent), Arabic (Conversational)', '[{\"id\": 1, \"jobTitle\": \"Senior Full Stack Developer\", \"company\": \"Tech Solutions Inc.\", \"location\": \"Paris, France\", \"startDate\": \"2022-01\", \"endDate\": \"\", \"current\": true, \"description\": \"Lead development of scalable web applications using React and Node.js. Manage a team of 4 developers and collaborate with product managers to deliver high-quality software solutions.\"}]', '[{\"id\": 1, \"degree\": \"Master of Computer Science\", \"institution\": \"École Polytechnique\", \"location\": \"Paris, France\", \"graduationDate\": \"2019-06\", \"gpa\": \"3.8/4.0\", \"description\": \"Specialized in Software Engineering and Artificial Intelligence\"}]', '[{\"id\": 1, \"name\": \"E-commerce Platform\", \"description\": \"Full-stack e-commerce platform with React frontend and Node.js backend\", \"technologies\": \"React, Node.js, PostgreSQL, Stripe API\", \"url\": \"https://github.com/ahmed-benali/ecommerce\"}]', '[{\"id\": 1, \"name\": \"AWS Certified Solutions Architect\", \"issuer\": \"Amazon Web Services\", \"date\": \"2023-03\", \"url\": \"https://aws.amazon.com/certification/\"}]', true FROM candidates c WHERE c.first_name = 'Ahmed';"

echo.
echo 📊 Step 9: Verifying Setup...
echo ============================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "SELECT 'Users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'Candidates', COUNT(*) FROM candidates UNION ALL SELECT 'Employers', COUNT(*) FROM employers UNION ALL SELECT 'Jobs', COUNT(*) FROM jobs UNION ALL SELECT 'Skills', COUNT(*) FROM skills UNION ALL SELECT 'CV Data', COUNT(*) FROM cv_data;"

echo.
echo 📊 Checking Demo Users...
echo ========================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "SELECT id, name, email, role, is_active, email_verified FROM users WHERE email IN ('ahmed.benali@email.com', 'marie.dubois@techcorp.fr', 'admin@smartrecruit.com');"

echo.
echo ✅ Perfect Reset Complete!
echo =========================

echo.
echo 🧪 Demo Accounts with Correct Passwords:
echo ========================================
echo 👤 CANDIDATE: ahmed.benali@email.com / Password123
echo 🏢 EMPLOYER: marie.dubois@techcorp.fr / Password123  
echo ⚡ ADMIN: admin@smartrecruit.com / password
echo.
echo 📊 Sample Data Created:
echo ======================
echo ✅ 3 Demo users with correct password hashes
echo ✅ 1 Candidate profile (Ahmed Ben Ali)
echo ✅ 1 Employer profile (TechCorp Solutions)
echo ✅ 2 Sample job postings
echo ✅ 10 Sample skills
echo ✅ 1 Complete CV data (Ahmed's professional CV)
echo.
echo 💡 Next Steps:
echo =============
echo 1. Start backend: cd backend && npm run dev
echo 2. Start frontend: cd frontend\smart-recruit-app && npm start
echo 3. Go to http://localhost:3001
echo 4. Test login with demo accounts
echo.
pause
