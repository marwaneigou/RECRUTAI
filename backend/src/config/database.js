const { PrismaClient } = require('@prisma/client')
const { MongoClient } = require('mongodb')
const redis = require('redis')
const { logger } = require('../utils/logger')

// Initialize Prisma client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
})

// MongoDB client
let mongoClient = null
let mongoDb = null

// Redis client
let redisClient = null

/**
 * Connect to PostgreSQL using Prisma
 */
async function connectPostgreSQL() {
  try {
    await prisma.$connect()
    logger.info('✅ Connected to PostgreSQL database')
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`
    logger.info('✅ PostgreSQL connection test successful')
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL:', error)
    throw error
  }
}

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set')
    }

    mongoClient = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    await mongoClient.connect()
    
    // Get database name from URI or use default
    const dbName = process.env.MONGO_DB || 'srp'
    mongoDb = mongoClient.db(dbName)
    
    // Test the connection
    await mongoDb.admin().ping()
    
    logger.info('✅ Connected to MongoDB database')
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error)
    throw error
  }
}

/**
 * Connect to Redis
 */
async function connectRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    redisClient = redis.createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused')
          return new Error('Redis server connection refused')
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted')
          return new Error('Retry time exhausted')
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached')
          return undefined
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000)
      }
    })

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      logger.info('✅ Connected to Redis')
    })

    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready')
    })

    redisClient.on('end', () => {
      logger.info('Redis connection ended')
    })

    await redisClient.connect()
    
    // Test the connection
    await redisClient.ping()
    logger.info('✅ Redis connection test successful')
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error)
    // Redis is optional, so we don't throw the error
    logger.warn('⚠️  Continuing without Redis cache')
  }
}

/**
 * Connect to all databases
 */
async function connectDatabases() {
  logger.info('🔌 Connecting to databases...')
  
  await Promise.all([
    connectPostgreSQL(),
    connectMongoDB(),
    connectRedis()
  ])
  
  logger.info('✅ All database connections established')
}

/**
 * Disconnect from all databases
 */
let disconnectInProgress = false
async function disconnectDatabases() {
  if (disconnectInProgress) {
    logger.info('🔌 Database disconnection already in progress, skipping...')
    return
  }

  disconnectInProgress = true
  logger.info('🔌 Disconnecting from databases...')

  const disconnectPromises = []

  // Disconnect Prisma
  if (prisma) {
    disconnectPromises.push(
      prisma.$disconnect().then(() => {
        logger.info('✅ Disconnected from PostgreSQL')
      }).catch((error) => {
        logger.error('❌ Error disconnecting from PostgreSQL:', error)
      })
    )
  }

  // Disconnect MongoDB
  if (mongoClient) {
    disconnectPromises.push(
      mongoClient.close().then(() => {
        logger.info('✅ Disconnected from MongoDB')
      }).catch((error) => {
        logger.error('❌ Error disconnecting from MongoDB:', error)
      })
    )
  }

  // Disconnect Redis
  if (redisClient && redisClient.isOpen) {
    disconnectPromises.push(
      redisClient.quit().then(() => {
        logger.info('✅ Disconnected from Redis')
      }).catch((error) => {
        logger.error('❌ Error disconnecting from Redis:', error)
      })
    )
  }

  await Promise.all(disconnectPromises)
  logger.info('✅ All database connections closed')
  disconnectInProgress = false
}

/**
 * Get MongoDB collection
 */
function getMongoCollection(collectionName) {
  if (!mongoDb) {
    throw new Error('MongoDB not connected')
  }
  return mongoDb.collection(collectionName)
}

/**
 * MongoDB service functions for AI features
 */
const mongoService = {
  // Resume operations
  async saveResumeAnalysis(candidateId, resumeData, aiAnalysis) {
    const collection = getMongoCollection('resumes')
    return await collection.insertOne({
      candidateId,
      ...resumeData,
      aiAnalysis,
      uploadedAt: new Date(),
      isActive: true
    })
  },

  async getResumeAnalysis(candidateId) {
    const collection = getMongoCollection('resumes')
    return await collection.findOne({ candidateId, isActive: true })
  },

  // Job matching operations
  async saveJobMatch(candidateId, jobId, matchData) {
    const collection = getMongoCollection('job_matches')
    return await collection.insertOne({
      candidateId,
      jobId,
      ...matchData,
      calculatedAt: new Date()
    })
  },

  async getJobMatches(candidateId, limit = 10) {
    const collection = getMongoCollection('job_matches')
    return await collection.find({ candidateId })
      .sort({ matchScore: -1 })
      .limit(limit)
      .toArray()
  },

  // Recommendation analytics operations
  async saveRecommendationInteraction(interactionData) {
    const collection = getMongoCollection('recommendation_interactions')
    return await collection.insertOne(interactionData)
  },

  async saveRecommendationFeedback(feedbackData) {
    const collection = getMongoCollection('recommendation_feedback')
    return await collection.insertOne(feedbackData)
  },

  async getRecommendationAnalytics(filters = {}) {
    const interactionsCollection = getMongoCollection('recommendation_interactions')
    const feedbackCollection = getMongoCollection('recommendation_feedback')

    const matchQuery = {}

    // Add date filters
    if (filters.startDate || filters.endDate) {
      matchQuery.timestamp = {}
      if (filters.startDate) matchQuery.timestamp.$gte = filters.startDate
      if (filters.endDate) matchQuery.timestamp.$lte = filters.endDate
    }

    // Add candidate filter
    if (filters.candidateId) {
      matchQuery.candidateId = filters.candidateId
    }

    // Get interaction statistics
    const interactionStats = await interactionsCollection.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          avgMatchScore: { $avg: '$matchScore' }
        }
      }
    ]).toArray()

    // Get feedback statistics
    const feedbackStats = await feedbackCollection.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]).toArray()

    // Get top performing jobs (most interactions)
    const topJobs = await interactionsCollection.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$jobId',
          interactions: { $sum: 1 },
          avgMatchScore: { $avg: '$matchScore' },
          actions: { $push: '$action' }
        }
      },
      { $sort: { interactions: -1 } },
      { $limit: 10 }
    ]).toArray()

    return {
      interactionStats,
      feedbackStats: feedbackStats[0] || { avgRating: 0, totalFeedback: 0, ratingDistribution: [] },
      topJobs,
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate
      }
    }
  },

  // CV data operations
  async saveCvData(candidateId, cvData) {
    const collection = getMongoCollection('cv_data')
    return await collection.insertOne({
      candidateId,
      selectedTemplate: cvData.selectedTemplate || 'modern',
      firstName: cvData.firstName,
      lastName: cvData.lastName,
      email: cvData.email,
      phone: cvData.phone,
      address: cvData.address,
      city: cvData.city,
      country: cvData.country,
      linkedinUrl: cvData.linkedinUrl,
      githubUrl: cvData.githubUrl,
      portfolioUrl: cvData.portfolioUrl,
      professionalSummary: cvData.professionalSummary,
      technicalSkills: cvData.technicalSkills,
      softSkills: cvData.softSkills,
      languages: cvData.languages,
      workExperience: cvData.workExperience || [],
      education: cvData.education || [],
      projects: cvData.projects || [],
      certifications: cvData.certifications || [],
      isComplete: cvData.isComplete || false,
      lastGenerated: cvData.lastGenerated || null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  },

  async getCvData(candidateId) {
    const collection = getMongoCollection('cv_data')
    return await collection.findOne({ candidateId })
  },

  async getCvDataById(cvDataId) {
    const collection = getMongoCollection('cv_data')
    const { ObjectId } = require('mongodb')
    try {
      return await collection.findOne({ _id: ObjectId.createFromHexString(cvDataId) })
    } catch (error) {
      return null
    }
  },

  async updateCvData(candidateId, updateData) {
    const collection = getMongoCollection('cv_data')
    return await collection.updateOne(
      { candidateId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
  },

  // CV snapshot operations
  async saveCvSnapshot(applicationId, candidateId, jobId, cvData, customizations = {}) {
    const collection = getMongoCollection('cv_snapshots')
    return await collection.insertOne({
      applicationId,
      candidateId,
      jobId,
      cvData,
      customizations,
      createdAt: new Date()
    })
  },

  async getCvSnapshot(applicationId) {
    const collection = getMongoCollection('cv_snapshots')
    return await collection.findOne({ applicationId })
  },

  async getCvSnapshotById(cvSnapshotId) {
    const collection = getMongoCollection('cv_snapshots')
    const { ObjectId } = require('mongodb')
    try {
      return await collection.findOne({ _id: ObjectId.createFromHexString(cvSnapshotId) })
    } catch (error) {
      return null
    }
  },

  // Cover letter operations
  async saveCoverLetter(applicationId, candidateId, jobId, coverLetterData) {
    const collection = getMongoCollection('cover_letters')
    return await collection.insertOne({
      applicationId,
      candidateId,
      jobId,
      content: coverLetterData.content || coverLetterData,
      type: coverLetterData.type || 'user_written',
      template: coverLetterData.template || null,
      aiAnalysis: coverLetterData.aiAnalysis || null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  },

  async getCoverLetter(applicationId) {
    const collection = getMongoCollection('cover_letters')
    return await collection.findOne({ applicationId })
  },

  async getCoverLetterById(coverLetterId) {
    const collection = getMongoCollection('cover_letters')
    const { ObjectId } = require('mongodb')
    try {
      return await collection.findOne({ _id: ObjectId.createFromHexString(coverLetterId) })
    } catch (error) {
      // If invalid ObjectId format, return null
      return null
    }
  },

  async updateCoverLetter(coverLetterId, updateData) {
    const collection = getMongoCollection('cover_letters')
    const { ObjectId } = require('mongodb')
    try {
      return await collection.updateOne(
        { _id: ObjectId.createFromHexString(coverLetterId) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      )
    } catch (error) {
      throw new Error(`Invalid cover letter ID: ${coverLetterId}`)
    }
  },

  // Generated documents operations
  async saveGeneratedDocument(candidateId, jobId, documentData) {
    const collection = getMongoCollection('generated_documents')
    return await collection.insertOne({
      candidateId,
      jobId,
      ...documentData,
      generatedAt: new Date()
    })
  },

  async getGeneratedDocument(candidateId, jobId, type) {
    const collection = getMongoCollection('generated_documents')
    return await collection.findOne({ candidateId, jobId, type })
  },

  // CV variations for job-specific customizations
  async saveCvVariation(candidateId, jobId, customizations) {
    const collection = getMongoCollection('cv_variations')
    return await collection.insertOne({
      candidateId,
      jobId,
      customizations,
      generatedAt: new Date(),
      performanceMetrics: {
        viewCount: 0,
        downloadCount: 0
      }
    })
  },

  async getCvVariation(candidateId, jobId) {
    const collection = getMongoCollection('cv_variations')
    return await collection.findOne({ candidateId, jobId })
  },

  async updateCvPerformance(candidateId, jobId, metric) {
    const collection = getMongoCollection('cv_variations')
    const updateField = metric === 'view' ? 'performanceMetrics.viewCount' : 'performanceMetrics.downloadCount'
    return await collection.updateOne(
      { candidateId, jobId },
      { $inc: { [updateField]: 1 } }
    )
  }
}

/**
 * Cache operations using Redis
 */
const cache = {
  async get(key) {
    if (!redisClient || !redisClient.isOpen) {
      return null
    }
    try {
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  },

  async set(key, value, ttl = 3600) {
    if (!redisClient || !redisClient.isOpen) {
      return false
    }
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error('Cache set error:', error)
      return false
    }
  },

  async del(key) {
    if (!redisClient || !redisClient.isOpen) {
      return false
    }
    try {
      await redisClient.del(key)
      return true
    } catch (error) {
      logger.error('Cache delete error:', error)
      return false
    }
  },

  async flush() {
    if (!redisClient || !redisClient.isOpen) {
      return false
    }
    try {
      await redisClient.flushAll()
      return true
    } catch (error) {
      logger.error('Cache flush error:', error)
      return false
    }
  }
}

// Handle process termination - prevent multiple disconnections
let isDisconnecting = false

process.on('beforeExit', async () => {
  if (!isDisconnecting) {
    isDisconnecting = true
    await disconnectDatabases()
  }
})

process.on('SIGINT', async () => {
  if (!isDisconnecting) {
    isDisconnecting = true
    await disconnectDatabases()
    process.exit(0)
  }
})

process.on('SIGTERM', async () => {
  if (!isDisconnecting) {
    isDisconnecting = true
    await disconnectDatabases()
    process.exit(0)
  }
})

module.exports = {
  prisma,
  mongoClient,
  mongoDb,
  redisClient,
  connectDatabases,
  disconnectDatabases,
  getMongoCollection,
  mongoService,
  cache
}
