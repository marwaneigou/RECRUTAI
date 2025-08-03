const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const { prisma, mongoService } = require('../config/database')
const { authenticateToken, authorizeRoles } = require('../middleware/auth')
const { logger } = require('../utils/logger')

const router = express.Router()

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

// Simple in-memory cache for job recommendations
const recommendationCache = new Map()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

// Helper function to get cache key
const getCacheKey = (candidateId, limit) => `recommendations_${candidateId}_${limit}`

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION
}

// Background job matching calculation
const calculateBackgroundMatches = async () => {
  try {
    logger.info('Starting background job matching calculation...')

    // Get all active candidates
    const candidates = await prisma.candidate.findMany({
      include: {
        candidateSkills: {
          include: { skill: true }
        }
      },
      take: 10 // Limit to prevent overload
    })

    // Get active jobs
    const activeJobs = await prisma.job.findMany({
      where: {
        isActive: true,
        OR: [
          { applicationDeadline: { gte: new Date() } }, // Jobs with future deadlines
          { applicationDeadline: null } // Jobs with no deadline set
        ]
      },
      include: {
        employer: {
          select: { companyName: true, logoUrl: true, industry: true }
        },
        jobSkills: {
          include: { skill: true }
        }
      },
      take: 20 // Limit jobs to prevent overload
    })

    let processedCount = 0

    for (const candidate of candidates) {
      try {
        // Check if we already have recent matches for this candidate
        const cacheKey = getCacheKey(candidate.id, 10)
        const cachedData = recommendationCache.get(cacheKey)

        if (isCacheValid(cachedData)) {
          continue // Skip if we have recent data
        }

        // Get candidate's CV analysis
        const cvAnalysis = await mongoService.getResumeAnalysis(candidate.id)

        // Prepare candidate profile
        const candidateProfile = {
          candidateId: candidate.id,
          skills: candidate.candidateSkills.map(cs => cs.skill.name),
          experience: candidate.experienceYears || 0,
          location: candidate.location,
          expectedSalary: candidate.expectedSalary,
          cvAnalysis: cvAnalysis?.aiAnalysis || null
        }

        // Calculate matches for top 5 jobs only (to save resources)
        const jobMatches = []

        for (const job of activeJobs.slice(0, 5)) {
          try {
            const jobData = {
              jobId: job.id,
              title: job.title,
              description: job.description,
              requirements: job.requirements,
              requiredSkills: job.jobSkills.map(js => js.skill.name),
              experienceLevel: job.experienceLevel,
              location: job.location,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              remoteAllowed: job.remoteAllowed,
              company: job.employer.companyName,
              industry: job.employer.industry
            }

            // Use a simpler matching algorithm for background processing
            const matchScore = calculateSimpleMatchScore(candidateProfile, jobData)

            jobMatches.push({
              jobId: job.id,
              title: job.title,
              company: job.employer.companyName,
              location: job.location,
              matchScore: Math.round(matchScore * 100),
              // Add other basic fields...
            })

            // Save to MongoDB
            await mongoService.saveJobMatch(candidate.id, job.id, {
              matchScore: matchScore * 100,
              calculatedAt: new Date(),
              backgroundCalculated: true
            })

          } catch (jobError) {
            logger.error(`Background matching error for job ${job.id}:`, jobError.message)
            continue
          }
        }

        processedCount++

        // Add a small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (candidateError) {
        logger.error(`Background matching error for candidate ${candidate.id}:`, candidateError.message)
        continue
      }
    }

    logger.info(`Background job matching completed. Processed ${processedCount} candidates.`)

  } catch (error) {
    logger.error('Background job matching failed:', error)
  }
}

