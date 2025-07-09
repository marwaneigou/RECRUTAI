import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import JobDetailsModal from '../common/JobDetailsModal';
import JobApplicationModal from './JobApplicationModal';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  FunnelIcon,
  HeartIcon,
  EyeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const JobSearch = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('all');
  const [remoteFilter, setRemoteFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jobs');
      console.log('Jobs response:', response.data);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      // This would fetch saved jobs from the API
      // For now, using localStorage as a placeholder
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setSavedJobs(new Set(saved));
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      const newSavedJobs = new Set(savedJobs);
      if (savedJobs.has(jobId)) {
        newSavedJobs.delete(jobId);
        toast.success('Job removed from saved jobs');
      } else {
        newSavedJobs.add(jobId);
        toast.success('Job saved successfully');
      }
      setSavedJobs(newSavedJobs);
      localStorage.setItem('savedJobs', JSON.stringify([...newSavedJobs]));
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    }
  };

  const handleApplyToJob = (job) => {
    setJobToApply(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSubmitted = () => {
    // Refresh jobs or update UI as needed
    fetchJobs();
  };

  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  // Filter and sort jobs
  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employer?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || 
        (job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase()));
      
      const matchesEmploymentType = employmentTypeFilter === 'all' || 
        job.employmentType === employmentTypeFilter;
      
      const matchesExperienceLevel = experienceLevelFilter === 'all' || 
        job.experienceLevel === experienceLevelFilter;
      
      const matchesRemote = remoteFilter === 'all' || 
        (remoteFilter === 'remote' && job.remoteAllowed) ||
        (remoteFilter === 'onsite' && !job.remoteAllowed);

      return matchesSearch && matchesLocation && matchesEmploymentType && 
             matchesExperienceLevel && matchesRemote;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'salary':
          return (b.salaryMax || 0) - (a.salaryMax || 0);
        case 'company':
          return a.employer?.companyName.localeCompare(b.employer?.companyName);
        default:
          return 0;
      }
    });

  const formatSalary = (min, max, currency) => {
    if (!min && !max) return 'Salary not disclosed';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    if (min) return `From ${min.toLocaleString()} ${currency}`;
    if (max) return `Up to ${max.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Posted today';
    if (diffDays <= 7) return `Posted ${diffDays} days ago`;
    return `Posted on ${date.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6 w-64"></div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BriefcaseIcon className="mr-2 h-6 w-6 text-blue-600" />
          Job Search
        </h1>
        <p className="text-gray-600 mt-1">
          Find your next career opportunity
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location */}
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Employment Type */}
          <div>
            <select
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <select
              value={experienceLevelFilter}
              onChange={(e) => setExperienceLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="ENTRY">Entry Level</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid Level</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead</option>
              <option value="EXECUTIVE">Executive</option>
            </select>
          </div>

          {/* Remote */}
          <div>
            <select
              value={remoteFilter}
              onChange={(e) => setRemoteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
        </div>

        {/* Sort and Results */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {filteredJobs.length} jobs found
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="salary">Highest Salary</option>
              <option value="company">Company A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters to find more opportunities.
          </p>
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
                      <button
                        onClick={() => handleSaveJob(job.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title={savedJobs.has(job.id) ? 'Remove from saved' : 'Save job'}
                      >
                        {savedJobs.has(job.id) ? (
                          <HeartIconSolid className="h-5 w-5 text-red-500" />
                        ) : (
                          <HeartIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4 mb-2">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        {job.employer?.companyName}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {job.location || 'Location not specified'}
                        {job.remoteAllowed && (
                          <span className="ml-1 text-blue-600">(Remote OK)</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {job.employmentType?.replace('_', '-').toLowerCase()}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApplyToJob(job)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </button>
                    <button
                      onClick={() => handleViewJobDetails(job)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Job Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Job Description */}
                <p className="text-gray-700 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Job Footer */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      {job.experienceLevel?.toLowerCase()}
                    </span>
                    {job.applicationDeadline && (
                      <span>
                        Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div>
                    {formatDate(job.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={showJobDetails}
        onClose={() => setShowJobDetails(false)}
        onApply={() => handleApplyToJob(selectedJob)}
        showApplyButton={true}
      />

      {/* Job Application Modal */}
      <JobApplicationModal
        job={jobToApply}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </div>
  );
};

export default JobSearch;
