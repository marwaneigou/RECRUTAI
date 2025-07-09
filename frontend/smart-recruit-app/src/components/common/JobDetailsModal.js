import React from 'react'
import {
  XMarkIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const JobDetailsModal = ({ job, isOpen, onClose, onApply, showApplyButton = true }) => {
  if (!isOpen || !job) return null

  const formatSalary = (min, max, currency = 'EUR') => {
    if (min && max) {
      return `${min}k - ${max}k ${currency}`
    } else if (min) {
      return `${min}k+ ${currency}`
    } else if (max) {
      return `Up to ${max}k ${currency}`
    }
    return 'Salary not specified'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{job.title || job.jobTitle}</h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                    <span>{job.company}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            {/* Job Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  <span>{job.location || job.jobLocation}</span>
                  {job.remote && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Remote
                    </span>
                  )}
                </div>
                
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span>{job.employmentType?.replace('_', ' ') || 'Full-time'}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  <span>{job.salary || formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <AcademicCapIcon className="w-5 h-5 mr-2" />
                  <span>{job.experienceLevel || 'Not specified'}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  <span>Posted: {formatDate(job.createdAt || job.appliedAt)}</span>
                </div>
                
                {job.applicationDeadline && (
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span>Deadline: {formatDate(job.applicationDeadline)}</span>
                  </div>
                )}
                
                {job.teamSize && (
                  <div className="flex items-center text-gray-600">
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    <span>Team size: {job.teamSize}</span>
                  </div>
                )}
                
                {job.website && (
                  <div className="flex items-center text-gray-600">
                    <GlobeAltIcon className="w-5 h-5 mr-2" />
                    <a 
                      href={job.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Company Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h4>
              <div className="prose prose-sm max-w-none text-gray-700">
                {job.description ? (
                  <p className="whitespace-pre-line">{job.description}</p>
                ) : (
                  <p>No description available for this position.</p>
                )}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h4>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-line">{job.requirements}</p>
                </div>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {job.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Application Notes (for Applications page) */}
            {job.applicationNotes && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Application Notes</h4>
                <p className="text-gray-700">{job.applicationNotes}</p>
              </div>
            )}

            {/* Feedback (for Applications page) */}
            {job.feedback && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Employer Feedback</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{job.feedback}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {showApplyButton && (
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
              {onApply && (
                <button
                  onClick={() => {
                    onApply(job.id)
                    onClose()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Apply Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobDetailsModal
