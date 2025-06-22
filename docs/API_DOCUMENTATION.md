# Smart Recruitment Platform - API Documentation

## 🌐 API Overview

**Base URL**: `http://localhost:3000/api`  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json`  
**API Version**: 1.0.0  

## 🔐 Authentication

### Authentication Flow
1. Register or login to receive JWT token
2. Include token in Authorization header: `Bearer <token>`
3. Token expires after 24 hours
4. Refresh token by logging in again

### Headers Required for Protected Routes
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 📋 API Endpoints

### 🔑 Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "role": "candidate",
  "phone": "+1234567890"
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format, unique
- `password`: Required, min 8 chars, must contain uppercase, lowercase, number, special character
- `role`: Required, one of: "candidate", "employer", "admin"
- `phone`: Optional, valid phone format

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "candidate",
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2025-06-20T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "candidate",
      "isActive": true,
      "lastLogin": "2025-06-20T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/logout`
Logout user and invalidate session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET `/api/auth/me`
Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "candidate",
      "isActive": true,
      "emailVerified": false,
      "phone": "+1234567890",
      "avatarUrl": null,
      "createdAt": "2025-06-20T10:00:00.000Z",
      "lastLogin": "2025-06-20T10:00:00.000Z"
    }
  }
}
```

### 👥 Users (`/api/users`)

#### GET `/api/users`
List all users (Admin only).

**Headers:** `Authorization: Bearer <token>`  
**Required Role:** `admin`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `role`: Filter by role (candidate, employer, admin)
- `search`: Search by name or email

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "candidate",
        "isActive": true,
        "createdAt": "2025-06-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### GET `/api/users/:id`
Get user by ID.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** Own profile or admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "candidate",
      "isActive": true,
      "phone": "+1234567890",
      "createdAt": "2025-06-20T10:00:00.000Z"
    }
  }
}
```

#### PUT `/api/users/:id`
Update user profile.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** Own profile or admin

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Smith",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "avatarUrl": "https://example.com/avatar.jpg",
      "updatedAt": "2025-06-20T11:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/users/:id`
Delete user account.

**Headers:** `Authorization: Bearer <token>`  
**Required Role:** `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### 💼 Jobs (`/api/jobs`)

#### GET `/api/jobs`
List job postings with filtering and search.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search in title and description
- `location`: Filter by location
- `employmentType`: Filter by employment type
- `experienceLevel`: Filter by experience level
- `remoteAllowed`: Filter remote jobs (true/false)
- `salaryMin`: Minimum salary filter
- `salaryMax`: Maximum salary filter

**Response (200):**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 1,
        "title": "Senior Full Stack Developer",
        "description": "We are looking for an experienced developer...",
        "location": "Paris, France",
        "employmentType": "full-time",
        "experienceLevel": "senior",
        "salaryMin": 50000,
        "salaryMax": 70000,
        "currency": "EUR",
        "remoteAllowed": true,
        "isActive": true,
        "createdAt": "2025-06-20T10:00:00.000Z",
        "employer": {
          "id": 1,
          "companyName": "TechCorp Solutions",
          "logoUrl": "https://example.com/logo.png"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

#### POST `/api/jobs`
Create a new job posting.

**Headers:** `Authorization: Bearer <token>`  
**Required Role:** `employer`

**Request Body:**
```json
{
  "title": "Senior Full Stack Developer",
  "description": "We are looking for an experienced developer to join our team...",
  "requirements": "5+ years of experience with JavaScript, React, Node.js...",
  "responsibilities": "Develop and maintain web applications...",
  "location": "Paris, France",
  "employmentType": "full-time",
  "experienceLevel": "senior",
  "salaryMin": 50000,
  "salaryMax": 70000,
  "currency": "EUR",
  "remoteAllowed": true,
  "applicationDeadline": "2025-12-31T23:59:59.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "job": {
      "id": 1,
      "title": "Senior Full Stack Developer",
      "description": "We are looking for an experienced developer...",
      "employerId": 1,
      "location": "Paris, France",
      "employmentType": "full-time",
      "experienceLevel": "senior",
      "salaryMin": 50000,
      "salaryMax": 70000,
      "currency": "EUR",
      "remoteAllowed": true,
      "isActive": true,
      "createdAt": "2025-06-20T10:00:00.000Z"
    }
  }
}
```

#### GET `/api/jobs/:id`
Get job details by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "title": "Senior Full Stack Developer",
      "description": "We are looking for an experienced developer...",
      "requirements": "5+ years of experience...",
      "responsibilities": "Develop and maintain web applications...",
      "location": "Paris, France",
      "employmentType": "full-time",
      "experienceLevel": "senior",
      "salaryMin": 50000,
      "salaryMax": 70000,
      "currency": "EUR",
      "remoteAllowed": true,
      "isActive": true,
      "applicationDeadline": "2025-12-31T23:59:59.000Z",
      "createdAt": "2025-06-20T10:00:00.000Z",
      "employer": {
        "id": 1,
        "companyName": "TechCorp Solutions",
        "industry": "Technology",
        "website": "https://techcorp-solutions.fr",
        "logoUrl": "https://example.com/logo.png"
      },
      "skills": [
        {
          "id": 1,
          "name": "JavaScript",
          "requiredLevel": "advanced",
          "isRequired": true
        }
      ]
    }
  }
}
```

#### PUT `/api/jobs/:id`
Update job posting.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Job owner (employer) or admin

**Request Body:** Same as POST `/api/jobs`

**Response (200):**
```json
{
  "success": true,
  "message": "Job updated successfully",
  "data": {
    "job": {
      "id": 1,
      "title": "Senior Full Stack Developer",
      "updatedAt": "2025-06-20T11:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/jobs/:id`
Delete job posting.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Job owner (employer) or admin

