import React from 'react'
import { Link } from 'react-router-dom'

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">RecrutIA</h1>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                About
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Contact
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">RecrutIA</h3>
              <p className="text-gray-300 mb-4">
                AI-powered recruitment platform connecting talented candidates with great opportunities.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">For Candidates</h4>
              <ul className="space-y-2">
                <li><Link to="/register" className="text-gray-300 hover:text-white">Find Jobs</Link></li>
                <li><Link to="/register" className="text-gray-300 hover:text-white">Build CV</Link></li>
                <li><Link to="/register" className="text-gray-300 hover:text-white">Career Advice</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2">
                <li><Link to="/register" className="text-gray-300 hover:text-white">Post Jobs</Link></li>
                <li><Link to="/register" className="text-gray-300 hover:text-white">Find Candidates</Link></li>
                <li><Link to="/register" className="text-gray-300 hover:text-white">Hiring Tools</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © 2024 RecrutIA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
