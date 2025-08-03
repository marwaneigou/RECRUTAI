const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { mongoService } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const prisma = new PrismaClient();

const execAsync = promisify(exec);

// LaTeX template for Modern CV
const modernTemplate = (data) => `
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}
\\usepackage[scale=0.75]{geometry}
\\usepackage[utf8]{inputenc}

% Personal data
\\name{${data.firstName}}{${data.lastName}}
\\title{${data.professionalSummary || 'Professional'}}
\\address{${data.address || ''}}{${data.city || ''}, ${data.country || ''}}
\\phone[mobile]{${data.phone || ''}}
\\email{${data.email || ''}}
${data.linkedinUrl ? `\\social[linkedin]{${data.linkedinUrl.replace('https://linkedin.com/in/', '')}}` : ''}
${data.githubUrl ? `\\social[github]{${data.githubUrl.replace('https://github.com/', '')}}` : ''}
${data.portfolioUrl ? `\\homepage{${data.portfolioUrl}}` : ''}

\\begin{document}
\\makecvtitle

% Professional Summary
${data.professionalSummary ? `
\\section{Professional Summary}
\\cvitem{}{${data.professionalSummary}}
` : ''}

% Work Experience
${data.workExperience && data.workExperience.length > 0 ? `
\\section{Work Experience}
${data.workExperience.map(exp => `
\\cventry{${exp.startDate || ''}--${exp.current ? 'Present' : exp.endDate || ''}}{${exp.jobTitle || ''}}{${exp.company || ''}}{${exp.location || ''}}{}{${exp.description || ''}}
`).join('')}
` : ''}

% Education
${data.education && data.education.length > 0 ? `
\\section{Education}
${data.education.map(edu => `
\\cventry{${edu.graduationDate || ''}}{${edu.degree || ''}}{${edu.institution || ''}}{${edu.location || ''}}{${edu.gpa ? `GPA: ${edu.gpa}` : ''}}{${edu.description || ''}}
`).join('')}
` : ''}

% Skills
${data.technicalSkills || data.softSkills || data.languages ? `
\\section{Skills}
${data.technicalSkills ? `\\cvitem{Technical}{${data.technicalSkills}}` : ''}
${data.softSkills ? `\\cvitem{Soft Skills}{${data.softSkills}}` : ''}
${data.languages ? `\\cvitem{Languages}{${data.languages}}` : ''}
` : ''}

% Projects
${data.projects && data.projects.length > 0 && data.projects[0].name ? `
\\section{Projects}
${data.projects.map(project => `
\\cvitem{${project.name || ''}}{${project.description || ''} ${project.technologies ? `\\\\Technologies: ${project.technologies}` : ''} ${project.url ? `\\\\URL: ${project.url}` : ''}}
`).join('')}
` : ''}

% Certifications
${data.certifications && data.certifications.length > 0 && data.certifications[0].name ? `
\\section{Certifications}
${data.certifications.map(cert => `
\\cvitem{${cert.date || ''}}{${cert.name || ''} - ${cert.issuer || ''} ${cert.url ? `\\\\URL: ${cert.url}` : ''}}
`).join('')}
` : ''}

\\end{document}
`;

