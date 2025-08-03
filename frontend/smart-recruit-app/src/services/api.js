import axios from 'axios'
import { getStoredToken, removeStoredToken } from '../utils/auth'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          removeStoredToken()
          if (window.location.pathname !== '/login') {
            toast.error('Session expired. Please login again.')
            window.location.href = '/login'
          }
          break
        
        case 403:
          // Forbidden - insufficient permissions
          toast.error('You do not have permission to perform this action.')
          break
        
        case 404:
          // Not found
          toast.error('Resource not found.')
          break
        
        case 429:
          // Too many requests
          toast.error('Too many requests. Please try again later.')
          break
        
        case 500:
          // Server error
          toast.error('Server error. Please try again later.')
          break
        
        default:
          // Other errors
          const errorMessage = data?.error?.message || 'An error occurred'
          toast.error(errorMessage)
      }
      
      return Promise.reject(error)
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    } else {
      // Other error
      toast.error('An unexpected error occurred.')
      return Promise.reject(error)
    }
  }
)

// Authentication API
export const authAPI = {
  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      return response
    } catch (error) {
      throw error
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me')
      return response
    } catch (error) {
      throw error
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/auth/logout')
      return response
    } catch (error) {
      throw error
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh')
      return response
    } catch (error) {
      throw error
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData)
      return response
    } catch (error) {
      throw error
    }
  }
}

// Jobs API
export const jobsAPI = {
  // Get all jobs
  getJobs: async (params = {}) => {
    try {
      const response = await api.get('/jobs', { params })
      return response
    } catch (error) {
      throw error
    }
  },

  // Get job by ID
  getJob: async (id) => {
    try {
      const response = await api.get(`/jobs/${id}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Create job (employer only)
  createJob: async (jobData) => {
    try {
      const response = await api.post('/jobs', jobData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Update job (employer only)
  updateJob: async (id, jobData) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Delete job (employer only)
  deleteJob: async (id) => {
    try {
      const response = await api.delete(`/jobs/${id}`)
      return response
    } catch (error) {
      throw error
    }
  }
}

// Applications API
export const applicationsAPI = {
  // Get applications
  getApplications: async (params = {}) => {
    try {
      const response = await api.get('/applications', { params })
      return response
    } catch (error) {
      throw error
    }
  },

  // Apply to job (with MongoDB cover letter storage)
  applyToJob: async (jobId, applicationData) => {
    try {
      const response = await api.post('/applications/submit', {
        jobId,
        ...applicationData
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Update application status (employer only)
  updateApplicationStatus: async (id, status) => {
    try {
      const response = await api.patch(`/applications/${id}/status`, { status })
      return response
    } catch (error) {
      throw error
    }
  }
}

// Users API
export const usersAPI = {
  // Update profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response
    } catch (error) {
      throw error
    }
  }
}

// AI Features API
export const aiAPI = {
  // Get AI-powered job recommendations for candidate
  getJobRecommendations: async (params = {}) => {
    try {
      const response = await api.get('/ai/job-recommendations', { params })
      return response
    } catch (error) {
      throw error
    }
  },

  // Get job matches (existing endpoint)
  getJobMatches: async (params = {}) => {
    try {
      const response = await api.get('/ai/job-matches', { params })
      return response
    } catch (error) {
      throw error
    }
  },

  // Generate cover letter
  generateCoverLetter: async (jobId, template = 'professional') => {
    try {
      const response = await api.post('/ai/generate-cover-letter', {
        jobId,
        template
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Track recommendation interaction
  trackRecommendationInteraction: async (jobId, action, matchScore = null, metadata = {}) => {
    try {
      const response = await api.post('/ai/track-recommendation-interaction', {
        jobId,
        action,
        matchScore,
        metadata
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Submit recommendation feedback
  submitRecommendationFeedback: async (jobId, rating, feedback = '', improvementSuggestions = []) => {
    try {
      const response = await api.post('/ai/recommendation-feedback', {
        jobId,
        rating,
        feedback,
        improvementSuggestions
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Get recommendation analytics (admin only)
  getRecommendationAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/ai/recommendation-analytics', { params })
      return response
    } catch (error) {
      throw error
    }
  }
}

export default api
