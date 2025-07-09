import React from 'react'
import Applications from '../../components/candidates/Applications'

const ApplicationsPage = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
        <p className="mt-2 text-gray-600">Track the status of your job applications and manage your pipeline.</p>
      </div>
      
      <Applications />
    </div>
  )
}

export default ApplicationsPage
