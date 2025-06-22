# Smart Recruitment Platform - Database Schema Documentation

## 📊 Database Architecture Overview

The Smart Recruitment Platform uses a hybrid database architecture combining:
- **PostgreSQL**: Primary database for transactional data, user management, and core business logic
- **MongoDB**: Document database for AI features, file storage, and unstructured data
- **Redis**: In-memory cache for sessions, temporary data, and performance optimization

## 🗄️ PostgreSQL Schema (Primary Database)

### Connection Details
- **Host**: localhost (Docker container)
- **Port**: 5432
- **Database**: `smart_recruit`
- **User**: `smart_admin`
- **ORM**: Prisma 5.7.1

### 📋 Core Tables

#### 1. users - Main Authentication Table
```sql
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
```

**Purpose**: Central user authentication and basic profile information  
**Key Features**:
- UUID for external references
- Bcrypt password hashing
- Role-based access control
- Email verification support
- Activity tracking

**Relationships**:
- One-to-One with `candidates` or `employers`
- One-to-Many with `sessions`, `notifications`

#### 2. candidates - Job Seeker Profiles
```sql
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
```

**Purpose**: Detailed profiles for job seekers  
**Key Features**:
- Professional experience tracking
- Salary expectations with currency support
- Social media and portfolio links
- Availability information

**Relationships**:
- One-to-One with `users`
- One-to-Many with `applications`, `candidate_skills`

#### 3. employers - Company Profiles
```sql
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
```

**Purpose**: Company information and employer profiles  
**Key Features**:
- Company branding (logo, description)
- Location and contact information
- Industry classification
- Company size categorization

**Relationships**:
- One-to-One with `users`
- One-to-Many with `jobs`

#### 4. jobs - Job Postings
```sql
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
```

**Purpose**: Job postings created by employers  
**Key Features**:
- Comprehensive job descriptions
- Salary range with currency support
- Remote work options
- Application deadlines
- Active/inactive status

**Relationships**:
- Many-to-One with `employers`
- One-to-Many with `applications`, `job_skills`

#### 5. applications - Job Applications
```sql
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
```

**Purpose**: Track job applications and their status  
**Key Features**:
- Application workflow tracking
- Cover letter storage
- Resume/CV file references
- Employer notes and ratings
- Unique constraint prevents duplicate applications

**Relationships**:
- Many-to-One with `jobs`, `candidates`
- Unique constraint on (job_id, candidate_id)

#### 6. skills - Master Skills List
```sql
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Centralized skills and technologies database  
**Key Features**:
- Categorized skill organization
- Detailed descriptions
- Unique skill names

**Relationships**:
- One-to-Many with `candidate_skills`, `job_skills`

### 🔗 Junction Tables

#### candidate_skills - Candidate Skill Associations
```sql
CREATE TABLE candidate_skills (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level "ProficiencyLevel" NOT NULL,
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_id, skill_id)
);
```

**Purpose**: Link candidates to their skills with proficiency levels

#### job_skills - Job Skill Requirements
```sql
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
```

**Purpose**: Define skill requirements for job postings with importance weighting

### 🔧 System Tables

#### sessions - Authentication Sessions
```sql
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Manage user authentication sessions

#### notifications - User Notifications
```sql
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
```

**Purpose**: Store user notifications and messages

#### permissions - Role-Based Access Control
```sql
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource, action)
);
```

**Purpose**: Define role-based permissions for system resources

### 📊 Enum Types

#### Role
```sql
CREATE TYPE "Role" AS ENUM ('candidate', 'employer', 'admin');
```

#### EmploymentType
```sql
CREATE TYPE "EmploymentType" AS ENUM ('full-time', 'part-time', 'contract', 'internship', 'freelance');
```

#### ExperienceLevel
```sql
CREATE TYPE "ExperienceLevel" AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');
```

#### ApplicationStatus
```sql
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn');
```

#### ProficiencyLevel
```sql
CREATE TYPE "ProficiencyLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
```

### 🚀 Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Job searches
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_active ON jobs(is_active);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_employment_type ON jobs(employment_type);

