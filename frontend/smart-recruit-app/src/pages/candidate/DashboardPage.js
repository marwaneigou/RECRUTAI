import React from 'react'
import CandidateDashboard from '../../components/dashboards/CandidateDashboard'

const DashboardPage = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back! Here's an overview of your job search activity.</p>
      </div>
      
      <CandidateDashboard />
    </div>
  )
}

export default DashboardPage
