import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const CandidateCV = ({ candidateId, candidateName, onClose }) => {
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (candidateId) {
      loadCandidateCV();
    }
  }, [candidateId]);

  const loadCandidateCV = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/candidates/candidate-cv/${candidateId}`);
      setCvData(response.data);
    } catch (error) {
      console.error('Error loading candidate CV:', error);
      setError('Failed to load candidate CV');
      toast.error('Failed to load candidate CV');
    } finally {
      setLoading(false);
    }
  };

  const viewCV = () => {
    if (cvData && cvData.htmlContent) {
      const blob = new Blob([cvData.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const downloadCV = () => {
    if (cvData && cvData.htmlContent) {
      const blob = new Blob([cvData.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidateName}_CV.html`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CV downloaded successfully!');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading CV...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">CV Not Available</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="mr-2 h-6 w-6 text-blue-600" />
              {candidateName}'s CV
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* CV Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{cvData?.candidateInfo?.name}</p>
                <p className="text-xs text-gray-500">{cvData?.candidateInfo?.email}</p>
              </div>
            </div>
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">Template</p>
                <p className="text-xs text-gray-500 capitalize">{cvData?.candidateInfo?.template}</p>
              </div>
            </div>
            <div className="flex items-center">
              {cvData?.candidateInfo?.isComplete ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Status</p>
                <p className={`text-xs ${cvData?.candidateInfo?.isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                  {cvData?.candidateInfo?.isComplete ? 'Complete' : 'Incomplete'}
                </p>
              </div>
            </div>
          </div>
          
          {cvData?.candidateInfo?.lastGenerated && (
            <div className="mt-3 flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Last updated: {new Date(cvData.candidateInfo.lastGenerated).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* CV Preview */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">CV Preview</h3>
            <p className="text-sm text-gray-600">
              Click "View Full CV" to see the complete formatted CV in a new tab.
              The CV is generated using the candidate's selected template and contains
              all their professional information.
            </p>
          </div>

          {/* CV Snippet Preview */}
          {cvData?.htmlContent && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="p-4 bg-white max-h-64 overflow-y-auto text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: cvData.htmlContent.substring(0, 1000) + '...' 
                }}
              />
              <div className="bg-gray-50 px-4 py-2 text-center">
                <span className="text-xs text-gray-500">Preview - Click "View Full CV" to see complete version</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={viewCV}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              View Full CV
            </button>
            <button
              onClick={downloadCV}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              Download CV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCV;