-- Application queries
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Session management
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Skills and associations
CREATE INDEX idx_candidate_skills_candidate ON candidate_skills(candidate_id);
CREATE INDEX idx_job_skills_job ON job_skills(job_id);
```

## 🍃 MongoDB Schema (Document Database)

### Connection Details
- **Host**: localhost (Docker container)
- **Port**: 27017
- **Database**: `smart_recruit_docs`
- **Purpose**: AI features, document storage, unstructured data

### 📄 Collections

#### 1. resumes - Resume Documents and AI Analysis
```javascript
{
  candidateId: Number,           // Reference to PostgreSQL candidates.id
  fileName: String,              // Original filename
  fileUrl: String,               // Storage path/URL
  fileType: String,              // pdf, doc, docx, txt
  fileSize: Number,              // File size in bytes
  uploadedAt: Date,              // Upload timestamp
  extractedText: String,         // Extracted text content
  aiAnalysis: {
    skills: [{
      name: String,
      confidence: Number,        // 0-1 confidence score
      category: String
    }],
    experience: {
      totalYears: Number,
      positions: [{
        title: String,
        company: String,
        duration: String,
        description: String
      }]
    },
    education: [{
      degree: String,
      institution: String,
      year: String,
      field: String
    }],
    summary: String,             // AI-generated summary
    score: Number                // Overall quality score 0-100
  },
  isActive: Boolean
}
```

#### 2. cover_letters - Cover Letter Analysis
```javascript
{
  applicationId: Number,         // Reference to PostgreSQL applications.id
  candidateId: Number,           // Reference to PostgreSQL candidates.id
  jobId: Number,                 // Reference to PostgreSQL jobs.id
  content: String,               // Cover letter text
  createdAt: Date,
  aiAnalysis: {
    sentiment: String,           // positive, neutral, negative
    enthusiasm: Number,          // 0-1 enthusiasm score
    relevance: Number,           // 0-1 relevance to job
    keyPoints: [String],         // Important points identified
    suggestions: [String],       // Improvement suggestions
    score: Number                // Overall score 0-100
  }
}
```

#### 3. job_matches - AI Job Matching Results
```javascript
{
  candidateId: Number,           // Reference to PostgreSQL candidates.id
  jobId: Number,                 // Reference to PostgreSQL jobs.id
  matchScore: Number,            // Overall match percentage 0-100
  calculatedAt: Date,
  skillsMatch: {
    score: Number,
    matchedSkills: [{
      skillName: String,
      candidateLevel: String,
      requiredLevel: String,
      match: Boolean
    }],
    missingSkills: [String]
  },
  experienceMatch: {
    score: Number,
    candidateYears: Number,
    requiredLevel: String,
    match: Boolean
  },
  locationMatch: {
    score: Number,
    candidateLocation: String,
    jobLocation: String,
    remoteAllowed: Boolean
  },
  salaryMatch: {
    score: Number,
    candidateExpectation: Number,
    jobRange: {
      min: Number,
      max: Number
    }
  },
  recommendations: [String]      // AI recommendations for improvement
}
```

#### 4. ai_insights - General AI Analytics
```javascript
{
  type: String,                  // candidate_analysis, job_analysis, market_trends, hiring_insights
  entityId: Number,              // Related entity ID
  entityType: String,            // candidate, job, employer, global
  generatedAt: Date,
  data: Object,                  // Flexible insight data
  confidence: Number,            // 0-1 confidence level
  expiresAt: Date               // When to recalculate
}
```

#### 5. file_uploads - File Management
```javascript
{
  fileName: String,              // Stored filename
  originalName: String,          // Original filename
  fileUrl: String,               // Storage path/URL
  fileType: String,              // File extension
  fileSize: Number,              // Size in bytes
  mimeType: String,              // MIME type
  uploadedBy: Number,            // User ID who uploaded
  uploadedAt: Date,
  category: String,              // resume, cover_letter, portfolio, company_logo, other
  isPublic: Boolean,
  metadata: Object               // Additional file metadata
}
```

### 🚀 MongoDB Indexes

```javascript
// Resume lookups
db.resumes.createIndex({ "candidateId": 1 });
db.resumes.createIndex({ "uploadedAt": -1 });
db.resumes.createIndex({ "isActive": 1 });

