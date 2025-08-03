# 🔄 CV Data & Cover Letter Migration Guide: PostgreSQL → MongoDB

## Step 1: Navigate to Backend Directory
```bash
cd backend
```

## Step 2: Run Prisma Migration
```bash
npx prisma migrate dev --name remove_cover_letter_add_reference
```

## Step 3: Generate Prisma Client
```bash
npx prisma generate
```

## Step 4: Manual Database Update (if migration fails)
If the Prisma migration doesn't work, run these SQL commands manually in your PostgreSQL database:

```sql
-- Run the complete CV data migration
\i database/migrations/migrate_cv_data_to_mongodb.sql
```

Or run these commands individually:
```sql
-- Remove CV-related columns and add MongoDB references
ALTER TABLE applications DROP COLUMN IF EXISTS cover_letter;
ALTER TABLE applications DROP COLUMN IF EXISTS cv_snapshot;
ALTER TABLE applications DROP COLUMN IF EXISTS cv_url;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter_id VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_snapshot_id VARCHAR(255);

-- Add CV data reference to candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_data_id VARCHAR(255);

-- Drop cv_data table (data moved to MongoDB)
DROP TABLE IF EXISTS cv_data CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_applications_cover_letter_id ON applications(cover_letter_id);
CREATE INDEX IF NOT EXISTS idx_applications_cv_snapshot_id ON applications(cv_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_candidates_cv_data_id ON candidates(cv_data_id);
```

## Step 5: Restart Backend Server
```bash
npm run dev
```

## Step 6: Test the Application
1. Go to: `http://localhost:3001/candidate/jobs`
2. Apply to a job with a cover letter
3. Check that the application is submitted successfully

## Step 7: Verify Data Storage

### PostgreSQL (Application Record):
```sql
SELECT id, job_id, candidate_id, cover_letter_id, cv_snapshot_id, status, applied_at
FROM applications
ORDER BY id DESC
LIMIT 5;

-- Check candidates with CV data references
SELECT id, first_name, last_name, cv_data_id
FROM candidates
WHERE cv_data_id IS NOT NULL
LIMIT 5;
```

### MongoDB (Document Content):
```javascript
// In MongoDB shell or MongoDB Compass

// Check cover letters
db.cover_letters.find().pretty()

// Check CV data
db.cv_data.find().pretty()

// Check CV snapshots
db.cv_snapshots.find().pretty()
```

## 🎯 Expected Results:
- ✅ Applications table has `cover_letter_id` and `cv_snapshot_id` instead of `cover_letter` and `cv_snapshot`
- ✅ Candidates table has `cv_data_id` reference to MongoDB
- ✅ CV data is stored in MongoDB `cv_data` collection
- ✅ Cover letters are stored in MongoDB `cover_letters` collection
- ✅ CV snapshots are stored in MongoDB `cv_snapshots` collection
- ✅ Application submission works from frontend
- ✅ CV builder works with MongoDB storage
- ✅ Cover letters and CV data are displayed correctly

## 🚨 Troubleshooting:

### If Prisma migration fails:
1. Run the SQL commands manually (Step 4)
2. Update your database schema manually
3. Run `npx prisma db pull` to sync Prisma with database

### If MongoDB connection fails:
1. Check if MongoDB container is running: `docker ps`
2. Start MongoDB: `docker start smart_recruit_mongo`
3. Check connection in backend logs

### If applications don't show cover letters:
1. Check browser network tab for API errors
2. Check backend logs for MongoDB connection issues
3. Verify cover letters exist in MongoDB: `db.cover_letters.count()`

## 📋 Files Changed:
- ✅ `backend/prisma/schema.prisma` - Updated Application and Candidate models
- ✅ `backend/src/routes/applications.js` - Added MongoDB integration for cover letters and CV snapshots
- ✅ `backend/src/routes/cv.js` - Updated to use MongoDB for CV data storage
- ✅ `backend/src/config/database.js` - Added MongoDB service functions for CV data, snapshots, and cover letters
- ✅ `database/mongodb/schema.js` - Added cv_data and cv_snapshots collections
- ✅ `database/migrations/migrate_cv_data_to_mongodb.sql` - Migration script
- ✅ `frontend/src/components/candidates/JobApplicationModal.js` - Updated API call
- ✅ `frontend/src/services/api.js` - Updated application submission endpoint
