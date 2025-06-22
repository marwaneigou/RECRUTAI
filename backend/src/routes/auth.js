const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const { prisma } = require('../config/database')
const { logger } = require('../utils/logger')
const { authenticateToken, authRateLimit } = require('../middleware/auth')

const router = express.Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [candidate, employer]
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', authRateLimit, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .custom((value) => {
      const hasLower = /[a-z]/.test(value)
      const hasUpper = /[A-Z]/.test(value)
      const hasNumber = /\d/.test(value)

      if (!hasLower || !hasUpper || !hasNumber) {
        throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      }
      return true
    }),
  body('role').isIn(['candidate', 'employer', 'admin']).withMessage('Role must be candidate, employer, or admin'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      })
    }

    const { name, email, password, role, phone } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'User with this email already exists'
        }
      })
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role.toUpperCase(),
        phone,
        emailVerified: false
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true
      }
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    logger.info(`New user registered: ${email} (${role})`)

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    })
  } catch (error) {
    logger.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Registration failed'
      }
    })
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authRateLimit, [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      })
    }

    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials'
        }
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated'
        }
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials'
        }
      })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user

    logger.info(`User logged in: ${email}`)

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Login failed'
      }
    })
  }
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Get detailed user information based on role
    let userDetails = { ...req.user }

    if (req.user.role.toLowerCase() === 'candidate') {
      const candidate = await prisma.candidate.findUnique({
        where: { userId: req.user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          location: true,
          experienceYears: true,
          currentPosition: true,
          currentCompany: true,
          salaryExpectation: true,
          availabilityDate: true,
          linkedinUrl: true,
          githubUrl: true,
          portfolioUrl: true
        }
      })
      userDetails.candidateProfile = candidate
    } else if (req.user.role.toLowerCase() === 'employer') {
      const employer = await prisma.employer.findUnique({
        where: { userId: req.user.id },
        select: {
          id: true,
          companyName: true,
          industry: true,
          companySize: true,
          website: true,
          description: true,
          logoUrl: true,
          address: true,
          city: true,
          country: true,
          foundedYear: true
        }
      })
      userDetails.employerProfile = employer
    }

    res.json({
      success: true,
      data: {
        user: userDetails
      }
    })
  } catch (error) {
    logger.error('Get user profile error:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user profile'
      }
    })
  }
})

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return success
    logger.info(`User logged out: ${req.user.email}`)

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Logout failed'
      }
    })
  }
})

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      data: {
        token
      }
    })
  } catch (error) {
    logger.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Token refresh failed'
      }
    })
  }
})

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      })
    }

    const { currentPassword, newPassword } = req.body

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { passwordHash: true }
    })

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current password is incorrect'
        }
      })
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    })

    logger.info(`Password changed for user: ${req.user.email}`)

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    logger.error('Change password error:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Password change failed'
      }
    })
  }
})

module.exports = router
