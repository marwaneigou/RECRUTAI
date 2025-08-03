// Smart Recruitment Platform - MongoDB Schema
// Used for document storage, AI analysis, and file management

// Database: smart_recruit_docs

// Collection: resumes
// Stores candidate resume documents and AI analysis
db.createCollection("resumes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["candidateId", "fileName", "fileUrl", "uploadedAt"],
      properties: {
        candidateId: {
          bsonType: "int",
          description: "Reference to PostgreSQL candidates.id"
        },
        fileName: {
          bsonType: "string",
          description: "Original filename of the resume"
        },
        fileUrl: {
          bsonType: "string",
          description: "URL or path to the stored resume file"
        },
        fileType: {
          bsonType: "string",
          enum: ["pdf", "doc", "docx", "txt"],
          description: "Type of the resume file"
        },
        fileSize: {
          bsonType: "int",
          description: "File size in bytes"
        },
        uploadedAt: {
          bsonType: "date",
          description: "When the resume was uploaded"
        },
        extractedText: {
          bsonType: "string",
          description: "Text content extracted from the resume"
        },
        aiAnalysis: {
          bsonType: "object",
          properties: {
            skills: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  name: { bsonType: "string" },
                  confidence: { bsonType: "double" },
                  category: { bsonType: "string" }
                }
              }
            },
            experience: {
              bsonType: "object",
              properties: {
                totalYears: { bsonType: "int" },
                positions: {
                  bsonType: "array",
                  items: {
                    bsonType: "object",
                    properties: {
                      title: { bsonType: "string" },
                      company: { bsonType: "string" },
                      duration: { bsonType: "string" },
                      description: { bsonType: "string" }
                    }
                  }
                }
              }
            },
            education: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  degree: { bsonType: "string" },
                  institution: { bsonType: "string" },
                  year: { bsonType: "string" },
                  field: { bsonType: "string" }
                }
              }
            },
            summary: {
              bsonType: "string",
              description: "AI-generated summary of the candidate"
            },
            score: {
              bsonType: "double",
              minimum: 0,
              maximum: 100,
              description: "Overall resume quality score"
            }
          }
        },
        isActive: {
          bsonType: "bool",
          description: "Whether this resume is currently active"
        }
      }
    }
  }
});

// Collection: cv_data
// Stores candidate CV/resume data (moved from PostgreSQL cv_data table)
db.createCollection("cv_data", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["candidateId", "createdAt"],
      properties: {
        candidateId: {
          bsonType: "int",
          description: "Reference to PostgreSQL candidates.id"
        },
        selectedTemplate: {
          bsonType: "string",
          description: "CV template selected by candidate"
        },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        email: { bsonType: "string" },
        phone: { bsonType: "string" },
        address: { bsonType: "string" },
        city: { bsonType: "string" },
        country: { bsonType: "string" },
        linkedinUrl: { bsonType: "string" },
        githubUrl: { bsonType: "string" },
        portfolioUrl: { bsonType: "string" },
        professionalSummary: { bsonType: "string" },
        technicalSkills: { bsonType: "string" },
        softSkills: { bsonType: "string" },
        languages: { bsonType: "string" },
        workExperience: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              id: { bsonType: "int" },
              jobTitle: { bsonType: "string" },
              company: { bsonType: "string" },
              location: { bsonType: "string" },
              startDate: { bsonType: "string" },
              endDate: { bsonType: "string" },
              current: { bsonType: "bool" },
              description: { bsonType: "string" }
            }
          }
        },
        education: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              id: { bsonType: "int" },
              degree: { bsonType: "string" },
              institution: { bsonType: "string" },
              location: { bsonType: "string" },
              graduationDate: { bsonType: "string" },
              gpa: { bsonType: "string" },
              description: { bsonType: "string" }
            }
          }
        },
        projects: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              id: { bsonType: "int" },
              name: { bsonType: "string" },
              description: { bsonType: "string" },
              technologies: { bsonType: "string" },
              url: { bsonType: "string" },
              startDate: { bsonType: "string" },
              endDate: { bsonType: "string" }
            }
          }
        },
        certifications: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              id: { bsonType: "int" },
              name: { bsonType: "string" },
              issuer: { bsonType: "string" },
              date: { bsonType: "string" },
              url: { bsonType: "string" }
            }
          }
        },
        isComplete: {
          bsonType: "bool",
          description: "Whether the CV is complete and ready for use"
        },
        lastGenerated: {
          bsonType: "date",
          description: "When the CV was last generated"
        },
        createdAt: {
          bsonType: "date",
          description: "When the CV data was created"
        },
        updatedAt: {
          bsonType: "date",
          description: "When the CV data was last updated"
        }
      }
    }
  }
});

// Collection: cv_snapshots
// Stores CV snapshots for job applications (moved from PostgreSQL applications.cv_snapshot)
db.createCollection("cv_snapshots", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["applicationId", "candidateId", "jobId", "cvData", "createdAt"],
      properties: {
        applicationId: {
          bsonType: "int",
          description: "Reference to PostgreSQL applications.id"
        },
        candidateId: {
          bsonType: "int",
          description: "Reference to PostgreSQL candidates.id"
        },
        jobId: {
          bsonType: "int",
          description: "Reference to PostgreSQL jobs.id"
        },
        cvData: {
          bsonType: "object",
          description: "Complete CV data snapshot at time of application"
        },
        customizations: {
          bsonType: "object",
          description: "Job-specific CV customizations",
          properties: {
            highlightedSkills: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            customSummary: { bsonType: "string" },
            reorderedSections: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            emphasizedProjects: {
              bsonType: "array",
              items: { bsonType: "int" }
            }
          }
        },
        createdAt: {
          bsonType: "date",
          description: "When the CV snapshot was created"
        }
      }
    }
  }
});

// Collection: cover_letters
// Stores cover letters and AI analysis (moved from PostgreSQL applications table)
db.createCollection("cover_letters", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["applicationId", "candidateId", "jobId", "content", "createdAt"],
      properties: {
        applicationId: {
          bsonType: "int",
          description: "Reference to PostgreSQL applications.id"
        },
        candidateId: {
          bsonType: "int",
          description: "Reference to PostgreSQL candidates.id"
        },
        jobId: {
          bsonType: "int",
          description: "Reference to PostgreSQL jobs.id"
        },
        content: {
          bsonType: "string",
          description: "Cover letter content"
        },
        type: {
          bsonType: "string",
          enum: ["user_written", "ai_generated", "template_based"],
          description: "How the cover letter was created"
        },
        template: {
          bsonType: "string",
          description: "Template used if applicable"
        },
        createdAt: {
          bsonType: "date",
          description: "When the cover letter was created"
        },
        updatedAt: {
          bsonType: "date",
          description: "When the cover letter was last updated"
        },
        aiAnalysis: {
          bsonType: "object",
          properties: {
            sentiment: {
              bsonType: "string",
              enum: ["positive", "neutral", "negative"]
            },
            enthusiasm: {
              bsonType: "double",
              minimum: 0,
              maximum: 1
            },
            relevance: {
              bsonType: "double",
              minimum: 0,
              maximum: 1
            },
            keyPoints: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            suggestions: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            score: {
              bsonType: "double",
              minimum: 0,
              maximum: 100
            }
          }
        }
      }
    }
  }
});

// Collection: job_matches
// Stores AI-powered job matching results
db.createCollection("job_matches", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["candidateId", "jobId", "calculatedAt"],
      properties: {
        candidateId: {
          bsonType: "int",
          description: "Reference to PostgreSQL candidates.id"
        },
        jobId: {
          bsonType: "int",
          description: "Reference to PostgreSQL jobs.id"
        },
        matchScore: {
          bsonType: "double",
          minimum: 0,
          maximum: 100,
          description: "Overall match percentage"
        },
        calculatedAt: {
          bsonType: "date",
          description: "When the match was calculated"
        },
        skillsMatch: {
          bsonType: "object",
          properties: {
            score: { bsonType: "double" },
            matchedSkills: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  skillName: { bsonType: "string" },
                  candidateLevel: { bsonType: "string" },
                  requiredLevel: { bsonType: "string" },
                  match: { bsonType: "bool" }
                }
              }
            },
            missingSkills: {
              bsonType: "array",
              items: { bsonType: "string" }
            }
          }
        },
        experienceMatch: {
          bsonType: "object",
          properties: {
            score: { bsonType: "double" },
            candidateYears: { bsonType: "int" },
            requiredLevel: { bsonType: "string" },
            match: { bsonType: "bool" }
          }
        },
        locationMatch: {
          bsonType: "object",
          properties: {
            score: { bsonType: "double" },
            candidateLocation: { bsonType: "string" },
            jobLocation: { bsonType: "string" },
            remoteAllowed: { bsonType: "bool" }
          }
        },
        salaryMatch: {
          bsonType: "object",
          properties: {
            score: { bsonType: "double" },
            candidateExpectation: { bsonType: "double" },
            jobRange: {
              bsonType: "object",
              properties: {
                min: { bsonType: "double" },
                max: { bsonType: "double" }
              }
            }
          }
        },
        recommendations: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "AI recommendations for improving the match"
        }
      }
    }
  }
});

// Collection: ai_insights
// Stores various AI-generated insights and analytics
db.createCollection("ai_insights", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["type", "entityId", "generatedAt"],
      properties: {
        type: {
          bsonType: "string",
          enum: ["candidate_analysis", "job_analysis", "market_trends", "hiring_insights"],
          description: "Type of AI insight"
        },
        entityId: {
          bsonType: "int",
          description: "ID of the related entity (candidate, job, employer)"
        },
        entityType: {
          bsonType: "string",
          enum: ["candidate", "job", "employer", "global"],
          description: "Type of the related entity"
        },
        generatedAt: {
          bsonType: "date",
          description: "When the insight was generated"
        },
        data: {
          bsonType: "object",
          description: "Flexible object containing the insight data"
        },
        confidence: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
          description: "Confidence level of the AI insight"
        },
        expiresAt: {
          bsonType: "date",
          description: "When this insight expires and should be recalculated"
        }
      }
    }
  }
});

// Collection: file_uploads
// Stores metadata for all uploaded files
db.createCollection("file_uploads", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["fileName", "fileUrl", "uploadedBy", "uploadedAt"],
      properties: {
        fileName: { bsonType: "string" },
        originalName: { bsonType: "string" },
        fileUrl: { bsonType: "string" },
        fileType: { bsonType: "string" },
        fileSize: { bsonType: "int" },
        mimeType: { bsonType: "string" },
        uploadedBy: {
          bsonType: "int",
          description: "User ID who uploaded the file"
        },
        uploadedAt: { bsonType: "date" },
        category: {
          bsonType: "string",
          enum: ["resume", "cover_letter", "portfolio", "company_logo", "other"]
        },
        isPublic: { bsonType: "bool" },
        metadata: {
          bsonType: "object",
          description: "Additional file metadata"
        }
      }
    }
  }
});

// Create indexes for better performance
db.resumes.createIndex({ "candidateId": 1 });
db.resumes.createIndex({ "uploadedAt": -1 });
db.resumes.createIndex({ "isActive": 1 });

db.cover_letters.createIndex({ "applicationId": 1 });
db.cover_letters.createIndex({ "candidateId": 1 });
db.cover_letters.createIndex({ "jobId": 1 });
db.cover_letters.createIndex({ "createdAt": -1 });

db.job_matches.createIndex({ "candidateId": 1, "jobId": 1 });
db.job_matches.createIndex({ "matchScore": -1 });
db.job_matches.createIndex({ "calculatedAt": -1 });

db.ai_insights.createIndex({ "type": 1, "entityId": 1 });
db.ai_insights.createIndex({ "generatedAt": -1 });
db.ai_insights.createIndex({ "expiresAt": 1 });

db.file_uploads.createIndex({ "uploadedBy": 1 });
db.file_uploads.createIndex({ "uploadedAt": -1 });
db.file_uploads.createIndex({ "category": 1 });

// Sample data for testing
db.resumes.insertOne({
  candidateId: 1,
  fileName: "ahmed_benali_resume.pdf",
  fileUrl: "/uploads/resumes/ahmed_benali_resume.pdf",
  fileType: "pdf",
  fileSize: 245760,
  uploadedAt: new Date(),
  extractedText: "Ahmed Ben Ali - Full Stack Developer...",
  aiAnalysis: {
    skills: [
      { name: "JavaScript", confidence: 0.95, category: "Programming" },
      { name: "React", confidence: 0.90, category: "Frontend" },
      { name: "Node.js", confidence: 0.85, category: "Backend" }
    ],
    experience: {
      totalYears: 5,
      positions: [
        {
          title: "Full Stack Developer",
          company: "Tech Solutions Inc.",
          duration: "2020-2025",
          description: "Developed web applications using React and Node.js"
        }
      ]
    },
    education: [
      {
        degree: "Master's in Computer Science",
        institution: "University of Paris",
        year: "2019",
        field: "Computer Science"
      }
    ],
    summary: "Experienced full stack developer with strong skills in modern web technologies",
    score: 85.5
  },
  isActive: true
});

console.log("MongoDB schema and sample data created successfully!");
