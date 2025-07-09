import React from 'react'
import CVBuilder from '../../components/candidates/CVBuilder'

const CVBuilderPage = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CV Builder</h1>
        <p className="mt-2 text-gray-600">Create and customize your professional CV with AI-powered suggestions.</p>
      </div>
      
      <CVBuilder />
    </div>
  )
}

export default CVBuilderPage
