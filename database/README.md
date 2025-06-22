# Smart Recruitment Platform - Database Documentation

## 📁 Database Structure

```
database/
├── postgresql/          # PostgreSQL schema and configuration
│   └── schema.sql      # Complete database schema with tables and indexes
├── mongodb/            # MongoDB schema and configuration  
│   └── schema.js       # Collections schema for AI features and documents
├── seeds/              # Demo data and test data
│   └── demo_data.sql   # Complete demo data with users, jobs, skills
├── scripts/            # Database utility scripts
│   └── setup_database.bat  # Complete database setup script
└── README.md           # This documentation file
```

## 🗄️ Database Architecture

### PostgreSQL (Primary Database)
- **Purpose**: Transactional data, user authentication, core business logic
- **Port**: 5432
- **Database**: `smart_recruit`
- **User**: `smart_admin`

### MongoDB (Document Database)  
- **Purpose**: Document storage, AI analysis, file metadata
- **Port**: 27017
- **Database**: `smart_recruit_docs`

## 📊 PostgreSQL Schema

### Core Tables

#### `users` - Main authentication table
- Primary key: `id`
- Unique fields: `email`, `uuid`
- Enum: `role` ("candidate", "employer", "admin")
- Includes: password_hash, profile info, timestamps

#### `candidates` - Job seeker profiles
- Foreign key: `user_id` → `users.id`
- Includes: personal info, experience, salary expectations, social links

#### `employers` - Company profiles
- Foreign key: `user_id` → `users.id`  
- Includes: company info, industry, size, description

#### `jobs` - Job postings
- Foreign key: `employer_id` → `employers.id`
- Enums: `employment_type`, `experience_level`
- Includes: description, requirements, salary range

#### `applications` - Job applications
- Foreign keys: `job_id` → `jobs.id`, `candidate_id` → `candidates.id`
- Enum: `status` (pending, reviewed, etc.)
- Unique constraint: (job_id, candidate_id)

#### `skills` - Master skills list
- Used for candidate skills and job requirements
- Categories: Programming, Frontend, Backend, Database, etc.

### Junction Tables
- `candidate_skills` - Links candidates to skills with proficiency levels
- `job_skills` - Links jobs to required skills with importance weights

### System Tables
- `sessions` - User authentication sessions
- `notifications` - User notifications
- `permissions` - Role-based access control

## 🍃 MongoDB Collections

### `resumes`
- Stores resume files and AI-extracted content
- AI analysis: skills detection, experience parsing, quality scoring

### `cover_letters`
- Cover letter content and AI sentiment analysis
- Relevance scoring and improvement suggestions

### `job_matches`
- AI-powered job matching results
- Detailed scoring: skills, experience, location, salary compatibility

### `ai_insights`
- Various AI-generated insights and analytics
- Market trends, hiring insights, candidate analysis

### `file_uploads`
- Metadata for all uploaded files
- File management and access control

## 🧪 Demo Data

### Demo Users (Password: `Password123` except admin)

| Email | Role | Password | Description |
|-------|------|----------|-------------|
| ahmed.benali@email.com | candidate | Password123 | Senior Full Stack Developer |
| sophie.martin@email.com | candidate | Password123 | Frontend Developer |
| marie.dubois@techcorp.fr | employer | Password123 | TechCorp Solutions |
| jean.dupont@innovtech.fr | employer | Password123 | InnovTech Startup |
| admin@smartrecruit.com | admin | password | System Administrator |

### Sample Data Included
- ✅ 5 Demo users with complete profiles
- ✅ 2 Employer companies with detailed info
- ✅ 4 Job postings across different roles
- ✅ 15 Skills with candidate associations
- ✅ Job-skill requirements mapping
- ✅ Role-based permissions
- ✅ MongoDB sample documents

## 🚀 Quick Setup

### Option 1: Use Perfect Reset Script
```bash
scripts\perfect-reset.bat
```

### Option 2: Use Database Setup Script
```bash
database\scripts\setup_database.bat
```

### Option 3: Manual Setup
```bash
# Setup PostgreSQL
docker cp database\postgresql\schema.sql smart_recruit_postgres:/tmp/
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -f /tmp/schema.sql

# Load demo data
docker cp database\seeds\demo_data.sql smart_recruit_postgres:/tmp/
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -f /tmp/demo_data.sql

# Setup MongoDB
docker cp database\mongodb\schema.js smart_recruit_mongodb:/tmp/
docker exec smart_recruit_mongodb mongosh smart_recruit_docs /tmp/schema.js
```

## 🔧 Database Management

### Backup PostgreSQL
```bash
docker exec smart_recruit_postgres pg_dump -U smart_admin smart_recruit > backup.sql
```

### Backup MongoDB
```bash
docker exec smart_recruit_mongodb mongodump --db smart_recruit_docs --out /tmp/backup
```

### Reset Database
```bash
scripts\perfect-reset.bat
```

## 📈 Performance Considerations

### PostgreSQL Indexes
- Email lookups: `idx_users_email`
- Role filtering: `idx_users_role`
- Job searches: `idx_jobs_employer`, `idx_jobs_active`
- Application queries: `idx_applications_job`, `idx_applications_candidate`

### MongoDB Indexes
- Resume lookups: `candidateId`, `uploadedAt`
- Job matches: `candidateId + jobId`, `matchScore`
- AI insights: `type + entityId`, `generatedAt`

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- Session-based authentication
- Role-based access control (RBAC)
- Input validation with database constraints
- Secure file upload handling

## 🧪 Testing

### Verify Setup
```bash
# Check PostgreSQL
docker exec smart_recruit_postgres psql -U smart_admin -d smart_recruit -c "\dt"

# Check MongoDB
docker exec smart_recruit_mongodb mongosh smart_recruit_docs --eval "db.getCollectionNames()"
```

### Test Authentication
- Try logging in with demo accounts
- Test registration with new accounts
- Verify role-based access

## 📝 Notes

- All timestamps are in UTC
- Enum values are lowercase with hyphens
- Foreign key constraints ensure data integrity
- Soft deletes not implemented (using hard deletes)
- File uploads stored in MongoDB with metadata
- AI features ready for future implementation
