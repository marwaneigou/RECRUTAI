import React, { useState, useEffect } from 'react'
import { UserGroupIcon, EyeIcon, CheckIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'
import CVModal from '../../components/common/CVModal'

const CandidatesPage = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showCVModal, setShowCVModal] = useState(false)
  const [selectedCV, setSelectedCV] = useState(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/applications')
      console.log('Applications API Response:', response.data)

      // Handle the response structure
      const allApplications = response.data.data?.applications || response.data.applications || []

      // Format applications for display
      const formattedApplications = allApplications.map(app => ({
        id: app.id,
        candidateName: app.candidateName || 'Unknown Candidate',
        jobTitle: app.jobTitle || 'Unknown Job',
        appliedDate: app.appliedDate || new Date().toISOString().split('T')[0],
        status: app.status || 'pending',
        matchScore: app.matchScore || 0,
        email: app.email || 'No email',
        coverLetter: app.coverLetter,
        cvSnapshot: app.cvSnapshot,
        matchAnalysis: app.matchAnalysis,
        matchStrengths: app.matchStrengths,
        matchGaps: app.matchGaps,
        matchCalculatedAt: app.matchCalculatedAt,
        notes: app.notes,
        rating: app.rating
      }))

      setApplications(formattedApplications)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const calculateMatchScore = (application) => {
    // Use the calculated match score from database if available
    if (application.match_score !== null && application.match_score !== undefined) {
      return application.match_score
    }

    // Fallback to simple calculation if no AI score available
    let score = 70 // Base score

    if (application.cv_snapshot?.technical_skills) {
      score += 15 // Has technical skills
    }
    if (application.cv_snapshot?.work_experience) {
      score += 10 // Has work experience
    }
    if (application.cover_letter && application.cover_letter.length > 50) {
      score += 5 // Good cover letter
    }

    return Math.min(score, 100)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'shortlisted': return 'bg-purple-100 text-purple-800'
      case 'interviewed': return 'bg-indigo-100 text-indigo-800'
      case 'offered': return 'bg-green-100 text-green-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const viewCV = (application) => {
    setSelectedCV(application)
    setShowCVModal(true)
  }

  const closeCVModal = () => {
    setShowCVModal(false)
    setSelectedCV(null)
  }

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.put(`/applications/${applicationId}`, { status: newStatus })
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ))
      toast.success('Application status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleViewCV = (application) => {
    viewCV(application)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
        <p className="mt-2 text-gray-600">Review applications and manage candidates for your job postings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : applications.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : applications.filter(app => app.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckIcon className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Accepted</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : applications.filter(app => ['accepted', 'offered'].includes(app.status)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XMarkIcon className="h-8 w-8 text-red-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : applications.filter(app => app.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600">Applications will appear here when candidates apply to your jobs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.candidateName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.jobTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.appliedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {application.matchScore}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${application.matchScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusChange(application.id, e.target.value)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(application.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interviewed">Interviewed</option>
                      <option value="offered">Offered</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCV(application)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="View CV"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        View CV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* CV Modal */}
      {showCVModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCVModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    CV - {selectedApplication.candidateName}
                  </h3>
                  <button
                    onClick={() => setShowCVModal(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
                {selectedApplication.cvSnapshot ? (
                  <div className="space-y-6">
                    {/* Match Score Section */}
                    {selectedApplication.matchScore && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="text-lg font-semibold text-blue-900 mb-3">AI Match Analysis</h4>
                        <div className="flex items-center mb-3">
                          <span className="text-3xl font-bold text-blue-900 mr-4">
                            {selectedApplication.matchScore}%
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                              style={{ width: `${selectedApplication.matchScore}%` }}
                            ></div>
                          </div>
                        </div>

                        {selectedApplication.match_analysis && (
                          <p className="text-sm text-blue-800 mb-3">{selectedApplication.match_analysis}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedApplication.match_strengths && selectedApplication.match_strengths.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-green-800 mb-2">✅ Strengths</h5>
                              <ul className="text-sm text-green-700 space-y-1">
                                {selectedApplication.match_strengths.map((strength, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedApplication.match_gaps && selectedApplication.match_gaps.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-orange-800 mb-2">⚠️ Areas for Improvement</h5>
                              <ul className="text-sm text-orange-700 space-y-1">
                                {selectedApplication.match_gaps.map((gap, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{gap}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {selectedApplication.match_calculated_at && (
                          <p className="text-xs text-gray-500 mt-3">
                            Calculated: {new Date(selectedApplication.match_calculated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Personal Information */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{selectedApplication.cvSnapshot.first_name} {selectedApplication.cvSnapshot.last_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedApplication.cvSnapshot.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{selectedApplication.cvSnapshot.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{selectedApplication.cvSnapshot.city}, {selectedApplication.cvSnapshot.country}</p>
                        </div>
                      </div>
                    </div>

                    {/* Professional Summary */}
                    {selectedApplication.cvSnapshot.professional_summary && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Professional Summary</h4>
                        <p className="text-gray-700">{selectedApplication.cvSnapshot.professional_summary}</p>
                      </div>
                    )}

                    {/* Technical Skills */}
                    {selectedApplication.cvSnapshot.technical_skills && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Technical Skills</h4>
                        <p className="text-gray-700">{selectedApplication.cvSnapshot.technical_skills}</p>
                      </div>
                    )}

                    {/* Cover Letter */}
                    {selectedApplication.coverLetter && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Cover Letter</h4>
                        <p className="text-gray-700 whitespace-pre-line">{selectedApplication.coverLetter}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No CV data available for this application</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CV Modal */}
      <CVModal
        isOpen={showCVModal}
        onClose={closeCVModal}
        cvSnapshot={selectedCV?.cvSnapshot}
        candidateName={selectedCV?.candidateName}
        jobTitle={selectedCV?.jobTitle}
      />
    </div>
  )
}

export default CandidatesPage
