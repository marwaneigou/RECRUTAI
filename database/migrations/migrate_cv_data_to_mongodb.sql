-- Migration: Move CV data and CV snapshots from PostgreSQL to MongoDB
-- This migration removes cv_data table and cv_snapshot from applications

-- Step 1: Create backup of existing CV data (optional)
CREATE TABLE IF NOT EXISTS cv_data_backup AS 
SELECT * FROM cv_data;

-- Step 2: Create backup of existing CV snapshots from applications (optional)
CREATE TABLE IF NOT EXISTS cv_snapshots_backup AS 
SELECT 
    id as application_id,
    candidate_id,
    job_id,
    cv_snapshot,
    applied_at,
    created_at
FROM applications 
WHERE cv_snapshot IS NOT NULL;

-- Step 3: Remove cv_snapshot column from applications table
ALTER TABLE applications DROP COLUMN IF EXISTS cv_snapshot;
ALTER TABLE applications DROP COLUMN IF EXISTS cv_url;

-- Step 4: Add MongoDB reference columns to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_snapshot_id VARCHAR(255);

-- Step 5: Add MongoDB reference column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_data_id VARCHAR(255);

-- Step 6: Drop the cv_data table (data will be moved to MongoDB)
DROP TABLE IF EXISTS cv_data CASCADE;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_cv_snapshot_id ON applications(cv_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_candidates_cv_data_id ON candidates(cv_data_id);

-- Step 8: Add comments for documentation
COMMENT ON COLUMN applications.cv_snapshot_id IS 'Reference to MongoDB cv_snapshots collection document ID';
COMMENT ON COLUMN candidates.cv_data_id IS 'Reference to MongoDB cv_data collection document ID';

-- Step 9: Verify the changes
SELECT 'Applications table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Candidates table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'candidates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 10: Check if cv_data table was dropped
SELECT 'CV Data table status:' as info;
SELECT CASE 
    WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cv_data' AND table_schema = 'public'
    ) 
    THEN 'cv_data table still exists' 
    ELSE 'cv_data table successfully dropped' 
END as status;
