const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../config/database')

// Get candidate statistics
router.get('/candidate', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user

    if (role !== 'candidate') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only candidates can access candidate stats' }
      })
    }

    // Get candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId: userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Candidate profile not found' }
      })
    }

    // Get applications count
    const applicationsCount = await prisma.application.count({
      where: { candidateId: candidate.id }
    })

    // Get applications by status
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      where: { candidateId: candidate.id },
      _count: { status: true }
    })

    // Get total active jobs (potential matches)
    const totalActiveJobs = await prisma.job.count({
      where: { isActive: true }
    })

    const stats = {
      applicationsSent: applicationsCount,
      jobMatches: totalActiveJobs,
      interviews: applicationsByStatus.find(s => s.status === 'interviewed')?._count?.status || 0,
      pending: applicationsByStatus.find(s => s.status === 'pending')?._count?.status || 0,
      reviewed: applicationsByStatus.find(s => s.status === 'reviewed')?._count?.status || 0,
      accepted: applicationsByStatus.find(s => s.status === 'accepted')?._count?.status || 0,
      rejected: applicationsByStatus.find(s => s.status === 'rejected')?._count?.status || 0
    }

    res.json({
      success: true,
      data: { stats }
    })

  } catch (error) {
    console.error('Get candidate stats error:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch candidate statistics' }
    })
  }
})

// Get employer statistics
router.get('/employer', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user

    if (role !== 'employer') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only employers can access employer stats' }
      })
    }

    // Get employer profile
    const employer = await prisma.employer.findUnique({
      where: { userId: userId }
    })

    if (!employer) {
      return res.status(404).json({
        success: false,
        error: { message: 'Employer profile not found' }
      })
    }

    // Get jobs count
    const totalJobs = await prisma.job.count({
      where: { employerId: employer.id }
    })

    const activeJobs = await prisma.job.count({
      where: { 
        employerId: employer.id,
        isActive: true 
      }
    })

    // Get applications count for employer's jobs
    const totalApplications = await prisma.application.count({
      where: {
        job: {
          employerId: employer.id
        }
      }
    })

    // Get applications by status for employer's jobs
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      where: {
        job: {
          employerId: employer.id
        }
      },
      _count: { status: true }
    })

    // Get recent applications (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentApplications = await prisma.application.count({
      where: {
        job: {
          employerId: employer.id
        },
        appliedAt: {
          gte: sevenDaysAgo
        }
      }
    })

    const stats = {
      companyName: employer.companyName,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications: applicationsByStatus.find(s => s.status === 'pending')?._count?.status || 0,
      interviewApplications: applicationsByStatus.find(s => s.status === 'interviewed')?._count?.status || 0,
      acceptedApplications: applicationsByStatus.find(s => s.status === 'accepted')?._count?.status || 0,
      rejectedApplications: applicationsByStatus.find(s => s.status === 'rejected')?._count?.status || 0,
      recentApplications
    }

    res.json({
      success: true,
      data: { stats }
    })

  } catch (error) {
    console.error('Get employer stats error:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch employer statistics' }
    })
  }
})

module.exports = router
