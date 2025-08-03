import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import JobDetailsModal from '../common/JobDetailsModal'
import api, { aiAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserIcon,
  SparklesIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline'

const CandidateDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    applicationsSent: 0,
    jobMatches: 0,
    profileViews: 0,
    interviews: 0
  })
  const [loading, setLoading] = useState(true)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [jobRecommendations, setJobRecommendations] = useState([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [feedbackGiven, setFeedbackGiven] = useState(new Set())

  useEffect(() => {
    fetchCandidateStats()
    fetchJobRecommendations()
  }, [])

  const fetchCandidateStats = async () => {
    try {
      setLoading(true)
      console.log('Fetching candidate stats...') // Debug log

      // Fetch real stats from dedicated endpoint
      const response = await api.get('/stats/candidate')
      console.log('🔍 Full candidate API response:', response) // Debug log

      // The API service returns response.data directly, so response is actually the data
      // The actual structure is: response.data.stats (not response.data.data.stats)
      const statsData = response.data?.stats || {}
      console.log('📊 Extracted candidate stats:', statsData) // Debug log

      // Validate that we have the expected data
      if (statsData && typeof statsData === 'object') {
        setStats(statsData)
        setForceUpdate(prev => prev + 1) // Force re-render
        console.log('✅ Candidate stats successfully set:', statsData) // Debug log
      } else {
        console.error('❌ Invalid candidate stats data received:', statsData)
        throw new Error('Invalid stats data format')
      }
    } catch (error) {
      console.error('❌ Error fetching candidate stats:', error)
      console.error('Error details:', error.message, error.stack)
      toast.error('Failed to load dashboard data')

      // Only set fallback if there was actually an error
      console.log('Setting fallback candidate stats due to error')
      setStats({
        applicationsSent: 0,
        jobMatches: 0,
        profileViews: 0,
        interviews: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchJobRecommendations = async () => {
    try {
      setRecommendationsLoading(true)
      console.log('Fetching AI-powered job recommendations...') // Debug log

      // Fetch job recommendations from AI service
      const response = await aiAPI.getJobRecommendations({ limit: 5 })
      console.log('🤖 Job recommendations response:', response) // Debug log

      const recommendationsData = response.data?.recommendations || []
      console.log('📋 Extracted job recommendations:', recommendationsData) // Debug log

      // Transform the data to match the expected format
      const transformedRecommendations = recommendationsData.map(rec => ({
        id: rec.jobId,
        title: rec.title,
        company: rec.company,
        location: rec.location,
        matchScore: rec.matchScore,
        salary: rec.salaryMin && rec.salaryMax
          ? `${rec.salaryMin}k - ${rec.salaryMax}k ${rec.currency || 'EUR'}`
          : 'Salary not specified',
        salaryMin: rec.salaryMin,
        salaryMax: rec.salaryMax,
        currency: rec.currency || 'EUR',
        employmentType: rec.employmentType,
        experienceLevel: rec.experienceLevel,
        remote: rec.remoteAllowed,
        description: rec.description,
        requirements: rec.requirements,
        skills: rec.matchedSkills || [],
        benefits: [], // Could be added later
        createdAt: rec.createdAt,
        applicationDeadline: rec.applicationDeadline,
        logoUrl: rec.logoUrl,
        reasoning: rec.reasoning,
        missingSkills: rec.missingSkills || []
      }))

      setJobRecommendations(transformedRecommendations)
      console.log('✅ Job recommendations successfully set:', transformedRecommendations) // Debug log

    } catch (error) {
      console.error('❌ Error fetching job recommendations:', error)
      console.error('Error details:', error.message, error.stack)

      // Show user-friendly error message
      toast.error('Failed to load job recommendations. Please try again later.')

      // Set empty array as fallback
      setJobRecommendations([])
    } finally {
      setRecommendationsLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-200 animate-pulse rounded-lg h-32"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24"></div>
          ))}
        </div>
      </div>
    )
  }

  // Removed null check since we have default values

  // Dashboard content only (no view switching)

  // Main dashboard view
  console.log('Rendering CandidateDashboard with stats:', stats, 'forceUpdate:', forceUpdate) // Debug log

  const statsData = [
    {
      name: 'Applications Sent',
      value: stats.applicationsSent,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      change: '+2 this week'
    },
    {
      name: 'Job Matches',
      value: stats.jobMatches,
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      change: '+3 new matches'
    },
    {
      name: 'Profile Views',
      value: stats.profileViews,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: '+5 this week'
    },
    {
      name: 'Interviews',
      value: stats.interviews,
      icon: BellIcon,
      color: 'bg-orange-500',
      change: '1 scheduled'
    }
  ]

  const recentApplications = [
    {
      id: 1,
      jobTitle: 'Senior Full Stack Developer',
      company: 'TechCorp Solutions',
      status: 'Under Review',
      appliedDate: '2024-01-15',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 2,
      jobTitle: 'Frontend React Developer',
      company: 'Innovate Digital',
      status: 'Interview Scheduled',
      appliedDate: '2024-01-12',
      statusColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 3,
      jobTitle: 'Data Scientist',
      company: 'TechCorp Solutions',
      status: 'Shortlisted',
      appliedDate: '2024-01-10',
      statusColor: 'bg-green-100 text-green-800'
    }
  ]

  const handleViewJobDetails = async (job) => {
    setSelectedJob(job)
    setShowJobDetails(true)

    // Track interaction
    try {
      await aiAPI.trackRecommendationInteraction(job.id, 'view', job.matchScore, {
        source: 'dashboard',
        jobTitle: job.title,
        company: job.company
      })
    } catch (error) {
      console.error('Failed to track job view interaction:', error)
    }
  }

  const handleApplyToJob = async (jobId) => {
    // Find the job to get match score
    const job = jobRecommendations.find(j => j.id === jobId)

    // Track interaction
    try {
      await aiAPI.trackRecommendationInteraction(jobId, 'apply', job?.matchScore, {
        source: 'dashboard',
        jobTitle: job?.title,
        company: job?.company
      })
    } catch (error) {
      console.error('Failed to track job apply interaction:', error)
    }

    // Handle job application
    toast.success('Application submitted successfully!')
  }

  const handleJobFeedback = async (job, rating, feedback = '') => {
    try {
      await aiAPI.submitRecommendationFeedback(job.id, rating, feedback)

      // Track that feedback was given for this job
      setFeedbackGiven(prev => new Set([...prev, job.id]))

      // Show appropriate message based on rating
      if (rating >= 4) {
        toast.success('Thank you for your positive feedback! 👍')
      } else {
        toast.success('Thank you for your feedback. We\'ll improve our recommendations! 👎')
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.candidateProfile?.firstName || user?.name || 'Candidate'}! 👋
          </h1>
          <p className="text-blue-100">
            You have {stats.jobMatches} new job matches and {stats.interviews} interview{stats.interviews !== 1 ? 's' : ''} scheduled.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat) => (
            <div key={stat.name} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{application.jobTitle}</h4>
                      <p className="text-sm text-gray-600">{application.company}</p>
                      <p className="text-xs text-gray-500">Applied on {application.appliedDate}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${application.statusColor}`}>
                      {application.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/candidate/applications')}
                  className="btn-outline w-full"
                >
                  View All Applications
                </button>
              </div>
            </div>
          </div>

          {/* Job Recommendations */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">AI-Powered Job Recommendations</h3>
                {recommendationsLoading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Analyzing...
                  </div>
                )}
              </div>
            </div>
            <div className="card-body">
              {recommendationsLoading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobRecommendations.length === 0 ? (
                // Empty state
                <div className="text-center py-8">
                  <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Job Recommendations Yet</h4>
                  <p className="text-gray-600 mb-4">
                    Complete your profile and upload your CV to get personalized job recommendations powered by AI.
                  </p>
                  <div className="space-x-3">
                    <button
                      onClick={() => navigate('/candidate/cv-builder')}
                      className="btn-primary"
                    >
                      Complete Profile
                    </button>
                    <button
                      onClick={fetchJobRecommendations}
                      className="btn-outline"
                    >
                      Refresh Recommendations
                    </button>
                  </div>
                </div>
              ) : (
                // Job recommendations
                <>
                  <div className="space-y-4">
                    {jobRecommendations.map((job) => (
                      <div key={job.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.company}</p>
                            <p className="text-xs text-gray-500">{job.location}</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{job.salary}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {job.remote && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Remote
                                </span>
                              )}
                              {job.matchedSkills && job.matchedSkills.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {job.matchedSkills.length} skills match
                                </span>
                              )}
                            </div>
                            {job.reasoning && (
                              <p className="text-xs text-gray-600 mt-2 italic">
                                💡 {job.reasoning}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">{job.matchScore}%</div>
                            <div className="text-xs text-gray-500">AI Match</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApplyToJob(job.id)}
                              className="btn-primary text-xs px-3 py-1"
                            >
                              Apply Now
                            </button>
                            <button
                              onClick={() => handleViewJobDetails(job)}
                              className="btn-outline text-xs px-3 py-1"
                            >
                              View Details
                            </button>
                          </div>

                          {/* Feedback buttons */}
                          <div className="flex items-center space-x-1">
                            {feedbackGiven.has(job.id) ? (
                              <span className="text-xs text-gray-500">Thanks for feedback!</span>
                            ) : (
                              <>
                                <span className="text-xs text-gray-500 mr-2">Helpful?</span>
                                <button
                                  onClick={() => handleJobFeedback(job, 5, 'Positive feedback from dashboard')}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="This recommendation was helpful"
                                >
                                  <HandThumbUpIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleJobFeedback(job, 2, 'Negative feedback from dashboard')}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="This recommendation was not helpful"
                                >
                                  <HandThumbDownIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => navigate('/candidate/jobs')}
                      className="btn-outline flex-1"
                    >
                      View All Jobs
                    </button>
                    <button
                      onClick={fetchJobRecommendations}
                      className="btn-outline"
                    >
                      Refresh
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <button
                onClick={() => navigate('/candidate/cv-builder')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <SparklesIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Build CV</p>
                <p className="text-xs text-gray-500">Create professional CV</p>
              </button>

              <button
                onClick={() => navigate('/candidate/jobs')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Search Jobs</p>
                <p className="text-xs text-gray-500">Find your next opportunity</p>
              </button>
              <button
                onClick={() => navigate('/candidate/applications')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">My Applications</p>
                <p className="text-xs text-gray-500">Track application status</p>
              </button>

            </div>
          </div>
        </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={showJobDetails}
        onClose={() => setShowJobDetails(false)}
        onApply={handleApplyToJob}
        showApplyButton={true}
      />
    </div>
  )
}

export default CandidateDashboard
