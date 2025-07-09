import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  BriefcaseIcon,
  UserGroupIcon,
  PlusIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const EmployerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const stats = {
    companyName: 'Your Company',
    activeJobs: 5,
    totalApplications: 23,
    pendingApplications: 12,
    totalJobs: 8
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {stats.companyName}! 🏢
        </h1>
        <p className="text-green-100">
          You have {stats.totalApplications} applications and {stats.activeJobs} active job postings.
        </p>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={() => navigate('/employer/jobs')}
            className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Post New Job
          </button>
          <button
            onClick={() => navigate('/employer/settings')}
            className="bg-white/20 text-white px-4 py-2 rounded-md font-medium hover:bg-white/30"
          >
            <Cog6ToothIcon className="h-5 w-5 inline mr-2" />
            Manage Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeJobs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingApplications}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/employer/jobs')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
            >
              <PlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Post New Job</p>
              <p className="text-xs text-gray-500">Create a new job posting</p>
            </button>
            <button
              onClick={() => navigate('/employer/jobs')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50"
            >
              <BriefcaseIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Edit Jobs</p>
              <p className="text-xs text-gray-500">Manage job postings</p>
            </button>
            <button
              onClick={() => navigate('/employer/candidates')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50"
            >
              <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Job Applications</p>
              <p className="text-xs text-gray-500">Review applications</p>
            </button>
            <button
              onClick={() => navigate('/employer/settings')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50"
            >
              <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Company Profile</p>
              <p className="text-xs text-gray-500">Manage company info</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployerDashboard
