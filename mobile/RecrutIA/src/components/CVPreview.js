import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const CVPreview = ({ cvData, template = 'modern', style }) => {
  // Generate HTML CV using the same templates as web version
  const generateHTMLCV = (template, data) => {
    switch (template) {
      case 'modern':
        return generateModernHTML(data);
      case 'classic':
        return generateClassicHTML(data);
      case 'creative':
        return generateCreativeHTML(data);
      default:
        return generateModernHTML(data);
    }
  };

  const generateModernHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.firstName} ${data.lastName} - CV</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 10px;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            font-size: 12px;
          }
          .cv-container {
            max-width: 100%;
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
            padding: 20px 15px;
          }
          .main-content {
            padding: 20px 15px;
          }
          .name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
            text-align: center;
          }
          .contact-info {
            text-align: center;
            margin-bottom: 20px;
            font-size: 10px;
          }
          .contact-info div {
            margin: 2px 0;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin: 15px 0 8px 0;
            padding-bottom: 3px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
          }
          .main-section-title {
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
            margin: 15px 0 8px 0;
            padding-bottom: 3px;
            border-bottom: 2px solid #667eea;
          }
          .experience-item, .education-item {
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
          }
          .item-title {
            font-weight: bold;
            color: #333;
            font-size: 12px;
          }
          .item-company {
            color: #667eea;
            font-weight: 500;
            font-size: 11px;
          }
          .item-date {
            color: #666;
            font-size: 10px;
            font-style: italic;
          }
          .item-description {
            margin-top: 4px;
            font-size: 10px;
            line-height: 1.4;
          }
          .skills-list {
            font-size: 10px;
            line-height: 1.4;
          }
          .professional-summary {
            font-size: 11px;
            line-height: 1.5;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="cv-container">
          <div class="sidebar">
            <div class="name">${data.firstName || 'First Name'} ${data.lastName || 'Last Name'}</div>
            
            <div class="contact-info">
              <div>📧 ${data.email || 'email@example.com'}</div>
              <div>📱 ${data.phone || 'Phone Number'}</div>
              <div>📍 ${data.address || 'Address'}</div>
              <div>${data.city || 'City'}, ${data.country || 'Country'}</div>
              ${data.linkedinUrl ? `<div>🔗 LinkedIn: ${data.linkedinUrl}</div>` : ''}
              ${data.githubUrl ? `<div>💻 GitHub: ${data.githubUrl}</div>` : ''}
              ${data.portfolioUrl ? `<div>🌐 Portfolio: ${data.portfolioUrl}</div>` : ''}
            </div>

            ${data.technicalSkills ? `
            <div class="section-title">Technical Skills</div>
            <div class="skills-list">${data.technicalSkills}</div>
            ` : ''}

            ${data.softSkills ? `
            <div class="section-title">Soft Skills</div>
            <div class="skills-list">${data.softSkills}</div>
            ` : ''}

            ${data.languages ? `
            <div class="section-title">Languages</div>
            <div class="skills-list">${data.languages}</div>
            ` : ''}
          </div>

          <div class="main-content">
            ${data.professionalSummary ? `
            <div class="main-section-title">Professional Summary</div>
            <div class="professional-summary">${data.professionalSummary}</div>
            ` : ''}

            ${data.workExperience && data.workExperience.some(exp => exp.jobTitle || exp.company) ? `
            <div class="main-section-title">Work Experience</div>
            ${data.workExperience.map(exp => 
              exp.jobTitle || exp.company ? `
              <div class="experience-item">
                <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                <div class="item-company">${exp.company || 'Company'} ${exp.location ? `• ${exp.location}` : ''}</div>
                <div class="item-date">${exp.startDate || 'Start'} - ${exp.current ? 'Present' : exp.endDate || 'End'}</div>
                ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
              </div>
              ` : ''
            ).join('')}
            ` : ''}

            ${data.education && data.education.some(edu => edu.degree || edu.institution) ? `
            <div class="main-section-title">Education</div>
            ${data.education.map(edu => 
              edu.degree || edu.institution ? `
              <div class="education-item">
                <div class="item-title">${edu.degree || 'Degree'}</div>
                <div class="item-company">${edu.institution || 'Institution'} ${edu.location ? `• ${edu.location}` : ''}</div>
                <div class="item-date">${edu.graduationDate || 'Graduation Date'}</div>
                ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
                ${edu.description ? `<div class="item-description">${edu.description}</div>` : ''}
              </div>
              ` : ''
            ).join('')}
            ` : ''}

            ${data.projects && data.projects.some(proj => proj.name) ? `
            <div class="main-section-title">Projects</div>
            ${data.projects.map(proj => 
              proj.name ? `
              <div class="experience-item">
                <div class="item-title">${proj.name}</div>
                <div class="item-date">${proj.startDate || ''} - ${proj.endDate || ''}</div>
                ${proj.technologies ? `<div class="item-company">Technologies: ${proj.technologies}</div>` : ''}
                ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
                ${proj.url ? `<div class="item-description">URL: ${proj.url}</div>` : ''}
              </div>
              ` : ''
            ).join('')}
            ` : ''}

            ${data.certifications && data.certifications.some(cert => cert.name) ? `
            <div class="main-section-title">Certifications</div>
            ${data.certifications.map(cert => 
              cert.name ? `
              <div class="education-item">
                <div class="item-title">${cert.name}</div>
                <div class="item-company">${cert.issuer || ''}</div>
                <div class="item-date">${cert.date || ''}</div>
                ${cert.url ? `<div class="item-description">Verify: ${cert.url}</div>` : ''}
              </div>
              ` : ''
            ).join('')}
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateClassicHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.firstName} ${data.lastName} - CV</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            margin: 20px;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 3px solid #333; 
            padding-bottom: 15px; 
          }
          .name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 8px; 
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .contact { margin-bottom: 15px; font-size: 11px; }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #333;
            margin: 20px 0 10px 0;
            padding-bottom: 3px;
            letter-spacing: 0.5px;
          }
          .experience-item, .education-item {
            margin-bottom: 12px;
            padding-bottom: 8px;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
          }
          .item-title {
            font-weight: bold;
            font-size: 12px;
          }
          .item-company {
            font-style: italic;
            font-size: 11px;
          }
          .item-date {
            font-size: 10px;
            color: #666;
          }
          .item-description {
            margin-top: 4px;
            font-size: 10px;
            text-align: justify;
          }
          .professional-summary {
            font-size: 11px;
            text-align: justify;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${data.firstName || 'First Name'} ${data.lastName || 'Last Name'}</div>
          <div class="contact">
            ${data.email || 'email@example.com'} • ${data.phone || 'Phone Number'}<br>
            ${data.address || 'Address'}, ${data.city || 'City'}, ${data.country || 'Country'}<br>
            ${data.linkedinUrl ? `LinkedIn: ${data.linkedinUrl} • ` : ''}
            ${data.githubUrl ? `GitHub: ${data.githubUrl} • ` : ''}
            ${data.portfolioUrl ? `Portfolio: ${data.portfolioUrl}` : ''}
          </div>
        </div>

        ${data.professionalSummary ? `
        <div class="section-title">Professional Summary</div>
        <div class="professional-summary">${data.professionalSummary}</div>
        ` : ''}

        ${data.workExperience && data.workExperience.some(exp => exp.jobTitle || exp.company) ? `
        <div class="section-title">Work Experience</div>
        ${data.workExperience.map(exp => 
          exp.jobTitle || exp.company ? `
          <div class="experience-item">
            <div class="item-header">
              <div>
                <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                <div class="item-company">${exp.company || 'Company'} ${exp.location ? `• ${exp.location}` : ''}</div>
              </div>
              <div class="item-date">${exp.startDate || 'Start'} - ${exp.current ? 'Present' : exp.endDate || 'End'}</div>
            </div>
            ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
          </div>
          ` : ''
        ).join('')}
        ` : ''}

        ${data.education && data.education.some(edu => edu.degree || edu.institution) ? `
        <div class="section-title">Education</div>
        ${data.education.map(edu => 
          edu.degree || edu.institution ? `
          <div class="education-item">
            <div class="item-header">
              <div>
                <div class="item-title">${edu.degree || 'Degree'}</div>
                <div class="item-company">${edu.institution || 'Institution'} ${edu.location ? `• ${edu.location}` : ''}</div>
              </div>
              <div class="item-date">${edu.graduationDate || 'Graduation Date'}</div>
            </div>
            ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
            ${edu.description ? `<div class="item-description">${edu.description}</div>` : ''}
          </div>
          ` : ''
        ).join('')}
        ` : ''}

        ${(data.technicalSkills || data.softSkills || data.languages) ? `
        <div class="section-title">Skills</div>
        ${data.technicalSkills ? `<div><strong>Technical:</strong> ${data.technicalSkills}</div>` : ''}
        ${data.softSkills ? `<div><strong>Soft Skills:</strong> ${data.softSkills}</div>` : ''}
        ${data.languages ? `<div><strong>Languages:</strong> ${data.languages}</div>` : ''}
        ` : ''}

        ${data.projects && data.projects.some(proj => proj.name) ? `
        <div class="section-title">Projects</div>
        ${data.projects.map(proj => 
          proj.name ? `
          <div class="experience-item">
            <div class="item-header">
              <div class="item-title">${proj.name}</div>
              <div class="item-date">${proj.startDate || ''} - ${proj.endDate || ''}</div>
            </div>
            ${proj.technologies ? `<div class="item-company">Technologies: ${proj.technologies}</div>` : ''}
            ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
            ${proj.url ? `<div class="item-description">URL: ${proj.url}</div>` : ''}
          </div>
          ` : ''
        ).join('')}
        ` : ''}

        ${data.certifications && data.certifications.some(cert => cert.name) ? `
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => 
          cert.name ? `
          <div class="education-item">
            <div class="item-header">
              <div class="item-title">${cert.name}</div>
              <div class="item-date">${cert.date || ''}</div>
            </div>
            <div class="item-company">${cert.issuer || ''}</div>
            ${cert.url ? `<div class="item-description">Verify: ${cert.url}</div>` : ''}
          </div>
          ` : ''
        ).join('')}
        ` : ''}
      </body>
      </html>
    `;
  };

  const generateCreativeHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.firstName} ${data.lastName} - CV</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 10px;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            font-size: 12px;
          }
          .cv-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
            color: white;
            padding: 25px 20px;
            text-align: center;
            position: relative;
          }
          .name {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .contact-info {
            font-size: 11px;
            opacity: 0.9;
          }
          .content {
            padding: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin: 15px 0 8px 0;
            padding: 8px 15px;
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white;
            border-radius: 25px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .experience-item, .education-item {
            background: #f8f9fa;
            margin-bottom: 10px;
            padding: 12px;
            border-radius: 10px;
            border-left: 4px solid #74b9ff;
          }
          .item-title {
            font-weight: bold;
            color: #2c3e50;
            font-size: 12px;
          }
          .item-company {
            color: #74b9ff;
            font-weight: 500;
            font-size: 11px;
          }
          .item-date {
            color: #636e72;
            font-size: 10px;
            font-style: italic;
          }
          .item-description {
            margin-top: 4px;
            font-size: 10px;
            line-height: 1.4;
          }
          .professional-summary {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #00b894;
            font-size: 11px;
            line-height: 1.5;
          }
          .skills-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .skill-category {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
            border-left: 3px solid #fd79a8;
          }
          .skill-title {
            font-weight: bold;
            color: #2c3e50;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .skill-content {
            font-size: 10px;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div class="cv-container">
          <div class="header">
            <div class="name">${data.firstName || 'First Name'} ${data.lastName || 'Last Name'}</div>
            <div class="contact-info">
              ${data.email || 'email@example.com'} • ${data.phone || 'Phone Number'}<br>
              ${data.address || 'Address'}, ${data.city || 'City'}, ${data.country || 'Country'}<br>
              ${data.linkedinUrl ? `LinkedIn: ${data.linkedinUrl} • ` : ''}
              ${data.githubUrl ? `GitHub: ${data.githubUrl} • ` : ''}
              ${data.portfolioUrl ? `Portfolio: ${data.portfolioUrl}` : ''}
            </div>
          </div>

          <div class="content">
            ${data.professionalSummary ? `
            <div class="section-title">Professional Summary</div>
            <div class="professional-summary">${data.professionalSummary}</div>
            ` : ''}

            ${(data.technicalSkills || data.softSkills || data.languages) ? `
            <div class="section-title">Skills</div>
            <div class="skills-grid">
              ${data.technicalSkills ? `
              <div class="skill-category">
                <div class="skill-title">Technical Skills</div>
                <div class="skill-content">${data.technicalSkills}</div>
              </div>
              ` : ''}
              ${data.softSkills ? `
              <div class="skill-category">
                <div class="skill-title">Soft Skills</div>
                <div class="skill-content">${data.softSkills}</div>
              </div>
              ` : ''}
              ${data.languages ? `
              <div class="skill-category">
                <div class="skill-title">Languages</div>
                <div class="skill-content">${data.languages}</div>
              </div>
              ` : ''}
            </div>
            ` : ''}

            ${data.workExperience && data.workExperience.some(exp => exp.jobTitle || exp.company) ? `
            <div class="section-title">Work Experience</div>
            ${data.workExperience.map(exp => 
              exp.jobTitle || exp.company ? `
              <div class="experience-item">
                <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                <div class="item-company">${exp.company || 'Company'} ${exp.location ? `• ${exp.location}` : ''}</div>
                <div class="item-date">${exp.startDate || 'Start'} - ${exp.current ? 'Present' : exp.endDate || 'End'}</div>
                ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
              </div>
              ` : ''
            ).join('')}
            ` : ''}

            ${data.education && data.education.some(edu => edu.degree || edu.institution) ? `
            <div class="section-title">Education</div>
            ${data.education.map(edu => 
              edu.degree || edu.institution ? `
              <div class="education-item">
                <div class="item-title">${edu.degree || 'Degree'}</div>
                <div class="item-company">${edu.institution || 'Institution'} ${edu.location ? `• ${edu.location}` : ''}</div>
                <div class="item-date">${edu.graduationDate || 'Graduation Date'}</div>
                ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
                ${edu.description ? `<div class="item-description">${edu.description}</div>` : ''}
              </div>
              ` : ''
            ).join('')}
            ` : ''}

            ${data.projects && data.projects.some(proj => proj.name) ? `
            <div class="section-title">Projects</div>
            ${data.projects.map(proj => 
              proj.name ? `
              <div class="experience-item">
                <div class="item-title">${proj.name}</div>
                <div class="item-date">${proj.startDate || ''} - ${proj.endDate || ''}</div>
                ${proj.technologies ? `<div class="item-company">Technologies: ${proj.technologies}</div>` : ''}
                ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
                ${proj.url ? `<div class="item-description">URL: ${proj.url}</div>` : ''}
              </div>
              ` : ''
            ).join('')}
            ` : ''}

            ${data.certifications && data.certifications.some(cert => cert.name) ? `
            <div class="section-title">Certifications</div>
            ${data.certifications.map(cert => 
              cert.name ? `
              <div class="education-item">
                <div class="item-title">${cert.name}</div>
                <div class="item-company">${cert.issuer || ''}</div>
                <div class="item-date">${cert.date || ''}</div>
                ${cert.url ? `<div class="item-description">Verify: ${cert.url}</div>` : ''}
              </div>
              ` : ''
            ).join('')}
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const htmlContent = generateHTMLCV(template, cvData);

  // Platform-specific rendering
  if (Platform.OS === 'web') {
    // For web platform, use iframe or direct HTML rendering
    return (
      <div
        style={{
          flex: 1,
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          ...style
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // For mobile platforms, use WebView
  return (
    <WebView
      source={{ html: htmlContent }}
      style={[{ flex: 1, backgroundColor: 'transparent' }, style]}
      scalesPageToFit={true}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
    />
  );
};

export default CVPreview;
