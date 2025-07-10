const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { body, validationResult } = require('express-validator')
const { authenticateToken } = require('../middleware/auth')

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

      // Format applications for frontend
      applications = applications.map(app => ({
        id: app.id,
        candidateName: app.candidate?.user?.name || 'Unknown',
        email: app.candidate?.user?.email || 'Unknown',
        jobTitle: app.job.title,
        appliedDate: app.appliedAt.toISOString().split('T')[0],
        status: app.status,
        matchScore: app.matchScore || 0,
        coverLetter: app.coverLetter,
        cvSnapshot: app.cvSnapshot,
        matchAnalysis: app.matchAnalysis,
        matchStrengths: app.matchStrengths,
        matchGaps: app.matchGaps,
        matchCalculatedAt: app.matchCalculatedAt
      }))
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
          candidateId: candidate.id
        },
        orderBy: {
          appliedAt: 'desc'
        }
      })
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

// Create new application (for candidates)
router.post('/', [
  authenticateToken,
  body('jobId').isInt().withMessage('Job ID is required'),
  body('coverLetter').isLength({ min: 10, max: 2000 }).withMessage('Cover letter must be between 10 and 2000 characters'),
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
    const { jobId, coverLetter, cvSnapshot, matchScore, matchAnalysis, matchStrengths, matchGaps } = req.body

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

    // Create application with match score
    const application = await prisma.application.create({
      data: {
        jobId: parseInt(jobId),
        candidateId: candidate.id,
        coverLetter: coverLetter,
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

module.exports = router
