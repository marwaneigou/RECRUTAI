const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all jobs with filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      employmentType,
      experienceLevel,
      remoteAllowed,
      salaryMin,
      salaryMax,
      employerId
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      // Only filter by isActive if not specifically requesting employer's jobs
      ...(employerId ? {} : { isActive: true }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(employmentType && { employmentType }),
      ...(experienceLevel && { experienceLevel }),
      ...(remoteAllowed === 'true' && { remoteAllowed: true }),
      ...(employerId && { employerId: parseInt(employerId) }),
      ...(salaryMin && { salaryMin: { gte: parseFloat(salaryMin) } }),
      ...(salaryMax && { salaryMax: { lte: parseFloat(salaryMax) } })
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        include: {
          employer: {
            select: {
              id: true,
              companyName: true,
              logoUrl: true,
              industry: true
            }
          },
          // jobSkills: {
          //   include: {
          //     skill: {
          //       select: {
          //         id: true,
          //         name: true,
          //         category: true
          //       }
          //     }
          //   }
          // }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.job.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve jobs'
      }
    });
  }
});

// Create new job posting
router.post('/',
  authenticateToken,
  authorizeRoles(['employer']),
  [
    body('title')
      .notEmpty()
      .isLength({ min: 5, max: 255 })
      .withMessage('Title must be between 5 and 255 characters'),
    body('description')
      .notEmpty()
      .isLength({ min: 50, max: 5000 })
      .withMessage('Description must be between 50 and 5000 characters'),
    body('requirements')
      .optional()
      .isLength({ max: 3000 })
      .withMessage('Requirements must be less than 3000 characters'),
    body('responsibilities')
      .optional()
      .isLength({ max: 3000 })
      .withMessage('Responsibilities must be less than 3000 characters'),
    body('location')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Location must be less than 255 characters'),
    body('employmentType')
      .notEmpty()
      .isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance'])
      .withMessage('Invalid employment type'),
    body('experienceLevel')
      .notEmpty()
      .isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive'])
      .withMessage('Invalid experience level'),
    body('salaryMin')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum salary must be a positive number'),
    body('salaryMax')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum salary must be a positive number'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be 3 characters (e.g., USD, EUR)'),
    body('remoteAllowed')
      .optional()
      .isBoolean()
      .withMessage('Remote allowed must be true or false'),
    body('applicationDeadline')
      .optional()
      .isISO8601()
      .withMessage('Application deadline must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;

      // Get employer profile
      const employer = await prisma.employer.findUnique({
        where: { userId }
      });

      if (!employer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMPLOYER_NOT_FOUND',
            message: 'Employer profile not found'
          }
        });
      }

      const {
        title,
        description,
        requirements,
        responsibilities,
        location,
        employmentType,
        experienceLevel,
        salaryMin,
        salaryMax,
        currency = 'USD',
        remoteAllowed = false,
        applicationDeadline
      } = req.body;

      // Map employment type to enum values
      const employmentTypeMap = {
        'full-time': 'full_time',
        'part-time': 'part_time',
        'contract': 'contract',
        'internship': 'internship',
        'freelance': 'freelance',
        'FULL_TIME': 'full_time',
        'PART_TIME': 'part_time',
        'CONTRACT': 'contract',
        'INTERNSHIP': 'internship',
        'FREELANCE': 'freelance'
      };

      // Map experience level to enum values
      const experienceLevelMap = {
        'entry': 'entry',
        'junior': 'junior',
        'mid': 'mid',
        'senior': 'senior',
        'lead': 'lead',
        'executive': 'executive',
        'ENTRY': 'entry',
        'JUNIOR': 'junior',
        'MID': 'mid',
        'SENIOR': 'senior',
        'LEAD': 'lead',
        'EXECUTIVE': 'executive'
      };

      // Validate salary range
      if (salaryMin && salaryMax && parseFloat(salaryMin) > parseFloat(salaryMax)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Minimum salary cannot be greater than maximum salary'
          }
        });
      }

      // Create job posting
      const job = await prisma.job.create({
        data: {
          employerId: employer.id,
          title,
          description,
          requirements,
          responsibilities,
          location,
          employmentType: employmentTypeMap[employmentType] || employmentType,
          experienceLevel: experienceLevelMap[experienceLevel] || experienceLevel,
          salaryMin: salaryMin ? parseFloat(salaryMin) : null,
          salaryMax: salaryMax ? parseFloat(salaryMax) : null,
          currency,
          remoteAllowed,
          applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
          isActive: true
        },
        include: {
          employer: {
            select: {
              id: true,
              companyName: true,
              logoUrl: true
            }
          }
        }
      });

      logger.info(`Job created: ${job.title} by ${employer.companyName} (ID: ${job.id})`);

      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: { job }
      });

    } catch (error) {
      logger.error('Create job error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create job'
        }
      });
    }
  }
);

