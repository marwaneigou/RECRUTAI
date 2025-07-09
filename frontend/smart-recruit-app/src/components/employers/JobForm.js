import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const JobForm = ({ job, onSave, onCancel, isOpen }) => {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time',
    salary: '',
    status: 'Draft',
    description: '',
    requirements: '',
    responsibilities: '',
    experience_level: 'mid',
    salary_min: '',
    salary_max: '',
    currency: 'EUR',
    remote_allowed: false
  })

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        department: job.department || '',
        location: job.location || '',
        type: job.employment_type || job.type || 'full-time',
        salary: job.salary || '',
        status: job.is_active ? 'Active' : 'Draft',
        description: job.description || '',
        requirements: job.requirements || '',
        responsibilities: job.responsibilities || '',
        experience_level: job.experience_level || 'mid',
        salary_min: job.salary_min || '',
        salary_max: job.salary_max || '',
        currency: job.currency || 'EUR',
        remote_allowed: job.remote_allowed || false
      })
    } else {
      setFormData({
        title: '',
        department: '',
        location: '',
        type: 'full-time',
        salary: '',
        status: 'Draft',
        description: '',
        requirements: '',
        responsibilities: '',
        experience_level: 'mid',
        salary_min: '',
        salary_max: '',
        currency: 'EUR',
        remote_allowed: false
      })
    }
  }, [job])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Client-side validation
    const errors = []

    if (!formData.title.trim()) {
      errors.push('Job title is required')
    }

    if (!formData.description.trim()) {
      errors.push('Job description is required')
    } else if (formData.description.length < 50) {
      errors.push('Description must be at least 50 characters long')
    } else if (formData.description.length > 5000) {
      errors.push('Description must be less than 5000 characters')
    }

    if (!formData.requirements.trim()) {
      errors.push('Job requirements are required')
    }

    if (!formData.location.trim()) {
      errors.push('Job location is required')
    }

    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'))
      return
    }

    const jobData = {
      ...formData,
      id: job ? job.id : Date.now(),
      applications: job ? job.applications : 0,
      views: job ? job.views : 0,
      postedDate: job ? job.postedDate : new Date().toISOString().split('T')[0]
    }

    onSave(jobData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onCancel}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {job ? 'Edit Job Posting' : 'Create New Job Posting'}
              </h3>
              <button
                onClick={onCancel}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Frontend Developer"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Paris, France or Remote"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level *
                </label>
                <select
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="entry">Entry Level</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              {/* Salary Min */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary (k)
                </label>
                <input
                  type="number"
                  name="salary_min"
                  value={formData.salary_min}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 50"
                />
              </div>

              {/* Salary Max */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary (k)
                </label>
                <input
                  type="number"
                  name="salary_max"
                  value={formData.salary_max}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 70"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Remote Work */}
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="remote_allowed"
                    checked={formData.remote_allowed}
                    onChange={(e) => setFormData(prev => ({ ...prev, remote_allowed: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Remote work allowed
                  </label>
                </div>
              </div>

              {/* Job Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                  <span className={`ml-2 text-xs ${
                    formData.description.length < 50 ? 'text-red-500' :
                    formData.description.length > 5000 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    ({formData.description.length}/5000 characters, min 50)
                  </span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.description.length < 50 || formData.description.length > 5000
                      ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe the role, responsibilities, and what you're looking for... (minimum 50 characters)"
                />
                {formData.description.length < 50 && formData.description.length > 0 && (
                  <p className="text-red-500 text-xs mt-1">
                    Description needs at least {50 - formData.description.length} more characters
                  </p>
                )}
              </div>

              {/* Responsibilities */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Responsibilities
                </label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List the main responsibilities and duties..."
                />
              </div>

              {/* Requirements */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements *
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List the required skills, experience, and qualifications..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {job ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default JobForm
