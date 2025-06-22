import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CandidateCV from './CandidateCV';
import {
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const JobOffers = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCandidateCV, setShowCandidateCV] = useState(false); // all, pending, accepted, rejected

  useEffect(() => {
    fetchJobOffers();
  }, []);

  const fetchJobOffers = async () => {
    try {
      setLoading(true);
      // This would be the actual API call when applications are implemented
      // const response = await api.get('/applications/offers');
      
      // For now, show placeholder data
      const mockOffers = [
        {
          id: 1,
          candidateName: 'Ahmed Ben Ali',
          candidateEmail: 'ahmed.benali@email.com',
          jobTitle: 'Senior Full Stack Developer',
          appliedAt: '2025-06-20T10:30:00Z',
          status: 'pending',
          matchScore: 92,
          resumeUrl: '#',
          coverLetter: 'I am very interested in this position...'
        },
        {
          id: 2,
          candidateName: 'Fatima El Mansouri',
          candidateEmail: 'fatima.elmansouri@email.com',
          jobTitle: 'Senior Full Stack Developer',
          appliedAt: '2025-06-19T14:15:00Z',
          status: 'accepted',
          matchScore: 96,
          resumeUrl: '#',
          coverLetter: 'With 5+ years of experience in React and Node.js...'
        }
      ];
      
      setOffers(mockOffers);
    } catch (error) {
      console.error('Error fetching job offers:', error);
      toast.error('Failed to load job offers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (offerId, newStatus) => {
    try {
      // This would be the actual API call
      // await api.put(`/applications/${offerId}`, { status: newStatus });

      // For now, update locally
      setOffers(prev => prev.map(offer =>
        offer.id === offerId ? { ...offer, status: newStatus } : offer
      ));

      toast.success(`Application ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const viewCandidateCV = (candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateCV(true);
  };

  const closeCandidateCV = () => {
    setSelectedCandidate(null);
    setShowCandidateCV(false);
  };

  const filteredOffers = offers.filter(offer => {
    if (filter === 'all') return true;
    return offer.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Rejected' }
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6 w-64"></div>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="mr-2 h-6 w-6 text-blue-600" />
            Job Applications
          </h1>
          <p className="text-gray-600 mt-1">
            Review and manage applications for your job postings
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Applications ({offers.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({offers.filter(o => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'accepted' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Accepted ({offers.filter(o => o.status === 'accepted').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'rejected' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({offers.filter(o => o.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Applications List */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Applications will appear here when candidates apply to your jobs'
              : `No applications with ${filter} status found`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Application Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{offer.candidateName}</h3>
                      {getStatusBadge(offer.status)}
                      <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                        <span className="font-medium">{offer.matchScore}% match</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {offer.candidateEmail}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Applied {formatDate(offer.appliedAt)}
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2">Applied for: <span className="font-medium">{offer.jobTitle}</span></p>
                  </div>
                </div>

                {/* Cover Letter Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter:</h4>
                  <p className="text-gray-600 text-sm line-clamp-2">{offer.coverLetter}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => viewCandidateCV({
                        id: offer.candidateId || offer.id,
                        name: offer.candidateName,
                        email: offer.candidateEmail
                      })}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      View CV
                    </button>
                    <button className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      <UserIcon className="h-4 w-4 mr-1" />
                      View Profile
                    </button>
                  </div>
                  
                  {offer.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStatusChange(offer.id, 'rejected')}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(offer.id, 'accepted')}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate CV Modal */}
      {showCandidateCV && selectedCandidate && (
        <CandidateCV
          candidateId={selectedCandidate.id}
          candidateName={selectedCandidate.name}
          onClose={closeCandidateCV}
        />
      )}
    </div>
  );
};

export default JobOffers;