// Simple matching algorithm for background processing
const calculateSimpleMatchScore = (candidateProfile, jobData) => {
  let score = 0.5 // Base score

  // Skills matching (40% weight)
  const candidateSkills = new Set((candidateProfile.skills || []).map(s => s.toLowerCase()))
  const jobSkills = new Set((jobData.requiredSkills || []).map(s => s.toLowerCase()))
  const matchedSkills = [...candidateSkills].filter(skill => jobSkills.has(skill))
  const missingSkills = [...jobSkills].filter(skill => !candidateSkills.has(skill))
  const skillsScore = jobSkills.size > 0 ? matchedSkills.length / jobSkills.size : 0.5
  score += skillsScore * 0.4

  // Experience matching (30% weight)
  const candidateExp = candidateProfile.experience || 0
  let expScore = 0.5
  if (jobData.experienceLevel === 'entry' && candidateExp >= 0) expScore = 1.0
  else if (jobData.experienceLevel === 'mid' && candidateExp >= 2) expScore = 1.0
  else if (jobData.experienceLevel === 'senior' && candidateExp >= 5) expScore = 1.0
  score += expScore * 0.3

  // Location matching (20% weight)
  let locationScore = 0.3 // Default for different locations
  if (jobData.remoteAllowed) locationScore = 1.0
  else if (candidateProfile.location && jobData.location &&
           candidateProfile.location.toLowerCase().includes(jobData.location.toLowerCase())) {
    locationScore = 1.0
  }
  score += locationScore * 0.2

  // Salary matching (10% weight)
  let salaryScore = 0.5
  if (candidateProfile.expectedSalary && jobData.salaryMin && jobData.salaryMax) {
    const expected = candidateProfile.expectedSalary
    if (expected >= jobData.salaryMin && expected <= jobData.salaryMax) {
      salaryScore = 1.0
    }
  }
  score += salaryScore * 0.1

  const overallScore = Math.min(score, 1.0) // Cap at 1.0

  // Return in the same format as AI service
  return {
    overallScore,
    skillsMatch: skillsScore,
    experienceMatch: expScore,
    locationMatch: locationScore,
    salaryMatch: salaryScore,
    matchedSkills: matchedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    missingSkills: missingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    reasoning: `Fallback algorithm match: ${Math.round(overallScore * 100)}% compatibility based on skills (${Math.round(skillsScore * 100)}%), experience (${Math.round(expScore * 100)}%), location (${Math.round(locationScore * 100)}%), and salary alignment.`,
    recommendations: missingSkills.length > 0 ? [`Consider developing skills in: ${missingSkills.slice(0, 3).join(', ')}`] : ['Great match! Consider applying.'],
    aiConfidence: 0.7 // Lower confidence for fallback algorithm
  }
}

// Schedule background matching every 2 hours
setInterval(calculateBackgroundMatches, 2 * 60 * 60 * 1000)

// Test endpoint to verify AI features routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'AI features routes are working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /job-recommendations',
      'GET /job-matches',
      'POST /track-recommendation-interaction',
      'POST /recommendation-feedback',
      'POST /generate-cover-letter'
    ]
  })
})

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'))
    }
  }
})

// Upload and analyze resume
router.post('/upload-resume', authenticateToken, authorizeRoles(['candidate']), upload.single('resume'), async (req, res) => {
  try {
    const userId = req.user.id
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No resume file uploaded' }
      })
    }

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Prepare resume data
    const resumeData = {
      fileName: file.originalname,
      fileUrl: `/uploads/resumes/${file.filename}`,
      fileType: path.extname(file.originalname).toLowerCase().substring(1),
      fileSize: file.size
    }

    // Call AI analysis service
    try {
      const analysisResponse = await axios.post('http://localhost:5002/api/analyze/cv', {
        cvText: `Resume file: ${file.originalname}`, // In real implementation, extract text from file
        candidateId: candidate.id
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      })

      const aiAnalysis = analysisResponse.data

      // Save to MongoDB
      const mongoResult = await mongoService.saveResumeAnalysis(candidate.id, resumeData, aiAnalysis)

      res.json({
        success: true,
        data: {
          resumeId: mongoResult.insertedId,
          fileName: file.originalname,
          fileSize: file.size,
          aiAnalysis: aiAnalysis,
          message: 'Resume uploaded and analyzed successfully'
        }
      })

    } catch (aiError) {
      logger.error('AI analysis failed:', aiError)
      
      // Save without AI analysis
      const mongoResult = await mongoService.saveResumeAnalysis(candidate.id, resumeData, {
        error: 'AI analysis unavailable',
        fallback: true
      })

      res.json({
        success: true,
        data: {
          resumeId: mongoResult.insertedId,
          fileName: file.originalname,
          fileSize: file.size,
          message: 'Resume uploaded successfully (AI analysis unavailable)'
        }
      })
    }

  } catch (error) {
    logger.error('Resume upload error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload resume' }
    })
  }
})

// Get candidate's resume analysis
router.get('/resume-analysis', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id

    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    const resumeAnalysis = await mongoService.getResumeAnalysis(candidate.id)

    if (!resumeAnalysis) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_RESUME', message: 'No resume found for this candidate' }
      })
    }

    res.json({
      success: true,
      data: {
        resume: resumeAnalysis
      }
    })

  } catch (error) {
    logger.error('Get resume analysis error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch resume analysis' }
    })
  }
})

// Get job matches for candidate
router.get('/job-matches', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 10 } = req.query

    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    const jobMatches = await mongoService.getJobMatches(candidate.id, parseInt(limit))

    // Get job details from PostgreSQL
    const jobIds = jobMatches.map(match => match.jobId)
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      include: {
        employer: {
          select: { companyName: true, logoUrl: true }
        }
      }
    })

    // Combine match data with job details
    const enrichedMatches = jobMatches.map(match => {
      const job = jobs.find(j => j.id === match.jobId)
      return {
        ...match,
        job: job || null
      }
    })

    res.json({
      success: true,
      data: {
        matches: enrichedMatches,
        total: jobMatches.length
      }
    })

  } catch (error) {
    logger.error('Get job matches error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch job matches' }
    })
  }
})

// Get AI-powered job recommendations for candidate
router.get('/job-recommendations', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 10, refresh = false } = req.query

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      include: {
        candidateSkills: {
          include: { skill: true }
        }
      }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Check cache first (unless refresh is requested)
    const cacheKey = getCacheKey(candidate.id, limit)
    const cachedRecommendations = recommendationCache.get(cacheKey)

    if (!refresh && isCacheValid(cachedRecommendations)) {
      logger.info(`Returning cached job recommendations for candidate ${candidate.id}`)
      return res.json({
        success: true,
        data: {
          ...cachedRecommendations.data,
          cached: true,
          cacheAge: Math.round((Date.now() - cachedRecommendations.timestamp) / 1000) // seconds
        }
      })
    }

    // Get candidate's CV data from the CV builder
    let cvData = null
    try {
      const cvResponse = await axios.get(`${BACKEND_URL}/api/candidates/cv-data`, {
        headers: { 'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}` }
      })
      if (cvResponse.data.success) {
        cvData = cvResponse.data.cvData
        logger.info(`Retrieved CV data for candidate ${candidate.id}`)
      }
    } catch (cvError) {
      logger.warn(`Could not retrieve CV data for candidate ${candidate.id}:`, cvError.message)
    }

    // Get candidate's CV analysis from MongoDB (fallback)
    const cvAnalysis = await mongoService.getResumeAnalysis(candidate.id)

    // Get active jobs from database
    const activeJobs = await prisma.job.findMany({
      where: {
        isActive: true,
        OR: [
          { applicationDeadline: { gte: new Date() } }, // Jobs with future deadlines
          { applicationDeadline: null } // Jobs with no deadline set
        ]
      },
      include: {
        employer: {
          select: { companyName: true, logoUrl: true, industry: true }
        },
        jobSkills: {
          include: { skill: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Get more jobs to have better matching pool
    })

    if (activeJobs.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          total: 0,
          message: 'No active jobs available for matching'
        }
      })
    }

    // Prepare candidate profile for AI matching using CV data
    let candidateSkills = []
    let candidateExperience = candidate.experienceYears || 0
    let candidateLocation = candidate.location
    let professionalSummary = ''
    let workExperience = []

    if (cvData) {
      // Use rich CV data
      candidateSkills = cvData.skills?.map(skill => skill.name) || []
      candidateLocation = cvData.personalInfo?.address || candidate.location
      professionalSummary = cvData.professionalSummary || ''
      workExperience = cvData.experience || []

      // Calculate experience from work history if not set
      if (candidateExperience === 0 && workExperience.length > 0) {
        const totalMonths = workExperience.reduce((total, exp) => {
          const startDate = new Date(exp.startDate + '-01')
          const endDate = exp.current ? new Date() : new Date(exp.endDate + '-01')
          const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                        (endDate.getMonth() - startDate.getMonth())
          return total + Math.max(0, months)
        }, 0)
        candidateExperience = Math.round(totalMonths / 12)
      }
    } else {
      // Fallback to candidate profile skills
      candidateSkills = candidate.candidateSkills.map(cs => cs.skill.name)
    }

    const candidateProfile = {
      candidateId: candidate.id,
      skills: candidateSkills,
      experience: candidateExperience,
      location: candidateLocation,
      expectedSalary: candidate.expectedSalary,
      professionalSummary,
      workExperience,
      cvAnalysis: cvAnalysis?.aiAnalysis || null
    }

    // Calculate match scores for each job using AI service
    const jobRecommendations = []

    for (const job of activeJobs) {
      try {
        // Prepare job data for AI matching
        let jobSkills = job.jobSkills.map(js => js.skill.name)

        // If no explicit job skills, try to extract from requirements text
        if (jobSkills.length === 0 && job.requirements) {
          const commonSkills = [
            'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'HTML', 'CSS',
            'Angular', 'Vue.js', 'PHP', 'C#', 'C++', 'Go', 'Ruby', 'Swift', 'Kotlin',
            'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
            'AWS', 'Azure', 'GCP', 'Git', 'Jenkins', 'Terraform', 'Linux'
          ]

          const requirementsText = job.requirements.toLowerCase()
          jobSkills = commonSkills.filter(skill =>
            requirementsText.includes(skill.toLowerCase())
          )
        }

        const jobData = {
          jobId: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          requiredSkills: jobSkills,
          experienceLevel: job.experienceLevel,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          remoteAllowed: job.remoteAllowed,
          company: job.employer.companyName,
          industry: job.employer.industry
        }

        // Call AI matching service with fallback
        let matchResult
        try {
          const matchingResponse = await axios.post('http://localhost:5001/api/match/cv-to-job', {
            candidateProfile,
            jobData,
            includeReasons: true
          }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
          })
          matchResult = matchingResponse.data
        } catch (aiServiceError) {
          logger.warn(`AI matching service unavailable for job ${job.id}, using fallback algorithm:`, aiServiceError.message)
          // Use fallback simple matching algorithm
          matchResult = calculateSimpleMatchScore(candidateProfile, jobData)
        }

        // Create recommendation object
        const recommendation = {
          jobId: job.id,
          title: job.title,
          company: job.employer.companyName,
          location: job.location,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          remoteAllowed: job.remoteAllowed,
          description: job.description,
          requirements: job.requirements,
          matchScore: Math.round(matchResult.overallScore * 100), // Convert to percentage
          skillsMatch: Math.round(matchResult.skillsMatch * 100),
          experienceMatch: Math.round(matchResult.experienceMatch * 100),
          locationMatch: matchResult.locationMatch || 0,
          salaryMatch: matchResult.salaryMatch || 0,
          reasoning: matchResult.reasoning,
          matchedSkills: matchResult.matchedSkills || [],
          missingSkills: matchResult.missingSkills || [],
          recommendations: matchResult.recommendations || [],
          createdAt: job.createdAt,
          applicationDeadline: job.applicationDeadline,
          logoUrl: job.employer.logoUrl
        }

        jobRecommendations.push(recommendation)

        // Save match to MongoDB for future reference
        await mongoService.saveJobMatch(candidate.id, job.id, {
          matchScore: matchResult.overallScore * 100,
          skillsMatch: {
            score: matchResult.skillsMatch * 100,
            matchedSkills: matchResult.matchedSkills || [],
            missingSkills: matchResult.missingSkills || []
          },
          experienceMatch: {
            score: matchResult.experienceMatch * 100,
            candidateExperience: candidate.experienceYears,
            jobRequirement: job.experienceLevel
          },
          locationMatch: {
            score: matchResult.locationMatch || 0,
            candidateLocation: candidate.location,
            jobLocation: job.location,
            remoteAllowed: job.remoteAllowed
          },
          salaryMatch: {
            score: matchResult.salaryMatch || 0,
            candidateExpectation: candidate.expectedSalary,
            jobRange: {
              min: job.salaryMin,
              max: job.salaryMax
            }
          },
          reasoning: matchResult.reasoning,
          recommendations: matchResult.recommendations || []
        })

      } catch (matchError) {
        logger.error(`Error matching job ${job.id}:`, matchError.message)
        // Continue with other jobs even if one fails
        continue
      }
    }

    // Sort by match score (highest first) and limit results
    const sortedRecommendations = jobRecommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit))

    const responseData = {
      recommendations: sortedRecommendations,
      total: sortedRecommendations.length,
      candidateProfile: {
        skills: candidateProfile.skills,
        experience: candidateProfile.experience,
        location: candidateProfile.location
      },
      processingInfo: {
        jobsAnalyzed: activeJobs.length,
        recommendationsGenerated: sortedRecommendations.length,
        timestamp: new Date().toISOString()
      }
    }

    // Cache the results
    recommendationCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    // Clean up old cache entries (simple cleanup)
    if (recommendationCache.size > 100) {
      const oldestKey = recommendationCache.keys().next().value
      recommendationCache.delete(oldestKey)
    }

    logger.info(`Generated and cached job recommendations for candidate ${candidate.id}`)

    res.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    logger.error('Get job recommendations error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'RECOMMENDATION_FAILED',
        message: 'Failed to generate job recommendations',
        details: error.message
      }
    })
  }
})

