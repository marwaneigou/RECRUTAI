import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  UserGroupIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import CVModal from '../../components/common/CVModal'
import api from '../../services/api'
import toast from 'react-hot-toast'

const JobCandidatesPage = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('matchScore') // matchScore, appliedDate, status
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCV, setSelectedCV] = useState(null)
  const [showCVModal, setShowCVModal] = useState(false)
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null)
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false)

  useEffect(() => {
    fetchJobAndCandidates()
  }, [jobId])

  const fetchJobAndCandidates = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching job candidates for jobId:', jobId)

      // Fetch job details and applications
      const response = await api.get(`/jobs/${jobId}/applications`)

      console.log('📊 Job candidates response:', response)
      console.log('📊 Response success:', response.success)

      if (response.success) {
        console.log('✅ Job data:', response.data.job)
        console.log('✅ Applications data:', response.data.applications)
        setJob(response.data.job)
        setApplications(response.data.applications)
      } else {
        console.error('❌ Failed to fetch job candidates - response:', response)
      }
    } catch (error) {
      console.error('❌ Error fetching job candidates:', error)
      console.error('❌ Error details:', error.response?.data)
    } finally {
      setLoading(false)
    }
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      offered: 'bg-green-100 text-green-800',
      accepted: 'bg-green-200 text-green-900',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const filteredAndSortedApplications = applications
    .filter(app => statusFilter === 'all' || app.status === statusFilter)
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'matchScore':
          aValue = a.matchScore || 0
          bValue = b.matchScore || 0
          break
        case 'appliedDate':
          aValue = new Date(a.appliedDate)
          bValue = new Date(b.appliedDate)
          break
        case 'candidateName':
          aValue = a.candidateName.toLowerCase()
          bValue = b.candidateName.toLowerCase()
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  const viewCV = (application) => {
    setSelectedCV(application)
    setShowCVModal(true)
  }

  const viewCoverLetter = (application) => {
    setSelectedCoverLetter(application)
    setShowCoverLetterModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
        <button 
          onClick={() => navigate('/employer/jobs')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Jobs
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/employer/jobs')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Job Candidates</h1>
        </div>
        
        {/* Job Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <BriefcaseIcon className="h-4 w-4 mr-1" />
                  {job.employmentType}
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  {job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax} ${job.currency}` : 'Competitive'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{applications.length}</div>
              <div className="text-sm text-gray-500">Total Applications</div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status ({applications.length})</option>
                <option value="pending">Pending ({statusCounts.pending || 0})</option>
                <option value="reviewed">Reviewed ({statusCounts.reviewed || 0})</option>
                <option value="shortlisted">Shortlisted ({statusCounts.shortlisted || 0})</option>
                <option value="interviewed">Interviewed ({statusCounts.interviewed || 0})</option>
                <option value="offered">Offered ({statusCounts.offered || 0})</option>
                <option value="accepted">Accepted ({statusCounts.accepted || 0})</option>
                <option value="rejected">Rejected ({statusCounts.rejected || 0})</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Sort by:</span>
              <button
                onClick={() => handleSort('matchScore')}
                className={`px-3 py-1 rounded text-sm ${
                  sortBy === 'matchScore' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Match Score {sortBy === 'matchScore' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSort('appliedDate')}
                className={`px-3 py-1 rounded text-sm ${
                  sortBy === 'appliedDate' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Applied Date {sortBy === 'appliedDate' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSort('candidateName')}
                className={`px-3 py-1 rounded text-sm ${
                  sortBy === 'candidateName' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Name {sortBy === 'candidateName' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      {filteredAndSortedApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No applications yet' : `No ${statusFilter} applications`}
          </h3>
          <p className="text-gray-600">
            {statusFilter === 'all' 
              ? 'Applications will appear here when candidates apply to this job'
              : `No applications with ${statusFilter} status found`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
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
                {filteredAndSortedApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{application.candidateName}</div>
                        <div className="text-sm text-gray-500">{application.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.appliedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`text-sm font-medium ${getMatchScoreColor(application.matchScore || 0)}`}>
                          {application.matchScore || 0}%
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${application.matchScore || 0}%` }}
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
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(application.status)}`}
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
                          onClick={() => viewCV(application)}
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
        </div>
      )}

      {/* CV Modal */}
      <CVModal
        isOpen={showCVModal}
        onClose={() => setShowCVModal(false)}
        cvSnapshot={selectedCV?.cvSnapshot}
        candidateName={selectedCV?.candidateName}
        jobTitle={job?.title}
      />

      {/* Cover Letter Modal */}
      {showCoverLetterModal && selectedCoverLetter && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCoverLetterModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Cover Letter - {selectedCoverLetter.candidateName}
                  </h3>
                  <button
                    onClick={() => setShowCoverLetterModal(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Applied for: {job.title}
                </p>
              </div>

              <div className="bg-white px-6 py-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedCoverLetter.coverLetter?.content || 'No cover letter content available'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-4">
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
              </div>

              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCoverLetterModal(false)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobCandidatesPage
