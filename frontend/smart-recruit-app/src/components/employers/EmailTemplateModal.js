import React, { useState, useEffect } from 'react'
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../services/api'

const EmailTemplateModal = ({ 
  isOpen, 
  onClose, 
  application, 
  newStatus, 
  onEmailSent 
}) => {
  const [loading, setLoading] = useState(false)
  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
    recipientEmail: '',
    recipientName: ''
  })

  // Email templates for different statuses
  const emailTemplates = {
    reviewed: {
      subject: 'Application Update - Under Review',
      body: `Dear {candidateName},

Thank you for your interest in the {jobTitle} position at {companyName}.

We have reviewed your application and are pleased to inform you that it has progressed to the next stage of our selection process. Your qualifications and experience align well with what we're looking for.

Our team will be in touch soon with next steps.

Best regards,
{companyName} Hiring Team`
    },
    shortlisted: {
      subject: 'Great News - You\'ve Been Shortlisted!',
      body: `Dear {candidateName},

Congratulations! We are excited to inform you that you have been shortlisted for the {jobTitle} position at {companyName}.

Your application stood out among many qualified candidates, and we would like to move forward with the next step in our hiring process.

We will contact you within the next 2-3 business days to schedule an interview.

Best regards,
{companyName} Hiring Team`
    },
    interviewed: {
      subject: 'Interview Scheduled - {jobTitle}',
      body: `Dear {candidateName},

Thank you for your continued interest in the {jobTitle} position at {companyName}.

We would like to invite you for an interview to discuss your qualifications and learn more about your experience.

Please reply to this email with your availability for the coming week, and we will schedule a convenient time.

Looking forward to speaking with you soon.

Best regards,
{companyName} Hiring Team`
    },
    offered: {
      subject: 'Job Offer - {jobTitle} Position',
      body: `Dear {candidateName},

We are delighted to extend an offer for the {jobTitle} position at {companyName}!

After careful consideration of your qualifications and interview performance, we believe you would be an excellent addition to our team.

Please find the detailed offer letter attached. We would appreciate your response within 5 business days.

If you have any questions, please don't hesitate to reach out.

Congratulations and welcome to the team!

Best regards,
{companyName} Hiring Team`
    },
    accepted: {
      subject: 'Welcome to {companyName}!',
      body: `Dear {candidateName},

Welcome to {companyName}! We are thrilled that you have accepted our offer for the {jobTitle} position.

Our HR team will be in touch shortly with onboarding information, including your start date, required documentation, and first-day details.

We look forward to having you join our team and contribute to our continued success.

Welcome aboard!

Best regards,
{companyName} Team`
    },
    rejected: {
      subject: 'Application Update - {jobTitle}',
      body: `Dear {candidateName},

Thank you for your interest in the {jobTitle} position at {companyName} and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We were impressed by your qualifications and encourage you to apply for future opportunities that align with your skills and experience.

We wish you the best of luck in your job search.

Best regards,
{companyName} Hiring Team`
    },
    withdrawn: {
      subject: 'Application Status Update',
      body: `Dear {candidateName},

We have received your request to withdraw your application for the {jobTitle} position at {companyName}.

Your application has been removed from our active candidate pool as requested.

Thank you for your interest in {companyName}, and we hope you will consider us for future opportunities.

Best regards,
{companyName} Hiring Team`
    }
  }

  useEffect(() => {
    if (isOpen && application && newStatus) {
      const template = emailTemplates[newStatus]
      if (template) {
        // Replace placeholders with actual data
        const subject = template.subject
          .replace('{candidateName}', application.candidateName || 'Candidate')
          .replace('{jobTitle}', application.jobTitle || 'Position')
          .replace('{companyName}', application.companyName || 'Our Company')

        const body = template.body
          .replace(/{candidateName}/g, application.candidateName || 'Candidate')
          .replace(/{jobTitle}/g, application.jobTitle || 'Position')
          .replace(/{companyName}/g, application.companyName || 'Our Company')

        setEmailData({
          subject,
          body,
          recipientEmail: application.email || '',
          recipientName: application.candidateName || ''
        })
      }
    }
  }, [isOpen, application, newStatus])

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail || !emailData.subject || !emailData.body) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      const response = await api.post('/applications/send-status-email', {
        applicationId: application.id,
        recipientEmail: emailData.recipientEmail,
        recipientName: emailData.recipientName,
        subject: emailData.subject,
        body: emailData.body,
        status: newStatus
      })

      if (response.success) {
        toast.success('Email sent successfully!')
        onEmailSent()
        onClose()
      } else {
        toast.error('Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Send Status Update Email
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Status: <span className="font-medium capitalize">{newStatus}</span> • 
              Candidate: <span className="font-medium">{application?.candidateName}</span>
            </p>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4">
            <div className="space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailData.recipientEmail}
                  onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="candidate@example.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={emailData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email message"
                />
              </div>

              {/* Template Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> You can customize this template before sending. 
                  The placeholders have been automatically replaced with candidate and job information.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={loading || !emailData.recipientEmail || !emailData.subject || !emailData.body}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailTemplateModal
