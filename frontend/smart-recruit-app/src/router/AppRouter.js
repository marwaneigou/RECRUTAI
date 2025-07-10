import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Auth Pages
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

// Candidate Pages
import CandidateDashboardPage from '../pages/candidate/DashboardPage'
import JobSearchPage from '../pages/candidate/JobSearchPage'
import ApplicationsPage from '../pages/candidate/ApplicationsPage'
import CVBuilderPage from '../pages/candidate/CVBuilderPage'
import SettingsPage from '../pages/candidate/SettingsPage'

// Employer Pages
import EmployerDashboardPage from '../pages/employer/DashboardPage'
import JobManagementPage from '../pages/employer/JobManagementPage'
import CandidatesPage from '../pages/employer/CandidatesPage'
import EmployerSettingsPage from '../pages/employer/SettingsPage'

// Public Pages
import HomePage from '../pages/public/HomePage'
import AboutPage from '../pages/public/AboutPage'
import ContactPage from '../pages/public/ContactPage'

// Layout Components
import PublicLayout from '../layouts/PublicLayout'
import CandidateLayout from '../layouts/CandidateLayout'
import EmployerLayout from '../layouts/EmployerLayout'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    // Redirect based on user role
    if (user.role === 'candidate') {
      return <Navigate to="/candidate/dashboard" replace />
    } else if (user.role === 'employer') {
      return <Navigate to="/employer/dashboard" replace />
    }
  }

  return children
}

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicRoute>
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          </PublicRoute>
        } />
        
        <Route path="/about" element={
          <PublicLayout>
            <AboutPage />
          </PublicLayout>
        } />
        
        <Route path="/contact" element={
          <PublicLayout>
            <ContactPage />
          </PublicLayout>
        } />

        {/* Auth Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />

        {/* Candidate Routes */}
        <Route path="/candidate/*" element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateLayout>
              <Routes>
                <Route path="dashboard" element={<CandidateDashboardPage />} />
                <Route path="jobs" element={<JobSearchPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="cv-builder" element={<CVBuilderPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </CandidateLayout>
          </ProtectedRoute>
        } />

        {/* Employer Routes */}
        <Route path="/employer/*" element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerLayout>
              <Routes>
                <Route path="dashboard" element={<EmployerDashboardPage />} />
                <Route path="jobs" element={<JobManagementPage />} />
                <Route path="candidates" element={<CandidatesPage />} />
                <Route path="settings" element={<EmployerSettingsPage />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </EmployerLayout>
          </ProtectedRoute>
        } />

        {/* Fallback Route */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Page not found</p>
              <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Go Home
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default AppRouter
