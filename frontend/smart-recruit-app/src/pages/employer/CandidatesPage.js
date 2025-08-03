import React, { useState, useEffect } from 'react'
import { UserGroupIcon, EyeIcon, CheckIcon, XMarkIcon, DocumentTextIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'
import CVModal from '../../components/common/CVModal'

const CandidatesPage = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showCVModal, setShowCVModal] = useState(false)
  const [selectedCV, setSelectedCV] = useState(null)
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false)
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const calculateMatchScore = (application) => {
    // Use the calculated match score from database if available
    if (application.matchScore !== null && application.matchScore !== undefined && application.matchScore > 0) {
      return application.matchScore
    }

    // Fallback to simple calculation if no AI score available
    let score = 60 // Base score

    // Check MongoDB CV data (handle both field name formats)
    const cvData = application.cvSnapshot?.cvData || application.cvData
    if (cvData) {
      // Technical skills check (both camelCase and snake_case)
      const technicalSkills = cvData.technicalSkills || cvData.technical_skills
      if (technicalSkills && technicalSkills.length > 0) {
        score += 15 // Has technical skills
        console.log('Added 15 points for technical skills:', technicalSkills)
      }

      // Work experience check (both camelCase and snake_case)
      const workExperience = cvData.workExperience || cvData.work_experience
      if (workExperience && workExperience.length > 0) {
        score += 15 // Has work experience
        console.log('Added 15 points for work experience:', workExperience.length, 'positions')
      }

      // Education check
      if (cvData.education && cvData.education.length > 0) {
        score += 5 // Has education
        console.log('Added 5 points for education:', cvData.education.length, 'entries')
      }

      // Professional summary check
      const professionalSummary = cvData.professionalSummary || cvData.professional_summary
      if (professionalSummary && professionalSummary.length > 50) {
        score += 5 // Has good summary
        console.log('Added 5 points for professional summary')
      }
    }

    // Check cover letter
    if (application.coverLetter?.content && application.coverLetter.content.length > 50) {
      score += 10 // Good cover letter
      console.log('Added 10 points for cover letter:', application.coverLetter.content.length, 'chars')
    }

    console.log('Final calculated match score for', application.candidateName, ':', score)
    return Math.min(score, 100)
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/applications')
      console.log('Applications API Response:', response.data)

      // Handle the response structure
      const allApplications = response.data.data?.applications || response.data.applications || []

      // Format applications for display
      const formattedApplications = allApplications.map(app => {
        const formattedApp = {
          id: app.id,
          candidateId: app.candidateId,
          candidateName: app.candidateName || 'Unknown Candidate',
          jobTitle: app.jobTitle || 'Unknown Job',
          appliedDate: app.appliedDate || new Date().toISOString().split('T')[0],
          status: app.status || 'pending',
          matchScore: app.matchScore || 0,
          email: app.email || 'No email',
          coverLetter: app.coverLetter,
          cvSnapshot: app.cvSnapshot,
          cvData: app.cvData,
          matchAnalysis: app.matchAnalysis,
          matchStrengths: app.matchStrengths,
          matchGaps: app.matchGaps,
          matchCalculatedAt: app.matchCalculatedAt,
          notes: app.notes,
          rating: app.rating
        }

        // Calculate match score if not provided or is 0
        if (!formattedApp.matchScore || formattedApp.matchScore === 0) {
          console.log('Calculating match score for:', formattedApp.candidateName)
          console.log('Application data:', {
            coverLetter: formattedApp.coverLetter ? 'Present' : 'Missing',
            cvSnapshot: formattedApp.cvSnapshot ? 'Present' : 'Missing',
            cvData: formattedApp.cvData ? 'Present' : 'Missing'
          })
          formattedApp.matchScore = calculateMatchScore(formattedApp)
          console.log('Calculated match score:', formattedApp.matchScore)
        }

        return formattedApp
      })

      setApplications(formattedApplications)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
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
    // Prepare CV data for modal - use cvSnapshot if available, otherwise use cvData
    const cvDataToShow = application.cvSnapshot?.cvData || application.cvData || {
      firstName: application.candidateName?.split(' ')[0] || 'Unknown',
      lastName: application.candidateName?.split(' ')[1] || '',
      email: application.email,
      professionalSummary: 'No CV data available',
      workExperience: [],
      education: [],
      projects: [],
      certifications: [],
      technicalSkills: '',
      softSkills: '',
      languages: ''
    }

    // Add cover letter information
    const enrichedApplication = {
      ...application,
      cvData: cvDataToShow,
      coverLetterContent: application.coverLetter?.content || null,
      coverLetterType: application.coverLetter?.type || null,
      coverLetterAnalysis: application.coverLetter?.aiAnalysis || null
    }

    setSelectedCV(enrichedApplication)
    setShowCVModal(true)
  }

  const closeCVModal = () => {
    setShowCVModal(false)
    setSelectedCV(null)
  }

  const viewCoverLetter = (application) => {
    setSelectedCoverLetter(application)
    setShowCoverLetterModal(true)
  }

  const closeCoverLetterModal = () => {
    setShowCoverLetterModal(false)
    setSelectedCoverLetter(null)
  }

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      console.log('🔄 Updating status:', { applicationId, newStatus })
      const response = await api.put(`/applications/${applicationId}/status`, {
        status: newStatus
      })

      console.log('📊 Full response:', response)
      console.log('📊 Response success:', response.success)

      // The api service returns the data directly, so check response.success
      if (response.success) {
        // Update the local state
        setApplications(prev => prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        ))
        toast.success('Application status updated successfully')
        console.log('✅ Status updated successfully in UI')
      } else {
        console.error('Failed to update status - Response:', response)
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      console.error('Error details:', error.response?.data)
      toast.error('Error updating status. Please try again.')
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
                  Cover Letter
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
                    <div className="text-sm text-gray-900">
                      {application.coverLetter?.content ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Provided
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {application.coverLetter.content.length} chars
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No cover letter
                        </span>
                      )}
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
                      {application.coverLetter?.content && (
                        <button
                          onClick={() => viewCoverLetter(application)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="View Cover Letter"
                        >
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          Cover Letter
                        </button>
                      )}
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
      {/* Cover Letter Modal */}
      {showCoverLetterModal && selectedCoverLetter && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeCoverLetterModal} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Cover Letter - {selectedCoverLetter.candidateName}
                  </h3>
                  <button
                    onClick={closeCoverLetterModal}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Applied for: {selectedCoverLetter.jobTitle}
                </p>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-6">
                <div className="space-y-4">
                  {/* Cover Letter Content */}
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedCoverLetter.coverLetter?.content || 'No cover letter content available'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Type</p>
                      <p className="text-sm text-gray-900">
                        {selectedCoverLetter.coverLetter?.type === 'user_written' ? 'User Written' :
                         selectedCoverLetter.coverLetter?.type === 'ai_generated' ? 'AI Generated' :
                         'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Length</p>
                      <p className="text-sm text-gray-900">
                        {selectedCoverLetter.coverLetter?.content?.length || 0} characters
                      </p>
                    </div>
                  </div>

                  {/* AI Analysis if available */}
                  {selectedCoverLetter.coverLetter?.aiAnalysis && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Analysis</h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Sentiment:</span> {selectedCoverLetter.coverLetter.aiAnalysis.sentiment}
                          </div>
                          <div>
                            <span className="font-medium">Score:</span> {selectedCoverLetter.coverLetter.aiAnalysis.score}/100
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Submitted on {selectedCoverLetter.appliedDate}
                  </p>
                  <button
                    onClick={closeCoverLetterModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