// LaTeX template for Classic CV
const classicTemplate = (data) => `
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titleformat{\\subsection}{\\bfseries}{}{0em}{}

\\begin{document}

% Header
\\begin{center}
{\\LARGE \\textbf{${data.firstName} ${data.lastName}}}\\\\[0.5em]
${data.address ? `${data.address}\\\\` : ''}
${data.city || data.country ? `${data.city}${data.city && data.country ? ', ' : ''}${data.country}\\\\` : ''}
${data.phone ? `Phone: ${data.phone}\\\\` : ''}
${data.email ? `Email: ${data.email}\\\\` : ''}
${data.linkedinUrl ? `LinkedIn: \\href{${data.linkedinUrl}}{${data.linkedinUrl}}\\\\` : ''}
${data.githubUrl ? `GitHub: \\href{${data.githubUrl}}{${data.githubUrl}}\\\\` : ''}
${data.portfolioUrl ? `Portfolio: \\href{${data.portfolioUrl}}{${data.portfolioUrl}}\\\\` : ''}
\\end{center}

% Professional Summary
${data.professionalSummary ? `
\\section{Professional Summary}
${data.professionalSummary}
` : ''}

% Work Experience
${data.workExperience && data.workExperience.length > 0 ? `
\\section{Work Experience}
${data.workExperience.map(exp => `
\\subsection{${exp.jobTitle || ''} - ${exp.company || ''}}
\\textit{${exp.startDate || ''}${exp.endDate || exp.current ? ' - ' : ''}${exp.current ? 'Present' : exp.endDate || ''}} ${exp.location ? `\\hfill ${exp.location}` : ''}\\\\
${exp.description || ''}\\\\
`).join('')}
` : ''}

% Education
${data.education && data.education.length > 0 ? `
\\section{Education}
${data.education.map(edu => `
\\subsection{${edu.degree || ''}}
\\textit{${edu.institution || ''}} ${edu.graduationDate ? `\\hfill ${edu.graduationDate}` : ''}\\\\
${edu.location ? `${edu.location}\\\\` : ''}
${edu.gpa ? `GPA: ${edu.gpa}\\\\` : ''}
${edu.description ? `${edu.description}\\\\` : ''}
`).join('')}
` : ''}

% Skills
${data.technicalSkills || data.softSkills || data.languages ? `
\\section{Skills}
${data.technicalSkills ? `\\textbf{Technical Skills:} ${data.technicalSkills}\\\\` : ''}
${data.softSkills ? `\\textbf{Soft Skills:} ${data.softSkills}\\\\` : ''}
${data.languages ? `\\textbf{Languages:} ${data.languages}\\\\` : ''}
` : ''}

% Projects
${data.projects && data.projects.length > 0 && data.projects[0].name ? `
\\section{Projects}
${data.projects.map(project => `
\\subsection{${project.name || ''}}
${project.description || ''}\\\\
${project.technologies ? `\\textbf{Technologies:} ${project.technologies}\\\\` : ''}
${project.url ? `\\textbf{URL:} \\href{${project.url}}{${project.url}}\\\\` : ''}
`).join('')}
` : ''}

% Certifications
${data.certifications && data.certifications.length > 0 && data.certifications[0].name ? `
\\section{Certifications}
${data.certifications.map(cert => `
\\textbf{${cert.name || ''}} - ${cert.issuer || ''} ${cert.date ? `(${cert.date})` : ''}\\\\
${cert.url ? `URL: \\href{${cert.url}}{${cert.url}}\\\\` : ''}
`).join('')}
` : ''}

\\end{document}
`;

