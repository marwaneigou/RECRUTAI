import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { EyeIcon, EyeSlashIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { validatePassword, getDashboardRoute } from '../../utils/auth'
import LoadingSpinner from '../common/LoadingSpinner'

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const { register: registerUser, isLoading, error } = useAuth()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      const result = await registerUser(data)
      
      if (result.success) {
        // Redirect to appropriate dashboard based on role
        const dashboardRoute = getDashboardRoute(data.role)
        navigate(dashboardRoute, { replace: true })
      }
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  const passwordValidation = password ? validatePassword(password) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    selectedRole === 'candidate'
                      ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    {...register('role', { required: 'Please select your role' })}
                    type="radio"
                    value="candidate"
                    className="sr-only"
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div className="flex items-center">
                    <UserIcon className="h-6 w-6 text-gray-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Candidate</div>
                      <div className="text-xs text-gray-500">Looking for jobs</div>
                    </div>
                  </div>
                </label>

                <label
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    selectedRole === 'employer'
                      ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    {...register('role', { required: 'Please select your role' })}
                    type="radio"
                    value="employer"
                    className="sr-only"
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-gray-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Employer</div>
                      <div className="text-xs text-gray-500">Hiring talent</div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                {...register('name', {
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                type="text"
                autoComplete="name"
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="label">
                Phone Number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                {...register('phone')}
                type="tel"
                autoComplete="tel"
                className="input"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    },
                    validate: (value) => {
                      const hasLower = /[a-z]/.test(value)
                      const hasUpper = /[A-Z]/.test(value)
                      const hasNumber = /\d/.test(value)

                      if (!hasLower) return 'Password must contain at least one lowercase letter'
                      if (!hasUpper) return 'Password must contain at least one uppercase letter'
                      if (!hasNumber) return 'Password must contain at least one number'

                      return true
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && passwordValidation && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordValidation.strength === 'weak'
                            ? 'w-1/3 bg-error-500'
                            : passwordValidation.strength === 'medium'
                            ? 'w-2/3 bg-warning-500'
                            : 'w-full bg-success-500'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordValidation.strength === 'weak'
                          ? 'text-error-600'
                          : passwordValidation.strength === 'medium'
                          ? 'text-warning-600'
                          : 'text-success-600'
                      }`}
                    >
                      {passwordValidation.strength}
                    </span>
                  </div>
                  {passwordValidation.errors.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-600 space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-error-500 mr-1">•</span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="flex items-center">
            <input
              {...register('acceptTerms', {
                required: 'You must accept the terms and conditions'
              })}
              id="accept-terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="mt-1 text-sm text-error-600">{errors.acceptTerms.message}</p>
          )}

          {/* Error message */}
          {error && (
            <div className="alert-error">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting || isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterForm
