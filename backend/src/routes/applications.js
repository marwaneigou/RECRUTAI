const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { body, validationResult } = require('express-validator')
const { authenticateToken, authorizeRoles } = require('../middleware/auth')
const { mongoService } = require('../config/database')

const router = express.Router()
const prisma = new PrismaClient()

// Get all applications (for employers) or user's applications (for candidates)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user
    let applications = []

    if (role === 'employer') {
      // Get applications for employer's jobs
      const employer = await prisma.employer.findUnique({
        where: { userId: userId }
      })

      if (!employer) {
        return res.status(404).json({
          success: false,
          error: { message: 'Employer profile not found' }
        })
      }

      applications = await prisma.application.findMany({
        include: {
          candidate: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          job: {
            include: {
              employer: {
                select: { id: true, companyName: true }
              }
            }
          }
        },
        where: {
          job: {
            employerId: employer.id
          }
        },
        orderBy: {
          appliedAt: 'desc'
        }
      })

      // Format applications for frontend and fetch MongoDB data
      const applicationsWithMongoData = await Promise.all(
        applications.map(async (app) => {
          let coverLetter = null
          let cvSnapshot = null
          let cvData = null

          // Fetch cover letter from MongoDB
          if (app.coverLetterId) {
            try {
              const coverLetterDoc = await mongoService.getCoverLetterById(app.coverLetterId)
              coverLetter = coverLetterDoc
            } catch (error) {
              console.error('Error fetching cover letter:', error)
            }
          }

          // Fetch CV snapshot from MongoDB
          if (app.cvSnapshotId) {
            try {
              const cvSnapshotDoc = await mongoService.getCvSnapshotById(app.cvSnapshotId)
              cvSnapshot = cvSnapshotDoc
            } catch (error) {
              console.error('Error fetching CV snapshot:', error)
            }
          }

          // Fetch candidate's current CV data from MongoDB
          if (app.candidate?.cvDataId) {
            try {
              const cvDataDoc = await mongoService.getCvDataById(app.candidate.cvDataId)
              cvData = cvDataDoc
            } catch (error) {
              console.error('Error fetching CV data:', error)
            }
          } else {
            // Fallback: try to get CV data by candidate ID
            try {
              const cvDataDoc = await mongoService.getCvData(app.candidateId)
              cvData = cvDataDoc
            } catch (error) {
              console.error('Error fetching CV data by candidate ID:', error)
            }
          }

          return {
            id: app.id,
            candidateId: app.candidateId,
            candidateName: app.candidate?.user?.name || 'Unknown',
            email: app.candidate?.user?.email || 'Unknown',
            jobTitle: app.job.title,
            appliedDate: app.appliedAt.toISOString().split('T')[0],
            status: app.status,
            matchScore: app.matchScore || 0,
            coverLetter: coverLetter,
            cvSnapshot: cvSnapshot,
            cvData: cvData,
            matchAnalysis: app.matchAnalysis,
            matchStrengths: app.matchStrengths,
            matchGaps: app.matchGaps,
            matchCalculatedAt: app.matchCalculatedAt,
            notes: app.notes,
            rating: app.rating
          }
        })
      )

      applications = applicationsWithMongoData
    } else if (role === 'candidate') {
      // Get candidate's applications
      const candidate = await prisma.candidate.findUnique({
        where: { userId: userId }
      })

      if (!candidate) {
        return res.status(404).json({
          success: false,
          error: { message: 'Candidate profile not found' }
        })
      }

      const rawApplications = await prisma.application.findMany({
        include: {
          candidate: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          job: {
            include: {
              employer: {
                select: { id: true, companyName: true }
              }
            }
          }
        },
        where: {
          candidateId: candidate.id
        },
        orderBy: {
          appliedAt: 'desc'
        }
      })

      // Format applications for frontend and fetch MongoDB data
      const applicationsWithMongoData = await Promise.all(
        rawApplications.map(async (app) => {
          let coverLetter = null
          let cvSnapshot = null

          // Fetch cover letter from MongoDB
          if (app.coverLetterId) {
            try {
              const coverLetterDoc = await mongoService.getCoverLetterById(app.coverLetterId)
              coverLetter = coverLetterDoc
            } catch (error) {
              console.error('Error fetching cover letter:', error)
            }
          }

          // Fetch CV snapshot from MongoDB
          if (app.cvSnapshotId) {
            try {
              const cvSnapshotDoc = await mongoService.getCvSnapshotById(app.cvSnapshotId)
              cvSnapshot = cvSnapshotDoc
            } catch (error) {
              console.error('Error fetching CV snapshot:', error)
            }
          }

          return {
            id: app.id,
            jobId: app.jobId,
            candidateId: app.candidateId,
            jobTitle: app.job.title,
            companyName: app.job.employer.companyName,
            location: app.job.location,
            employmentType: app.job.employmentType,
            salaryRange: app.job.salaryMin && app.job.salaryMax ?
              `${app.job.salaryMin}-${app.job.salaryMax} ${app.job.currency}` : null,
            appliedDate: app.appliedAt.toISOString().split('T')[0],
            status: app.status,
            matchScore: app.matchScore || 0,
            coverLetter: coverLetter,
            cvSnapshot: cvSnapshot,
            matchAnalysis: app.matchAnalysis,
            matchStrengths: app.matchStrengths,
            matchGaps: app.matchGaps,
            matchCalculatedAt: app.matchCalculatedAt,
            notes: app.notes,
            rating: app.rating,
            reviewedAt: app.reviewedAt,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
          }
        })
      )

      applications = applicationsWithMongoData
    }

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: 1,
          limit: 50,
          total: applications.length,
          pages: 1
        }
      }
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch applications' }
    })
  }
})

