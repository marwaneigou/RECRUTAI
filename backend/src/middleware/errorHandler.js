const { logger } = require('../utils/logger')

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  if (err.code === 'P2025') {
    const message = 'Record not found'
    error = { message, statusCode: 404 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
}

/**
 * Not found handler middleware
 */
function notFoundHandler(req, res, next) {
  const message = `Route ${req.originalUrl} not found`
  logger.warn(message)
  res.status(404).json({
    success: false,
    error: {
      message
    }
  })
}

module.exports = {
  errorHandler,
  notFoundHandler
}
