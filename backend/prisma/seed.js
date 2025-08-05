const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Hash passwords
  const saltRounds = 12
  const candidatePassword = await bcrypt.hash('candidate123', saltRounds)
  const employerPassword = await bcrypt.hash('employer123', saltRounds)

  try {
    // Create Candidate Profile - Ahmed Ben Ali
    const candidate = await prisma.user.upsert({
      where: { email: 'ahmed.benali@example.com' },
      update: {},
      create: {
        name: 'Ahmed Ben Ali',
        email: 'ahmed.benali@example.com',
        passwordHash: candidatePassword,
        role: 'candidate',
        phone: '+216 98 123 456',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date()
      }
    })

    // Create Employer Profile - TechCorp Solutions
    const employer = await prisma.user.upsert({
      where: { email: 'hr@techcorp-solutions.com' },
      update: {},
      create: {
        name: 'TechCorp Solutions',
        email: 'hr@techcorp-solutions.com',
        passwordHash: employerPassword,
        role: 'employer',
        phone: '+1 555 123 4567',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date()
      }
    })

    // Create some sample skills
    const skills = await Promise.all([
      prisma.skill.upsert({
        where: { name: 'JavaScript' },
        update: {},
        create: { name: 'JavaScript', category: 'Programming' }
      }),
      prisma.skill.upsert({
        where: { name: 'React' },
        update: {},
        create: { name: 'React', category: 'Frontend' }
      }),
      prisma.skill.upsert({
        where: { name: 'Node.js' },
        update: {},
        create: { name: 'Node.js', category: 'Backend' }
      }),
      prisma.skill.upsert({
        where: { name: 'Python' },
        update: {},
        create: { name: 'Python', category: 'Programming' }
      }),
      prisma.skill.upsert({
        where: { name: 'SQL' },
        update: {},
        create: { name: 'SQL', category: 'Database' }
      })
    ])

    // Create employer profile first
    const employerProfile = await prisma.employer.create({
      data: {
        userId: employer.id,
        companyName: 'TechCorp Solutions',
        industry: 'Technology',
        companySize: '50-200',
        website: 'https://techcorp-solutions.com',
        description: 'Leading technology solutions provider specializing in web development, AI, and cloud services.',
        address: '123 Tech Street',
        city: 'Paris',
        country: 'France',
        foundedYear: 2015
      }
    })

    // Create sample job postings from TechCorp Solutions
    const jobs = await Promise.all([
      prisma.job.create({
        data: {
          title: 'Senior Full Stack Developer',
          description: 'We are looking for an experienced Full Stack Developer to join our dynamic team at TechCorp Solutions. You will work on cutting-edge projects using modern technologies like React, Node.js, and cloud platforms.',
          requirements: '5+ years of experience with JavaScript, React, Node.js, and databases. Strong problem-solving skills and experience with agile methodologies. Knowledge of cloud platforms (AWS/Azure) is a plus.',
          location: 'Paris, France (Remote Available)',
          salaryMin: 65000,
          salaryMax: 85000,
          employmentType: 'full_time',
          experienceLevel: 'senior',
          isActive: true,
          employerId: employerProfile.id
        }
      }),
      prisma.job.create({
        data: {
          title: 'Frontend React Developer',
          description: 'Join our frontend team to build amazing user interfaces with React and modern JavaScript. You will collaborate with designers and backend developers to create responsive, user-friendly web applications.',
          requirements: '3+ years of React experience, knowledge of TypeScript, CSS, and modern frontend tools. Experience with state management (Redux/Context API) and testing frameworks.',
          location: 'Paris, France (Hybrid)',
          salaryMin: 45000,
          salaryMax: 60000,
          employmentType: 'full_time',
          experienceLevel: 'mid',
          isActive: true,
          employerId: employerProfile.id
        }
      }),
      prisma.job.create({
        data: {
          title: 'DevOps Engineer',
          description: 'We are seeking a DevOps Engineer to help us scale our infrastructure and improve our deployment processes. You will work with Docker, Kubernetes, and cloud platforms to ensure reliable and efficient operations.',
          requirements: 'Experience with Docker, Kubernetes, CI/CD pipelines, and cloud platforms (AWS/Azure). Knowledge of monitoring tools and infrastructure as code. Strong scripting skills in Python or Bash.',
          location: 'Remote',
          salaryMin: 55000,
          salaryMax: 75000,
          employmentType: 'full_time',
          experienceLevel: 'mid',
          isActive: true,
          employerId: employerProfile.id
        }
      })
    ])

    // Create candidate profile
    const candidateProfile = await prisma.candidate.create({
      data: {
        userId: candidate.id,
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        location: 'Paris, France',
        experienceYears: 5,
        currentPosition: 'Full Stack Developer',
        currentCompany: 'Tech Solutions Inc.',
        salaryExpectation: 55000,
        currency: 'EUR',
        linkedinUrl: 'https://linkedin.com/in/ahmed-benali',
        githubUrl: 'https://github.com/ahmed-benali',
        portfolioUrl: 'https://ahmed-portfolio.dev'
      }
    })

    console.log('✅ Database seeding completed successfully!')
    console.log('')
    console.log('📊 Created accounts:')
    console.log('✅ 1 Candidate profile (Ahmed Ben Ali)')
    console.log('   📧 Email: ahmed.benali@example.com')
    console.log('   🔑 Password: candidate123')
    console.log('')
    console.log('✅ 1 Employer profile (TechCorp Solutions)')
    console.log('   📧 Email: hr@techcorp-solutions.com')
    console.log('   🔑 Password: employer123')
    console.log('')
    console.log('📋 Sample data:')
    console.log(`✅ ${skills.length} skills created`)
    console.log(`✅ ${jobs.length} job postings created`)
    console.log('✅ 1 employer profile created (TechCorp Solutions)')
    console.log('✅ 1 candidate profile created (Ahmed Ben Ali)')

    // Create sample CV data in MongoDB for the candidate
    const { mongoService } = require('../src/config/database')

    const sampleCvData = {
      selectedTemplate: 'modern',
      firstName: 'Ahmed',
      lastName: 'Ben Ali',
      email: 'ahmed.benali@example.com',
      phone: '+33 1 23 45 67 89',
      address: '123 Rue de la Paix',
      city: 'Paris',
      country: 'France',
      linkedinUrl: 'https://linkedin.com/in/ahmed-benali',
      githubUrl: 'https://github.com/ahmed-benali',
      portfolioUrl: 'https://ahmed-portfolio.dev',
      professionalSummary: 'Experienced Full Stack Developer with 5+ years of expertise in modern web technologies. Passionate about creating scalable applications and leading development teams.',
      technicalSkills: 'JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, MongoDB, Docker, AWS',
      softSkills: 'Leadership, Communication, Problem-solving, Team collaboration, Agile methodologies',
      languages: 'French (Native), English (Fluent), Arabic (Conversational)',
      workExperience: [
        {
          id: 1,
          jobTitle: 'Senior Full Stack Developer',
          company: 'Tech Solutions Inc.',
          location: 'Paris, France',
          startDate: '2021-03',
          endDate: '',
          current: true,
          description: 'Lead development of web applications using React and Node.js. Manage a team of 4 developers and collaborate with product managers to deliver high-quality software solutions.'
        },
        {
          id: 2,
          jobTitle: 'Full Stack Developer',
          company: 'Digital Innovations',
          location: 'Lyon, France',
          startDate: '2019-06',
          endDate: '2021-02',
          current: false,
          description: 'Developed and maintained multiple web applications using JavaScript, React, and Python. Implemented CI/CD pipelines and improved application performance by 40%.'
        }
      ],
      education: [
        {
          id: 1,
          degree: 'Master of Science in Computer Science',
          institution: 'École Polytechnique',
          location: 'Paris, France',
          graduationDate: '2019-05',
          gpa: '16.5/20',
          description: 'Specialized in Software Engineering and Artificial Intelligence. Completed thesis on machine learning applications in web development. Graduated Magna Cum Laude.'
        }
      ],
      projects: [
        {
          id: 1,
          name: 'E-commerce Platform',
          description: 'Built a full-stack e-commerce platform with React, Node.js, and PostgreSQL. Implemented payment processing, inventory management, and admin dashboard.',
          technologies: 'React, Node.js, PostgreSQL, Stripe API, Docker',
          url: 'https://github.com/ahmed-benali/ecommerce-platform',
          startDate: '2023-01',
          endDate: '2023-06'
        },
        {
          id: 2,
          name: 'Task Management App',
          description: 'Developed a collaborative task management application with real-time updates using WebSocket technology.',
          technologies: 'React, Node.js, Socket.io, MongoDB',
          url: 'https://github.com/ahmed-benali/task-manager',
          startDate: '2022-08',
          endDate: '2022-12'
        }
      ],
      certifications: [
        {
          id: 1,
          name: 'AWS Certified Developer Associate',
          issuer: 'Amazon Web Services',
          date: '2023-03',
          url: 'https://aws.amazon.com/certification/certified-developer-associate/'
        },
        {
          id: 2,
          name: 'React Professional Developer',
          issuer: 'Meta',
          date: '2022-11',
          url: 'https://www.coursera.org/professional-certificates/meta-react-native'
        }
      ],
      isComplete: true,
      lastGenerated: new Date()
    }

    try {
      const cvResult = await mongoService.saveCvData(candidateProfile.id, sampleCvData)
      const cvDataId = cvResult.insertedId.toString()

      // Update candidate with CV data reference
      await prisma.candidate.update({
        where: { id: candidateProfile.id },
        data: { cvDataId }
      })

      console.log('✅ Sample CV data created in MongoDB')
    } catch (error) {
      console.log('⚠️ Failed to create CV data in MongoDB:', error.message)
    }
    console.log('')
    console.log('🌐 Access Adminer at: http://localhost:8080')
    console.log('   Server: postgres')
    console.log('   Username: postgres')
    console.log('   Password: password123')
    console.log('   Database: recrutia')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    console.log('🔌 Disconnecting from database...')
    await prisma.$disconnect()
    console.log('✅ Database disconnected')
  })