// LaTeX template for Creative CV
const creativeTemplate = (data) => `
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.8in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{tikz}

\\definecolor{primary}{RGB}{52, 152, 219}
\\definecolor{secondary}{RGB}{46, 204, 113}

\\titleformat{\\section}{\\color{primary}\\Large\\bfseries}{}{0em}{}[\\color{primary}\\titlerule]
\\titleformat{\\subsection}{\\color{secondary}\\large\\bfseries}{}{0em}{}

\\begin{document}

% Creative Header
\\begin{center}
\\begin{tikzpicture}
\\node[rectangle, fill=primary, text=white, minimum width=\\textwidth, minimum height=2cm] at (0,0) {
\\begin{tabular}{c}
{\\Huge \\textbf{${data.firstName} ${data.lastName}}} \\\\[0.3em]
{\\Large ${data.professionalSummary ? data.professionalSummary.substring(0, 50) + '...' : 'Creative Professional'}}
\\end{tabular}
};
\\end{tikzpicture}
\\end{center}

\\vspace{1em}

% Contact Information
\\begin{center}
${data.email ? `\\textbf{Email:} ${data.email} \\quad` : ''}
${data.phone ? `\\textbf{Phone:} ${data.phone} \\quad` : ''}
${data.city || data.country ? `\\textbf{Location:} ${data.city}${data.city && data.country ? ', ' : ''}${data.country}` : ''}\\\\
${data.linkedinUrl ? `\\href{${data.linkedinUrl}}{LinkedIn} \\quad` : ''}
${data.githubUrl ? `\\href{${data.githubUrl}}{GitHub} \\quad` : ''}
${data.portfolioUrl ? `\\href{${data.portfolioUrl}}{Portfolio}` : ''}
\\end{center}

% Professional Summary
${data.professionalSummary ? `
\\section{About Me}
${data.professionalSummary}
` : ''}

% Work Experience
${data.workExperience && data.workExperience.length > 0 ? `
\\section{Experience}
${data.workExperience.map(exp => `
\\subsection{${exp.jobTitle || ''}}
\\textcolor{primary}{\\textbf{${exp.company || ''}}} \\hfill \\textcolor{secondary}{${exp.startDate || ''}${exp.endDate || exp.current ? ' - ' : ''}${exp.current ? 'Present' : exp.endDate || ''}}\\\\
${exp.location ? `\\textit{${exp.location}}\\\\` : ''}
${exp.description || ''}\\\\
`).join('')}
` : ''}

% Education
${data.education && data.education.length > 0 ? `
\\section{Education}
${data.education.map(edu => `
\\subsection{${edu.degree || ''}}
\\textcolor{primary}{\\textbf{${edu.institution || ''}}} \\hfill \\textcolor{secondary}{${edu.graduationDate || ''}}\\\\
${edu.location ? `\\textit{${edu.location}}\\\\` : ''}
${edu.gpa ? `\\textbf{GPA:} ${edu.gpa}\\\\` : ''}
${edu.description ? `${edu.description}\\\\` : ''}
`).join('')}
` : ''}

% Skills
${data.technicalSkills || data.softSkills || data.languages ? `
\\section{Skills \\& Expertise}
${data.technicalSkills ? `\\textcolor{primary}{\\textbf{Technical:}} ${data.technicalSkills}\\\\` : ''}
${data.softSkills ? `\\textcolor{primary}{\\textbf{Soft Skills:}} ${data.softSkills}\\\\` : ''}
${data.languages ? `\\textcolor{primary}{\\textbf{Languages:}} ${data.languages}\\\\` : ''}
` : ''}

% Projects
${data.projects && data.projects.length > 0 && data.projects[0].name ? `
\\section{Featured Projects}
${data.projects.map(project => `
\\subsection{${project.name || ''}}
${project.description || ''}\\\\
${project.technologies ? `\\textcolor{secondary}{\\textbf{Tech Stack:}} ${project.technologies}\\\\` : ''}
${project.url ? `\\textcolor{primary}{\\textbf{Link:}} \\href{${project.url}}{${project.url}}\\\\` : ''}
`).join('')}
` : ''}

\\end{document}
`;

