const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { logger } = require('../utils/logger')

const prisma = new PrismaClient()

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required'
        }
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true
      }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found'
        }
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated'
        }
      })
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token'
        }
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired'
        }
      })
    }

    logger.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed'
      }
    })
  }
}

/**
 * Authorization middleware to check user roles
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      })
    }

    const userRole = req.user.role.toLowerCase()
    const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRole)

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions'
        }
      })
    }

    next()
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      })

      if (user && user.isActive) {
        req.user = user
      }
    }

    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}

/**
 * Middleware to check if user owns the resource or is admin
 * @param {string} userIdParam - Parameter name containing the user ID
 */
const checkOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      })
    }

    const resourceUserId = parseInt(req.params[userIdParam])
    const isOwner = req.user.id === resourceUserId
    const isAdmin = req.user.role.toLowerCase() === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied'
        }
      })
    }

    next()
  }
}

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // don't count successful requests
})

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  checkOwnership,
  authRateLimit
}
