import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/auth'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
}

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getStoredToken()
        
        if (token) {
          // Verify token and get user data
          const response = await authAPI.getProfile()
          
          if (response.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.data.user,
                token
              }
            })
          } else {
            // Token is invalid, remove it
            removeStoredToken()
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        removeStoredToken()
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await authAPI.login(credentials)

      if (response.success) {
        const { user, token } = response.data
        
        // Store token
        setStoredToken(token)
        
        // Update state
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        })

        toast.success(`Welcome back, ${user.name}!`)
        return { success: true }
      } else {
        const errorMessage = response.error?.message || 'Login failed'
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await authAPI.register(userData)

      if (response.success) {
        const { user, token } = response.data
        
        // Store token
        setStoredToken(token)
        
        // Update state
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        })

        toast.success(`Welcome to Smart Recruit, ${user.name}!`)
        return { success: true }
      } else {
        const errorMessage = response.error?.message || 'Registration failed'
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      await authAPI.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Always clear local state
      removeStoredToken()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success('Logged out successfully')
    }
  }

  // Update user profile
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    })
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role?.toLowerCase() === role.toLowerCase()
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role))
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext
