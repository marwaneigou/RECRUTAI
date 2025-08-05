import React, { useState, useEffect } from 'react'
import { BuildingOfficeIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    industry: 'Technology',
    companySize: '50-200',
    website: '',
    description: '',
    address: '',
    city: '',
    country: '',
    foundedYear: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    fetchEmployerProfile()
  }, [])

  const fetchEmployerProfile = async () => {
    try {
      setLoading(true)
      console.log('Fetching employer profile...')

      // Get employer profile from the auth endpoint that returns full user data
      const response = await api.get('/auth/me')
      console.log('Auth me response:', response)

      if (response.success && response.data?.user?.employerProfile) {
        const profile = response.data.user.employerProfile
        const userData = response.data.user

        console.log('Employer profile data:', profile)

        setCompanyInfo({
          companyName: profile.companyName || userData.name || '',
          industry: profile.industry || 'Technology',
          companySize: profile.companySize || '50-200',
          website: profile.website || '',
          description: profile.description || '',
          address: profile.address || '',
          city: profile.city || '',
          country: profile.country || '',
          foundedYear: profile.foundedYear || '',
          phone: userData.phone || '',
          email: userData.email || ''
        })

        console.log('Company info set:', {
          companyName: profile.companyName || userData.name || '',
          phone: userData.phone || '',
          email: userData.email || ''
        })
      } else {
        console.log('No employer profile found, using defaults')
        // Set defaults with user data if available
        const userData = response.data?.user || user
        setCompanyInfo(prev => ({
          ...prev,
          companyName: userData?.name || '',
          email: userData?.email || '',
          phone: userData?.phone || ''
        }))

        console.log('Using default data:', {
          companyName: userData?.name || '',
          email: userData?.email || '',
          phone: userData?.phone || ''
        })
      }
    } catch (error) {
      console.error('Error fetching employer profile:', error)
      toast.error('Failed to load company profile')

      // Set defaults with user data if available
      setCompanyInfo(prev => ({
        ...prev,
        companyName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('Saving company info:', companyInfo)

      // Step 1: Update user data (email, phone)
      const userData = {
        email: companyInfo.email,
        phone: companyInfo.phone
      }

      console.log('Updating user data:', userData)
      const userResponse = await api.put('/users/profile', userData)
      console.log('User update response:', userResponse)

      // Step 2: Update employer profile data
      const employerData = {
        companyName: companyInfo.companyName,
        industry: companyInfo.industry,
        companySize: companyInfo.companySize,
        website: companyInfo.website,
        description: companyInfo.description,
        address: companyInfo.address,
        city: companyInfo.city,
        country: companyInfo.country,
        foundedYear: companyInfo.foundedYear ? parseInt(companyInfo.foundedYear) : null
      }

      console.log('Updating employer data:', employerData)
      const employerResponse = await api.put('/employers/profile', employerData)
      console.log('Employer update response:', employerResponse)

      // Check if both updates were successful
      if (userResponse.success && employerResponse.success) {
        toast.success('Company information saved successfully!')
        // Refresh the profile data
        await fetchEmployerProfile()
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving company info:', error)

      // Handle validation errors
      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details
        details.forEach(detail => {
          toast.error(`${detail.path}: ${detail.msg}`)
        })
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to save company information')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your company profile and account settings.</p>
      </div>

      <div className="space-y-6">
        {/* Company Profile */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Company Profile</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={companyInfo.companyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  name="industry"
                  value={companyInfo.industry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  name="companySize"
                  value={companyInfo.companySize}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="50-200">50-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={companyInfo.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={companyInfo.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={companyInfo.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Founded Year
                </label>
                <input
                  type="number"
                  name="foundedYear"
                  value={companyInfo.foundedYear}
                  onChange={handleInputChange}
                  min="1800"
                  max="2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>
                <textarea
                  name="description"
                  value={companyInfo.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <UserIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={companyInfo.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={companyInfo.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={companyInfo.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
