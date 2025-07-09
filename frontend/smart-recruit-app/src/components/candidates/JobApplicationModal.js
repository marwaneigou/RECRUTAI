import React, { useState, useEffect } from 'react'
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const JobApplicationModal = ({ job, isOpen, onClose, onApplicationSubmitted }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [cvData, setCvData] = useState(null)
  const [formData, setFormData] = useState({
    coverLetter: '',
    useCurrentCV: true
  })

  useEffect(() => {
    if (isOpen && user) {
      fetchCVData()
    }
  }, [isOpen, user])

  const fetchCVData = async () => {
    try {
      const response = await api.get('/candidates/cv-data')
      console.log('JobApplicationModal - API response:', response)
      console.log('JobApplicationModal - Response data:', response.data)

      // Handle different possible response structures
      let cvDataFromApi = null
      if (response.data && response.data.success) {
        cvDataFromApi = response.data.cvData || response.data.data?.cvData
      } else if (response.data && response.data.cvData) {
        cvDataFromApi = response.data.cvData
      } else if (response.cvData) {
        cvDataFromApi = response.cvData
      }

      console.log('JobApplicationModal - Parsed CV data:', cvDataFromApi)
      setCvData(cvDataFromApi)
    } catch (error) {
      console.error('Error fetching CV data:', error)
      toast.error('Failed to load CV data')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.coverLetter.trim()) {
      toast.error('Please write a cover letter')
      return
    }

    if (!cvData || !cvData.isComplete) {
      toast.error('Please complete your CV before applying')
      return
    }

    try {
      setLoading(true)

      // Create CV snapshot for this application
      const personalInfo = cvData.personalInfo || {}
      const cvSnapshot = {
        first_name: personalInfo.firstName || '',
        last_name: personalInfo.lastName || '',
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        address: personalInfo.address || '',
        city: personalInfo.city || '',
        country: personalInfo.country || '',
        linkedin_url: personalInfo.linkedin || '',
        github_url: personalInfo.github || '',
        portfolio_url: personalInfo.website || '',
        professional_summary: cvData.professionalSummary || '',
        technical_skills: cvData.skills?.filter(s => ['Programming', 'Frontend', 'Backend'].includes(s.category))
          .map(s => s.name).join(', ') || '',
        soft_skills: cvData.skills?.filter(s => s.category === 'Soft')
          .map(s => s.name).join(', ') || '',
        languages: cvData.languages || '',
        work_experience: cvData.experience || [],
        education: cvData.education || [],
        projects: cvData.projects || [],
        certifications: cvData.certifications || [],
        selected_template: cvData.selectedTemplate || 'modern'
      }

      const applicationData = {
        jobId: job.id,
        coverLetter: formData.coverLetter,
        cvSnapshot: cvSnapshot
      }

      await api.post('/applications', applicationData)
      toast.success('Application submitted successfully!')
      onApplicationSubmitted()
      onClose()
    } catch (error) {
      console.error('Error submitting application:', error)
      const errorMessage = error.response?.data?.error?.message || 'Failed to submit application'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Apply for {job?.title}
              </h3>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white px-6 py-6">
            {/* Job Information */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Job Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{job?.title}</p>
                <p className="text-sm text-gray-600">{job?.company} • {job?.location}</p>
                <p className="text-sm text-gray-600 mt-2">{job?.salary}</p>
              </div>
            </div>

            {/* CV Status */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Your CV</h4>
              {cvData ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        CV Ready: {cvData.personalInfo?.firstName} {cvData.personalInfo?.lastName}
                      </p>
                      <p className="text-xs text-green-600">
                        Template: {cvData.selectedTemplate} •
                        {cvData.isComplete ? ' Complete' : ' Incomplete'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800">No CV found. Please create your CV first.</p>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter *
              </label>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleInputChange}
                required
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write a compelling cover letter explaining why you're interested in this position and how your skills match the requirements..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.coverLetter.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !cvData?.isComplete}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default JobApplicationModal
