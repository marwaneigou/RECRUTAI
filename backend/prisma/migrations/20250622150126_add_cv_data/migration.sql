-- CreateEnum
CREATE TYPE "Role" AS ENUM ('candidate', 'employer', 'admin');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full-time', 'part-time', 'contract', 'internship', 'freelance');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_name" TEXT NOT NULL,
    "industry" TEXT,
    "company_size" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "founded_year" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "location" TEXT,
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "current_position" TEXT,
    "current_company" TEXT,
    "salary_expectation" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "availability_date" TIMESTAMP(3),
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "portfolio_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_data" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "selected_template" TEXT NOT NULL DEFAULT 'modern',
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "portfolio_url" TEXT,
    "professional_summary" TEXT,
    "technical_skills" TEXT,
    "soft_skills" TEXT,
    "languages" TEXT,
    "work_experience" JSONB,
    "education" JSONB,
    "projects" JSONB,
    "certifications" JSONB,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "last_generated" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "employer_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "responsibilities" TEXT,
    "location" TEXT,
    "employment_type" "EmploymentType" NOT NULL,
    "experience_level" "ExperienceLevel" NOT NULL,
    "salary_min" DECIMAL(10,2),
    "salary_max" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "remote_allowed" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "application_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "cover_letter" TEXT,
    "cv_url" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "rating" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_skills" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "proficiency_level" "ProficiencyLevel" NOT NULL,
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skills" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "required_level" "ProficiencyLevel" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employers_user_id_key" ON "employers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_user_id_key" ON "candidates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cv_data_candidate_id_key" ON "cv_data"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_id_candidate_id_key" ON "applications"("job_id", "candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_role_resource_action_key" ON "permissions"("role", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_skills_candidate_id_skill_id_key" ON "candidate_skills"("candidate_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_skills_job_id_skill_id_key" ON "job_skills"("job_id", "skill_id");

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_data" ADD CONSTRAINT "cv_data_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
