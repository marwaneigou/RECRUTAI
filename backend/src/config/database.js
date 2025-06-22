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
async function disconnectDatabases() {
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

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabases()
})

process.on('SIGINT', async () => {
  await disconnectDatabases()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDatabases()
  process.exit(0)
})

module.exports = {
  prisma,
  mongoClient,
  mongoDb,
  redisClient,
  connectDatabases,
  disconnectDatabases,
  getMongoCollection,
  cache
}
