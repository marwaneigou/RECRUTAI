import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import DashboardLayout from './DashboardLayout'
import EmployerProfile from '../employers/EmployerProfile'
import CreateJob from '../employers/CreateJob'
import JobListings from '../employers/JobListings'
import EditJob from '../employers/EditJob'
import JobOffers from '../employers/JobOffers'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  BriefcaseIcon,
  UserGroupIcon,
  EyeIcon,
  PlusIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const EmployerDashboard = () => {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard') // dashboard, profile, createJob, myJobs, editJob, jobOffers

  // Debug logging
  console.log('EmployerDashboard - User:', user)
  console.log('EmployerDashboard - Current view:', currentView)
  const [stats, setStats] = useState(null)
  const [recentApplications, setRecentApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeJobs, setActiveJobs] = useState([])
  const [editingJob, setEditingJob] = useState(null)

  useEffect(() => {
    // Only fetch stats once when component mounts
    fetchEmployerStats()
  }, [])

  const fetchEmployerStats = async () => {
    try {
      setLoading(true)

      // Fetch employer profile and stats
      const [profileResponse, jobsResponse] = await Promise.all([
        api.get('/employers/profile'),
        api.get('/jobs') // Get all jobs, will be filtered by backend for this employer
      ])

      const profile = profileResponse.data.employer
      const jobs = jobsResponse.data.jobs || []

      // Filter jobs for this employer (in case backend doesn't filter)
      const employerJobs = jobs.filter(job => job.employer?.id === profile.id)

      // Calculate statistics
      const totalJobs = employerJobs.length
      const activeJobsCount = employerJobs.filter(job => job.isActive).length
      const totalApplications = 0 // Will be updated when applications API is ready
      const pendingApplications = 0 // Will be updated when applications API is ready

      setStats({
        totalJobs,
        activeJobs: activeJobsCount,
        totalApplications,
        pendingApplications,
        companyName: profile.companyName
      })

      // Set active jobs for display
      const activeJobsList = employerJobs
        .filter(job => job.isActive)
        .slice(0, 3) // Show only first 3
        .map(job => ({
          id: job.id,
          title: job.title,
          applications: 0, // Will be updated when applications API is ready
          views: 0, // Will be updated when analytics are available
          posted: new Date(job.createdAt).toLocaleDateString(),
          status: job.isActive ? 'Active' : 'Inactive'
        }))

      setActiveJobs(activeJobsList)

      // Set empty recent applications for now
      setRecentApplications([])

    } catch (error) {
      console.error('Error fetching employer stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleJobCreated = (newJob) => {
    setCurrentView('dashboard')
    // Refresh the dashboard data
    fetchEmployerStats()
  }

  const handleEditJob = (job) => {
    setEditingJob(job)
    setCurrentView('editJob')
  }

  const handleJobUpdated = (updatedJob) => {
    setCurrentView('myJobs')
    setEditingJob(null)
    // Refresh data if needed
    fetchEmployerStats()
  }

  // Render different views based on currentView state
  if (currentView === 'profile') {
    return (
      <DashboardLayout
        title="Company Profile"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <EmployerProfile />
      </DashboardLayout>
    )
  }

  if (currentView === 'createJob') {
    return (
      <DashboardLayout
        title="Create Job Posting"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <CreateJob
          onJobCreated={handleJobCreated}
          onCancel={() => setCurrentView('dashboard')}
        />
      </DashboardLayout>
    )
  }

  if (currentView === 'myJobs') {
    return (
      <DashboardLayout
        title="My Job Postings"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <JobListings
          onCreateJob={() => setCurrentView('createJob')}
          onEditJob={handleEditJob}
        />
      </DashboardLayout>
    )
  }

  if (currentView === 'editJob' && editingJob) {
    return (
      <DashboardLayout
        title="Edit Job Posting"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <EditJob
          job={editingJob}
          onJobUpdated={handleJobUpdated}
          onCancel={() => setCurrentView('myJobs')}
        />
      </DashboardLayout>
    )
  }

  if (currentView === 'jobOffers') {
    return (
      <DashboardLayout
        title="Job Applications"
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <JobOffers />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Employer Dashboard"
      user={user}
      currentView={currentView}
      onViewChange={setCurrentView}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {stats?.companyName || user?.name}! 🏢
          </h1>
          <p className="text-green-100">
            {loading ? (
              'Loading your dashboard...'
            ) : (
              `You have ${stats?.totalApplications || 0} applications and ${stats?.activeJobs || 0} active job postings.`
            )}
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => setCurrentView('createJob')}
              className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              <PlusIcon className="h-5 w-5 inline mr-2" />
              Post New Job
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-white/20 text-white px-4 py-2 rounded-md font-medium hover:bg-white/30 transition-colors"
            >
              <Cog6ToothIcon className="h-5 w-5 inline mr-2" />
              Manage Profile
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Job Postings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.activeJobs || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Applications
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalApplications || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Applications
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.pendingApplications || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BriefcaseIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Job Postings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalJobs || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-6 bg-gray-300 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{application.candidateName}</h4>
                        <p className="text-sm text-gray-600">{application.jobTitle}</p>
                        <p className="text-xs text-gray-500">Applied on {application.appliedDate}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{application.matchScore}%</div>
                        <div className="text-xs text-gray-500">Match</div>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${application.statusColor}`}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No applications yet</p>
                  <p className="text-sm text-gray-400">Applications will appear here when candidates apply to your jobs</p>
                </div>
              )}
              {!loading && recentApplications.length > 0 && (
                <div className="mt-4">
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View All Applications
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Active Job Posts</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeJobs.length > 0 ? (
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">{job.title}</h4>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">{job.applications}</span> applications
                        </div>
                        <div>
                          <span className="font-medium">{job.views}</span> views
                        </div>
                        <div>
                          Posted {job.posted}
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => setCurrentView('jobOffers')}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          View Applications
                        </button>
                        <button
                          onClick={() => handleEditJob(job)}
                          className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                          Edit Job
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active jobs</p>
                  <p className="text-sm text-gray-400">Create your first job posting to start receiving applications</p>
                  <button
                    onClick={() => setCurrentView('createJob')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Job Posting
                  </button>
                </div>
              )}
              {!loading && activeJobs.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setCurrentView('myJobs')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View All Jobs
                  </button>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setCurrentView('createJob')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <PlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Post New Job</p>
                <p className="text-xs text-gray-500">Create a new job posting</p>
              </button>
              <button
                onClick={() => setCurrentView('myJobs')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <BriefcaseIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Edit Jobs</p>
                <p className="text-xs text-gray-500">Manage job postings</p>
              </button>
              <button
                onClick={() => setCurrentView('jobOffers')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Job Applications</p>
                <p className="text-xs text-gray-500">Review applications</p>
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Company Profile</p>
                <p className="text-xs text-gray-500">Manage company info</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EmployerDashboard
