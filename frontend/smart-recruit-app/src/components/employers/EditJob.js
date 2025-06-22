import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  BriefcaseIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const EditJob = ({ job, onJobUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    salaryMin: '',
    salaryMax: '',
    currency: 'EUR',
    remoteAllowed: false,
    applicationDeadline: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        requirements: job.requirements || '',
        responsibilities: job.responsibilities || '',
        location: job.location || '',
        employmentType: job.employmentType?.toLowerCase().replace('_', '-') || 'full-time',
        experienceLevel: job.experienceLevel?.toLowerCase() || 'mid',
        salaryMin: job.salaryMin || '',
        salaryMax: job.salaryMax || '',
        currency: job.currency || 'EUR',
        remoteAllowed: job.remoteAllowed || false,
        applicationDeadline: job.applicationDeadline ? 
          new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
        isActive: job.isActive !== undefined ? job.isActive : true
      });
    }
  }, [job]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      processedValue = value ? parseFloat(value) : '';
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        applicationDeadline: formData.applicationDeadline || null
      };

      // Remove empty strings to avoid validation issues
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      console.log('Submitting job update:', submitData);

      const response = await api.put(`/jobs/${job.id}`, submitData);

      console.log('Job update response:', response.data);
      toast.success('Job updated successfully!');
      onJobUpdated(response.data.job);
    } catch (error) {
      console.error('Error updating job:', error);
      
      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        details.forEach(detail => {
          toast.error(`${detail.path}: ${detail.msg}`);
        });
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to update job');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BriefcaseIcon className="mr-2 h-6 w-6 text-blue-600" />
            Edit Job Posting
          </h1>
          <p className="text-gray-600 mt-1">
            Update your job posting details
          </p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <XMarkIcon className="mr-2 h-4 w-4" />
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Senior Full Stack Developer"
              />
            </div>

            {/* Employment Type */}
            <div>
              <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type *
              </label>
              <select
                id="employmentType"
                name="employmentType"
                value={formData.employmentType}
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
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level *
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                value={formData.experienceLevel}
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

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Paris, France"
              />
            </div>

            {/* Remote Work */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remoteAllowed"
                name="remoteAllowed"
                checked={formData.remoteAllowed}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remoteAllowed" className="ml-2 block text-sm text-gray-700">
                Remote work allowed
              </label>
            </div>
          </div>

          {/* Salary Information */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Salary Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  id="salaryMin"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                />
              </div>
              <div>
                <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary
                </label>
                <input
                  type="number"
                  id="salaryMax"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="70000"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
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
            </div>
          </div>

          {/* Job Description */}
          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the role, responsibilities, and what makes this position exciting..."
            />
          </div>

          {/* Requirements */}
          <div className="mt-6">
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List the required skills, experience, and qualifications..."
            />
          </div>

          {/* Responsibilities */}
          <div className="mt-6">
            <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-2">
              Responsibilities
            </label>
            <textarea
              id="responsibilities"
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the key responsibilities and daily tasks..."
            />
          </div>

          {/* Application Deadline */}
          <div className="mt-6">
            <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
              Application Deadline
            </label>
            <input
              type="date"
              id="applicationDeadline"
              name="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Job Status */}
          <div className="mt-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Job is active (visible to candidates)
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                Update Job
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditJob;
