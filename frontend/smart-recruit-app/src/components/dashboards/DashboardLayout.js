import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { getAvatarUrl, formatRole } from '../../utils/auth'

const DashboardLayout = ({ children, title, currentView, onViewChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    console.log('DashboardLayout - User role:', user?.role);
    console.log('DashboardLayout - Current view:', currentView);
    console.log('DashboardLayout - Full user object:', user);

    // Check if we're on the employer dashboard route
    const isEmployerRoute = window.location.pathname.includes('/employer');
    console.log('DashboardLayout - Is employer route:', isEmployerRoute);

    if (user?.role === 'candidate') {
      return [
        { name: 'Dashboard', view: 'dashboard', icon: HomeIcon, current: currentView === 'dashboard' },
        { name: 'Job Search', view: 'jobSearch', icon: MagnifyingGlassIcon, current: currentView === 'jobSearch' },
        { name: 'Applications', view: 'applications', icon: DocumentTextIcon, current: currentView === 'applications' },
        { name: 'Resume', view: 'resume', icon: DocumentTextIcon, current: currentView === 'resume' },
        { name: 'CV Builder', view: 'cvBuilder', icon: DocumentTextIcon, current: currentView === 'cvBuilder' },
        { name: 'Settings', view: 'settings', icon: Cog6ToothIcon, current: currentView === 'settings' },
      ]
    } else if (user?.role === 'employer' || isEmployerRoute) {
      return [
        { name: 'Dashboard', view: 'dashboard', icon: HomeIcon, current: currentView === 'dashboard' },
        { name: 'Post Job', view: 'createJob', icon: BriefcaseIcon, current: currentView === 'createJob' },
        { name: 'My Jobs', view: 'myJobs', icon: BriefcaseIcon, current: currentView === 'myJobs' },
        { name: 'Job Offers', view: 'jobOffers', icon: DocumentTextIcon, current: currentView === 'jobOffers' },
        { name: 'Candidates', view: 'candidates', icon: UserIcon, current: currentView === 'candidates' },
        { name: 'Company Profile', view: 'profile', icon: UserIcon, current: currentView === 'profile' },
        { name: 'Settings', view: 'settings', icon: Cog6ToothIcon, current: currentView === 'settings' },
      ]
    } else if (user?.role === 'admin') {
      return [
        { name: 'Dashboard', view: 'dashboard', icon: HomeIcon, current: currentView === 'dashboard' },
        { name: 'Users', view: 'users', icon: UserIcon, current: currentView === 'users' },
        { name: 'Jobs', view: 'jobs', icon: BriefcaseIcon, current: currentView === 'jobs' },
        { name: 'Analytics', view: 'analytics', icon: DocumentTextIcon, current: currentView === 'analytics' },
        { name: 'Settings', view: 'settings', icon: Cog6ToothIcon, current: currentView === 'settings' },
      ]
    }

    return [
      { name: 'Dashboard', view: 'dashboard', icon: HomeIcon, current: currentView === 'dashboard' },
      { name: 'Settings', view: 'settings', icon: Cog6ToothIcon, current: currentView === 'settings' },
    ]
  }

  const handleNavClick = (view) => {
    if (onViewChange) {
      onViewChange(view)
    }
    setSidebarOpen(false) // Close mobile sidebar
  }

  const navigation = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SR</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">Smart Recruit</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.view)}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SR</span>
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">Smart Recruit</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.view)}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-gray-600"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="ml-4 lg:ml-0 text-lg font-semibold text-gray-900">
                {title}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="text-gray-400 hover:text-gray-600">
                <BellIcon className="h-6 w-6" />
              </button>

              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <img
                    className="h-8 w-8 rounded-full"
                    src={getAvatarUrl(user)}
                    alt={user?.name}
                  />
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500">{formatRole(user?.role)}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
