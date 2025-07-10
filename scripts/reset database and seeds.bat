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
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE users (id SERIAL PRIMARY KEY, uuid VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, \"passwordHash\" VARCHAR(255) NOT NULL, role \"Role\" NOT NULL, \"isActive\" BOOLEAN DEFAULT true, \"emailVerified\" BOOLEAN DEFAULT false, phone VARCHAR(255), \"avatarUrl\" VARCHAR(255), \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \"lastLogin\" TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE employers (id SERIAL PRIMARY KEY, \"userId\" INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE, \"companyName\" VARCHAR(255) NOT NULL, industry VARCHAR(255), \"companySize\" VARCHAR(255), website VARCHAR(255), description TEXT, \"logoUrl\" VARCHAR(255), address VARCHAR(255), city VARCHAR(255), country VARCHAR(255), \"foundedYear\" INTEGER, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE candidates (id SERIAL PRIMARY KEY, \"userId\" INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE, \"firstName\" VARCHAR(255) NOT NULL, \"lastName\" VARCHAR(255) NOT NULL, \"dateOfBirth\" DATE, location VARCHAR(255), \"experienceYears\" INTEGER DEFAULT 0, \"currentPosition\" VARCHAR(255), \"currentCompany\" VARCHAR(255), \"salaryExpectation\" DECIMAL(10,2), currency VARCHAR(10) DEFAULT 'USD', \"availabilityDate\" DATE, \"linkedinUrl\" VARCHAR(255), \"githubUrl\" VARCHAR(255), \"portfolioUrl\" VARCHAR(255), \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE jobs (id SERIAL PRIMARY KEY, \"employerId\" INTEGER REFERENCES employers(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, requirements TEXT, responsibilities TEXT, location VARCHAR(255), \"employmentType\" \"EmploymentType\" NOT NULL, \"experienceLevel\" \"ExperienceLevel\" NOT NULL, \"salaryMin\" DECIMAL(10,2), \"salaryMax\" DECIMAL(10,2), currency VARCHAR(10) DEFAULT 'USD', \"remoteAllowed\" BOOLEAN DEFAULT false, \"isActive\" BOOLEAN DEFAULT true, \"applicationDeadline\" TIMESTAMP, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE applications (id SERIAL PRIMARY KEY, \"jobId\" INTEGER REFERENCES jobs(id) ON DELETE CASCADE, \"candidateId\" INTEGER REFERENCES candidates(id) ON DELETE CASCADE, status \"ApplicationStatus\" DEFAULT 'pending', \"coverLetter\" TEXT, \"cvUrl\" VARCHAR(255), \"appliedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \"reviewedAt\" TIMESTAMP, notes TEXT, rating SMALLINT, \"cvSnapshot\" JSONB, \"matchScore\" INTEGER, \"matchAnalysis\" TEXT, \"matchStrengths\" JSONB, \"matchGaps\" JSONB, \"matchCalculatedAt\" TIMESTAMP, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(\"jobId\", \"candidateId\"));"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE skills (id SERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL, category VARCHAR(255), description TEXT, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE sessions (id SERIAL PRIMARY KEY, \"userId\" INTEGER REFERENCES users(id) ON DELETE CASCADE, \"sessionToken\" VARCHAR(255) UNIQUE NOT NULL, \"expiresAt\" TIMESTAMP NOT NULL, \"ipAddress\" VARCHAR(45), \"userAgent\" TEXT, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE notifications (id SERIAL PRIMARY KEY, \"userId\" INTEGER REFERENCES users(id) ON DELETE CASCADE, type VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, \"isRead\" BOOLEAN DEFAULT false, data JSONB, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE permissions (id SERIAL PRIMARY KEY, role VARCHAR(255) NOT NULL, resource VARCHAR(255) NOT NULL, action VARCHAR(255) NOT NULL, allowed BOOLEAN DEFAULT true, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(role, resource, action));"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE candidate_skills (id SERIAL PRIMARY KEY, \"candidateId\" INTEGER REFERENCES candidates(id) ON DELETE CASCADE, \"skillId\" INTEGER REFERENCES skills(id) ON DELETE CASCADE, \"proficiencyLevel\" \"ProficiencyLevel\" NOT NULL, \"yearsExperience\" INTEGER DEFAULT 0, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(\"candidateId\", \"skillId\"));"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE job_skills (id SERIAL PRIMARY KEY, \"jobId\" INTEGER REFERENCES jobs(id) ON DELETE CASCADE, \"skillId\" INTEGER REFERENCES skills(id) ON DELETE CASCADE, \"requiredLevel\" \"ProficiencyLevel\" NOT NULL, \"isRequired\" BOOLEAN DEFAULT true, weight DECIMAL(3,2) DEFAULT 1.0, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(\"jobId\", \"skillId\"));"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "CREATE TABLE cv_data (id SERIAL PRIMARY KEY, \"candidateId\" INTEGER UNIQUE REFERENCES candidates(id) ON DELETE CASCADE, \"selectedTemplate\" VARCHAR(255) DEFAULT 'modern', \"firstName\" VARCHAR(255), \"lastName\" VARCHAR(255), email VARCHAR(255), phone VARCHAR(255), address VARCHAR(255), city VARCHAR(255), country VARCHAR(255), \"linkedinUrl\" VARCHAR(255), \"githubUrl\" VARCHAR(255), \"portfolioUrl\" VARCHAR(255), \"professionalSummary\" TEXT, \"technicalSkills\" TEXT, \"softSkills\" TEXT, languages TEXT, \"workExperience\" JSONB, education JSONB, projects JSONB, certifications JSONB, \"isComplete\" BOOLEAN DEFAULT false, \"lastGenerated\" TIMESTAMP, \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

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

REM Password123 = $2b$12$UvM5ZlWeuh84LqmZlpp1AOhWvhig295/fGEFKc0fuuUgHSInnsIiS
REM password = $2b$12$eD3YdxJUZGw3b9WEYcpV6.BxU8CyW4AbZDuQJl9FyZUSp9/v2zShy

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO users (uuid, name, email, \"passwordHash\", role, phone, \"isActive\", \"emailVerified\") VALUES ('demo-candidate-001', 'Ahmed Ben Ali', 'ahmed.benali@email.com', '$2b$12$UvM5ZlWeuh84LqmZlpp1AOhWvhig295/fGEFKc0fuuUgHSInnsIiS', 'candidate', '+33123456789', true, true);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO users (uuid, name, email, \"passwordHash\", role, phone, \"isActive\", \"emailVerified\") VALUES ('demo-employer-001', 'Marie Dubois', 'marie.dubois@techcorp.fr', '$2b$12$UvM5ZlWeuh84LqmZlpp1AOhWvhig295/fGEFKc0fuuUgHSInnsIiS', 'employer', '+33987654321', true, true);"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO users (uuid, name, email, \"passwordHash\", role, phone, \"isActive\", \"emailVerified\") VALUES ('demo-admin-001', 'System Administrator', 'admin@smartrecruit.com', '$2b$12$eD3YdxJUZGw3b9WEYcpV6.BxU8CyW4AbZDuQJl9FyZUSp9/v2zShy', 'admin', '+33555000111', true, true);"

echo.
echo 🌱 Step 7: Creating Profiles and Sample Data...
echo ==============================================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO candidates (\"userId\", \"firstName\", \"lastName\", location, \"experienceYears\", \"currentPosition\", \"currentCompany\", \"salaryExpectation\", currency, \"linkedinUrl\", \"githubUrl\", \"portfolioUrl\") SELECT u.id, 'Ahmed', 'Ben Ali', 'Paris, France', 5, 'Full Stack Developer', 'Tech Solutions Inc.', 55000.00, 'EUR', 'https://linkedin.com/in/ahmed-benali', 'https://github.com/ahmed-benali', 'https://ahmed-portfolio.dev' FROM users u WHERE u.email = 'ahmed.benali@email.com';"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO employers (\"userId\", \"companyName\", industry, \"companySize\", website, description, address, city, country, \"foundedYear\") SELECT u.id, 'TechCorp Solutions', 'Technology', '50-200', 'https://techcorp-solutions.fr', 'Leading technology solutions provider in France', '123 Tech Street', 'Paris', 'France', 2015 FROM users u WHERE u.email = 'marie.dubois@techcorp.fr';"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO skills (name, category, description) VALUES ('JavaScript', 'Programming', 'JavaScript programming language'), ('React', 'Frontend', 'React.js library for building user interfaces'), ('Node.js', 'Backend', 'JavaScript runtime for server-side development'), ('Python', 'Programming', 'Python programming language'), ('PostgreSQL', 'Database', 'Relational database management system'), ('MongoDB', 'Database', 'NoSQL document database'), ('Docker', 'DevOps', 'Containerization platform'), ('AWS', 'Cloud', 'Amazon Web Services cloud platform'), ('Git', 'Tools', 'Version control system'), ('TypeScript', 'Programming', 'Typed superset of JavaScript');"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO jobs (\"employerId\", title, description, requirements, responsibilities, location, \"employmentType\", \"experienceLevel\", \"salaryMin\", \"salaryMax\", currency, \"remoteAllowed\", \"isActive\") SELECT e.id, 'Senior Full Stack Developer', 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will work on cutting-edge projects using modern technologies.', '5+ years of experience with JavaScript, React, Node.js, and databases. Strong problem-solving skills and experience with agile methodologies.', 'Develop and maintain web applications, collaborate with cross-functional teams, mentor junior developers, participate in code reviews.', 'Paris, France', 'full-time', 'senior', 50000.00, 70000.00, 'EUR', true, true FROM employers e WHERE e.\"companyName\" = 'TechCorp Solutions';"

docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO jobs (\"employerId\", title, description, requirements, responsibilities, location, \"employmentType\", \"experienceLevel\", \"salaryMin\", \"salaryMax\", currency, \"remoteAllowed\", \"isActive\") SELECT e.id, 'Frontend React Developer', 'Join our frontend team to build amazing user interfaces with React and modern JavaScript.', '3+ years of React experience, knowledge of TypeScript, CSS, and modern frontend tools.', 'Build responsive web applications, optimize performance, work with designers and backend developers.', 'Paris, France', 'full-time', 'mid', 40000.00, 55000.00, 'EUR', true, true FROM employers e WHERE e.\"companyName\" = 'TechCorp Solutions';"

echo.
echo 🎨 Step 8: Creating CV Data...
echo =============================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "INSERT INTO cv_data (\"candidateId\", \"selectedTemplate\", \"firstName\", \"lastName\", email, phone, city, country, \"linkedinUrl\", \"githubUrl\", \"professionalSummary\", \"technicalSkills\", \"softSkills\", languages, \"workExperience\", education, projects, certifications, \"isComplete\") SELECT c.id, 'modern', 'Ahmed', 'Ben Ali', 'ahmed.benali@email.com', '+33123456789', 'Paris', 'France', 'https://linkedin.com/in/ahmed-benali', 'https://github.com/ahmed-benali', 'Experienced Full Stack Developer with 5+ years of expertise in React, Node.js, and cloud technologies. Passionate about creating scalable web applications and leading development teams.', 'JavaScript, React.js, Node.js, Python, PostgreSQL, MongoDB, AWS, Docker, Git', 'Leadership, Problem Solving, Team Collaboration, Agile Methodologies, Communication', 'French (Native), English (Fluent), Arabic (Conversational)', '[{\"id\": 1, \"jobTitle\": \"Senior Full Stack Developer\", \"company\": \"Tech Solutions Inc.\", \"location\": \"Paris, France\", \"startDate\": \"2022-01\", \"endDate\": \"\", \"current\": true, \"description\": \"Lead development of scalable web applications using React and Node.js. Manage a team of 4 developers and collaborate with product managers to deliver high-quality software solutions.\"}]', '[{\"id\": 1, \"degree\": \"Master of Computer Science\", \"institution\": \"École Polytechnique\", \"location\": \"Paris, France\", \"graduationDate\": \"2019-06\", \"gpa\": \"3.8/4.0\", \"description\": \"Specialized in Software Engineering and Artificial Intelligence\"}]', '[{\"id\": 1, \"name\": \"E-commerce Platform\", \"description\": \"Full-stack e-commerce platform with React frontend and Node.js backend\", \"technologies\": \"React, Node.js, PostgreSQL, Stripe API\", \"url\": \"https://github.com/ahmed-benali/ecommerce\"}]', '[{\"id\": 1, \"name\": \"AWS Certified Solutions Architect\", \"issuer\": \"Amazon Web Services\", \"date\": \"2023-03\", \"url\": \"https://aws.amazon.com/certification/\"}]', true FROM candidates c WHERE c.\"firstName\" = 'Ahmed';"

echo.
echo 📊 Step 9: Verifying Setup...
echo ============================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "SELECT 'Users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'Candidates', COUNT(*) FROM candidates UNION ALL SELECT 'Employers', COUNT(*) FROM employers UNION ALL SELECT 'Jobs', COUNT(*) FROM jobs UNION ALL SELECT 'Skills', COUNT(*) FROM skills UNION ALL SELECT 'CV Data', COUNT(*) FROM cv_data;"

echo.
echo 📊 Checking Demo Users...
echo ========================
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "SELECT id, name, email, role, \"isActive\", \"emailVerified\" FROM users WHERE email IN ('ahmed.benali@email.com', 'marie.dubois@techcorp.fr', 'admin@smartrecruit.com');"

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
