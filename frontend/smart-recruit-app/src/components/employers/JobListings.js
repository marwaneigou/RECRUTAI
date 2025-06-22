import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  BriefcaseIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const JobListings = ({ onCreateJob, onEditJob }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      console.log('Fetching jobs from my-jobs endpoint at:', new Date().toISOString());

      const response = await api.get('/jobs/my-jobs?status=all');
      console.log('My-jobs response:', response.data);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else {
        toast.error('Failed to load job postings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/jobs/${jobId}`);
      toast.success('Job posting deleted successfully');
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to delete job posting');
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/jobs/${jobId}`, { isActive: newStatus });
      toast.success(`Job ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  // Filter and sort jobs
  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && job.isActive) ||
                           (statusFilter === 'inactive' && !job.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'applications':
          return (b.applications || 0) - (a.applications || 0);
        default:
          return 0;
      }
    });

  const formatSalary = (min, max, currency) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    if (min) return `From ${min.toLocaleString()} ${currency}`;
    if (max) return `Up to ${max.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6 w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BriefcaseIcon className="mr-2 h-6 w-6 text-blue-600" />
            My Job Postings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your job postings and track applications
          </p>
        </div>
        <button
          onClick={onCreateJob}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Post New Job
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="applications">Most Applications</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            {filteredJobs.length} of {jobs.length} jobs
          </div>
        </div>
      </div>

      {/* Job Listings */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {jobs.length === 0 ? 'No job postings yet' : 'No jobs match your filters'}
          </h3>
          <p className="text-gray-600 mb-6">
            {jobs.length === 0 
              ? 'Create your first job posting to start receiving applications from qualified candidates.'
              : 'Try adjusting your search terms or filters to find the jobs you\'re looking for.'
            }
          </p>
          {jobs.length === 0 && (
            <button
              onClick={onCreateJob}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Job Posting
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Job Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      {getStatusBadge(job.isActive)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {job.location || 'Location not specified'}
                        {job.remoteAllowed && (
                          <span className="ml-1 text-blue-600">(Remote OK)</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {job.employmentType}
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(job.id, job.isActive)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        job.isActive 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {job.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        console.log('Edit button clicked for job:', job);
                        if (onEditJob) {
                          onEditJob(job);
                        } else {
                          console.error('onEditJob prop not provided');
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Job"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Job"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Job Description */}
                <p className="text-gray-700 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Job Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {job.applicationCount || 0} applications
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {job.views || 0} views
                    </div>
                    <div>
                      Posted {formatDate(job.createdAt)}
                    </div>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    View Applications →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobListings;
