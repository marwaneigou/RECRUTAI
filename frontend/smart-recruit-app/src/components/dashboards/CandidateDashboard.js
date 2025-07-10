import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import JobDetailsModal from '../common/JobDetailsModal'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserIcon,
  SparklesIcon
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

  useEffect(() => {
    fetchCandidateStats()
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

  const jobRecommendations = [
    {
      id: 1,
      title: 'Machine Learning Engineer',
      company: 'StartupXYZ',
      location: 'Toulouse, France',
      matchScore: 94,
      salary: '45k - 60k €',
      salaryMin: 45,
      salaryMax: 60,
      currency: 'EUR',
      employmentType: 'Full-time',
      experienceLevel: 'Senior',
      remote: true,
      description: 'Join our AI team to develop cutting-edge machine learning models. You will work on computer vision, NLP, and recommendation systems using Python, TensorFlow, and PyTorch.',
      requirements: '• PhD or Master\'s in Computer Science, AI, or related field\n• 3+ years of experience in ML/AI\n• Proficiency in Python, TensorFlow, PyTorch\n• Experience with cloud platforms (AWS, GCP)',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning'],
      benefits: ['Stock options', 'Flexible hours', 'Remote work', 'Learning budget'],
      createdAt: '2025-06-25T10:00:00Z'
    },
    {
      id: 2,
      title: 'Python Backend Developer',
      company: 'StartupXYZ',
      location: 'Toulouse, France',
      matchScore: 87,
      salary: '42k - 57k €',
      salaryMin: 42,
      salaryMax: 57,
      currency: 'EUR',
      employmentType: 'Full-time',
      experienceLevel: 'Mid-level',
      remote: true,
      description: 'Develop and maintain scalable backend services using Python and Django. Work with modern technologies and agile methodologies.',
      requirements: '• Bachelor\'s degree in Computer Science\n• 3+ years of Python development experience\n• Experience with Django/Flask\n• Knowledge of databases and APIs',
      skills: ['Python', 'Django', 'PostgreSQL', 'REST APIs', 'Docker'],
      benefits: ['Remote work', 'Flexible schedule', 'Tech allowance', 'Training budget'],
      createdAt: '2025-06-24T14:30:00Z'
    }
  ]

  const handleViewJobDetails = (job) => {
    setSelectedJob(job)
    setShowJobDetails(true)
  }

  const handleApplyToJob = (jobId) => {
    // Handle job application
    toast.success('Application submitted successfully!')
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
              <h3 className="text-lg font-medium text-gray-900">Recommended Jobs</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {jobRecommendations.map((job) => (
                  <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <p className="text-xs text-gray-500">{job.location}</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{job.salary}</p>
                        {job.remote && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                            Remote
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{job.matchScore}%</div>
                        <div className="text-xs text-gray-500">Match</div>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
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
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/candidate/jobs')}
                  className="btn-outline w-full"
                >
                  View All Jobs
                </button>
              </div>
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
