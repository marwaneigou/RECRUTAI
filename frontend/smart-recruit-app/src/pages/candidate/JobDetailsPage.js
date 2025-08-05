import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import JobApplicationModal from '../../components/candidates/JobApplicationModal'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  BookmarkIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import {
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid'

const JobDetailsPage = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Check if we should auto-open the application modal
  const shouldAutoApply = searchParams.get('apply') === 'true'

  useEffect(() => {
    fetchJobDetails()
  }, [jobId])

  useEffect(() => {
    // Auto-open application modal if apply=true in URL
    if (shouldAutoApply && job && !loading) {
      setShowApplicationModal(true)
    }
  }, [shouldAutoApply, job, loading])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/jobs/${jobId}`)
      
      if (response.success) {
        setJob(response.data.job)
        
        // Check if job is saved
        const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]')
        setIsSaved(savedJobs.includes(parseInt(jobId)))
      } else {
        toast.error('Failed to load job details')
        navigate('/candidate/jobs')
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
      toast.error('Failed to load job details')
      navigate('/candidate/jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToJob = () => {
    setShowApplicationModal(true)
  }

  const handleApplicationSubmitted = () => {
    toast.success('Application submitted successfully!')
    setShowApplicationModal(false)
    // Optionally navigate back or refresh
  }

  const handleSaveJob = () => {
    try {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      let newSavedJobs
      
      if (isSaved) {
        newSavedJobs = savedJobs.filter(id => id !== parseInt(jobId))
        toast.success('Job removed from saved jobs')
      } else {
        newSavedJobs = [...savedJobs, parseInt(jobId)]
        toast.success('Job saved successfully')
      }
      
      localStorage.setItem('savedJobs', JSON.stringify(newSavedJobs))
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error saving job:', error)
      toast.error('Failed to save job')
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: job.title,
          text: `Check out this job opportunity: ${job.title} at ${job.employer?.companyName}`,
          url: window.location.href
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Job link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing job:', error)
      toast.error('Failed to share job')
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          onClick={() => navigate('/candidate/jobs')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Job Search
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/candidate/jobs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Job Search
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">{job.employer?.companyName}</span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  <span>{job.location}</span>
                  {job.remoteAllowed && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Remote OK
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>{job.employmentType?.replace('_', ' ') || 'Full-time'}</span>
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  <span>{job.experienceLevel} level</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Posted {formatDate(job.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSaveJob}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={isSaved ? 'Remove from saved jobs' : 'Save job'}
              >
                {isSaved ? (
                  <BookmarkSolidIcon className="h-5 w-5 text-blue-600" />
                ) : (
                  <BookmarkIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
              <button
                onClick={handleShare}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Share job"
              >
                <ShareIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleApplyToJob}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsibilities</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.responsibilities}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Company</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-900">{job.employer?.companyName}</span>
              </div>
              {job.employer?.industry && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Industry:</span> {job.employer.industry}
                </div>
              )}
              {job.employer?.companySize && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Company Size:</span> {job.employer.companySize}
                </div>
              )}
              {job.employer?.website && (
                <div className="text-sm">
                  <a 
                    href={job.employer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Visit Company Website
                  </a>
                </div>
              )}
              {job.employer?.description && (
                <div className="text-sm text-gray-700 mt-3">
                  {job.employer.description}
                </div>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-900">Employment Type:</span>
                <span className="ml-2 text-gray-600">{job.employmentType?.replace('_', ' ') || 'Full-time'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-900">Experience Level:</span>
                <span className="ml-2 text-gray-600">{job.experienceLevel}</span>
              </div>
              <div>
                <span className="font-medium text-gray-900">Location:</span>
                <span className="ml-2 text-gray-600">{job.location}</span>
              </div>
              {job.applicationDeadline && (
                <div>
                  <span className="font-medium text-gray-900">Application Deadline:</span>
                  <span className="ml-2 text-gray-600">{formatDate(job.applicationDeadline)}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-900">Posted:</span>
                <span className="ml-2 text-gray-600">{formatDate(job.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Apply Button (Sticky) */}
          <div className="sticky top-6">
            <button
              onClick={handleApplyToJob}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
            >
              Apply for this Position
            </button>
          </div>
        </div>
      </div>

      {/* Job Application Modal */}
      <JobApplicationModal
        job={job}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </div>
  )
}

export default JobDetailsPage
