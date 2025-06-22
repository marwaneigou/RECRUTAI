// Load environment variables first
require('dotenv').config()

const bcrypt = require('bcryptjs')
const { prisma } = require('../config/database')
const { logger } = require('../utils/logger')

async function seedDemoUsers() {
  try {
    logger.info('🌱 Starting demo users seeding...')

    // Hash password for demo accounts
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const hashedPassword = await bcrypt.hash('password123', saltRounds)
    const adminHashedPassword = await bcrypt.hash('admin123', saltRounds)

    // Demo users data
    const demoUsers = [
      {
        uuid: 'demo-candidate-001',
        name: 'Ahmed Ben Ali',
        email: 'ahmed.benali@email.com',
        passwordHash: hashedPassword,
        role: 'candidate',
        phone: '+33123456789',
        isActive: true,
        emailVerified: true
      },
      {
        uuid: 'demo-employer-001',
        name: 'Marie Dubois',
        email: 'marie.dubois@techcorp.fr',
        passwordHash: hashedPassword,
        role: 'employer',
        phone: '+33987654321',
        isActive: true,
        emailVerified: true
      },
      {
        uuid: 'demo-admin-001',
        name: 'System Administrator',
        email: 'admin@smartrecruit.com',
        passwordHash: adminHashedPassword,
        role: 'admin',
        phone: '+33555000111',
        isActive: true,
        emailVerified: true
      }
    ]

    // Create or update demo users
    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { email: userData.email },
            data: {
              name: userData.name,
              passwordHash: userData.passwordHash,
              role: userData.role,
              phone: userData.phone,
              isActive: userData.isActive,
              emailVerified: userData.emailVerified
            }
          })
          logger.info(`✅ Updated demo user: ${userData.email}`)
        } else {
          // Create new user
          const newUser = await prisma.user.create({
            data: userData
          })
          logger.info(`✅ Created demo user: ${userData.email} (ID: ${newUser.id})`)
        }
      } catch (error) {
        logger.error(`❌ Failed to create/update user ${userData.email}:`, error.message)
      }
    }

    // Create candidate profile for Ahmed
    try {
      const candidateUser = await prisma.user.findUnique({
        where: { email: 'ahmed.benali@email.com' }
      })

      if (candidateUser) {
        const existingCandidate = await prisma.candidate.findUnique({
          where: { userId: candidateUser.id }
        })

        if (!existingCandidate) {
          await prisma.candidate.create({
            data: {
              userId: candidateUser.id,
              firstName: 'Ahmed',
              lastName: 'Ben Ali',
              location: 'Paris, France',
              experienceYears: 5,
              currentPosition: 'Full Stack Developer',
              currentCompany: 'Tech Solutions Inc.',
              salaryExpectation: 55000,
              availabilityDate: new Date('2024-02-01'),
              linkedinUrl: 'https://linkedin.com/in/ahmed-benali',
              githubUrl: 'https://github.com/ahmed-benali',
              portfolioUrl: 'https://ahmed-portfolio.dev'
            }
          })
          logger.info('✅ Created candidate profile for Ahmed')
        }
      }
    } catch (error) {
      logger.error('❌ Failed to create candidate profile:', error.message)
    }

    // Create employer profile for Marie
    try {
      const employerUser = await prisma.user.findUnique({
        where: { email: 'marie.dubois@techcorp.fr' }
      })

      if (employerUser) {
        const existingEmployer = await prisma.employer.findUnique({
          where: { userId: employerUser.id }
        })

        if (!existingEmployer) {
          await prisma.employer.create({
            data: {
              userId: employerUser.id,
              companyName: 'TechCorp Solutions',
              industry: 'Technology',
              companySize: '50-200',
              website: 'https://techcorp-solutions.fr',
              description: 'Leading technology solutions provider in France',
              logoUrl: 'https://techcorp-solutions.fr/logo.png',
              address: '123 Tech Street',
              city: 'Paris',
              country: 'France',
              foundedYear: 2015
            }
          })
          logger.info('✅ Created employer profile for Marie')
        }
      }
    } catch (error) {
      logger.error('❌ Failed to create employer profile:', error.message)
    }

    logger.info('🎉 Demo users seeding completed!')

    // Display summary
    const userCount = await prisma.user.count()
    const candidateCount = await prisma.candidate.count()
    const employerCount = await prisma.employer.count()

    logger.info(`📊 Database Summary:`)
    logger.info(`   Users: ${userCount}`)
    logger.info(`   Candidates: ${candidateCount}`)
    logger.info(`   Employers: ${employerCount}`)

    logger.info('🧪 Demo Accounts:')
    logger.info('   Candidate: ahmed.benali@email.com / password123')
    logger.info('   Employer: marie.dubois@techcorp.fr / password123')
    logger.info('   Admin: admin@smartrecruit.com / admin123')

  } catch (error) {
    logger.error('❌ Failed to seed demo users:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDemoUsers()
    .then(() => {
      logger.info('✅ Seeding completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedDemoUsers }
