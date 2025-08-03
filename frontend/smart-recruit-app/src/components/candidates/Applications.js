import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import JobDetailsModal from '../common/JobDetailsModal';
import CVModal from '../common/CVModal';
import {
  DocumentTextIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected, interview
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [])

  // Check for status changes (could be enhanced with real-time updates)
  useEffect(() => {
    const checkForStatusUpdates = () => {
      const lastCheck = localStorage.getItem('lastStatusCheck')
      const now = new Date().getTime()

      if (lastCheck && (now - parseInt(lastCheck)) < 60000) { // Check every minute
        return
      }

      // Fetch latest applications to check for status changes
      fetchApplications()
      localStorage.setItem('lastStatusCheck', now.toString())
    }

    const interval = setInterval(checkForStatusUpdates, 60000) // Check every minute
    return () => clearInterval(interval)
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Make the actual API call to get applications
      const response = await api.get('/applications');
      console.log('Candidate Applications API Response:', response.data);

      // Handle different response structures
      const applicationsData = response.data.data?.applications || response.data.applications || [];

      // Transform the data to match the expected format
      const transformedApplications = applicationsData.map(app => ({
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle || 'Unknown Position',
        title: app.jobTitle || 'Unknown Position', // For modal compatibility
        company: app.companyName || 'Unknown Company',
        companyLogo: null,
        status: app.status,
        appliedAt: app.appliedDate || app.appliedAt,
        lastUpdated: app.updatedAt || app.appliedDate || app.appliedAt,
        jobLocation: app.location || 'Remote',
        location: app.location || 'Remote', // For modal compatibility
        employmentType: app.employmentType || 'Full-time',
        salary: app.salaryRange || 'Competitive',
        matchScore: app.matchScore || 0,
        coverLetter: app.coverLetter,
        cvSnapshot: app.cvSnapshot,
        matchAnalysis: app.matchAnalysis,
        matchStrengths: app.matchStrengths,
        matchGaps: app.matchGaps,
        notes: app.notes,
        rating: app.rating,
        reviewedAt: app.reviewedAt,
        // Additional fields for display
        description: `Applied for ${app.jobTitle || 'position'} at ${app.companyName || 'company'}`,
        requirements: 'View job details for requirements',
        responsibilities: 'View job details for responsibilities'
      }));

      console.log('Transformed applications:', transformedApplications);
      setApplications(transformedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const handleViewJobDetails = (application) => {
    setSelectedJob(application);
    setShowJobDetails(true);
  };

  const handleViewCV = (application) => {
    setSelectedCV(application);
    setShowCVModal(true);
  };

  const closeCVModal = () => {
    setShowCVModal(false);
    setSelectedCV(null);
  };

  const handleViewCoverLetter = (application) => {
    setSelectedCoverLetter(application);
    setShowCoverLetterModal(true);
  };

  const closeCoverLetterModal = () => {
    setShowCoverLetterModal(false);
    setSelectedCoverLetter(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: ClockIcon, 
        text: 'Pending Review' 
      },
      interview: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: ChatBubbleLeftRightIcon, 
        text: 'Interview Scheduled' 
      },
      accepted: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircleIcon, 
        text: 'Accepted' 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircleIcon, 
        text: 'Not Selected' 
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      interview: applications.filter(app => app.status === 'interview').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6 w-64"></div>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-300 rounded w-24"></div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
          <DocumentTextIcon className="mr-2 h-6 w-6 text-blue-600" />
          My Applications
        </h1>
        <p className="text-gray-600 mt-1">
          Track the status of your job applications
        </p>
      </div>

      {/* Status Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Applications ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setFilter('interview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'interview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Interviews ({statusCounts.interview})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'accepted' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Accepted ({statusCounts.accepted})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'rejected' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Not Selected ({statusCounts.rejected})
          </button>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Start applying to jobs to track your applications here'
              : `No applications with ${filter} status found`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Application Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{application.jobTitle}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (application.matchScore || 0) >= 80 ? 'bg-green-100 text-green-800' :
                        (application.matchScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        (application.matchScore || 0) >= 40 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {application.matchScore || 0}% Match
                      </span>
                      {getStatusBadge(application.status)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        {application.company}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Applied {formatDate(application.appliedAt)}
                      </div>
                      <div>
                        {application.jobLocation} • {application.employmentType}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Salary: {application.salary}
                    </div>

                    {/* Match Score Display */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Match Score:</span>
                        <div className="flex items-center">
                          <span className={`text-lg font-bold mr-3 ${
                            (application.matchScore || 0) >= 80 ? 'text-green-600' :
                            (application.matchScore || 0) >= 60 ? 'text-yellow-600' :
                            (application.matchScore || 0) >= 40 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {application.matchScore || 0}%
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${
                                (application.matchScore || 0) >= 80 ? 'bg-green-500' :
                                (application.matchScore || 0) >= 60 ? 'bg-yellow-500' :
                                (application.matchScore || 0) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${application.matchScore || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      {application.matchAnalysis && (
                        <p className="text-xs text-gray-600 mt-2">{application.matchAnalysis}</p>
                      )}
                      {(application.matchScore || 0) === 0 && (
                        <p className="text-xs text-gray-500 mt-1">Match score will be calculated after review</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewJobDetails(application)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Job Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleViewCV(application)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="View My CV"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                    </button>
                    {application.coverLetter?.content && (
                      <button
                        onClick={() => handleViewCoverLetter(application)}
                        className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                        title="View My Cover Letter"
                      >
                        <EnvelopeIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>


                {/* Application Details */}
                {application.applicationNotes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {application.applicationNotes}
                    </p>
                  </div>
                )}

                {/* Interview Information */}
                {application.interviewDate && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">Interview Scheduled</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      {formatDate(application.interviewDate)}
                    </p>
                  </div>
                )}

                {/* Feedback */}
                {application.feedback && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Feedback:</span> {application.feedback}
                    </p>
                  </div>
                )}

                {/* Application Footer */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                  <div>
                    Last updated: {formatDate(application.lastUpdated)}
                  </div>
                  <div className="flex items-center space-x-4">
                    {application.status === 'interview' && (
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        Prepare for Interview →
                      </button>
                    )}
                    {application.status === 'accepted' && (
                      <button className="text-green-600 hover:text-green-800 font-medium">
                        View Offer Details →
                      </button>
                    )}
                    <button
                      onClick={() => handleViewJobDetails(application)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      View Job Details
                    </button>
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
        showApplyButton={false}
      />

      {/* CV Modal */}
      <CVModal
        isOpen={showCVModal}
        onClose={closeCVModal}
        cvSnapshot={selectedCV?.cvSnapshot}
        candidateName={selectedCV?.cvSnapshot ? `${selectedCV.cvSnapshot.first_name} ${selectedCV.cvSnapshot.last_name}` : 'Unknown'}
        jobTitle={selectedCV?.jobTitle}
      />

      {/* Cover Letter Modal */}
      {showCoverLetterModal && selectedCoverLetter && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeCoverLetterModal} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    My Cover Letter
                  </h3>
                  <button
                    onClick={closeCoverLetterModal}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Applied for: {selectedCoverLetter.jobTitle} at {selectedCoverLetter.company}
                </p>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-6">
                <div className="space-y-4">
                  {/* Cover Letter Content */}
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedCoverLetter.coverLetter?.content || 'No cover letter content available'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Type</p>
                      <p className="text-sm text-gray-900">
                        {selectedCoverLetter.coverLetter?.type === 'user_written' ? 'User Written' :
                         selectedCoverLetter.coverLetter?.type === 'ai_generated' ? 'AI Generated' :
                         'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Length</p>
                      <p className="text-sm text-gray-900">
                        {selectedCoverLetter.coverLetter?.content?.length || 0} characters
                      </p>
                    </div>
                  </div>

                  {/* Application Info */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Applied:</span> {selectedCoverLetter.appliedAt}
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Status:</span>
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          selectedCoverLetter.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedCoverLetter.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          selectedCoverLetter.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedCoverLetter.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={closeCoverLetterModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;