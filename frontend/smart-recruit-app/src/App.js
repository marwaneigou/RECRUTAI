import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

// Page Components
import HomePage from './pages/public/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Candidate Pages
import CandidateDashboardPage from './pages/candidate/DashboardPage'
import JobSearchPage from './pages/candidate/JobSearchPage'
import JobDetailsPage from './pages/candidate/JobDetailsPage'
import ApplicationsPage from './pages/candidate/ApplicationsPage'
import CVBuilderPage from './pages/candidate/CVBuilderPage'

// Employer Pages
import EmployerDashboard from './components/dashboards/EmployerDashboard'
import JobsPage from './pages/employer/JobsPage'
import CandidatesPage from './pages/employer/CandidatesPage'
import JobCandidatesPage from './pages/employer/JobCandidatesPage'
import EmployerSettingsPage from './pages/employer/SettingsPage'
import AdminDashboard from './components/dashboards/AdminDashboard'

// Layouts
import CandidateLayout from './layouts/CandidateLayout'
import EmployerLayout from './layouts/EmployerLayout'

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

  // Not authenticated, show home page
  return <HomePage />
}

// Main App component
const AppContent = () => {
  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AuthenticatedRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Candidate routes with layout */}
        <Route path="/candidate/*" element={
          <ProtectedRoute requiredRoles={['candidate']}>
            <CandidateLayout>
              <Routes>
                <Route path="dashboard" element={<CandidateDashboardPage />} />
                <Route path="jobs" element={<JobSearchPage />} />
                <Route path="jobs/:jobId" element={<JobDetailsPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="cv-builder" element={<CVBuilderPage />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </CandidateLayout>
          </ProtectedRoute>
        } />

        {/* Employer routes with layout */}
        <Route path="/employer/*" element={
          <ProtectedRoute requiredRoles={['employer']}>
            <EmployerLayout>
              <Routes>
                <Route path="dashboard" element={<EmployerDashboard />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/:jobId/candidates" element={<JobCandidatesPage />} />
                <Route path="candidates" element={<CandidatesPage />} />
                <Route path="settings" element={<EmployerSettingsPage />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </EmployerLayout>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
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