// Track job recommendation interaction
router.post('/track-recommendation-interaction', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id
    const { jobId, action, matchScore, metadata = {} } = req.body

    // Validate required fields
    if (!jobId || !action) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Job ID and action are required' }
      })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Save interaction to MongoDB for analytics
    const interactionData = {
      candidateId: candidate.id,
      jobId: parseInt(jobId),
      action, // 'view', 'apply', 'save', 'dismiss', 'feedback'
      matchScore: matchScore || null,
      metadata,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    }

    await mongoService.saveRecommendationInteraction(interactionData)

    logger.info(`Tracked recommendation interaction: candidate ${candidate.id}, job ${jobId}, action ${action}`)

    res.json({
      success: true,
      data: {
        message: 'Interaction tracked successfully',
        interactionId: interactionData.timestamp.toISOString()
      }
    })

  } catch (error) {
    logger.error('Track recommendation interaction error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'TRACKING_FAILED',
        message: 'Failed to track interaction',
        details: error.message
      }
    })
  }
})

// Submit feedback on job recommendation
router.post('/recommendation-feedback', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id
    const { jobId, rating, feedback, improvementSuggestions = [] } = req.body

    // Validate required fields
    if (!jobId || rating === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Job ID and rating are required' }
      })
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5' }
      })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Save feedback to MongoDB
    const feedbackData = {
      candidateId: candidate.id,
      jobId: parseInt(jobId),
      rating,
      feedback: feedback || '',
      improvementSuggestions,
      submittedAt: new Date(),
      processed: false
    }

    await mongoService.saveRecommendationFeedback(feedbackData)

    // Also track this as an interaction
    await mongoService.saveRecommendationInteraction({
      candidateId: candidate.id,
      jobId: parseInt(jobId),
      action: 'feedback',
      metadata: { rating, hasTextFeedback: !!feedback },
      timestamp: new Date()
    })

    logger.info(`Received recommendation feedback: candidate ${candidate.id}, job ${jobId}, rating ${rating}`)

    res.json({
      success: true,
      data: {
        message: 'Feedback submitted successfully',
        feedbackId: feedbackData.submittedAt.toISOString()
      }
    })

  } catch (error) {
    logger.error('Submit recommendation feedback error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'FEEDBACK_FAILED',
        message: 'Failed to submit feedback',
        details: error.message
      }
    })
  }
})

