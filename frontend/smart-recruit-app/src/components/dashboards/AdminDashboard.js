import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import DashboardLayout from './DashboardLayout'
import { 
  UserGroupIcon, 
  BriefcaseIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

const AdminDashboard = () => {
  const { user } = useAuth()

  const stats = [
    {
      name: 'Total Users',
      value: '1,247',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      change: '+12% from last month'
    },
    {
      name: 'Active Jobs',
      value: '89',
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      change: '+8% from last month'
    },
    {
      name: 'Applications',
      value: '3,456',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: '+23% from last month'
    },
    {
      name: 'Reports',
      value: '12',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      change: '3 pending review'
    }
  ]

  const recentUsers = [
    {
      id: 1,
      name: 'Ahmed Ben Ali',
      email: 'ahmed.benali@email.com',
      role: 'Candidate',
      joinDate: '2024-01-15',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Marie Dubois',
      email: 'marie.dubois@techcorp.fr',
      role: 'Employer',
      joinDate: '2024-01-14',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Fatima El Mansouri',
      email: 'fatima.elmansouri@email.com',
      role: 'Candidate',
      joinDate: '2024-01-12',
      status: 'Active'
    }
  ]

  const systemMetrics = [
    {
      name: 'Server Uptime',
      value: '99.9%',
      status: 'good'
    },
    {
      name: 'Response Time',
      value: '245ms',
      status: 'good'
    },
    {
      name: 'Database Size',
      value: '2.4GB',
      status: 'warning'
    },
    {
      name: 'Active Sessions',
      value: '156',
      status: 'good'
    }
  ]

  return (
    <DashboardLayout title="Admin Dashboard" user={user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, Administrator! ⚡
          </h1>
          <p className="text-purple-100">
            System is running smoothly. 12 new users joined this week.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">Joined {user.joinDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {user.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="btn-outline w-full">View All Users</button>
              </div>
            </div>
          </div>

          {/* System Metrics */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">System Health</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {systemMetrics.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{metric.name}</h4>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-semibold text-gray-900 mr-2">{metric.value}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        metric.status === 'good' ? 'bg-green-500' :
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="btn-outline w-full">View System Logs</button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Admin Actions</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-500">View and edit users</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <BriefcaseIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Job Management</p>
                <p className="text-xs text-gray-500">Moderate job posts</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Analytics</p>
                <p className="text-xs text-gray-500">Platform insights</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Reports</p>
                <p className="text-xs text-gray-500">Handle user reports</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
