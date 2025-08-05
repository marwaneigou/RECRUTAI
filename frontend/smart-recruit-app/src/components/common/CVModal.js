import React from 'react';
import { XMarkIcon, DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';
import CVViewer from './CVViewer';

const CVModal = ({ isOpen, onClose, cvSnapshot, candidateName, jobTitle }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    // Create a print-optimized version
    const printContent = createPrintableContent();
    const printWindow = window.open('', '_blank');

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownload = () => {
    // Create a downloadable version and open in new tab for PDF saving
    const printContent = createPrintableContent();
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open in new tab for user to save as PDF
    const newWindow = window.open(url, '_blank');

    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const createPrintableContent = () => {
    const cvContent = document.getElementById('cv-content');
    if (!cvContent) return '';

    const cvData = cvSnapshot?.cvData || cvSnapshot;
    const candidateFullName = candidateName || `${cvData?.first_name || ''} ${cvData?.last_name || ''}`.trim();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CV</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
              margin: 0;
              padding: 20px;
            }

            .cv-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .cv-header {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }

            .cv-header h1 {
              font-size: 2.5rem;
              font-weight: bold;
              margin-bottom: 10px;
            }

            .cv-header p {
              font-size: 1.1rem;
              opacity: 0.9;
            }

            .cv-content {
              padding: 30px;
            }

            .cv-section {
              margin-bottom: 30px;
            }

            .cv-section h2 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            }

            .cv-section h3 {
              font-size: 1.2rem;
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }

            .cv-section p, .cv-section li {
              color: #6b7280;
              margin-bottom: 8px;
            }

            .contact-info {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
            }

            .contact-item {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .experience-item, .education-item {
              margin-bottom: 20px;
              padding: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
            }

            .item-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
            }

            .item-title {
              font-weight: 600;
              color: #1f2937;
            }

            .item-company {
              color: #2563eb;
              font-weight: 500;
            }

            .item-date {
              color: #6b7280;
              font-size: 0.9rem;
            }

            .skills-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }

            .skill-category h4 {
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }

            .skill-list {
              color: #6b7280;
            }

            .footer-info {
              text-align: center;
              padding: 20px;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 0.9rem;
            }

            @media print {
              body {
                margin: 0;
                padding: 0;
                background: white;
              }

              .cv-container {
                box-shadow: none;
                border-radius: 0;
              }

              .no-print {
                display: none !important;
              }

              @page {
                margin: 1cm;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          ${generateFormattedCVContent(cvData, candidateFullName)}
        </body>
      </html>
    `;
  };

  const generateFormattedCVContent = (cvData, candidateFullName) => {
    if (!cvData) return '<p>No CV data available</p>';

    return `
      <div class="cv-container">
        <div class="cv-header">
          <h1>${candidateFullName}</h1>
          <p>${cvData.professional_summary || cvData.professionalSummary || 'Professional Summary Not Available'}</p>
        </div>

        <div class="cv-content">
          <!-- Contact Information -->
          <div class="cv-section">
            <h2>Contact Information</h2>
            <div class="contact-info">
              ${cvData.email ? `<div class="contact-item">📧 ${cvData.email}</div>` : ''}
              ${cvData.phone ? `<div class="contact-item">📱 ${cvData.phone}</div>` : ''}
              ${(cvData.address || cvData.city) ? `<div class="contact-item">📍 ${cvData.address || cvData.city}${cvData.country ? ', ' + cvData.country : ''}</div>` : ''}
              ${(cvData.linkedinUrl || cvData.linkedin_url) ? `<div class="contact-item">💼 LinkedIn Profile</div>` : ''}
              ${(cvData.githubUrl || cvData.github_url) ? `<div class="contact-item">💻 GitHub Profile</div>` : ''}
            </div>
          </div>

          <!-- Skills -->
          ${(cvData.technical_skills || cvData.technicalSkills || cvData.soft_skills || cvData.softSkills || cvData.languages) ? `
          <div class="cv-section">
            <h2>Skills</h2>
            <div class="skills-grid">
              ${cvData.technical_skills || cvData.technicalSkills ? `
                <div class="skill-category">
                  <h4>Technical Skills</h4>
                  <div class="skill-list">${cvData.technical_skills || cvData.technicalSkills}</div>
                </div>
              ` : ''}
              ${cvData.soft_skills || cvData.softSkills ? `
                <div class="skill-category">
                  <h4>Soft Skills</h4>
                  <div class="skill-list">${cvData.soft_skills || cvData.softSkills}</div>
                </div>
              ` : ''}
              ${cvData.languages ? `
                <div class="skill-category">
                  <h4>Languages</h4>
                  <div class="skill-list">${cvData.languages}</div>
                </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Work Experience -->
          ${(cvData.work_experience || cvData.workExperience) && (cvData.work_experience || cvData.workExperience).length > 0 ? `
          <div class="cv-section">
            <h2>Work Experience</h2>
            ${(cvData.work_experience || cvData.workExperience).map(exp => `
              <div class="experience-item">
                <div class="item-header">
                  <div>
                    <div class="item-title">${exp.jobTitle || exp.job_title || 'Position'}</div>
                    <div class="item-company">${exp.company || 'Company'}</div>
                  </div>
                  <div class="item-date">${exp.startDate || exp.start_date || ''} - ${exp.current ? 'Present' : (exp.endDate || exp.end_date || '')}</div>
                </div>
                ${exp.description ? `<p>${exp.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Education -->
          ${cvData.education && cvData.education.length > 0 ? `
          <div class="cv-section">
            <h2>Education</h2>
            ${cvData.education.map(edu => `
              <div class="education-item">
                <div class="item-header">
                  <div>
                    <div class="item-title">${edu.degree || 'Degree'}</div>
                    <div class="item-company">${edu.institution || 'Institution'}</div>
                  </div>
                  <div class="item-date">${edu.graduationDate || edu.graduation_date || ''}</div>
                </div>
                ${edu.description ? `<p>${edu.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>

        <div class="footer-info">
          CV Template: ${cvData.selectedTemplate || cvData.selected_template || 'Default'} • Generated for job application
          ${jobTitle ? `<br>Applied for: ${jobTitle}` : ''}
        </div>
      </div>
    `;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  CV
                </h3>
                {jobTitle && (
                  <p className="text-sm text-gray-500 mt-1">
                    Applied for: {jobTitle}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Download/Print CV"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Print CV"
                >
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  Print
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center p-2 border border-transparent rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* CV Content */}
          <div className="max-h-[80vh] overflow-y-auto">
            <div id="cv-content" className="p-6">
              <CVViewer cvSnapshot={cvSnapshot} />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                This CV was submitted as part of the job application process
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVModal;
