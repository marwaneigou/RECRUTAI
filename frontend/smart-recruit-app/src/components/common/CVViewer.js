import React from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LinkIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  TrophyIcon,
  LanguageIcon,
  HeartIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const CVViewer = ({ cvSnapshot, className = "" }) => {
  if (!cvSnapshot) {
    return (
      <div className={`bg-gray-50 p-6 rounded-lg text-center ${className}`}>
        <p className="text-gray-500">No CV data available</p>
      </div>
    );
  }

  // Handle both old format (cvSnapshot) and new MongoDB format (cvData)
  const cvData = cvSnapshot.cvData || cvSnapshot;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const formatDateRange = (startDate, endDate, current = false) => {
    const start = formatDate(startDate);
    const end = current ? 'Present' : formatDate(endDate);
    return `${start} - ${end}`;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-full">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {cvData.firstName || cvData.first_name} {cvData.lastName || cvData.last_name}
            </h2>
            <p className="text-blue-100 mt-1">
              {cvData.professionalSummary || cvData.professional_summary || 'Professional Summary Not Available'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              {cvData.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {cvData.email}
                </div>
              )}
              {cvData.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {cvData.phone}
                </div>
              )}
              {(cvData.address || cvData.city) && (
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {cvData.address || cvData.city}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <LinkIcon className="h-5 w-5 mr-2 text-blue-600" />
              Online Presence
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              {(cvData.linkedinUrl || cvData.linkedin_url) && (
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <a href={`https://${cvData.linkedinUrl || cvData.linkedin_url}`} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {(cvData.githubUrl || cvData.github_url) && (
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <a href={`https://${cvData.githubUrl || cvData.github_url}`} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline">
                    GitHub Profile
                  </a>
                </div>
              )}
              {(cvData.portfolioUrl || cvData.portfolio_url) && (
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <a href={`https://${cvData.portfolioUrl || cvData.portfolio_url}`} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline">
                    Portfolio
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Work Experience */}
        {(cvData.workExperience || cvData.work_experience) && (cvData.workExperience || cvData.work_experience).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
              Work Experience
            </h3>
            <div className="space-y-4">
              {(cvData.workExperience || cvData.work_experience).map((job, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{job.jobTitle || job.title}</h4>
                      <p className="text-blue-600 font-medium">{job.company}</p>
                      {job.location && <p className="text-sm text-gray-500">{job.location}</p>}
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatDateRange(job.startDate, job.endDate, job.current)}
                    </span>
                  </div>
                  {job.description && (
                    <p className="text-sm text-gray-600 mt-2">{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cvData.education && cvData.education.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
              Education
            </h3>
            <div className="space-y-4">
              {cvData.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-green-200 pl-4 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-green-600 font-medium">{edu.institution}</p>
                      {edu.location && <p className="text-sm text-gray-500">{edu.location}</p>}
                      {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatDate(edu.graduationDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(cvData.technicalSkills || cvData.technical_skills) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
                <CodeBracketIcon className="h-5 w-5 mr-2 text-blue-600" />
                Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(cvData.technicalSkills || cvData.technical_skills).split(',').map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(cvData.softSkills || cvData.soft_skills) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
                <HeartIcon className="h-5 w-5 mr-2 text-blue-600" />
                Soft Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(cvData.softSkills || cvData.soft_skills).split(',').map((skill, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Projects */}
        {cvData.projects && cvData.projects.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <CodeBracketIcon className="h-5 w-5 mr-2 text-blue-600" />
              Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cvData.projects.map((project, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{project.name}</h4>
                    {project.url && (
                      <a href={`https://${project.url}`} target="_blank" rel="noopener noreferrer"
                         className="text-blue-600 hover:underline text-sm">
                        View
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                  {project.technologies && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Tech:</span> {project.technologies}
                    </p>
                  )}
                  {(project.startDate || project.endDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateRange(project.startDate, project.endDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {cvData.certifications && cvData.certifications.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <TrophyIcon className="h-5 w-5 mr-2 text-blue-600" />
              Certifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cvData.certifications.map((cert, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                    </div>
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer"
                         className="text-blue-600 hover:underline text-sm">
                        Verify
                      </a>
                    )}
                  </div>
                  {cert.date && (
                    <p className="text-xs text-gray-500">
                      Issued: {formatDate(cert.date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {cvData.languages && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
              <LanguageIcon className="h-5 w-5 mr-2 text-blue-600" />
              Languages
            </h3>
            <p className="text-gray-600">{cvData.languages}</p>
          </div>
        )}

        {/* Cover Letter Section */}
        {cvSnapshot.coverLetterContent && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
              Cover Letter
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{cvSnapshot.coverLetterContent}</p>
              {cvSnapshot.coverLetterType && (
                <p className="text-xs text-gray-500 mt-2">
                  Type: {cvSnapshot.coverLetterType}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Template Info */}
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 text-center">
            CV Template: {cvData.selectedTemplate || cvData.selected_template || 'Default'} •
            Generated for job application
          </p>
        </div>
      </div>
    </div>
  );
};

export default CVViewer;
