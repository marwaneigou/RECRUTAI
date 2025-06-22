const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get employer profile
router.get('/profile', authenticateToken, authorizeRoles(['employer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.id;

    // If admin, they can view any employer profile with ?userId=X
    const targetUserId = req.user.role === 'admin' && req.query.userId ?
      parseInt(req.query.userId) : userId;

    const employer = await prisma.employer.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
          }
        },
        jobs: {
          select: {
            id: true,
            title: true,
            isActive: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
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

    res.json({
      success: true,
      data: { employer }
    });

  } catch (error) {
    logger.error('Get employer profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve employer profile'
      }
    });
  }
});

// Update employer profile
router.put('/profile',
  authenticateToken,
  authorizeRoles(['employer', 'admin']),
  [
    body('companyName')
      .optional()
      .isLength({ min: 2, max: 255 })
      .withMessage('Company name must be between 2 and 255 characters'),
    body('industry')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Industry must be less than 255 characters'),
    body('companySize')
      .optional()
      .isIn(['1-10', '11-50', '50-200', '51-200', '201-500', '501-1000', '1000+'])
      .withMessage('Invalid company size'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Website must be a valid URL'),
    body('description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('logoUrl')
      .optional()
      .isURL()
      .withMessage('Logo URL must be a valid URL'),
    body('address')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Address must be less than 255 characters'),
    body('city')
      .optional()
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    body('country')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Country must be less than 100 characters'),
    body('foundedYear')
      .optional()
      .isInt({ min: 1800, max: new Date().getFullYear() })
      .withMessage('Founded year must be between 1800 and current year')
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
      const {
        companyName,
        industry,
        companySize,
        website,
        description,
        logoUrl,
        address,
        city,
        country,
        foundedYear
      } = req.body;

      // Check if employer profile exists
      const existingEmployer = await prisma.employer.findUnique({
        where: { userId }
      });

      if (!existingEmployer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMPLOYER_NOT_FOUND',
            message: 'Employer profile not found'
          }
        });
      }

      // Prepare update data with proper type conversions
      const updateData = {};
      if (companyName) updateData.companyName = companyName;
      if (industry) updateData.industry = industry;
      if (companySize) updateData.companySize = companySize;
      if (website) updateData.website = website;
      if (description) updateData.description = description;
      if (logoUrl) updateData.logoUrl = logoUrl;
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (country) updateData.country = country;
      if (foundedYear) updateData.foundedYear = parseInt(foundedYear);
      updateData.updatedAt = new Date();

      // Update employer profile
      const updatedEmployer = await prisma.employer.update({
        where: { userId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      logger.info(`Employer profile updated: ${updatedEmployer.companyName} (ID: ${updatedEmployer.id})`);

      res.json({
        success: true,
        message: 'Employer profile updated successfully',
        data: { employer: updatedEmployer }
      });

    } catch (error) {
      logger.error('Update employer profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update employer profile'
        }
      });
    }
  }
);

// Get employer statistics
router.get('/stats', authenticateToken, authorizeRoles(['employer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.id;

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

    // Get statistics
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      recentApplications
    ] = await Promise.all([
      prisma.job.count({
        where: { employerId: employer.id }
      }),
      prisma.job.count({
        where: { employerId: employer.id, isActive: true }
      }),
      prisma.application.count({
        where: { job: { employerId: employer.id } }
      }),
      prisma.application.count({
        where: {
          job: { employerId: employer.id },
          status: 'pending'
        }
      }),
      prisma.application.findMany({
        where: { job: { employerId: employer.id } },
        include: {
          candidate: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          job: {
            select: {
              title: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalJobs,
          activeJobs,
          totalApplications,
          pendingApplications
        },
        recentApplications
      }
    });

  } catch (error) {
    logger.error('Get employer stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve employer statistics'
      }
    });
  }
});

module.exports = router;