// Create new application (for candidates) - DEPRECATED: Use /submit instead
router.post('/', [
  authenticateToken,
  body('jobId').isInt().withMessage('Job ID is required'),
  body('cvSnapshot').optional().isObject().withMessage('CV snapshot must be an object'),
  body('matchScore').optional().isInt({ min: 0, max: 100 }).withMessage('Match score must be between 0 and 100'),
  body('matchAnalysis').optional().isString().withMessage('Match analysis must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      })
    }

    const { role, id: userId } = req.user
    const { jobId, cvSnapshot, matchScore, matchAnalysis, matchStrengths, matchGaps } = req.body

    // Validate required fields
    if (!matchScore || matchScore < 0 || matchScore > 100) {
      return res.status(400).json({
        success: false,
        error: { message: 'Match score is required and must be between 0 and 100' }
      })
    }

    // Only candidates can apply to jobs
    if (role !== 'candidate') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only candidates can apply to jobs' }
      })
    }

    // Get candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId: userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Candidate profile not found' }
      })
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId) }
    })

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found' }
      })
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId: parseInt(jobId),
          candidateId: candidate.id
        }
      }
    })

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: { message: 'You have already applied to this job' }
      })
    }

    // Create application with match score (no cover letter - use /submit endpoint instead)
    const application = await prisma.application.create({
      data: {
        jobId: parseInt(jobId),
        candidateId: candidate.id,
        cvSnapshot: cvSnapshot || {},
        matchScore: matchScore || null,
        matchAnalysis: matchAnalysis || null,
        matchStrengths: matchStrengths || null,
        matchGaps: matchGaps || null,
        matchCalculatedAt: matchScore ? new Date() : null,
        status: 'pending',
        appliedAt: new Date()
      },
      include: {
        job: {
          include: {
            employer: {
              select: { companyName: true }
            }
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: { application },
      message: 'Application submitted successfully'
    })
  } catch (error) {
    console.error('Error creating application:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit application' }
    })
  }
})

// Submit job application with cover letter and CV snapshot stored in MongoDB
router.post('/submit', authenticateToken, [
  body('jobId').isInt().withMessage('Valid job ID is required'),
  body('coverLetter').optional().isString().withMessage('Cover letter must be a string'),
  body('cvSnapshot').optional().isObject().withMessage('CV snapshot must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      })
    }

    const { jobId, coverLetter, cvSnapshot, matchScore: frontendMatchScore, matchAnalysis: frontendMatchAnalysis, matchStrengths, matchGaps } = req.body
    const userId = req.user.id

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Candidate profile not found' }
      })
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId) }
    })

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found' }
      })
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId: parseInt(jobId),
          candidateId: candidate.id
        }
      }
    })

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: { message: 'You have already applied to this job' }
      })
    }

    // Create application first
    const application = await prisma.application.create({
      data: {
        jobId: parseInt(jobId),
        candidateId: candidate.id,
        status: 'pending'
      }
    })

    // Save cover letter to MongoDB if provided
    let coverLetterId = null
    if (coverLetter && coverLetter.trim()) {
      try {
        const coverLetterDoc = await mongoService.saveCoverLetter(
          application.id,
          candidate.id,
          parseInt(jobId),
          {
            content: coverLetter,
            type: 'user_written'
          }
        )
        coverLetterId = coverLetterDoc.insertedId.toString()
      } catch (mongoError) {
        console.error('Error saving cover letter to MongoDB:', mongoError)
        // Continue without cover letter if MongoDB fails
      }
    }

    // Save CV snapshot to MongoDB if provided
    let cvSnapshotId = null
    if (cvSnapshot && Object.keys(cvSnapshot).length > 0) {
      try {
        const cvSnapshotDoc = await mongoService.saveCvSnapshot(
          application.id,
          candidate.id,
          parseInt(jobId),
          cvSnapshot,
          {} // customizations can be added later
        )
        cvSnapshotId = cvSnapshotDoc.insertedId.toString()
      } catch (mongoError) {
        console.error('Error saving CV snapshot to MongoDB:', mongoError)
        // Continue without CV snapshot if MongoDB fails
      }
    }

    // Use frontend match score if provided, otherwise calculate
    let matchScore = frontendMatchScore || 0
    let matchAnalysis = frontendMatchAnalysis || null

    // If no frontend match score provided, calculate based on CV data
    if (!frontendMatchScore && cvSnapshot && Object.keys(cvSnapshot).length > 0) {
      // Simple match score calculation based on CV data
      let score = 60 // Base score

      // Check technical skills
      if (cvSnapshot.technical_skills && cvSnapshot.technical_skills.length > 0) {
        score += 15
      }

      // Check work experience
      if (cvSnapshot.work_experience && cvSnapshot.work_experience.length > 0) {
        score += 15
      }

      // Check education
      if (cvSnapshot.education && cvSnapshot.education.length > 0) {
        score += 5
      }

      // Check professional summary
      if (cvSnapshot.professional_summary && cvSnapshot.professional_summary.length > 50) {
        score += 5
      }

      matchScore = Math.min(score, 100)
      matchAnalysis = `Match calculated based on CV content: ${cvSnapshot.technical_skills ? 'Technical skills, ' : ''}${cvSnapshot.work_experience?.length || 0} work experiences, ${cvSnapshot.education?.length || 0} education entries`

      // Add cover letter bonus
      if (coverLetter && coverLetter.trim().length > 50) {
        matchScore = Math.min(matchScore + 10, 100)
        matchAnalysis = matchAnalysis ? matchAnalysis + ', includes cover letter' : 'Includes cover letter'
      }
    }

    console.log('📊 Match Score Data:', {
      frontendMatchScore,
      calculatedMatchScore: matchScore,
      matchAnalysis,
      matchStrengths,
      matchGaps
    })

    // Update application with MongoDB references and match score
    const updateData = {
      coverLetterId,
      cvSnapshotId
    }

    if (matchScore > 0) {
      updateData.matchScore = matchScore
      updateData.matchAnalysis = matchAnalysis
      updateData.matchStrengths = matchStrengths
      updateData.matchGaps = matchGaps
      updateData.matchCalculatedAt = new Date()
    }

    await prisma.application.update({
      where: { id: application.id },
      data: updateData
    })

    res.json({
      success: true,
      data: {
        applicationId: application.id,
        jobId: parseInt(jobId),
        status: application.status,
        appliedAt: application.appliedAt,
        coverLetterId: coverLetterId,
        cvSnapshotId: cvSnapshotId,
        message: 'Application submitted successfully'
      }
    })

  } catch (error) {
    console.error('Error submitting application:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit application' }
    })
  }
})

// Get application details with cover letter
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id)
    const userId = req.user.id

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        OR: [
          { candidate: { userId } }, // Candidate can view their own applications
          { job: { employer: { userId } } } // Employer can view applications to their jobs
        ]
      },
      include: {
        candidate: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        job: {
          include: {
            employer: {
              select: { id: true, companyName: true }
            }
          }
        }
      }
    })

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { message: 'Application not found' }
      })
    }

    // Fetch cover letter and CV snapshot from MongoDB
    let coverLetter = null
    let cvSnapshot = null

    if (application.coverLetterId) {
      try {
        const coverLetterDoc = await mongoService.getCoverLetterById(application.coverLetterId)
        coverLetter = coverLetterDoc
      } catch (error) {
        console.error('Error fetching cover letter:', error)
      }
    }

    if (application.cvSnapshotId) {
      try {
        const cvSnapshotDoc = await mongoService.getCvSnapshotById(application.cvSnapshotId)
        cvSnapshot = cvSnapshotDoc
      } catch (error) {
        console.error('Error fetching CV snapshot:', error)
      }
    }

    res.json({
      success: true,
      data: {
        application: {
          ...application,
          coverLetter: coverLetter,
          cvSnapshot: cvSnapshot
        }
      }
    })

  } catch (error) {
    console.error('Error fetching application:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch application' }
    })
  }
})

// Update application status (for employers)
router.put('/:id/status', authenticateToken, authorizeRoles(['employer']), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user.id

    console.log('🔍 Status update request:', { applicationId: id, newStatus: status, userId })

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid status value' }
      })
    }

    // First, find the employer record for this user
    const employer = await prisma.employer.findFirst({
      where: { userId: userId }
    })

    if (!employer) {
      console.log('❌ No employer record found for user:', userId)
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_EMPLOYER', message: 'User is not an employer' }
      })
    }

    // Check if application exists and belongs to employer's job
    const application = await prisma.application.findFirst({
      where: {
        id: parseInt(id),
        job: {
          employerId: employer.id
        }
      },
      include: {
        job: true,
        candidate: {
          include: {
            user: true
          }
        }
      }
    })

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' }
      })
    }

    // Update status
    const updatedApplication = await prisma.application.update({
      where: { id: parseInt(id) },
      data: {
        status,
        reviewedAt: status !== 'pending' ? new Date() : null,
        updatedAt: new Date()
      }
    })

    console.log(`📋 Application ${id} status updated to ${status} by employer ${employer.id}`)

    res.json({
      success: true,
      data: {
        applicationId: updatedApplication.id,
        status: updatedApplication.status,
        reviewedAt: updatedApplication.reviewedAt
      }
    })

  } catch (error) {
    console.error('Error updating application status:', error)
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_UPDATE_FAILED', message: 'Failed to update application status' }
    })
  }
})

module.exports = router
