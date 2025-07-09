import React from 'react'
import Resume from '../../components/candidates/Resume'

const ResumePage = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resume</h1>
        <p className="mt-2 text-gray-600">Manage your resume and download in various formats.</p>
      </div>
      
      <Resume />
    </div>
  )
}

export default ResumePage
