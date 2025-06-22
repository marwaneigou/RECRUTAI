-- Smart Recruitment Platform - PostgreSQL Schema
-- Compatible with Prisma ORM
-- Created: 2025-06-20

-- Drop existing schema and recreate
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO smart_admin;
GRANT ALL ON SCHEMA public TO public;

-- Create Prisma-compatible enum types
CREATE TYPE "Role" AS ENUM ('candidate', 'employer', 'admin');
CREATE TYPE "EmploymentType" AS ENUM ('full-time', 'part-time', 'contract', 'internship', 'freelance');
CREATE TYPE "ExperienceLevel" AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE "ProficiencyLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Users table (main authentication table)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role "Role" NOT NULL,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Employers table
CREATE TABLE employers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    company_size VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255),
    founded_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    location VARCHAR(255),
    experience_years INTEGER DEFAULT 0,
    current_position VARCHAR(255),
    current_company VARCHAR(255),
    salary_expectation DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    availability_date DATE,
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER REFERENCES employers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    location VARCHAR(255),
    employment_type "EmploymentType" NOT NULL,
    experience_level "ExperienceLevel" NOT NULL,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    remote_allowed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    application_deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    status "ApplicationStatus" DEFAULT 'pending',
    cover_letter TEXT,
    cv_url VARCHAR(255),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    notes TEXT,
    rating SMALLINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, candidate_id)
);

-- Skills table
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for authentication)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource, action)
);

-- Candidate Skills junction table
CREATE TABLE candidate_skills (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level "ProficiencyLevel" NOT NULL,
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_id, skill_id)
);

-- Job Skills junction table
CREATE TABLE job_skills (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    required_level "ProficiencyLevel" NOT NULL,
    is_required BOOLEAN DEFAULT true,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, skill_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_active ON jobs(is_active);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Main user authentication and profile table';
COMMENT ON TABLE employers IS 'Company profiles for employers';
COMMENT ON TABLE candidates IS 'Candidate profiles for job seekers';
COMMENT ON TABLE jobs IS 'Job postings created by employers';
COMMENT ON TABLE applications IS 'Job applications submitted by candidates';
COMMENT ON TABLE skills IS 'Master list of skills and technologies';
COMMENT ON TABLE sessions IS 'User authentication sessions';
COMMENT ON TABLE notifications IS 'User notifications and messages';
COMMENT ON TABLE permissions IS 'Role-based access control permissions';
COMMENT ON TABLE candidate_skills IS 'Skills associated with candidates';
COMMENT ON TABLE job_skills IS 'Skills required for jobs';
