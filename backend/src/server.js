const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const path = require('path')
require('express-async-errors')
require('dotenv').config()

const { logger } = require('./utils/logger')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const { connectDatabases } = require('./config/database')

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const jobRoutes = require('./routes/jobs')
const applicationRoutes = require('./routes/applications')
const candidateRoutes = require('./routes/candidates')
const employerRoutes = require('./routes/employers')
const skillRoutes = require('./routes/skills')
const notificationRoutes = require('./routes/notifications')
const cvRoutes = require('./routes/cv')
const aiFeaturesRoutes = require('./routes/ai-features')

const app = express()
const PORT = process.env.PORT || 3000

// Trust proxy for rate limiting
app.set('trust proxy', 1)

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// General middleware
app.use(compression())
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(limiter)

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/temp', express.static(path.join(__dirname, '../temp')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/employers', employerRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/cv', cvRoutes)
app.use('/api/ai', aiFeaturesRoutes)
app.use('/api/stats', require('./routes/stats'))

// Swagger documentation (only in development)
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_SWAGGER === 'true') {
  const swaggerJsdoc = require('swagger-jsdoc')
  const swaggerUi = require('swagger-ui-express')

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Smart Recruitment Platform API',
        version: '1.0.0',
        description: 'API documentation for the Smart Recruitment Platform'
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server'
        }
      ]
    },
    apis: ['./src/routes/*.js'] // paths to files containing OpenAPI definitions
  }

  const specs = swaggerJsdoc(options)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
}

// Error handling middleware
app.use(notFoundHandler)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

// Start server
async function startServer() {
  try {
    // Connect to databases
    await connectDatabases()
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`)
      
      if (process.env.NODE_ENV === 'development' && process.env.ENABLE_SWAGGER === 'true') {
        logger.info(`📖 API Documentation: http://localhost:${PORT}/api-docs`)
      }
    })

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`)
          process.exit(1)
          break
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`)
          process.exit(1)
          break
        default:
          throw error
      }
    })

    return server
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer()
}

module.exports = app