// Cover letter queries
db.cover_letters.createIndex({ "applicationId": 1 });
db.cover_letters.createIndex({ "candidateId": 1 });
db.cover_letters.createIndex({ "jobId": 1 });

// Job matching
db.job_matches.createIndex({ "candidateId": 1, "jobId": 1 });
db.job_matches.createIndex({ "matchScore": -1 });
db.job_matches.createIndex({ "calculatedAt": -1 });

// AI insights
db.ai_insights.createIndex({ "type": 1, "entityId": 1 });
db.ai_insights.createIndex({ "generatedAt": -1 });
db.ai_insights.createIndex({ "expiresAt": 1 });

// File management
db.file_uploads.createIndex({ "uploadedBy": 1 });
db.file_uploads.createIndex({ "category": 1 });
```

## 🔄 Redis Schema (Cache Database)

### Connection Details
- **Host**: localhost (Docker container)
- **Port**: 6379
- **Purpose**: Session storage, caching, temporary data

### 🗂️ Key Patterns

#### Session Storage
```
session:{sessionToken} → {
  userId: Number,
  role: String,
  expiresAt: Date,
  ipAddress: String,
  userAgent: String
}
```

#### User Cache
```
user:{userId} → {
  id: Number,
  name: String,
  email: String,
  role: String,
  isActive: Boolean
}
```

#### Job Cache
```
job:{jobId} → {
  id: Number,
  title: String,
  employerId: Number,
  location: String,
  isActive: Boolean
}
```

## 🔗 Database Relationships

### Entity Relationship Diagram (ERD)

```
users (1) ←→ (1) candidates
users (1) ←→ (1) employers
users (1) ←→ (n) sessions
users (1) ←→ (n) notifications

employers (1) ←→ (n) jobs
candidates (1) ←→ (n) applications
jobs (1) ←→ (n) applications

candidates (n) ←→ (n) skills [via candidate_skills]
jobs (n) ←→ (n) skills [via job_skills]

applications (1) ←→ (1) cover_letters [MongoDB]
candidates (1) ←→ (n) resumes [MongoDB]
candidates + jobs ←→ job_matches [MongoDB]
```

## 📊 Data Flow

### Authentication Flow
1. User credentials → PostgreSQL users table
2. Session creation → Redis session storage
3. JWT token generation with user data

### Job Application Flow
1. Job posting → PostgreSQL jobs table
2. Application submission → PostgreSQL applications table
3. Cover letter → MongoDB cover_letters collection
4. Resume upload → MongoDB resumes collection
5. AI matching → MongoDB job_matches collection

### AI Analysis Flow
1. Document upload → MongoDB file_uploads
2. Text extraction → MongoDB resumes/cover_letters
3. AI processing → MongoDB ai_insights
4. Match calculation → MongoDB job_matches

## 🔒 Data Security

### PostgreSQL Security
- Row-level security policies
- Encrypted connections (SSL)
- Role-based database access
- Input validation via Prisma ORM

### MongoDB Security
- Collection-level validation schemas
- Encrypted connections
- Document-level access control
- File upload validation

### Redis Security
- Password authentication
- Connection encryption
- Session token expiration
- IP-based access control

## 📈 Scalability Considerations

### PostgreSQL Optimization
- Connection pooling (9 connections)
- Query optimization with indexes
- Partitioning for large tables
- Read replicas for scaling

### MongoDB Optimization
- Sharding for large collections
- Compound indexes for complex queries
- GridFS for large file storage
- Aggregation pipeline optimization

### Redis Optimization
- Memory optimization
- Key expiration policies
- Clustering for high availability
- Persistence configuration

## 🧪 Sample Data

### Demo Users
- 5 users across all roles (candidate, employer, admin)
- Complete profile information
- Realistic professional data

### Demo Jobs
- 4 job postings with varying requirements
- Different experience levels and employment types
- Comprehensive job descriptions

### Demo Skills
- 15 technical skills across categories
- Programming languages, frameworks, tools
- Associated with candidates and jobs

### Demo Applications
- Sample applications linking candidates to jobs
- Various application statuses
- Cover letters and notes

This database schema provides a robust foundation for the Smart Recruitment Platform, supporting both current authentication features and future AI-powered recruitment capabilities.
```
