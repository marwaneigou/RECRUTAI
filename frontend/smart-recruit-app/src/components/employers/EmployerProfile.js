import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Globe, MapPin, Calendar, Users, Edit3, Save, X } from 'lucide-react';

const EmployerProfile = () => {
  // const { user } = useAuth(); // Not needed for this component
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/employers/profile');

      // The API service already extracts response.data, so we access data.employer directly
      const employerData = response.data.employer;
      setProfile(employerData);
      setFormData(employerData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
        toast.error('Employer profile not found. Please contact support.');
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : '') : value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/employers/profile', formData);
      // The API service already extracts response.data, so we access data.employer directly
      setProfile(response.data.employer);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);

      // Handle validation errors
      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        details.forEach(detail => {
          toast.error(`${detail.path}: ${detail.msg}`);
        });
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to update profile');
      }
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No profile found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="mr-2 h-6 w-6 text-blue-600" />
            Company Profile
          </h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              {editing ? (
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 font-semibold">{profile.companyName}</p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              {editing ? (
                <input
                  type="text"
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.industry || 'Not specified'}</p>
              )}
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline mr-1 h-4 w-4" />
                Company Size
              </label>
              {editing ? (
                <select
                  name="companySize"
                  value={formData.companySize || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="50-200">50-200 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              ) : (
                <p className="text-gray-900">{profile.companySize || 'Not specified'}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline mr-1 h-4 w-4" />
                Website
              </label>
              {editing ? (
                <input
                  type="url"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              ) : (
                <p className="text-gray-900">
                  {profile.website ? (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </p>
              )}
            </div>

            {/* Founded Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline mr-1 h-4 w-4" />
                Founded Year
              </label>
              {editing ? (
                <input
                  type="number"
                  name="foundedYear"
                  value={formData.foundedYear || ''}
                  onChange={handleInputChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.foundedYear || 'Not specified'}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline mr-1 h-4 w-4" />
                Location
              </label>
              {editing ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="country"
                    value={formData.country || ''}
                    onChange={handleInputChange}
                    placeholder="Country"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <p className="text-gray-900">
                  {profile.city && profile.country 
                    ? `${profile.city}, ${profile.country}`
                    : profile.city || profile.country || 'Not specified'
                  }
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Description
            </label>
            {editing ? (
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about your company..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {profile.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Address */}
          {editing && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address"
              />
            </div>
          )}

          {/* Logo URL */}
          {editing && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerProfile;
