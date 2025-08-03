-- CreateEnum
CREATE TYPE "Role" AS ENUM ('candidate', 'employer', 'admin');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

/*
  Warnings:

  - You are about to drop the column `coverLetter` on the `applications` table. All the data in the column will be lost.

*/
-- Step 1: Backup existing cover letters to temporary table (optional)
CREATE TABLE IF NOT EXISTS temp_cover_letters AS 
SELECT 
    id as application_id,
    candidate_id,
    job_id,
    cover_letter,
    applied_at,
    created_at
FROM applications 
WHERE cover_letter IS NOT NULL AND cover_letter != '';

-- Step 2: AlterTable - Remove coverLetter column and add coverLetterId
ALTER TABLE "applications" DROP COLUMN "coverLetter";
ALTER TABLE "applications" ADD COLUMN "coverLetterId" TEXT;

-- Step 3: Create index for better performance
CREATE INDEX "idx_applications_cover_letter_id" ON "applications"("coverLetterId");

-- Step 4: Add comment for documentation
COMMENT ON COLUMN "applications"."coverLetterId" IS 'Reference to MongoDB cover_letters collection document ID';

-- Step 5: Display migration summary
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Removed coverLetter column from applications table';
    RAISE NOTICE '- Added coverLetterId column for MongoDB reference';
    RAISE NOTICE '- Created index on coverLetterId for performance';
    RAISE NOTICE '- Backed up existing cover letters to temp_cover_letters table';
END $$;