// Generate CV endpoint
router.post('/generate-cv', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const { template, data } = req.body;
    const userId = req.user.id;

    // Get candidate and CV data from database
    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      include: { cvData: true }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      });
    }

    // Use database data if available, otherwise use provided data
    const cvData = candidate.cvData || data;

    // Validate template
    const validTemplates = ['modern', 'classic', 'creative'];
    const selectedTemplate = template || cvData.selectedTemplate || 'modern';
    if (!validTemplates.includes(selectedTemplate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TEMPLATE',
          message: 'Invalid template selected'
        }
      });
    }

    // Create temporary directory for this user
    const tempDir = path.join(__dirname, '../../temp', `cv_${userId}_${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    console.log('Created temp directory:', tempDir);

    // Select template
    let latexContent;
    switch (selectedTemplate) {
      case 'modern':
        latexContent = modernTemplate(cvData);
        break;
      case 'classic':
        latexContent = classicTemplate(cvData);
        break;
      case 'creative':
        latexContent = creativeTemplate(cvData);
        break;
    }

    // Write LaTeX file
    const texFile = path.join(tempDir, 'cv.tex');
    await fs.writeFile(texFile, latexContent, 'utf8');

    // Try LaTeX compilation first, fallback to HTML
    let pdfGenerated = false;
    let cvUrl;

    try {
      // Check if pdflatex is available
      await execAsync('pdflatex --version');

      // Compile LaTeX to PDF
      await execAsync(`pdflatex -output-directory="${tempDir}" "${texFile}"`);
      await execAsync(`pdflatex -output-directory="${tempDir}" "${texFile}"`);

      // Check if PDF was created
      const pdfFile = path.join(tempDir, 'cv.pdf');
      await fs.access(pdfFile);

      // Extract just the folder name for URL
      const folderName = path.basename(tempDir);
      cvUrl = `/temp/${folderName}/cv.pdf`;
      pdfGenerated = true;

    } catch (latexError) {
      console.log('LaTeX not available, using HTML generation:', latexError.message);

      // Update lastGenerated timestamp in database
      if (candidate.cvData) {
        await prisma.cvData.update({
          where: { candidateId: candidate.id },
          data: { lastGenerated: new Date() }
        });
      }

      // Fallback: Return HTML content directly
      const htmlContent = generateHTMLCV(selectedTemplate, cvData);

      return res.json({
        success: true,
        htmlContent: htmlContent,
        message: 'CV generated successfully (HTML - Print to save as PDF)',
        format: 'html',
        template: selectedTemplate
      });
    }

    console.log('Sending response with cvUrl:', cvUrl);

    res.json({
      success: true,
      pdfUrl: cvUrl,
      message: pdfGenerated ? 'CV generated successfully (PDF)' : 'CV generated successfully (HTML - Print to save as PDF)',
      format: pdfGenerated ? 'pdf' : 'html'
    });

  } catch (error) {
    console.error('CV generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CV_GENERATION_FAILED',
        message: 'Failed to generate CV'
      }
    });
  }
});

// Get CV data for candidate
router.get('/cv-data', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      });
    }

    // Get CV data from MongoDB
    let cvData = null;
    if (candidate.cvDataId) {
      cvData = await mongoService.getCvDataById(candidate.cvDataId);
    } else {
      cvData = await mongoService.getCvData(candidate.id);
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
        city: '',
        country: '',
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
      };

      // Save default CV data to MongoDB
      const result = await mongoService.saveCvData(candidate.id, defaultCvData);
      const cvDataId = result.insertedId.toString();

      // Update candidate with CV data reference
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { cvDataId }
      });

      return res.json({
        success: true,
        cvData: {
          ...defaultCvData,
          _id: cvDataId
        }
      });
    }

    res.json({
      success: true,
      cvData: cvData
    });

  } catch (error) {
    console.error('Error fetching CV data:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CV_DATA_FETCH_FAILED', message: 'Failed to fetch CV data' }
    });
  }
});

// Save CV data
router.post('/save-cv-data', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const userId = req.user.id;
    const cvData = req.body;

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { userId }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
      });
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
    });

    // Get the updated CV data
    const savedCvData = await mongoService.getCvData(candidate.id);

    // If this is a new CV data document, update the candidate with the reference
    if (updateResult.upsertedId && !candidate.cvDataId) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { cvDataId: updateResult.upsertedId.toString() }
      });
    }

    res.json({
      success: true,
      message: 'CV data saved successfully',
      cvData: savedCvData
    });

  } catch (error) {
    console.error('Error saving CV data:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CV_DATA_SAVE_FAILED', message: 'Failed to save CV data' }
    });
  }
});

// Test endpoint to verify static file serving
router.get('/test-static', (req, res) => {
  res.json({
    success: true,
    message: 'CV routes are working',
    timestamp: new Date().toISOString()
  });
});

// Get candidate CV for employers (view applications)
router.get('/candidate-cv/:candidateId', authenticateToken, authorizeRoles(['employer']), async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Get candidate basic info
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) },
      include: {
        user: {
          select: { email: true, createdAt: true }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate not found' }
      });
    }

    // Get CV data from MongoDB
    let cvData = null;
    if (candidate.cvDataId) {
      cvData = await mongoService.getCvDataById(candidate.cvDataId);
    } else {
      cvData = await mongoService.getCvData(parseInt(candidateId));
    }

    if (!cvData) {
      return res.status(404).json({
        success: false,
        error: { code: 'CV_NOT_FOUND', message: 'Candidate CV not found' }
      });
    }

    // Generate HTML CV for employer viewing
    const htmlContent = generateHTMLCV(cvData.selectedTemplate || 'modern', cvData);

    res.json({
      success: true,
      htmlContent: htmlContent,
      candidateInfo: {
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.user.email,
        template: cvData.selectedTemplate || 'modern',
        lastGenerated: cvData.lastGenerated,
        isComplete: cvData.isComplete
      },
      cvData: cvData,
      format: 'html'
    });

  } catch (error) {
    console.error('Error fetching candidate CV:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CV_FETCH_FAILED', message: 'Failed to fetch candidate CV' }
    });
  }
});

// Download CV endpoint
router.post('/download-cv', authenticateToken, authorizeRoles(['candidate']), async (req, res) => {
  try {
    const { template, data } = req.body;

    // For now, return a mock PDF response
    res.json({
      success: true,
      message: 'CV download will be implemented with proper LaTeX setup'
    });

  } catch (error) {
    console.error('CV download error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CV_DOWNLOAD_FAILED',
        message: 'Failed to download CV'
      }
    });
  }
});

// Enhanced HTML generation functions
function generateHTMLCV(template, data) {
  switch (template) {
    case 'modern':
      return generateModernHTML(data);
    case 'classic':
      return generateClassicHTML(data);
    case 'creative':
      return generateCreativeHTML(data);
    default:
      return generateClassicHTML(data);
  }
}

function generatePrintableHTML(template, data) {
  const content = generateHTMLCV(template, data);
  return content.replace('<style>', `<style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    @page { margin: 1cm; }
  `);
}

function generateModernHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.firstName} ${data.lastName} - CV</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          color: #333;
          background: #f8f9fa;
        }
        .cv-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          display: grid;
          grid-template-columns: 1fr 2fr;
          min-height: 100vh;
        }
        .sidebar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 25px;
        }
        .main-content { padding: 30px; }
        .name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .title { font-size: 16px; opacity: 0.9; margin-bottom: 30px; }
        .contact-item { margin-bottom: 10px; font-size: 14px; }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
          border-bottom: 2px solid #667eea;
          margin: 25px 0 15px 0;
          padding-bottom: 5px;
        }
        .sidebar .section-title { color: white; border-bottom-color: white; }
        .experience-item, .education-item { margin-bottom: 20px; }
        .job-title { font-weight: bold; color: #333; }
        .company { color: #667eea; font-weight: 500; }
        .date { color: #666; font-size: 14px; }
        .description { margin-top: 8px; }
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
        .skill { background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 15px; text-align: center; font-size: 12px; }
        .main-content .skill { background: #f0f4ff; color: #667eea; }
        @media print {
          body { background: white; }
          .cv-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <div class="sidebar">
          <div class="name">${data.firstName} ${data.lastName}</div>
          <div class="title">${data.professionalSummary ? data.professionalSummary.substring(0, 50) + '...' : 'Professional'}</div>

          <div class="section-title">Contact</div>
          ${data.email ? `<div class="contact-item">📧 ${data.email}</div>` : ''}
          ${data.phone ? `<div class="contact-item">📞 ${data.phone}</div>` : ''}
          ${data.city || data.country ? `<div class="contact-item">📍 ${data.city}${data.city && data.country ? ', ' : ''}${data.country}</div>` : ''}
          ${data.linkedinUrl ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
          ${data.githubUrl ? `<div class="contact-item">💻 GitHub</div>` : ''}

          ${data.technicalSkills ? `
            <div class="section-title">Technical Skills</div>
            <div class="skills-grid">
              ${data.technicalSkills.split(',').map(skill => `<div class="skill">${skill.trim()}</div>`).join('')}
            </div>
          ` : ''}

          ${data.languages ? `
            <div class="section-title">Languages</div>
            <div class="skills-grid">
              ${data.languages.split(',').map(lang => `<div class="skill">${lang.trim()}</div>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="main-content">
          ${data.professionalSummary ? `
            <div class="section-title">Professional Summary</div>
            <p>${data.professionalSummary}</p>
          ` : ''}

          ${data.workExperience && data.workExperience.length > 0 ? `
            <div class="section-title">Work Experience</div>
            ${data.workExperience.map(exp => `
              <div class="experience-item">
                <div class="job-title">${exp.jobTitle || ''}</div>
                <div class="company">${exp.company || ''} <span class="date">${exp.startDate || ''}${exp.endDate || exp.current ? ' - ' : ''}${exp.current ? 'Present' : exp.endDate || ''}</span></div>
                ${exp.location ? `<div class="date">${exp.location}</div>` : ''}
                ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
              </div>
            `).join('')}
          ` : ''}

          ${data.education && data.education.length > 0 ? `
            <div class="section-title">Education</div>
            ${data.education.map(edu => `
              <div class="education-item">
                <div class="job-title">${edu.degree || ''}</div>
                <div class="company">${edu.institution || ''} <span class="date">${edu.graduationDate || ''}</span></div>
                ${edu.location ? `<div class="date">${edu.location}</div>` : ''}
                ${edu.gpa ? `<div class="date">GPA: ${edu.gpa}</div>` : ''}
                ${edu.description ? `<div class="description">${edu.description}</div>` : ''}
              </div>
            `).join('')}
          ` : ''}

          ${data.projects && data.projects.length > 0 && data.projects[0].name ? `
            <div class="section-title">Projects</div>
            ${data.projects.map(project => `
              <div class="experience-item">
                <div class="job-title">${project.name || ''}</div>
                ${project.description ? `<div class="description">${project.description}</div>` : ''}
                ${project.technologies ? `<div class="date">Technologies: ${project.technologies}</div>` : ''}
              </div>
            `).join('')}
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateClassicHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.firstName} ${data.lastName} - CV</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          margin: 40px;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 40px auto;
        }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
        .name { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .contact { margin-bottom: 20px; }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1px solid #333;
          margin: 25px 0 15px 0;
          padding-bottom: 5px;
        }
        .experience-item, .education-item { margin-bottom: 20px; }
        .job-title { font-weight: bold; font-size: 16px; }
        .company { font-style: italic; }
        .date { float: right; color: #666; }
        .description { margin-top: 8px; text-align: justify; }
        .skills-list { margin-top: 10px; }
        @media print {
          body { margin: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${data.firstName} ${data.lastName}</div>
        <div class="contact">
          ${data.email ? `${data.email} | ` : ''}
          ${data.phone ? `${data.phone} | ` : ''}
          ${data.city || data.country ? `${data.city}${data.city && data.country ? ', ' : ''}${data.country}` : ''}
        </div>
        ${data.linkedinUrl || data.githubUrl || data.portfolioUrl ? `
          <div class="contact">
            ${data.linkedinUrl ? `LinkedIn | ` : ''}
            ${data.githubUrl ? `GitHub | ` : ''}
            ${data.portfolioUrl ? `Portfolio` : ''}
          </div>
        ` : ''}
      </div>

      ${data.professionalSummary ? `
        <div class="section-title">Professional Summary</div>
        <p style="text-align: justify;">${data.professionalSummary}</p>
      ` : ''}

      ${data.workExperience && data.workExperience.length > 0 ? `
        <div class="section-title">Work Experience</div>
        ${data.workExperience.map(exp => `
          <div class="experience-item">
            <div class="job-title">${exp.jobTitle || ''} <span class="date">${exp.startDate || ''}${exp.endDate || exp.current ? ' - ' : ''}${exp.current ? 'Present' : exp.endDate || ''}</span></div>
            <div class="company">${exp.company || ''}${exp.location ? `, ${exp.location}` : ''}</div>
            ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
          </div>
        `).join('')}
      ` : ''}

      ${data.education && data.education.length > 0 ? `
        <div class="section-title">Education</div>
        ${data.education.map(edu => `
          <div class="education-item">
            <div class="job-title">${edu.degree || ''} <span class="date">${edu.graduationDate || ''}</span></div>
            <div class="company">${edu.institution || ''}${edu.location ? `, ${edu.location}` : ''}</div>
            ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
            ${edu.description ? `<div class="description">${edu.description}</div>` : ''}
          </div>
        `).join('')}
      ` : ''}

      ${data.technicalSkills || data.softSkills || data.languages ? `
        <div class="section-title">Skills</div>
        ${data.technicalSkills ? `<div class="skills-list"><strong>Technical Skills:</strong> ${data.technicalSkills}</div>` : ''}
        ${data.softSkills ? `<div class="skills-list"><strong>Soft Skills:</strong> ${data.softSkills}</div>` : ''}
        ${data.languages ? `<div class="skills-list"><strong>Languages:</strong> ${data.languages}</div>` : ''}
      ` : ''}

      ${data.projects && data.projects.length > 0 && data.projects[0].name ? `
        <div class="section-title">Projects</div>
        ${data.projects.map(project => `
          <div class="experience-item">
            <div class="job-title">${project.name || ''}</div>
            ${project.description ? `<div class="description">${project.description}</div>` : ''}
            ${project.technologies ? `<div><strong>Technologies:</strong> ${project.technologies}</div>` : ''}
          </div>
        `).join('')}
      ` : ''}

    </body>
    </html>
  `;
}

function generateCreativeHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.firstName} ${data.lastName} - CV</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .cv-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-top: 20px solid #2c3e50;
        }
        .name { font-size: 36px; font-weight: bold; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .title { font-size: 18px; opacity: 0.9; margin-bottom: 20px; }
        .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 20px; }
        .contact-item { background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 20px; text-align: center; font-size: 14px; }
        .main-content { padding: 30px; }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #2c3e50;
          margin: 25px 0 15px 0;
          position: relative;
          padding-left: 20px;
        }
        .section-title::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 20px;
          background: linear-gradient(135deg, #3498db, #2c3e50);
          border-radius: 2px;
        }
        .experience-item, .education-item {
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          border-left: 4px solid #3498db;
        }
        .job-title { font-weight: bold; font-size: 18px; color: #2c3e50; }
        .company { color: #3498db; font-weight: 500; margin: 5px 0; }
        .date { color: #666; font-size: 14px; }
        .description { margin-top: 10px; }
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-top: 15px; }
        .skill {
          background: linear-gradient(135deg, #3498db, #2c3e50);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
        }
        @media print {
          body { background: white; }
          .cv-container { box-shadow: none; border-radius: 0; }
          .header::after { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <div class="header">
          <div class="name">${data.firstName} ${data.lastName}</div>
          <div class="title">${data.professionalSummary ? data.professionalSummary.substring(0, 60) + '...' : 'Creative Professional'}</div>

          <div class="contact-grid">
            ${data.email ? `<div class="contact-item">📧 Email</div>` : ''}
            ${data.phone ? `<div class="contact-item">📞 Phone</div>` : ''}
            ${data.city || data.country ? `<div class="contact-item">📍 Location</div>` : ''}
            ${data.linkedinUrl ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
            ${data.githubUrl ? `<div class="contact-item">💻 GitHub</div>` : ''}
            ${data.portfolioUrl ? `<div class="contact-item">🌐 Portfolio</div>` : ''}
          </div>
        </div>

        <div class="main-content">
          ${data.professionalSummary ? `
            <div class="section-title">About Me</div>
            <p style="font-size: 16px; text-align: justify;">${data.professionalSummary}</p>
          ` : ''}

          ${data.workExperience && data.workExperience.length > 0 ? `
            <div class="section-title">Experience</div>
            ${data.workExperience.map(exp => `
              <div class="experience-item">
                <div class="job-title">${exp.jobTitle || ''}</div>
                <div class="company">${exp.company || ''}</div>
                <div class="date">${exp.startDate || ''}${exp.endDate || exp.current ? ' - ' : ''}${exp.current ? 'Present' : exp.endDate || ''} ${exp.location ? `• ${exp.location}` : ''}</div>
                ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
              </div>
            `).join('')}
          ` : ''}

          ${data.education && data.education.length > 0 ? `
            <div class="section-title">Education</div>
            ${data.education.map(edu => `
              <div class="education-item">
                <div class="job-title">${edu.degree || ''}</div>
                <div class="company">${edu.institution || ''}</div>
                <div class="date">${edu.graduationDate || ''} ${edu.location ? `• ${edu.location}` : ''}</div>
                ${edu.gpa ? `<div class="date">GPA: ${edu.gpa}</div>` : ''}
                ${edu.description ? `<div class="description">${edu.description}</div>` : ''}
              </div>
            `).join('')}
          ` : ''}

          ${data.technicalSkills ? `
            <div class="section-title">Skills & Expertise</div>
            <div class="skills-grid">
              ${data.technicalSkills.split(',').map(skill => `<div class="skill">${skill.trim()}</div>`).join('')}
            </div>
          ` : ''}

          ${data.projects && data.projects.length > 0 && data.projects[0].name ? `
            <div class="section-title">Featured Projects</div>
            ${data.projects.map(project => `
              <div class="experience-item">
                <div class="job-title">${project.name || ''}</div>
                ${project.description ? `<div class="description">${project.description}</div>` : ''}
                ${project.technologies ? `<div class="date">Tech Stack: ${project.technologies}</div>` : ''}
              </div>
            `).join('')}
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
