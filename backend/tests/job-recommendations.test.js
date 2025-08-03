const request = require('supertest')
const app = require('../src/server')
const { prisma } = require('../src/config/database')

describe('Job Recommendations API', () => {
  let candidateToken
  let candidateId
  let testJobId

  beforeAll(async () => {
    // Create a test candidate user
    const testUser = await prisma.user.create({
      data: {
        uuid: 'test-candidate-recommendations',
        name: 'Test Candidate',
        email: 'test.candidate.recommendations@test.com',
        passwordHash: '$2a$12$LQv3c1yqBwEHXLAw98j2uOe5UPmkHO6T9mAp1ckrUVTeIaVOYYFHO', // Password123
        role: 'candidate',
        isActive: true,
        emailVerified: true
      }
    })

    // Create candidate profile
    const candidate = await prisma.candidate.create({
      data: {
        userId: testUser.id,
        firstName: 'Test',
        lastName: 'Candidate',
        location: 'Paris, France',
        experienceYears: 3,
        currentPosition: 'Software Developer',
        salaryExpectation: 50000,
        currency: 'EUR'
      }
    })

    candidateId = candidate.id

    // Create test employer and job
    const testEmployer = await prisma.user.create({
      data: {
        uuid: 'test-employer-recommendations',
        name: 'Test Employer',
        email: 'test.employer.recommendations@test.com',
        passwordHash: '$2a$12$LQv3c1yqBwEHXLAw98j2uOe5UPmkHO6T9mAp1ckrUVTeIaVOYYFHO',
        role: 'employer',
        isActive: true,
        emailVerified: true
      }
    })

    const employer = await prisma.employer.create({
      data: {
        userId: testEmployer.id,
        companyName: 'Test Company',
        industry: 'Technology'
      }
    })

    // Create a test job
    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        title: 'Test Software Developer',
        description: 'Test job description for software developer position',
        requirements: 'JavaScript, React, Node.js experience required',
        location: 'Paris, France',
        employmentType: 'full-time',
        experienceLevel: 'mid',
        salaryMin: 45000,
        salaryMax: 55000,
        currency: 'EUR',
        remoteAllowed: true,
        isActive: true,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    })

    testJobId = job.id

    // Login to get token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test.candidate.recommendations@test.com',
        password: 'Password123'
      })

    candidateToken = loginResponse.body.data.token
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.job.deleteMany({
      where: { title: 'Test Software Developer' }
    })
    await prisma.candidate.deleteMany({
      where: { firstName: 'Test', lastName: 'Candidate' }
    })
    await prisma.employer.deleteMany({
      where: { companyName: 'Test Company' }
    })
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test.candidate.recommendations@test.com', 'test.employer.recommendations@test.com']
        }
      }
    })
    await prisma.$disconnect()
  })

  describe('GET /ai-features/job-recommendations', () => {
    it('should return job recommendations for authenticated candidate', async () => {
      const response = await request(app)
        .get('/ai-features/job-recommendations?limit=5')
        .set('Authorization', `Bearer ${candidateToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('recommendations')
      expect(response.body.data).toHaveProperty('total')
      expect(response.body.data).toHaveProperty('candidateProfile')
      expect(response.body.data).toHaveProperty('processingInfo')
      expect(Array.isArray(response.body.data.recommendations)).toBe(true)
    })

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/ai-features/job-recommendations')

      expect(response.status).toBe(401)
    })

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/ai-features/job-recommendations?limit=2')
        .set('Authorization', `Bearer ${candidateToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.recommendations.length).toBeLessThanOrEqual(2)
    })

    it('should return cached results on subsequent calls', async () => {
      // First call
      const response1 = await request(app)
        .get('/ai-features/job-recommendations?limit=3')
        .set('Authorization', `Bearer ${candidateToken}`)

      expect(response1.status).toBe(200)
      expect(response1.body.data.cached).toBeFalsy()

      // Second call should be cached
      const response2 = await request(app)
        .get('/ai-features/job-recommendations?limit=3')
        .set('Authorization', `Bearer ${candidateToken}`)

      expect(response2.status).toBe(200)
      expect(response2.body.data.cached).toBe(true)
      expect(response2.body.data).toHaveProperty('cacheAge')
    })
  })

  describe('POST /ai-features/track-recommendation-interaction', () => {
    it('should track job recommendation interaction', async () => {
      const response = await request(app)
        .post('/ai-features/track-recommendation-interaction')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          jobId: testJobId,
          action: 'view',
          matchScore: 85,
          metadata: { source: 'test' }
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('message')
      expect(response.body.data).toHaveProperty('interactionId')
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/ai-features/track-recommendation-interaction')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          action: 'view'
          // Missing jobId
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('MISSING_FIELDS')
    })
  })

  describe('POST /ai-features/recommendation-feedback', () => {
    it('should submit recommendation feedback', async () => {
      const response = await request(app)
        .post('/ai-features/recommendation-feedback')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          jobId: testJobId,
          rating: 4,
          feedback: 'Great recommendation!',
          improvementSuggestions: ['More similar roles']
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('message')
      expect(response.body.data).toHaveProperty('feedbackId')
    })

    it('should return 400 for invalid rating', async () => {
      const response = await request(app)
        .post('/ai-features/recommendation-feedback')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          jobId: testJobId,
          rating: 6, // Invalid rating (should be 1-5)
          feedback: 'Test feedback'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_RATING')
    })
  })
})
