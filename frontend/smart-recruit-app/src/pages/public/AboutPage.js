import React from 'react'

const AboutPage = () => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">About Us</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Revolutionizing Recruitment with AI
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            RecrutIA is an AI-powered recruitment platform that connects talented candidates with great opportunities.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 mb-6">
                We believe that finding the right job or the right candidate shouldn't be a matter of luck. 
                Our AI-powered platform analyzes skills, experience, and preferences to create perfect matches 
                between candidates and employers.
              </p>
              <p className="text-gray-600">
                By leveraging cutting-edge technology, we're making the recruitment process more efficient, 
                fair, and successful for everyone involved.
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose RecrutIA?</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  AI-powered job matching based on skills and preferences
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Professional CV builder with multiple templates
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Real-time application tracking and updates
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Direct communication with employers and candidates
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Advanced analytics and insights
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-6">
              Join thousands of professionals who have found their perfect match through RecrutIA.
            </p>
            <a
              href="/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your Account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