**Response (200):**
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

### 📝 Applications (`/api/applications`)

#### GET `/api/applications`
List applications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `jobId`: Filter by job ID (employer view)
- `candidateId`: Filter by candidate ID (admin view)

**Permissions:**
- Candidates: See their own applications
- Employers: See applications for their jobs
- Admins: See all applications

**Response (200):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": 1,
        "status": "pending",
        "appliedAt": "2025-06-20T10:00:00.000Z",
        "coverLetter": "I am very interested in this position...",
        "cvUrl": "/uploads/cv/candidate_1_cv.pdf",
        "job": {
          "id": 1,
          "title": "Senior Full Stack Developer",
          "company": "TechCorp Solutions"
        },
        "candidate": {
          "id": 1,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### POST `/api/applications`
Submit job application.

**Headers:** `Authorization: Bearer <token>`
**Required Role:** `candidate`

**Request Body:**
```json
{
  "jobId": 1,
  "coverLetter": "I am very interested in this position because...",
  "cvUrl": "/uploads/cv/my_resume.pdf"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "id": 1,
      "jobId": 1,
      "candidateId": 1,
      "status": "pending",
      "coverLetter": "I am very interested...",
      "cvUrl": "/uploads/cv/my_resume.pdf",
      "appliedAt": "2025-06-20T10:00:00.000Z"
    }
  }
}
```

#### GET `/api/applications/:id`
Get application details.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Application owner, job owner, or admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": 1,
      "status": "pending",
      "coverLetter": "I am very interested in this position...",
      "cvUrl": "/uploads/cv/candidate_1_cv.pdf",
      "appliedAt": "2025-06-20T10:00:00.000Z",
      "reviewedAt": null,
      "notes": null,
      "rating": null,
      "job": {
        "id": 1,
        "title": "Senior Full Stack Developer",
        "employer": {
          "companyName": "TechCorp Solutions"
        }
      },
      "candidate": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "experienceYears": 5,
        "currentPosition": "Full Stack Developer"
      }
    }
  }
}
```

#### PUT `/api/applications/:id`
Update application status (employer/admin only).

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Job owner (employer) or admin

**Request Body:**
```json
{
  "status": "reviewed",
  "notes": "Good candidate, moving to next round",
  "rating": 4
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Application updated successfully",
  "data": {
    "application": {
      "id": 1,
      "status": "reviewed",
      "notes": "Good candidate, moving to next round",
      "rating": 4,
      "reviewedAt": "2025-06-20T11:00:00.000Z"
    }
  }
}
```

### 👤 Candidates (`/api/candidates`)

#### GET `/api/candidates`
List candidate profiles.

**Headers:** `Authorization: Bearer <token>`
**Required Role:** `employer` or `admin`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or skills
- `location`: Filter by location
- `experienceYears`: Minimum experience years
- `skills`: Filter by skill names (comma-separated)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "location": "Paris, France",
        "experienceYears": 5,
        "currentPosition": "Full Stack Developer",
        "currentCompany": "Tech Solutions Inc.",
        "skills": [
          {
            "name": "JavaScript",
            "proficiencyLevel": "advanced",
            "yearsExperience": 5
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "pages": 2
    }
  }
}
```

#### GET `/api/candidates/:id`
Get candidate profile details.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Own profile, employers, or admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "candidate": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15",
      "location": "Paris, France",
      "experienceYears": 5,
      "currentPosition": "Full Stack Developer",
      "currentCompany": "Tech Solutions Inc.",
      "salaryExpectation": 55000,
      "currency": "EUR",
      "availabilityDate": "2025-07-01",
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "githubUrl": "https://github.com/johndoe",
      "portfolioUrl": "https://johndoe.dev",
      "skills": [
        {
          "id": 1,
          "name": "JavaScript",
          "category": "Programming",
          "proficiencyLevel": "advanced",
          "yearsExperience": 5
        }
      ],
      "user": {
        "email": "john.doe@example.com",
        "phone": "+1234567890"
      }
    }
  }
}
```

#### PUT `/api/candidates/:id`
Update candidate profile.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Own profile or admin

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "location": "Lyon, France",
  "experienceYears": 6,
  "currentPosition": "Senior Full Stack Developer",
  "salaryExpectation": 60000,
  "availabilityDate": "2025-08-01",
  "linkedinUrl": "https://linkedin.com/in/johnsmith"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Candidate profile updated successfully",
  "data": {
    "candidate": {
      "id": 1,
      "firstName": "John",
      "lastName": "Smith",
      "experienceYears": 6,
      "updatedAt": "2025-06-20T11:00:00.000Z"
    }
  }
}
```

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common HTTP Status Codes

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data"
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email already exists"
  }
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 📊 Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## 🔧 Development Tools

### Health Check
```http
GET /health
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-20T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0"
}
```

### API Documentation
- **Swagger UI**: `http://localhost:3000/api-docs` (development only)
- **OpenAPI Spec**: Available when `ENABLE_SWAGGER=true`

## 📝 Notes

### Authentication
- JWT tokens expire after 24 hours
- Include `Bearer <token>` in Authorization header
- Tokens are stateless but sessions are tracked in Redis

### Validation
- All inputs are validated using Joi schemas
- Password requirements: min 8 chars, uppercase, lowercase, number, special char
- Email format validation and uniqueness checks

### Permissions
- Role-based access control (RBAC)
- Resource-level permissions
- Owner-based access for user-generated content

### File Uploads
- Supported formats: PDF, DOC, DOCX for resumes
- Maximum file size: 10MB
- Files stored with unique names
- Metadata tracked in MongoDB

This API provides a comprehensive foundation for the Smart Recruitment Platform with secure authentication, role-based access control, and full CRUD operations for all core entities.
```
