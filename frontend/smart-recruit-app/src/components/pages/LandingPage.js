import React from 'react'
import { Link } from 'react-router-dom'
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline'

const LandingPage = () => {
  const features = [
    {
      name: 'AI-Powered Matching',
      description: 'Our advanced AI algorithms match candidates with the perfect job opportunities based on skills, experience, and preferences.',
      icon: SparklesIcon,
    },
    {
      name: 'Smart Job Search',
      description: 'Find your dream job with intelligent search filters and personalized recommendations.',
      icon: BriefcaseIcon,
    },
    {
      name: 'Talent Pool Access',
      description: 'Employers get access to a curated pool of qualified candidates with detailed profiles and skill assessments.',
      icon: UserGroupIcon,
    },
    {
      name: 'Analytics & Insights',
      description: 'Track your hiring progress and candidate engagement with comprehensive analytics and reporting.',
      icon: ChartBarIcon,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SR</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Smart Recruit</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Find your perfect</span>{' '}
                  <span className="block text-primary-600 xl:inline">career match</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Connect talented professionals with amazing opportunities using our AI-powered recruitment platform. 
                  Whether you're looking for your next role or the perfect candidate, we make it simple and smart.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get started for free
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-br from-primary-400 to-purple-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-white text-center">
              <SparklesIcon className="h-24 w-24 mx-auto mb-4 opacity-80" />
              <p className="text-lg font-medium">AI-Powered Recruitment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform combines cutting-edge AI technology with intuitive design to create the best recruitment experience.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Join thousands of users today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-200">
            Create your account and start connecting with opportunities or talent in minutes.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/register?role=candidate"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
            >
              I'm looking for a job
            </Link>
            <Link
              to="/register?role=employer"
              className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-primary-600"
            >
              I'm hiring talent
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-gray-400 text-sm">
              © 2024 Smart Recruit. All rights reserved.
            </p>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SR</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Smart Recruit</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
