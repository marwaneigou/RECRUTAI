import React, { useState, useEffect } from 'react'
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'


const JobApplicationModal = ({ job, isOpen, onClose, onApplicationSubmitted }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [cvData, setCvData] = useState(null)
  const [matchScore, setMatchScore] = useState(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [coverLetterLoading, setCoverLetterLoading] = useState(false)
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

  const calculateMatchScore = async () => {
    if (!cvData || !job) {
      toast.error('CV data or job information is missing')
      return
    }

    try {
      setMatchLoading(true)

      // Convert CV data to text format for analysis
      const personalInfo = cvData.personalInfo || {}
      const cvText = `
        Name: ${personalInfo.firstName} ${personalInfo.lastName}
        Email: ${personalInfo.email}
        Phone: ${personalInfo.phone}
        Location: ${personalInfo.address}

        Professional Summary: ${cvData.professionalSummary || ''}

        Technical Skills: ${cvData.skills?.filter(s => ['Programming', 'Frontend', 'Backend'].includes(s.category))
          .map(s => s.name).join(', ') || ''}

        Soft Skills: ${cvData.skills?.filter(s => s.category === 'Soft')
          .map(s => s.name).join(', ') || ''}

        Languages: ${cvData.languages || ''}

        Experience: ${cvData.experience?.map(exp =>
          `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}): ${exp.description}`
        ).join('\n') || ''}

        Education: ${cvData.education?.map(edu =>
          `${edu.degree} from ${edu.institution} (${edu.endDate})`
        ).join('\n') || ''}

        Projects: ${cvData.projects?.map(proj =>
          `${proj.name}: ${proj.description} (${proj.technologies})`
        ).join('\n') || ''}

        Certifications: ${cvData.certifications?.map(cert =>
          `${cert.name} from ${cert.issuer} (${cert.date})`
        ).join('\n') || ''}
      `.trim()

      // Call the analysis service
      const response = await fetch('http://localhost:5002/api/analyze/calculate-match-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText: cvText,
          jobTitle: job.title,
          jobDescription: job.description,
          jobRequirements: job.requirements || job.description,
          company: job.company
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Match score result:', result)

      if (result.matchScore !== undefined) {
        setMatchScore(result)
        toast.success(`Match score calculated: ${result.matchScore}%`)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error calculating match score:', error)
      toast.error('Failed to calculate match score. Please try again.')
    } finally {
      setMatchLoading(false)
    }
  }

  const generateCoverLetter = async () => {
    if (!cvData || !job) {
      toast.error('CV data or job information is missing')
      return
    }

    try {
      setCoverLetterLoading(true)

      // Convert CV data to text format for analysis
      const personalInfo = cvData.personalInfo || {}
      const cvText = `
        Name: ${personalInfo.firstName} ${personalInfo.lastName}
        Email: ${personalInfo.email}
        Phone: ${personalInfo.phone}
        Location: ${personalInfo.address}

        Professional Summary: ${cvData.professionalSummary || ''}

        Technical Skills: ${cvData.skills?.filter(s => ['Programming', 'Frontend', 'Backend'].includes(s.category))
          .map(s => s.name).join(', ') || ''}

        Soft Skills: ${cvData.skills?.filter(s => s.category === 'Soft')
          .map(s => s.name).join(', ') || ''}

        Languages: ${cvData.languages || ''}

        Experience: ${cvData.experience?.map(exp =>
          `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}): ${exp.description}`
        ).join('\n') || ''}

        Education: ${cvData.education?.map(edu =>
          `${edu.degree} from ${edu.institution} (${edu.endDate})`
        ).join('\n') || ''}

        Projects: ${cvData.projects?.map(proj =>
          `${proj.name}: ${proj.description} (${proj.technologies})`
        ).join('\n') || ''}

        Certifications: ${cvData.certifications?.map(cert =>
          `${cert.name} from ${cert.issuer} (${cert.date})`
        ).join('\n') || ''}
      `.trim()

      // Call the analysis service
      const response = await fetch('http://localhost:5002/api/analyze/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText: cvText,
          jobTitle: job.title,
          jobDescription: job.description,
          company: job.company || job.employer?.company_name || 'the company',
          candidateName: `${personalInfo.firstName} ${personalInfo.lastName}`.trim() || 'Candidate'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Cover letter result:', result)

      if (result.coverLetter) {
        setFormData(prev => ({
          ...prev,
          coverLetter: result.coverLetter
        }))
        toast.success(`AI cover letter generated! (${result.wordCount} words)`)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error generating cover letter:', error)
      toast.error('Failed to generate cover letter. Please try again.')
    } finally {
      setCoverLetterLoading(false)
    }
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

    if (!matchScore || !matchScore.matchScore) {
      toast.error('Please calculate the match score before applying')
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
        cvSnapshot: cvSnapshot,
        // Include match score data if calculated
        ...(matchScore && {
          matchScore: matchScore.matchScore,
          matchAnalysis: matchScore.analysis,
          matchStrengths: matchScore.strengths,
          matchGaps: matchScore.gaps
        })
      }

      await api.post('/applications/submit', applicationData)
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

            {/* Match Score Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900">
                  CV-Job Match Analysis <span className="text-red-500">*</span>
                </h4>
                <button
                  type="button"
                  onClick={calculateMatchScore}
                  disabled={matchLoading || !cvData?.isComplete}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {matchLoading ? 'Calculating...' : 'Calculate Match Score'}
                </button>
              </div>

              {matchScore ? (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-3">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-blue-900 mr-2">
                          {matchScore.matchScore}%
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${matchScore.matchScore}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">{matchScore.analysis}</p>
                    </div>
                  </div>

                  {matchScore.strengths && matchScore.strengths.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-semibold text-green-800 mb-1">✅ Strengths:</h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        {matchScore.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {matchScore.gaps && matchScore.gaps.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-orange-800 mb-1">⚠️ Areas to Address:</h5>
                      <ul className="text-sm text-orange-700 space-y-1">
                        {matchScore.gaps.map((gap, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 text-center font-medium">
                    ⚠️ Match score calculation is required before applying
                  </p>
                  <p className="text-xs text-red-500 text-center mt-1">
                    Click "Calculate Match Score" to see how well your CV matches this job
                  </p>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Cover Letter *
                </label>
                <button
                  type="button"
                  onClick={generateCoverLetter}
                  disabled={coverLetterLoading || !cvData?.isComplete}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-md hover:from-green-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex items-center"
                >
                  {coverLetterLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      🤖 AI Generate Cover Letter
                    </>
                  )}
                </button>
              </div>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleInputChange}
                required
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write a compelling cover letter explaining why you're interested in this position and how your skills match the requirements..."
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  {formData.coverLetter.length}/1000 characters
                </p>
                <p className="text-xs text-blue-600">
                  💡 Tip: Use AI to generate a personalized cover letter, then customize it
                </p>
              </div>
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