// Get recommendation analytics (admin only)
router.get('/recommendation-analytics', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, candidateId } = req.query

    // Get analytics data from MongoDB
    const analytics = await mongoService.getRecommendationAnalytics({
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
      endDate: endDate ? new Date(endDate) : new Date(),
      candidateId: candidateId ? parseInt(candidateId) : null
    })

    res.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    logger.error('Get recommendation analytics error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_FAILED',
        message: 'Failed to get analytics',
        details: error.message
      }
    })
  }
})

// Generate customized cover letter
router.post('/generate-cover-letter', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id
    const { jobId, template = 'professional' } = req.body

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_JOB_ID', message: 'Job ID is required' }
      })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId) },
      include: {
        employer: {
          select: { companyName: true }
        }
      }
    })

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
      })
    }

    // Get candidate's resume analysis
    const resumeAnalysis = await mongoService.getResumeAnalysis(candidate.id)

    // Call AI service to generate cover letter
    try {
      const coverLetterResponse = await axios.post('http://localhost:5002/api/analyze/generate-cover-letter', {
        candidateProfile: {
          name: `${candidate.firstName} ${candidate.lastName}`,
          experience: resumeAnalysis?.aiAnalysis?.experience || {},
          skills: resumeAnalysis?.aiAnalysis?.skills || []
        },
        jobDetails: {
          title: job.title,
          company: job.employer.companyName,
          description: job.description,
          requirements: job.requirements
        },
        template
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      })

      const generatedContent = coverLetterResponse.data

      // Save generated cover letter to MongoDB
      const documentData = {
        type: 'cover_letter',
        content: generatedContent.coverLetter || generatedContent.content,
        template,
        aiAnalysis: generatedContent.analysis || {}
      }

      await mongoService.saveGeneratedDocument(candidate.id, parseInt(jobId), documentData)

      res.json({
        success: true,
        data: {
          coverLetter: generatedContent.coverLetter || generatedContent.content,
          analysis: generatedContent.analysis || {},
          template,
          message: 'Cover letter generated successfully'
        }
      })

    } catch (aiError) {
      logger.error('AI cover letter generation failed:', aiError)
      res.status(500).json({
        success: false,
        error: { code: 'AI_GENERATION_FAILED', message: 'Failed to generate cover letter' }
      })
    }

  } catch (error) {
    logger.error('Generate cover letter error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'GENERATION_FAILED', message: 'Failed to generate cover letter' }
    })
  }
})

module.exports = router
