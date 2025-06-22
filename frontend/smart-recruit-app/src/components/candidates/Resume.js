import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  DocumentTextIcon,
  CloudArrowUpIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Resume = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      // This would be the actual API call when resume management is implemented
      // const response = await api.get('/candidates/resumes');
      
      // For now, show mock data
      const mockResumes = [
        {
          id: 1,
          name: 'John_Doe_Resume_2025.pdf',
          originalName: 'John Doe Resume 2025.pdf',
          size: 245760, // bytes
          uploadedAt: '2025-06-20T10:30:00Z',
          isDefault: true,
          downloadUrl: '#',
          previewUrl: '#'
        },
        {
          id: 2,
          name: 'John_Doe_Developer_Resume.pdf',
          originalName: 'John Doe Developer Resume.pdf',
          size: 198432,
          uploadedAt: '2025-06-15T14:20:00Z',
          isDefault: false,
          downloadUrl: '#',
          previewUrl: '#'
        }
      ];
      
      setResumes(mockResumes);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('doc')) {
      toast.error('Please upload a PDF or DOC file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // This would be the actual file upload
      // const formData = new FormData();
      // formData.append('resume', file);
      // const response = await api.post('/candidates/resumes', formData);
      
      // Mock successful upload
      const newResume = {
        id: Date.now(),
        name: file.name.replace(/\s+/g, '_'),
        originalName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        isDefault: resumes.length === 0,
        downloadUrl: '#',
        previewUrl: '#'
      };
      
      setResumes(prev => [newResume, ...prev]);
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      // This would be the actual API call
      // await api.delete(`/candidates/resumes/${resumeId}`);
      
      setResumes(prev => prev.filter(resume => resume.id !== resumeId));
      toast.success('Resume deleted successfully');
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    }
  };

  const handleSetDefault = async (resumeId) => {
    try {
      // This would be the actual API call
      // await api.put(`/candidates/resumes/${resumeId}/set-default`);
      
      setResumes(prev => prev.map(resume => ({
        ...resume,
        isDefault: resume.id === resumeId
      })));
      toast.success('Default resume updated');
    } catch (error) {
      console.error('Error setting default resume:', error);
      toast.error('Failed to update default resume');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6 w-64"></div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <DocumentTextIcon className="mr-2 h-6 w-6 text-blue-600" />
          My Resumes
        </h1>
        <p className="text-gray-600 mt-1">
          Upload and manage your resume files
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Resume
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your resume file here, or click to browse
          </p>
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
              <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Choose File
                  </>
                )}
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: PDF, DOC, DOCX (Max 5MB)
          </p>
        </div>
      </div>

      {/* Resume List */}
      <div className="space-y-4">
        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded</h3>
            <p className="text-gray-600">
              Upload your first resume to get started with job applications
            </p>
          </div>
        ) : (
          resumes.map((resume) => (
            <div key={resume.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-4" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {resume.originalName}
                        </h3>
                        {resume.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckIcon className="w-3 h-3 mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <span>{formatFileSize(resume.size)}</span>
                        <span>Uploaded {formatDate(resume.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!resume.isDefault && (
                      <button
                        onClick={() => handleSetDefault(resume.id)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => window.open(resume.previewUrl, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Preview"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteResume(resume.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Resume Tips</h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• Keep your resume updated with your latest experience and skills</li>
          <li>• Use a clear, professional format that's easy to read</li>
          <li>• Tailor your resume for different types of positions</li>
          <li>• Include relevant keywords from job descriptions</li>
          <li>• Set your most current resume as the default for applications</li>
        </ul>
      </div>
    </div>
  );
};

export default Resume;
