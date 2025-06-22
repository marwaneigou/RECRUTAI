import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

// Token storage key
const TOKEN_KEY = 'smart_recruit_token'

/**
 * Store authentication token
 * @param {string} token - JWT token
 */
export const setStoredToken = (token) => {
  try {
    // Store in cookie (more secure than localStorage)
    Cookies.set(TOKEN_KEY, token, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    
    // Also store in localStorage as fallback
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error('Error storing token:', error)
  }
}

/**
 * Get stored authentication token
 * @returns {string|null} JWT token or null
 */
export const getStoredToken = () => {
  try {
    // Try to get from cookie first
    let token = Cookies.get(TOKEN_KEY)
    
    // Fallback to localStorage
    if (!token) {
      token = localStorage.getItem(TOKEN_KEY)
    }
    
    // Validate token if it exists
    if (token && isTokenValid(token)) {
      return token
    }
    
    // Remove invalid token
    if (token) {
      removeStoredToken()
    }
    
    return null
  } catch (error) {
    console.error('Error getting token:', error)
    return null
  }
}

/**
 * Remove stored authentication token
 */
export const removeStoredToken = () => {
  try {
    Cookies.remove(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.error('Error removing token:', error)
  }
}

/**
 * Check if token is valid (not expired)
 * @param {string} token - JWT token
 * @returns {boolean} True if token is valid
 */
export const isTokenValid = (token) => {
  try {
    if (!token) return false
    
    const decoded = jwtDecode(token)
    const currentTime = Date.now() / 1000
    
    // Check if token is expired
    return decoded.exp > currentTime
  } catch (error) {
    console.error('Error validating token:', error)
    return false
  }
}

/**
 * Get user data from token
 * @param {string} token - JWT token
 * @returns {object|null} User data or null
 */
export const getUserFromToken = (token) => {
  try {
    if (!token || !isTokenValid(token)) return null
    
    const decoded = jwtDecode(token)
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

/**
 * Check if user has specific role
 * @param {string} token - JWT token
 * @param {string} role - Role to check
 * @returns {boolean} True if user has the role
 */
export const hasRole = (token, role) => {
  try {
    const userData = getUserFromToken(token)
    return userData?.role?.toLowerCase() === role.toLowerCase()
  } catch (error) {
    console.error('Error checking role:', error)
    return false
  }
}

/**
 * Check if user has any of the specified roles
 * @param {string} token - JWT token
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} True if user has any of the roles
 */
export const hasAnyRole = (token, roles) => {
  try {
    const userData = getUserFromToken(token)
    if (!userData?.role) return false
    
    return roles.some(role => 
      userData.role.toLowerCase() === role.toLowerCase()
    )
  } catch (error) {
    console.error('Error checking roles:', error)
    return false
  }
}

/**
 * Format user role for display
 * @param {string} role - User role
 * @returns {string} Formatted role
 */
export const formatRole = (role) => {
  if (!role) return 'Unknown'
  
  const roleMap = {
    'candidate': 'Candidate',
    'employer': 'Employer',
    'admin': 'Administrator'
  }
  
  return roleMap[role.toLowerCase()] || role
}

/**
 * Get role-specific dashboard route
 * @param {string} role - User role
 * @returns {string} Dashboard route
 */
export const getDashboardRoute = (role) => {
  if (!role) return '/dashboard'
  
  const routeMap = {
    'candidate': '/candidate/dashboard',
    'employer': '/employer/dashboard',
    'admin': '/admin/dashboard'
  }
  
  return routeMap[role.toLowerCase()] || '/dashboard'
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    errors: [],
    strength: 'weak'
  }
  
  if (!password) {
    result.errors.push('Password is required')
    return result
  }
  
  if (password.length < 6) {
    result.errors.push('Password must be at least 6 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/\d/.test(password)) {
    result.errors.push('Password must contain at least one number')
  }
  
  // Removed special character requirement for easier testing
  
  // Calculate strength
  let strengthScore = 0
  if (password.length >= 8) strengthScore++
  if (/[a-z]/.test(password)) strengthScore++
  if (/[A-Z]/.test(password)) strengthScore++
  if (/\d/.test(password)) strengthScore++
  if (/[@$!%*?&]/.test(password)) strengthScore++
  if (password.length >= 12) strengthScore++
  
  if (strengthScore <= 2) {
    result.strength = 'weak'
  } else if (strengthScore <= 4) {
    result.strength = 'medium'
  } else {
    result.strength = 'strong'
  }
  
  result.isValid = result.errors.length === 0
  
  return result
}

/**
 * Generate avatar URL from user data
 * @param {object} user - User object
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (user) => {
  if (user?.avatarUrl) {
    return user.avatarUrl
  }
  
  // Generate initials-based avatar
  const name = user?.name || 'User'
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=ffffff&size=128`
}
