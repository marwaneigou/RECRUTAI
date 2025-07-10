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
  ChatBubbleLeftRightIcon
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

  useEffect(() => {
    fetchApplications();
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
        jobTitle: app.jobTitle || 'Unknown Position',
        title: app.jobTitle || 'Unknown Position', // For modal compatibility
        company: app.companyName || 'Unknown Company',
        companyLogo: null,
        status: app.status,
        appliedAt: app.appliedDate || app.appliedAt,
        lastUpdated: app.appliedDate || app.appliedAt,
        jobLocation: 'Remote', // Default for now
        location: 'Remote', // For modal compatibility
        employmentType: 'Full-time',
        salary: 'Competitive',
        matchScore: app.matchScore || 0,
        coverLetter: app.coverLetter,
        cvSnapshot: app.cvSnapshot,
        matchAnalysis: app.matchAnalysis,
        matchStrengths: app.matchStrengths,
        matchGaps: app.matchGaps,
        // Additional fields for display
        description: `Applied for ${app.jobTitle || 'position'} at ${app.companyName || 'company'}`,
        requirements: 'View job details for requirements',
        responsibilities: 'View job details for responsibilities'
      }));

      setApplications(transformedApplications);

      // Fallback mock data if no real applications
      if (transformedApplications.length === 0) {
        const mockApplications = [
        {
          id: 1,
          jobTitle: 'Senior Full Stack Developer',
          title: 'Senior Full Stack Developer', // For modal compatibility
          company: 'TechCorp Solutions',
          companyLogo: null,
          status: 'pending',
          appliedAt: '2025-06-20T10:30:00Z',
          lastUpdated: '2025-06-20T10:30:00Z',
          jobLocation: 'Paris, France',
          location: 'Paris, France', // For modal compatibility
          employmentType: 'Full-time',
          salary: '60k - 80k EUR',
          salaryMin: 60,
          salaryMax: 80,
          currency: 'EUR',
          experienceLevel: 'Senior',
          remote: false,
          description: 'We are looking for a Senior Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies like React, Node.js, and PostgreSQL. The ideal candidate should have strong problem-solving skills and experience with agile development methodologies.',
          requirements: '• 5+ years of experience in full-stack development\n• Proficiency in React, Node.js, and PostgreSQL\n• Experience with RESTful APIs and microservices\n• Knowledge of Git and CI/CD pipelines\n• Strong communication skills',
          skills: ['React', 'Node.js', 'PostgreSQL', 'JavaScript', 'TypeScript', 'Git'],
          benefits: ['Health insurance', 'Flexible working hours', 'Remote work options', 'Professional development budget'],
          applicationNotes: 'Applied through company website',
          interviewDate: null,
          feedback: null,
          createdAt: '2025-06-15T09:00:00Z',
          applicationDeadline: '2025-07-15T23:59:59Z'
        },
        {
          id: 2,
          jobTitle: 'Frontend React Developer',
          company: 'Innovate Digital',
          companyLogo: null,
          status: 'interview',
          appliedAt: '2025-06-18T14:15:00Z',
          lastUpdated: '2025-06-21T09:00:00Z',
          jobLocation: 'Remote',
          employmentType: 'Full-time',
          salary: '50k - 65k EUR',
          applicationNotes: 'Referred by John Doe',
          interviewDate: '2025-06-25T14:00:00Z',
          feedback: 'Great portfolio! Looking forward to the interview.'
        },
        {
          id: 3,
          jobTitle: 'Python Backend Developer',
          company: 'StartupXYZ',
          companyLogo: null,
          status: 'accepted',
          appliedAt: '2025-06-15T16:45:00Z',
          lastUpdated: '2025-06-22T11:30:00Z',
          jobLocation: 'Lyon, France',
          employmentType: 'Full-time',
          salary: '55k - 70k EUR',
          applicationNotes: 'Applied after networking event',
          interviewDate: null,
          feedback: 'Congratulations! We would like to offer you the position.'
        },
        {
          id: 4,
          jobTitle: 'Data Scientist',
          company: 'DataCorp',
          companyLogo: null,
          status: 'rejected',
          appliedAt: '2025-06-10T12:20:00Z',
          lastUpdated: '2025-06-19T15:45:00Z',
          jobLocation: 'Toulouse, France',
          employmentType: 'Full-time',
          salary: '65k - 85k EUR',
          applicationNotes: 'Applied through LinkedIn',
          interviewDate: null,
          feedback: 'Thank you for your interest. We decided to move forward with another candidate.'
        }
      ];

      setApplications(mockApplications);
      }
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
                    {application.matchScore > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 mr-2">Match Score:</span>
                          <div className="flex items-center">
                            <span className={`text-sm font-bold mr-2 ${
                              application.matchScore >= 80 ? 'text-green-600' :
                              application.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {application.matchScore}%
                            </span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  application.matchScore >= 80 ? 'bg-green-500' :
                                  application.matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${application.matchScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        {application.matchAnalysis && (
                          <p className="text-xs text-gray-600 mt-1">{application.matchAnalysis}</p>
                        )}
                      </div>
                    )}
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
                  </div>
                </div>

                {/* CV Snapshot Information */}
                {application.cvSnapshot && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">CV Submitted:</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Name:</span> {application.cvSnapshot.first_name} {application.cvSnapshot.last_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {application.cvSnapshot.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {application.cvSnapshot.phone}
                      </div>
                      <div>
                        <span className="font-medium">Template:</span> {application.cvSnapshot.selected_template}
                      </div>
                    </div>
                    {application.cvSnapshot.professional_summary && (
                      <div className="mt-2">
                        <span className="font-medium text-xs text-gray-700">Summary:</span>
                        <p className="text-xs text-gray-600 mt-1">{application.cvSnapshot.professional_summary}</p>
                      </div>
                    )}
                  </div>
                )}

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
    </div>
  );
};

export default Applications;
