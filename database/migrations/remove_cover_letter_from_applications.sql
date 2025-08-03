-- Migration: Remove cover_letter from applications table
-- Move cover letter data to MongoDB for better document management

-- Step 1: Create backup of existing cover letters (optional)
CREATE TABLE IF NOT EXISTS cover_letter_backup AS 
SELECT 
    id as application_id,
    candidate_id,
    job_id,
    cover_letter,
    applied_at,
    created_at
FROM applications 
WHERE cover_letter IS NOT NULL AND cover_letter != '';

-- Step 2: Remove cover_letter column from applications table
ALTER TABLE applications DROP COLUMN IF EXISTS cover_letter;

-- Step 3: Add reference field for MongoDB cover letter document (optional)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter_id VARCHAR(255);

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_applications_cover_letter_id ON applications(cover_letter_id);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN applications.cover_letter_id IS 'Reference to MongoDB cover_letters collection document ID';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;
