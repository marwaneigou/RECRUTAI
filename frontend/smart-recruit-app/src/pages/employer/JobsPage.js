import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import JobForm from '../../components/employers/JobForm'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const JobsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/jobs')
      console.log('API Response:', response.data) // Debug log

      // Handle the nested response structure: response.data.data.jobs
      const allJobs = response.data.data?.jobs || response.data.jobs || []

      // Filter jobs for current employer (if user is employer)
      // For now, we'll show all jobs - you can add employer filtering later
      const formattedJobs = allJobs.map(job => ({
        id: job.id,
        title: job.title,
        department: job.employer?.industry || 'General',
        location: job.location,
        type: job.employmentType?.replace('_', ' ').toLowerCase() || 'full-time',
        salary: formatSalary(job.salaryMin, job.salaryMax, job.currency),
        status: job.isActive ? 'Active' : 'Inactive',
        applications: 0, // Will be updated when applications API is ready
        views: 0, // Will be updated when analytics are available
        postedDate: new Date(job.createdAt).toISOString().split('T')[0],
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        employment_type: job.employmentType,
        experience_level: job.experienceLevel,
        salary_min: job.salaryMin,
        salary_max: job.salaryMax,
        currency: job.currency,
        remote_allowed: job.remoteAllowed,
        is_active: job.isActive,
        employer: job.employer
      }))

      console.log('Formatted Jobs:', formattedJobs) // Debug log
      setJobs(formattedJobs)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

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

  const handleCreateJob = () => {
    setShowCreateForm(true)
    setEditingJob(null)
  }

  const handleEditJob = (job) => {
    setEditingJob(job)
    setShowCreateForm(true)
  }

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await api.delete(`/jobs/${jobId}`)
        setJobs(jobs.filter(job => job.id !== jobId))
        toast.success('Job deleted successfully')
      } catch (error) {
        console.error('Error deleting job:', error)
        toast.error('Failed to delete job')
      }
    }
  }

  const handleSaveJob = async (jobData) => {
    try {
      const apiData = {
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities || '',
        location: jobData.location,
        employmentType: jobData.type, // Keep as lowercase with hyphens
        experienceLevel: jobData.experience_level || 'mid',
        salaryMin: jobData.salary_min ? parseInt(jobData.salary_min) : null,
        salaryMax: jobData.salary_max ? parseInt(jobData.salary_max) : null,
        currency: jobData.currency || 'EUR',
        remoteAllowed: jobData.remote_allowed || jobData.location.toLowerCase().includes('remote'),
        isActive: jobData.status === 'Active'
      }

      console.log('Sending API Data:', apiData) // Debug log

      if (editingJob) {
        // Update existing job
        await api.put(`/jobs/${editingJob.id}`, apiData)
        toast.success('Job updated successfully')
      } else {
        // Create new job
        await api.post('/jobs', apiData)
        toast.success('Job created successfully')
      }

      // Refresh the jobs list
      await fetchJobs()
      setShowCreateForm(false)
      setEditingJob(null)
    } catch (error) {
      console.error('Error saving job:', error)
      console.error('Error details:', error.response?.data) // Debug log

      // Handle validation errors
      if (error.response?.data?.error?.code === 'VALIDATION_ERROR') {
        const validationErrors = error.response.data.error.details || []
        const errorMessages = validationErrors.map(err => `${err.path}: ${err.msg}`).join('\n')
        toast.error(`Validation failed:\n${errorMessages}`, {
          duration: 6000,
          style: {
            whiteSpace: 'pre-line'
          }
        })
      } else {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Unknown error'
        toast.error(`${editingJob ? 'Failed to update job' : 'Failed to create job'}: ${errorMessage}`)
      }
    }
  }

  const handleCancelForm = () => {
    setShowCreateForm(false)
    setEditingJob(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Draft': return 'bg-yellow-100 text-yellow-800'
      case 'Closed': return 'bg-red-100 text-red-800'
      case 'Paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="mt-2 text-gray-600">Create, edit, and manage your job postings.</p>
          </div>
          <button
            onClick={handleCreateJob}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Job
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{jobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">
                {jobs.reduce((sum, job) => sum + job.applications, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900">
                {jobs.reduce((sum, job) => sum + job.views, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {jobs.filter(job => job.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Listings Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Job Postings</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <BriefcaseIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first job posting</p>
            <button
              onClick={handleCreateJob}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 inline mr-2" />
              Create Job Posting
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
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
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.department}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {job.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {job.salary}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="font-medium">{job.applications}</span>
                      <span className="ml-2 text-gray-500">({job.views} views)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditJob(job)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Job"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/employer/jobs/${job.id}/candidates`)}
                        className="text-green-600 hover:text-green-900"
                        title="View Candidates"
                      >
                        <UserGroupIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Job"
                      >
                        <TrashIcon className="h-4 w-4" />
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

      {/* Job Form Modal */}
      <JobForm
        job={editingJob}
        isOpen={showCreateForm}
        onSave={handleSaveJob}
        onCancel={handleCancelForm}
      />
    </div>
  )
}

export default JobsPage
