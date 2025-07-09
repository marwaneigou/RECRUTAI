-- Add CV snapshot fields to applications table
-- This ensures that CV data is preserved at the time of application

ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_snapshot JSONB;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_pdf_url VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_cv_data JSONB;

-- Update existing applications with current CV data (if any)
UPDATE applications 
SET cv_snapshot = (
  SELECT json_build_object(
    'first_name', cv.first_name,
    'last_name', cv.last_name,
    'email', cv.email,
    'phone', cv.phone,
    'address', cv.address,
    'city', cv.city,
    'country', cv.country,
    'linkedin_url', cv.linkedin_url,
    'github_url', cv.github_url,
    'portfolio_url', cv.portfolio_url,
    'professional_summary', cv.professional_summary,
    'technical_skills', cv.technical_skills,
    'soft_skills', cv.soft_skills,
    'languages', cv.languages,
    'work_experience', cv.work_experience,
    'education', cv.education,
    'projects', cv.projects,
    'certifications', cv.certifications,
    'selected_template', cv.selected_template
  )
  FROM cv_data cv
  JOIN candidates c ON c.id = cv.candidate_id
  WHERE c.id = applications.candidate_id
)
WHERE cv_snapshot IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_applications_candidate_job ON applications(candidate_id, job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);

-- Add some sample applications for testing
INSERT INTO applications (job_id, candidate_id, status, cover_letter, applied_at, cv_snapshot)
SELECT 
  j.id as job_id,
  c.id as candidate_id,
  'pending' as status,
  'I am very interested in this position and believe my skills align well with your requirements.' as cover_letter,
  CURRENT_TIMESTAMP - INTERVAL '2 days' as applied_at,
  json_build_object(
    'first_name', cv.first_name,
    'last_name', cv.last_name,
    'email', cv.email,
    'phone', cv.phone,
    'professional_summary', cv.professional_summary,
    'technical_skills', cv.technical_skills,
    'work_experience', cv.work_experience,
    'education', cv.education,
    'selected_template', cv.selected_template
  ) as cv_snapshot
FROM jobs j
CROSS JOIN candidates c
JOIN cv_data cv ON cv.candidate_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM applications a 
  WHERE a.job_id = j.id AND a.candidate_id = c.id
)
LIMIT 2; -- Create 2 sample applications