// Get jobs for current employer (must be before /:id route)
router.get('/my-jobs', authenticateToken, authorizeRoles(['employer']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all' } = req.query;

    console.log('My-jobs endpoint called for user:', userId);

    // Get employer profile
    const employer = await prisma.employer.findUnique({
      where: { userId }
    });

    console.log('Found employer:', employer ? employer.id : 'not found');

    if (!employer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EMPLOYER_NOT_FOUND',
          message: 'Employer profile not found'
        }
      });
    }

    // Build where clause for employer's jobs
    const where = {
      employerId: employer.id,
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false })
    };

    console.log('Query where clause:', where);

    // Get jobs with minimal includes to avoid relation issues
    const jobs = await prisma.job.findMany({
      where,
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            industry: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Found jobs:', jobs.length);

    // Add placeholder stats
    const jobsWithStats = jobs.map(job => ({
      ...job,
      applicationCount: 0,
      views: 0
    }));

    res.json({
      success: true,
      data: {
        jobs: jobsWithStats,
        pagination: {
          page: 1,
          limit: 100,
          total: jobs.length,
          pages: 1
        }
      }
    });

  } catch (error) {
    console.error('Get employer jobs error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve jobs'
      }
    });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            website: true,
            logoUrl: true,
            description: true,
            city: true,
            country: true
          }
        },
        // jobSkills: {
        //   include: {
        //     skill: {
        //       select: {
        //         id: true,
        //         name: true,
        //         category: true
        //       }
        //     }
        //   }
        // },
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found'
        }
      });
    }

    res.json({
      success: true,
      data: { job }
    });

  } catch (error) {
    logger.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve job'
      }
    });
  }
});

// Update job posting
router.put('/:id',
  authenticateToken,
  authorizeRoles(['employer']),
  [
    body('title')
      .optional()
      .isLength({ min: 5, max: 255 })
      .withMessage('Title must be between 5 and 255 characters'),
    body('description')
      .optional()
      .isLength({ min: 50, max: 5000 })
      .withMessage('Description must be between 50 and 5000 characters'),
    body('employmentType')
      .optional()
      .isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance'])
      .withMessage('Invalid employment type'),
    body('experienceLevel')
      .optional()
      .isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive'])
      .withMessage('Invalid experience level'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be true or false')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const jobId = parseInt(req.params.id);
      const userId = req.user.id;

      // Get employer profile
      const employer = await prisma.employer.findUnique({
        where: { userId }
      });

      if (!employer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMPLOYER_NOT_FOUND',
            message: 'Employer profile not found'
          }
        });
      }

      // Check if job exists and belongs to employer
      const existingJob = await prisma.job.findFirst({
        where: {
          id: jobId,
          employerId: employer.id
        }
      });

      if (!existingJob) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found or you do not have permission to edit it'
          }
        });
      }

      // Map employment type and experience level if provided
      const updateData = { ...req.body };

      if (updateData.employmentType) {
        const employmentTypeMap = {
          'full-time': 'FULL_TIME',
          'part-time': 'PART_TIME',
          'contract': 'CONTRACT',
          'internship': 'INTERNSHIP',
          'freelance': 'FREELANCE'
        };
        updateData.employmentType = employmentTypeMap[updateData.employmentType] || updateData.employmentType;
      }

      if (updateData.experienceLevel) {
        const experienceLevelMap = {
          'entry': 'ENTRY',
          'junior': 'JUNIOR',
          'mid': 'MID',
          'senior': 'SENIOR',
          'lead': 'LEAD',
          'executive': 'EXECUTIVE'
        };
        updateData.experienceLevel = experienceLevelMap[updateData.experienceLevel] || updateData.experienceLevel;
      }

      // Handle applicationDeadline - convert date string to proper DateTime
      if (updateData.applicationDeadline) {
        if (updateData.applicationDeadline === '') {
          updateData.applicationDeadline = null;
        } else {
          // Convert date string to ISO DateTime (add time if missing)
          const dateStr = updateData.applicationDeadline;
          if (dateStr.length === 10) { // YYYY-MM-DD format
            updateData.applicationDeadline = new Date(dateStr + 'T23:59:59.999Z');
          } else {
            updateData.applicationDeadline = new Date(dateStr);
          }
        }
      }

      // Handle salary fields
      if (updateData.salaryMin !== undefined) {
        updateData.salaryMin = updateData.salaryMin ? parseFloat(updateData.salaryMin) : null;
      }
      if (updateData.salaryMax !== undefined) {
        updateData.salaryMax = updateData.salaryMax ? parseFloat(updateData.salaryMax) : null;
      }

      // Update job
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          employer: {
            select: {
              companyName: true
            }
          }
        }
      });

      logger.info(`Job updated: ${updatedJob.title} (ID: ${updatedJob.id})`);

      res.json({
        success: true,
        message: 'Job updated successfully',
        data: { job: updatedJob }
      });

    } catch (error) {
      logger.error('Update job error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update job'
        }
      });
    }
  }
);

// Delete job posting
router.delete('/:id', authenticateToken, authorizeRoles(['employer']), async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const userId = req.user.id;

    // Get employer profile
    const employer = await prisma.employer.findUnique({
      where: { userId }
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EMPLOYER_NOT_FOUND',
          message: 'Employer profile not found'
        }
      });
    }

    // Check if job exists and belongs to employer
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        employerId: employer.id
      }
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found or you do not have permission to delete it'
        }
      });
    }

    // Delete job (this will cascade delete applications due to foreign key)
    await prisma.job.delete({
      where: { id: jobId }
    });

    logger.info(`Job deleted: ${existingJob.title} (ID: ${jobId})`);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete job'
      }
    });
  }
});

module.exports = router;
