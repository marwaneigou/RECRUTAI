const express = require('express')
const axios = require('axios')
const { authenticateToken, authorizeRoles } = require('../middleware/auth')
const { prisma, mongoService } = require('../config/database')

const router = express.Router()

// CV Improvements endpoint
router.post('/cv-improvements', async (req, res) => {
  try {
    const { cvText } = req.body

    if (!cvText) {
      return res.status(400).json({
        success: false,
        error: 'Missing cvText in request body'
      })
    }

    if (!cvText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'CV text cannot be empty'
      })
    }

    console.log(`📄 Analyzing CV (${cvText.length} characters)...`)

    // Call the Python analysis service with OpenAI endpoint
    const response = await axios.post('http://localhost:5002/api/analyze/cv', {
      cvText: cvText
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Handle the response from /api/analyze/cv endpoint
    if (response.data.analysis && response.data.analysis.improvementAreas) {
      // Extract improvements from the full CV analysis
      res.json({
        success: true,
        improvements: response.data.analysis.improvementAreas
      })
    } else if (response.data.improvements) {
      // Direct improvements response
      res.json({
        success: true,
        improvements: response.data.improvements
      })
    } else {
      // Fallback if structure is unexpected
      res.json({
        success: true,
        improvements: [
          "Add more specific technical skills relevant to your target role",
          "Include quantifiable achievements with numbers and percentages",
          "Improve the professional summary to highlight key strengths",
          "Add relevant certifications or training courses",
          "Use stronger action verbs to describe your accomplishments"
        ],
        note: "OpenAI analysis completed with fallback suggestions"
      })
    }

  } catch (error) {
    console.error('CV Improvements Error:', error.message)
    
    // Simple fallback when OpenAI service is unavailable
    let note = "AI service unavailable - showing general suggestions";
    let fallbackImprovements = [
      "Add more specific technical skills relevant to your target role",
      "Include quantifiable achievements with numbers and percentages",
      "Improve the professional summary to highlight key strengths",
      "Add relevant certifications or training courses",
      "Use stronger action verbs to describe your accomplishments"
    ];
    
    if (error.message.includes('429') || error.message.includes('quota')) {
      note = "⚠️ OpenAI quota exceeded - Add payment method for AI suggestions";
      fallbackImprovements = [
        "⚠️ OpenAI quota exceeded - Add payment method to get AI-powered suggestions",
        "Add more specific technical skills relevant to your target role",
        "Include quantifiable achievements with numbers and percentages",
        "Improve the professional summary to highlight key strengths",
        "Add relevant certifications or training courses"
      ];
    }

    res.json({
      success: true,
      improvements: fallbackImprovements,
      note: note,
      quotaExceeded: error.message.includes('429') || error.message.includes('quota')
    })
  }
})

// Get candidate dashboard data
router.get('/dashboard', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id

    // Get candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Get real application statistics
    const applications = await prisma.application.findMany({
      where: { candidateId: candidate.id },
      include: {
        job: {
          include: {
            employer: {
              select: { companyName: true }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })

    // Calculate stats
    const stats = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      interviews: applications.filter(app => ['interviewed', 'shortlisted'].includes(app.status)).length,
      offers: applications.filter(app => app.status === 'offered').length
    }

    // Get recent applications (last 5)
    const recentApplications = applications.slice(0, 5).map(app => ({
      id: app.id,
      jobTitle: app.job.title,
      company: app.job.employer.companyName,
      appliedDate: app.appliedAt.toISOString().split('T')[0],
      status: app.status,
      location: app.job.location,
      matchScore: app.matchScore
    }))

    // Get recommended jobs (active jobs that candidate hasn't applied to)
    const appliedJobIds = applications.map(app => app.jobId)
    const recommendedJobs = await prisma.job.findMany({
      where: {
        isActive: true,
        id: { notIn: appliedJobIds }
      },
      include: {
        employer: {
          select: { companyName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const formattedRecommendedJobs = recommendedJobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.employer.companyName,
      location: job.location || 'Not specified',
      salary: job.salaryMin && job.salaryMax
        ? `€${job.salaryMin.toLocaleString()} - €${job.salaryMax.toLocaleString()}`
        : 'Salary not specified',
      postedDate: job.createdAt.toISOString().split('T')[0],
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel
    }))

    const dashboardData = {
      stats,
      recentApplications,
      recommendedJobs: formattedRecommendedJobs,
      candidateInfo: {
        name: candidate.user.name,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.user.email,
        location: candidate.location,
        experienceYears: candidate.experienceYears
      }
    }

    res.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Dashboard data error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'DASHBOARD_FETCH_FAILED', message: 'Failed to fetch dashboard data' }
    })
  }
})

// Get candidate applications
router.get('/applications', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id

    // Get candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Get all applications for this candidate
    const applications = await prisma.application.findMany({
      where: { candidateId: candidate.id },
      include: {
        job: {
          include: {
            employer: {
              select: { companyName: true, logoUrl: true }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })

    const formattedApplications = applications.map(app => ({
      id: app.id,
      jobTitle: app.job.title,
      company: app.job.employer.companyName,
      appliedDate: app.appliedAt.toISOString().split('T')[0],
      status: app.status,
      location: app.job.location || 'Not specified',
      salary: app.job.salaryMin && app.job.salaryMax
        ? `€${app.job.salaryMin.toLocaleString()} - €${app.job.salaryMax.toLocaleString()}`
        : 'Salary not specified',
      employmentType: app.job.employmentType,
      experienceLevel: app.job.experienceLevel,
      matchScore: app.matchScore,
      coverLetterId: app.coverLetterId,
      notes: app.notes,
      rating: app.rating
    }))

    res.json({
      success: true,
      applications: formattedApplications
    })

  } catch (error) {
    console.error('Applications fetch error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'APPLICATIONS_FETCH_FAILED', message: 'Failed to fetch applications' }
    })
  }
})

// Apply to a job
router.post('/apply', (req, res) => {
  try {
    const { jobId, coverLetter } = req.body

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      })
    }

    // Mock application submission - replace with actual database insert
    console.log(`Application submitted for job ${jobId}`)
    console.log(`Cover letter: ${coverLetter?.substring(0, 100)}...`)

    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: Date.now() // Mock application ID
    })

  } catch (error) {
    console.error('Job application error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    })
  }
})

// Get CV data for candidate
router.get('/cv-data', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Get CV data from MongoDB
    let cvData = null
    if (candidate.cvDataId) {
      cvData = await mongoService.getCvDataById(candidate.cvDataId)
    } else {
      cvData = await mongoService.getCvData(candidate.id)
    }

    // If no CV data exists, create default structure
    if (!cvData) {
      const defaultCvData = {
        selectedTemplate: 'modern',
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: req.user.email || '',
        phone: '',
        address: '',
        city: candidate.location ? candidate.location.split(',')[0]?.trim() : '',
        country: candidate.location ? candidate.location.split(',')[1]?.trim() : '',
        linkedinUrl: candidate.linkedinUrl || '',
        githubUrl: candidate.githubUrl || '',
        portfolioUrl: candidate.portfolioUrl || '',
        professionalSummary: '',
        technicalSkills: '',
        softSkills: '',
        languages: '',
        workExperience: [
          {
            id: 1,
            jobTitle: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            description: ''
          }
        ],
        education: [
          {
            id: 1,
            degree: '',
            institution: '',
            location: '',
            graduationDate: '',
            gpa: '',
            description: ''
          }
        ],
        projects: [
          {
            id: 1,
            name: '',
            description: '',
            technologies: '',
            url: '',
            startDate: '',
            endDate: ''
          }
        ],
        certifications: [
          {
            id: 1,
            name: '',
            issuer: '',
            date: '',
            url: ''
          }
        ],
        isComplete: false,
        lastGenerated: null
      }

      // Save default CV data to MongoDB
      const result = await mongoService.saveCvData(candidate.id, defaultCvData)
      const cvDataId = result.insertedId.toString()

      // Update candidate with CV data reference
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { cvDataId }
      })

      return res.json({
        success: true,
        cvData: {
          ...defaultCvData,
          _id: cvDataId
        }
      })
    }

    res.json({
      success: true,
      cvData: cvData
    })

  } catch (error) {
    console.error('Error fetching CV data:', error)
    res.status(500).json({
      success: false,
      error: { code: 'CV_FETCH_FAILED', message: 'Failed to fetch CV data' }
    })
  }
})

// Save CV data for candidate
router.post('/save-cv-data', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id
    const cvData = req.body

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    })

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      })
    }

    // Update CV data in MongoDB
    const updateResult = await mongoService.updateCvData(candidate.id, {
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
      isComplete: cvData.isComplete || false
    })

    // If this is the first time saving CV data, update the candidate record
    if (!candidate.cvDataId && updateResult.upsertedId) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { cvDataId: updateResult.upsertedId.toString() }
      })
    }

    console.log('CV data saved for candidate:', candidate.id)

    res.json({
      success: true,
      message: 'CV data saved successfully',
      cvData: cvData
    })

  } catch (error) {
    console.error('Error saving CV data:', error)
    res.status(500).json({
      success: false,
      error: { code: 'CV_SAVE_FAILED', message: 'Failed to save CV data' }
    })
  }
})

// Template generation functions
function generateModernTemplate(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CV</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 40px;
          background: #f8f9fa;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section h2 {
          color: #667eea;
          border-left: 4px solid #667eea;
          padding-left: 15px;
          margin-bottom: 15px;
          font-size: 1.4em;
        }
        .experience-item, .education-item {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 5px;
        }
        .experience-item h3, .education-item h3 {
          color: #333;
          margin: 0 0 5px 0;
        }
        .date { color: #667eea; font-weight: bold; }
        .skills { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill-tag {
          background: #667eea;
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.firstName} ${data.lastName}</h1>
          <p>${data.email} | ${data.phone}</p>
          ${data.address ? `<p>${data.address}</p>` : ''}
        </div>

        <div class="content">
          ${data.professionalSummary ? `
            <div class="section">
              <h2>Professional Summary</h2>
              <p>${data.professionalSummary}</p>
            </div>
          ` : ''}

          ${data.workExperience && data.workExperience.length > 0 ? `
            <div class="section">
              <h2>Experience</h2>
              ${data.workExperience.map(exp => `
                <div class="experience-item">
                  <h3>${exp.jobTitle} at ${exp.company}</h3>
                  <p class="date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</p>
                  <p>${exp.location}</p>
                  <p>${exp.description}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.education && data.education.length > 0 ? `
            <div class="section">
              <h2>Education</h2>
              ${data.education.map(edu => `
                <div class="education-item">
                  <h3>${edu.degree}</h3>
                  <p>${edu.institution} - ${edu.location}</p>
                  <p class="date">${edu.graduationDate}</p>
                  ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.technicalSkills ? `
            <div class="section">
              <h2>Technical Skills</h2>
              <div class="skills">
                ${data.technicalSkills.split(',').map(skill => `
                  <span class="skill-tag">${skill.trim()}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

function generateClassicTemplate(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CV</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          margin: 0;
          padding: 40px;
          background: white;
          color: #000;
          line-height: 1.6;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 2.2em;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .header p { margin: 5px 0; font-size: 1.1em; }
        .section { margin-bottom: 25px; }
        .section h2 {
          color: #000;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
          margin-bottom: 15px;
          font-size: 1.3em;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .experience-item, .education-item {
          margin-bottom: 15px;
        }
        .experience-item h3, .education-item h3 {
          margin: 0 0 5px 0;
          font-weight: bold;
        }
        .date { font-style: italic; }
        .skills-list {
          columns: 2;
          column-gap: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.firstName} ${data.lastName}</h1>
          <p>${data.email} | ${data.phone}</p>
          ${data.address ? `<p>${data.address}</p>` : ''}
        </div>

        ${data.professionalSummary ? `
          <div class="section">
            <h2>Professional Summary</h2>
            <p>${data.professionalSummary}</p>
          </div>
        ` : ''}

        ${data.workExperience && data.workExperience.length > 0 ? `
          <div class="section">
            <h2>Professional Experience</h2>
            ${data.workExperience.map(exp => `
              <div class="experience-item">
                <h3>${exp.jobTitle}</h3>
                <p><strong>${exp.company}</strong> - ${exp.location}</p>
                <p class="date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</p>
                <p>${exp.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.education && data.education.length > 0 ? `
          <div class="section">
            <h2>Education</h2>
            ${data.education.map(edu => `
              <div class="education-item">
                <h3>${edu.degree}</h3>
                <p><strong>${edu.institution}</strong> - ${edu.location}</p>
                <p class="date">${edu.graduationDate}</p>
                ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.technicalSkills ? `
          <div class="section">
            <h2>Technical Skills</h2>
            <div class="skills-list">
              <p>${data.technicalSkills}</p>
            </div>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `
}

function generateCreativeTemplate(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CV</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
        }
        .header h1 {
          margin: 0;
          font-size: 3em;
          font-weight: 300;
          position: relative;
          z-index: 1;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section h2 {
          color: #667eea;
          font-size: 1.8em;
          margin-bottom: 20px;
          position: relative;
          padding-left: 30px;
        }
        .section h2::before {
          content: '\\1F680';
          position: absolute;
          left: 0;
          top: 0;
        }
        .experience-item, .education-item {
          margin-bottom: 25px;
          padding: 20px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border-radius: 15px;
          transform: perspective(1000px) rotateX(0deg);
          transition: transform 0.3s ease;
        }
        .experience-item:hover, .education-item:hover {
          transform: perspective(1000px) rotateX(5deg);
        }
        .experience-item h3, .education-item h3 {
          margin: 0 0 10px 0;
          font-size: 1.3em;
        }
        .date {
          background: rgba(255,255,255,0.2);
          padding: 5px 10px;
          border-radius: 10px;
          display: inline-block;
          margin-bottom: 10px;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .skill-tag {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          font-size: 0.9em;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          transform: translateY(0);
          transition: transform 0.3s ease;
        }
        .skill-tag:hover {
          transform: translateY(-5px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.firstName} ${data.lastName}</h1>
          <p>&star; ${data.email} | ${data.phone} &star;</p>
          ${data.address ? `<p>&bull; ${data.address}</p>` : ''}
        </div>

        <div class="content">
          ${data.professionalSummary ? `
            <div class="section">
              <h2>About Me</h2>
              <p style="font-size: 1.1em; line-height: 1.8;">${data.professionalSummary}</p>
            </div>
          ` : ''}

          ${data.workExperience && data.workExperience.length > 0 ? `
            <div class="section">
              <h2>Experience Journey</h2>
              ${data.workExperience.map(exp => `
                <div class="experience-item">
                  <h3>&bull; ${exp.jobTitle} at ${exp.company}</h3>
                  <div class="date">&raquo; ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
                  <p>&bull; ${exp.location}</p>
                  <p>${exp.description}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.education && data.education.length > 0 ? `
            <div class="section">
              <h2>Education Path</h2>
              ${data.education.map(edu => `
                <div class="education-item">
                  <h3>&bull; ${edu.degree}</h3>
                  <p>&bull; ${edu.institution} - ${edu.location}</p>
                  <div class="date">&raquo; ${edu.graduationDate}</div>
                  ${edu.gpa ? `<p>&star; GPA: ${edu.gpa}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.technicalSkills ? `
            <div class="section">
              <h2>Skills Arsenal</h2>
              <div class="skills">
                ${data.technicalSkills.split(',').map(skill => `
                  <span class="skill-tag">${skill.trim()}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate CV for candidate
router.post('/generate-cv', async (req, res) => {
  try {
    const { template, data } = req.body
    console.log('Generating CV with template:', template)
    console.log('CV data received:', data)

    // Generate different HTML based on selected template
    let htmlContent = ''

    if (template === 'modern') {
      htmlContent = generateModernTemplate(data)
    } else if (template === 'classic') {
      htmlContent = generateClassicTemplate(data)
    } else if (template === 'creative') {
      htmlContent = generateCreativeTemplate(data)
    } else {
      // Default to modern if template not recognized
      htmlContent = generateModernTemplate(data)
    }

    res.json({
      success: true,
      format: 'html',
      htmlContent: htmlContent,
      template: template,
      message: `CV generated successfully with ${template} template`
    })

  } catch (error) {
    console.error('Error generating CV:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate CV'
    })
  }
})

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Candidates API is healthy',
    timestamp: new Date().toISOString()
  })
})

module.exports = router
