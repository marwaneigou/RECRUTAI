import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import DashboardLayout from './DashboardLayout'
import CandidateProfile from '../candidates/CandidateProfile'
import JobSearch from '../candidates/JobSearch'
import Applications from '../candidates/Applications'
import Resume from '../candidates/Resume'
import CVBuilder from '../candidates/CVBuilder'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  UserIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const CandidateDashboard = () => {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard') // dashboard, profile, jobSearch, applications, resume, cvBuilder
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCandidateStats()
  }, [])

  const fetchCandidateStats = async () => {
    try {
      setLoading(true)
      // This would be the actual API call when candidate stats are implemented
      // const response = await api.get('/candidates/stats')

      // For now, use mock data
      const mockStats = {
        applicationsSent: 12,
        jobMatches: 8,
        profileViews: 24,
        interviews: 3
      }

      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching candidate stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Handle different views
  if (currentView === 'profile') {
    return (
      <DashboardLayout
        title="My Profile"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <CandidateProfile />
      </DashboardLayout>
    )
  }

  if (currentView === 'jobSearch') {
    return (
      <DashboardLayout
        title="Job Search"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <JobSearch />
      </DashboardLayout>
    )
  }

  if (currentView === 'applications') {
    return (
      <DashboardLayout
        title="My Applications"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <Applications />
      </DashboardLayout>
    )
  }

  if (currentView === 'resume') {
    return (
      <DashboardLayout
        title="My Resumes"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <Resume />
      </DashboardLayout>
    )
  }

  if (currentView === 'cvBuilder') {
    return (
      <DashboardLayout
        title="CV Builder"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <CVBuilder />
      </DashboardLayout>
    )
  }

  // Main dashboard view
  const statsData = [
    {
      name: 'Applications Sent',
      value: stats?.applicationsSent || '0',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      change: '+2 this week'
    },
    {
      name: 'Job Matches',
      value: stats?.jobMatches || '0',
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      change: '+3 new matches'
    },
    {
      name: 'Profile Views',
      value: stats?.profileViews || '0',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: '+5 this week'
    },
    {
      name: 'Interviews',
      value: stats?.interviews || '0',
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
      remote: true
    },
    {
      id: 2,
      title: 'Python Backend Developer',
      company: 'StartupXYZ',
      location: 'Toulouse, France',
      matchScore: 87,
      salary: '42k - 57k €',
      remote: true
    }
  ]

  return (
    <DashboardLayout
      title="Candidate Dashboard"
      user={user}
      currentView={currentView}
      onViewChange={setCurrentView}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.candidateProfile?.firstName || user?.name || 'Candidate'}! 👋
          </h1>
          <p className="text-blue-100">
            You have {stats?.jobMatches || 0} new job matches and {stats?.interviews || 0} interview{stats?.interviews !== 1 ? 's' : ''} scheduled.
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
                  onClick={() => setCurrentView('applications')}
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
                      <button className="btn-primary text-xs px-3 py-1">Apply Now</button>
                      <button className="btn-outline text-xs px-3 py-1">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setCurrentView('jobSearch')}
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
                onClick={() => setCurrentView('cvBuilder')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <SparklesIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Build CV</p>
                <p className="text-xs text-gray-500">Create professional CV</p>
              </button>
              <button
                onClick={() => setCurrentView('resume')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Manage Resume</p>
                <p className="text-xs text-gray-500">Upload and update resumes</p>
              </button>
              <button
                onClick={() => setCurrentView('jobSearch')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Search Jobs</p>
                <p className="text-xs text-gray-500">Find your next opportunity</p>
              </button>
              <button
                onClick={() => setCurrentView('applications')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">My Applications</p>
                <p className="text-xs text-gray-500">Track application status</p>
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <UserIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Update Profile</p>
                <p className="text-xs text-gray-500">Keep your profile current</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CandidateDashboard
