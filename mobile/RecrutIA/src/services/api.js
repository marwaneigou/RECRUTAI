import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { Platform } from 'react-native';

// API Configuration
// Automatically detect platform and use appropriate URL
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    // Web version can use localhost
    return 'http://localhost:3001/api';
  } else {
    // Mobile devices need your computer's IP address
    // Update this to match your computer's IP address
    return 'http://192.168.1.15:3001/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'smart_recruit_token';

export const getStoredToken = async () => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      return localStorage.getItem(TOKEN_KEY);
    } else {
      // Use SecureStore for mobile
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const setStoredToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      // Use SecureStore for mobile
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export const removeStoredToken = async () => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      localStorage.removeItem(TOKEN_KEY);
    } else {
      // Use SecureStore for mobile
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const { response } = error;

    if (response?.status === 401) {
      // Token expired or invalid
      await removeStoredToken();
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please log in again',
      });
    } else if (response?.status >= 500) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: 'Something went wrong. Please try again.',
      });
    } else if (!response) {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please check your internet connection',
      });
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/me', profileData);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

// Jobs API
export const jobsAPI = {
  getJobs: async (params = {}) => {
    try {
      const response = await api.get('/jobs', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getJobById: async (jobId) => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  searchJobs: async (searchParams) => {
    try {
      const response = await api.get('/jobs/search', { params: searchParams });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

// Applications API
export const applicationsAPI = {
  getApplications: async (params = {}) => {
    try {
      const response = await api.get('/applications', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  applyToJob: async (jobId, applicationData) => {
    try {
      const numericJobId = Number(jobId);
      if (!Number.isInteger(numericJobId)) {
        throw {
          success: false,
          error: { message: 'Invalid job identifier. Please try again.', status: 400 }
        };
      }
      const response = await api.post('/applications/submit', {
        jobId: numericJobId,
        ...applicationData,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateApplicationStatus: async (id, status) => {
    try {
      const response = await api.patch(`/applications/${id}/status`, { status });
      return response;
    } catch (error) {
      throw error;
    }
  },


};

// AI Features API
export const aiAPI = {
  getJobRecommendations: async (params = {}) => {
    try {
      const response = await api.get('/ai/job-recommendations', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  generateCoverLetter: async (jobId, template = 'professional') => {
    try {
      const response = await api.post('/ai/generate-cover-letter', {
        jobId,
        template,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  submitRecommendationFeedback: async (jobId, rating, feedback = '') => {
    try {
      const response = await api.post('/ai/recommendation-feedback', {
        jobId,
        rating,
        feedback,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  trackRecommendationInteraction: async (jobId, action, matchScore = null, metadata = {}) => {
    try {
      const response = await api.post('/ai/track-recommendation-interaction', {
        jobId,
        action,
        matchScore,
        metadata,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

// Candidates API
export const candidatesAPI = {
  getCandidateStats: async () => {
    try {
      const response = await api.get('/stats/candidate');
      return response;
    } catch (error) {
      throw error;
    }
  },

  getCvData: async () => {
    try {
      const response = await api.get('/candidates/cv-data');
      return response;
    } catch (error) {
      throw error;
    }
  },

  saveCvData: async (cvData) => {
    try {
      const response = await api.post('/candidates/save-cv-data', cvData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  generateCv: async (template, data) => {
    try {
      const response = await api.post('/candidates/generate-cv', {
        template,
        data
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  uploadCV: async (file) => {
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await api.post('/candidates/upload-cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateCandidateProfile: async (profileData) => {
    try {
      const response = await api.put('/candidates/profile', profileData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  uploadCV: async (cvFile) => {
    try {
      const formData = new FormData();
      formData.append('cv', cvFile);
      
      const response = await api.post('/candidates/upload-cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
