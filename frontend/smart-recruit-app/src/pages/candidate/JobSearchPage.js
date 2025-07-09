import React from 'react'
import JobSearch from '../../components/candidates/JobSearch'

const JobSearchPage = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
        <p className="mt-2 text-gray-600">Find your next opportunity from thousands of job listings.</p>
      </div>
      
      <JobSearch />
    </div>
  )
}

export default JobSearchPage
