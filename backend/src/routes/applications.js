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
      const employer = await prisma.employers.findUnique({
        where: { user_id: userId }
      })

      if (!employer) {
        return res.status(404).json({
          success: false,
          error: { message: 'Employer profile not found' }
        })
      }

      applications = await prisma.applications.findMany({
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
                select: { id: true, company_name: true }
              }
            }
          }
        },
        where: {
          job: {
            employer_id: employer.id
          }
        },
        orderBy: {
          applied_at: 'desc'
        }
      })

      // Format applications for frontend
      applications = applications.map(app => ({
        id: app.id,
        candidateName: app.candidate.user.name,
        email: app.candidate.user.email,
        jobTitle: app.job.title,
        appliedDate: app.applied_at.toISOString().split('T')[0],
        status: app.status,
        matchScore: app.match_score || 0,
        coverLetter: app.cover_letter,
        cvSnapshot: app.cv_snapshot,
        matchAnalysis: app.match_analysis
      }))
    } else if (role === 'candidate') {
      // Get candidate's applications
      const candidate = await prisma.candidates.findUnique({
        where: { user_id: userId }
      })

      if (!candidate) {
        return res.status(404).json({
          success: false,
          error: { message: 'Candidate profile not found' }
        })
      }

      applications = await prisma.applications.findMany({
        include: {
          job: {
            include: {
              employer: {
                select: { id: true, company_name: true }
              }
            }
          }
        },
        where: {
          candidate_id: candidate.id
        },
        orderBy: {
          applied_at: 'desc'
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
    const { jobId, coverLetter, cvSnapshot, matchScore, matchAnalysis } = req.body

    if (role !== 'candidate') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only candidates can apply to jobs' }
      })
    }

    // Get candidate profile
    const candidate = await prisma.candidates.findUnique({
      where: { user_id: userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Candidate profile not found' }
      })
    }

    // Check if job exists
    const job = await prisma.jobs.findUnique({
      where: { id: parseInt(jobId) }
    })

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found' }
      })
    }

    // Check if already applied
    const existingApplication = await prisma.applications.findUnique({
      where: {
        job_id_candidate_id: {
          job_id: parseInt(jobId),
          candidate_id: candidate.id
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
    const application = await prisma.applications.create({
      data: {
        job_id: parseInt(jobId),
        candidate_id: candidate.id,
        cover_letter: coverLetter,
        cv_snapshot: cvSnapshot || {},
        match_score: matchScore || null,
        match_analysis: matchAnalysis || null,
        status: 'pending',
        applied_at: new Date()
      },
      include: {
        job: {
          include: {
            employer: {
              select: { company_name: true }
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
