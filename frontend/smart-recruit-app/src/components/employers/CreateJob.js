import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, DollarSign, Clock, Users, FileText, Save, X } from 'lucide-react';

const CreateJob = ({ onJobCreated, onCancel }) => {
  // const { user } = useAuth(); // Not needed for this component
  const [loading, setLoading] = useState(false);
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
    applicationDeadline: ''
  });

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
      // Validate required fields
      if (!formData.title || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate salary range
      if (formData.salaryMin && formData.salaryMax) {
        if (parseFloat(formData.salaryMin) > parseFloat(formData.salaryMax)) {
          toast.error('Minimum salary cannot be greater than maximum salary');
          return;
        }
      }

      const response = await api.post('/jobs', formData);
      toast.success('Job posted successfully!');

      if (onJobCreated) {
        // The API service already extracts response.data, so we access data.job directly
        onJobCreated(response.data.job);
      }
      
      // Reset form
      setFormData({
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
        applicationDeadline: ''
      });

    } catch (error) {
      console.error('Error creating job:', error);

      // Handle validation errors
      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        details.forEach(detail => {
          toast.error(`${detail.path}: ${detail.msg}`);
        });
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to create job');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Briefcase className="mr-2 h-6 w-6 text-blue-600" />
            Create New Job Posting
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Senior Full Stack Developer"
                required
              />
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline mr-1 h-4 w-4" />
                Employment Type *
              </label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
                <Users className="inline mr-1 h-4 w-4" />
                Experience Level *
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline mr-1 h-4 w-4" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Paris, France"
              />
            </div>

            {/* Remote Allowed */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="remoteAllowed"
                checked={formData.remoteAllowed}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Remote work allowed
              </label>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline mr-1 h-4 w-4" />
                Minimum Salary
              </label>
              <div className="flex">
                <input
                  type="number"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="40000"
                  min="0"
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="px-3 py-2 border-l-0 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Salary
              </label>
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="60000"
                min="0"
              />
            </div>

            {/* Application Deadline */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline mr-1 h-4 w-4" />
              Job Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the role, what the candidate will be doing, and what makes this opportunity exciting..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Minimum 50 characters required
            </p>
          </div>

          {/* Requirements */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List the required skills, experience, education, and qualifications..."
            />
          </div>

          {/* Responsibilities */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsibilities
            </label>
            <textarea
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the key responsibilities and day-to-day tasks..."
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Creating...' : 'Create Job Posting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
