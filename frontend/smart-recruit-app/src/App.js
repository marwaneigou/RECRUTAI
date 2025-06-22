import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import CandidateDashboard from './components/dashboards/CandidateDashboard'
import EmployerDashboard from './components/dashboards/EmployerDashboard'
import AdminDashboard from './components/dashboards/AdminDashboard'
import LandingPage from './components/pages/LandingPage'
import LoadingSpinner from './components/common/LoadingSpinner'

// Component to handle authenticated redirects
const AuthenticatedRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on role
    switch (user.role?.toLowerCase()) {
      case 'candidate':
        return <Navigate to="/candidate/dashboard" replace />
      case 'employer':
        return <Navigate to="/employer/dashboard" replace />
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />
      default:
        return <Navigate to="/dashboard" replace />
    }
  }

  // Not authenticated, show landing page
  return <LandingPage />
}

// Main App component
const AppContent = () => {
  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AuthenticatedRedirect />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        
        {/* Protected routes - Candidate */}
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute requiredRoles={['candidate']}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Protected routes - Employer */}
        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute requiredRoles={['employer']}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Protected routes - Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Generic dashboard route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedRedirect />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <button
                  onClick={() => window.history.back()}
                  className="btn-primary"
                >
                  Go Back
                </button>
              </div>
            </div>
          }
        />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

// Root App component with providers
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
