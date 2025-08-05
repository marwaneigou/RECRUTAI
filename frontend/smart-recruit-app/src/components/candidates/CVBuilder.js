import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CVImprovements from './CVImprovements';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const CVBuilder = () => {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [cvData, setCvData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    
    // Professional Summary
    professionalSummary: '',
    
    // Work Experience
    workExperience: [
      {
        id: 1,
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }
    ],
    
    // Education
    education: [
      {
        id: 1,
        degree: '',
        institution: '',
        location: '',
        graduationDate: '',
        gpa: '',
        description: ''
      }
    ],
    
    // Skills
    technicalSkills: '',
    softSkills: '',
    languages: '',
    
    // Projects
    projects: [
      {
        id: 1,
        name: '',
        description: '',
        technologies: '',
        url: ''
      }
    ],
    
    // Certifications
    certifications: [
      {
        id: 1,
        name: '',
        issuer: '',
        date: '',
        url: ''
      }
    ]
  });

  const templates = [
    {
      id: 'modern',
      name: 'Modern Professional',
      description: 'Clean, modern design with accent colors',
      preview: null, // We'll create a CSS preview instead
      features: ['Two-column layout', 'Color accents', 'Modern typography'],
      colors: ['bg-blue-500', 'bg-blue-100', 'text-blue-900']
    },
    {
      id: 'classic',
      name: 'Classic Traditional',
      description: 'Traditional format preferred by conservative industries',
      preview: null,
      features: ['Single-column layout', 'Professional fonts', 'Traditional structure'],
      colors: ['bg-gray-700', 'bg-gray-100', 'text-gray-900']
    },
    {
      id: 'creative',
      name: 'Creative Designer',
      description: 'Eye-catching design for creative professionals',
      preview: null,
      features: ['Creative layout', 'Visual elements', 'Portfolio showcase'],
      colors: ['bg-purple-500', 'bg-purple-100', 'text-purple-900']
    }
  ];

  useEffect(() => {
    loadCvData();
  }, []);

  const loadCvData = async () => {
    try {
      setLoading(true);
      console.log('Loading CV data...');

      const response = await api.get('/candidates/cv-data');
      console.log('API response:', response);

      // The API interceptor returns response.data, so response is actually the data
      const responseData = response.data || response;
      console.log('Response data:', responseData);

      // Check for cvData in different possible locations
      let cvDataFromDb = null;
      if (responseData && responseData.success) {
        cvDataFromDb = responseData.cvData || responseData.data?.cvData;
      }

      console.log('CV data from DB:', cvDataFromDb);

      if (cvDataFromDb) {

        console.log('Setting CV data:', cvDataFromDb);

        console.log('Full CV data from API:', cvDataFromDb);
        console.log('Professional Summary:', cvDataFromDb.professionalSummary);
        console.log('Languages:', cvDataFromDb.languages);
        console.log('Work Experience:', cvDataFromDb.workExperience);
        console.log('Education:', cvDataFromDb.education);
        console.log('Projects:', cvDataFromDb.projects);
        console.log('Certifications:', cvDataFromDb.certifications);
        console.log('Selected Template:', cvDataFromDb.selectedTemplate);

        // Map the API response structure to the frontend structure
        // The backend now returns data directly in the root object, not nested in personalInfo
        const newCvData = {
          firstName: cvDataFromDb.firstName || '',
          lastName: cvDataFromDb.lastName || '',
          email: cvDataFromDb.email || user?.email || '',
          phone: cvDataFromDb.phone || '',
          address: cvDataFromDb.address || '',
          city: cvDataFromDb.city || '',
          country: cvDataFromDb.country || '',
          linkedinUrl: cvDataFromDb.linkedinUrl || '',
          githubUrl: cvDataFromDb.githubUrl || '',
          portfolioUrl: cvDataFromDb.portfolioUrl || '',
          professionalSummary: cvDataFromDb.professionalSummary || '',
          technicalSkills: cvDataFromDb.technicalSkills || '',
          softSkills: cvDataFromDb.softSkills || '',
          languages: cvDataFromDb.languages || '',
          workExperience: Array.isArray(cvDataFromDb.workExperience) && cvDataFromDb.workExperience.length > 0
            ? cvDataFromDb.workExperience.map(exp => ({
                id: exp.id || Date.now(),
                jobTitle: exp.jobTitle || '',
                company: exp.company || '',
                location: exp.location || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                current: exp.current || false,
                description: exp.description || ''
              }))
            : [{ id: 1, jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
          education: Array.isArray(cvDataFromDb.education) && cvDataFromDb.education.length > 0
            ? cvDataFromDb.education.map(edu => ({
                id: edu.id || Date.now(),
                degree: edu.degree || '',
                institution: edu.institution || '',
                location: edu.location || '',
                graduationDate: edu.graduationDate || '',
                gpa: edu.gpa || '',
                description: edu.description || ''
              }))
            : [{ id: 1, degree: '', institution: '', location: '', graduationDate: '', gpa: '', description: '' }],
          projects: Array.isArray(cvDataFromDb.projects) && cvDataFromDb.projects.length > 0
            ? cvDataFromDb.projects.map(proj => ({
                id: proj.id || Date.now(),
                name: proj.name || '',
                description: proj.description || '',
                technologies: proj.technologies || '',
                url: proj.url || '',
                startDate: proj.startDate || '',
                endDate: proj.endDate || ''
              }))
            : [{ id: 1, name: '', description: '', technologies: '', url: '', startDate: '', endDate: '' }],
          certifications: Array.isArray(cvDataFromDb.certifications) && cvDataFromDb.certifications.length > 0
            ? cvDataFromDb.certifications.map(cert => ({
                id: cert.id || Date.now(),
                name: cert.name || '',
                issuer: cert.issuer || '',
                date: cert.date || '',
                url: cert.url || ''
              }))
            : [{ id: 1, name: '', issuer: '', date: '', url: '' }]
        };

        console.log('Data being set to state:', newCvData);

        setCvData(newCvData);

        setSelectedTemplate(cvDataFromDb.selectedTemplate || 'modern');
        toast.success('CV data loaded successfully!');
      } else {
        console.log('No CV data found or invalid response structure');
        console.log('Response structure:', responseData);
        console.log('No existing CV data found. Starting with a blank form.');
        // Don't show error toast for empty CV data - this is normal for new users
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);

      // More detailed error handling
      let errorMessage = 'Failed to load CV data';
      if (error.response?.data?.error?.message) {
        errorMessage += ': ' + error.response.data.error.message;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveCvData = async () => {
    try {
      // Filter out empty projects and certifications
      const filteredProjects = cvData.projects.filter(project =>
        project.name && project.name.trim() !== ''
      );

      const filteredCertifications = cvData.certifications.filter(cert =>
        cert.name && cert.name.trim() !== ''
      );

      const dataToSave = {
        ...cvData,
        projects: filteredProjects,
        certifications: filteredCertifications,
        selectedTemplate,
        isComplete: isFormComplete()
      };

      console.log('Saving CV data:', dataToSave);

      const response = await api.post('/candidates/save-cv-data', dataToSave);
      console.log('Save response:', response);

      // The API interceptor returns response.data, so response is actually the data
      if (response && response.success) {
        toast.success('CV data saved successfully!');
      } else {
        throw new Error(response?.error?.message || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving CV data:', error);
      console.error('Error details:', error.response);

      let errorMessage = 'Failed to save CV data';
      if (error.response?.error?.message) {
        errorMessage += ': ' + error.response.error.message;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }

      toast.error(errorMessage);
    }
  };

  const isFormComplete = () => {
    return !!(
      cvData.firstName &&
      cvData.lastName &&
      cvData.email &&
      cvData.professionalSummary &&
      cvData.workExperience?.some(exp => exp.jobTitle && exp.company) &&
      cvData.education?.some(edu => edu.degree && edu.institution)
    );
  };

  const handleInputChange = (field, value) => {
    setCvData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-save after 2 seconds of no changes
    clearTimeout(window.cvAutoSaveTimeout);
    window.cvAutoSaveTimeout = setTimeout(() => {
      saveCvData();
    }, 2000);
  };

  const handleArrayItemChange = (arrayName, index, field, value) => {
    setCvData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (arrayName, newItem) => {
    setCvData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { ...newItem, id: Date.now() }]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setCvData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const generateCV = async () => {
    try {
      setGenerating(true);

      // Save CV data first
      await saveCvData();

      const response = await api.post('/candidates/generate-cv', {
        template: selectedTemplate,
        data: cvData
      });

      // Handle the response (API interceptor returns response.data)
      const format = response.format;

      if (format === 'html' && response.htmlContent) {
        // Create a blob URL for the HTML content
        const blob = new Blob([response.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success('CV generated successfully! Use browser Print → Save as PDF to download.');
      } else if (response.pdfUrl) {
        // Open PDF URL
        window.open(`http://localhost:3000${response.pdfUrl}`, '_blank');
        toast.success('CV generated successfully!');
      } else {
        throw new Error('No CV content received');
      }
    } catch (error) {
      console.error('Error generating CV:', error);
      toast.error('Failed to generate CV. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCV = async () => {
    try {
      // Generate CV first
      const response = await api.post('/candidates/generate-cv', {
        template: selectedTemplate,
        data: cvData
      });

      const format = response.format;

      if (format === 'pdf' && response.pdfUrl) {
        // Direct download for PDF
        const link = document.createElement('a');
        link.href = `http://localhost:3000${response.pdfUrl}`;
        link.download = `${cvData.firstName}_${cvData.lastName}_CV.pdf`;
        link.click();
        toast.success('CV downloaded successfully!');
      } else if (format === 'html' && response.htmlContent) {
        // Create blob URL for HTML and open for print-to-PDF
        const blob = new Blob([response.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success('CV opened in new tab. Use browser Print → Save as PDF to download.');
      } else {
        throw new Error('No CV content received');
      }
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Failed to download CV. Please try again.');
    }
  };

  // Generate CV text for AI analysis
  const generateCVText = () => {
    const sections = [];

    // Personal Info
    sections.push(`${cvData.firstName} ${cvData.lastName}`);
    if (cvData.email) sections.push(`Email: ${cvData.email}`);
    if (cvData.phone) sections.push(`Phone: ${cvData.phone}`);
    if (cvData.address) sections.push(`Address: ${cvData.address}, ${cvData.city}, ${cvData.country}`);

    // Professional Summary
    if (cvData.professionalSummary) {
      sections.push(`\nPROFESSIONAL SUMMARY:\n${cvData.professionalSummary}`);
    }

    // Work Experience
    if (cvData.workExperience.length > 0) {
      sections.push('\nWORK EXPERIENCE:');
      cvData.workExperience.forEach(exp => {
        if (exp.jobTitle || exp.company) {
          sections.push(`${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})`);
          if (exp.description) sections.push(exp.description);
        }
      });
    }

    // Education
    if (cvData.education.length > 0) {
      sections.push('\nEDUCATION:');
      cvData.education.forEach(edu => {
        if (edu.degree || edu.institution) {
          sections.push(`${edu.degree} - ${edu.institution} (${edu.year})`);
        }
      });
    }

    // Skills
    if (cvData.skills) {
      sections.push(`\nSKILLS:\n${cvData.skills}`);
    }

    // Projects
    if (cvData.projects.length > 0) {
      sections.push('\nPROJECTS:');
      cvData.projects.forEach(project => {
        if (project.name) {
          sections.push(`${project.name}: ${project.description}`);
        }
      });
    }

    // Certifications
    if (cvData.certifications.length > 0) {
      sections.push('\nCERTIFICATIONS:');
      cvData.certifications.forEach(cert => {
        if (cert.name) {
          sections.push(`${cert.name} - ${cert.issuer} (${cert.year})`);
        }
      });
    }

    return sections.join('\n');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading CV data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <SparklesIcon className="mr-2 h-6 w-6 text-blue-600" />
          CV Builder
        </h1>
        <p className="text-gray-600 mt-1">
          Create a professional CV with our LaTeX-powered templates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Template</h3>
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    console.log('Switching to template:', template.id);
                    setSelectedTemplate(template.id);
                    // Auto-save when template changes
                    setTimeout(() => {
                      saveCvData();
                    }, 500);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    {selectedTemplate === template.id && (
                      <CheckIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>

                  {/* Template Preview */}
                  <div className="mb-3 p-3 bg-gray-50 rounded border">
                    <div className="space-y-2">
                      <div className={`h-2 ${template.colors[0]} rounded`}></div>
                      <div className="space-y-1">
                        <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-1 bg-gray-300 rounded w-1/2"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="h-1 bg-gray-300 rounded"></div>
                          <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 bg-gray-300 rounded"></div>
                          <div className="h-1 bg-gray-300 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="space-y-1">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-500">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CV Completion Status */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">CV Completion</span>
                <span className={`text-sm font-medium ${isFormComplete() ? 'text-green-600' : 'text-orange-600'}`}>
                  {isFormComplete() ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${isFormComplete() ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${isFormComplete() ? 100 : 60}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={saveCvData}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckIcon className="mr-2 h-4 w-4" />
                Save CV Data
              </button>
              <button
                onClick={generateCV}
                disabled={generating}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <EyeIcon className="mr-2 h-4 w-4" />
                    Preview CV
                  </>
                )}
              </button>
              <button
                onClick={downloadCV}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                Download PDF
              </button>
              <button
                onClick={() => setShowImprovements(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <LightBulbIcon className="mr-2 h-4 w-4" />
                AI Improvements
              </button>
            </div>
          </div>
        </div>

        {/* CV Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">CV Information</h3>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Personal Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={cvData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={cvData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={cvData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={cvData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={cvData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={cvData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={cvData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Social Links */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={cvData.linkedinUrl}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={cvData.githubUrl}
                      onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={cvData.portfolioUrl}
                      onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Professional Summary</h4>
                <textarea
                  value={cvData.professionalSummary}
                  onChange={(e) => handleInputChange('professionalSummary', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write a brief professional summary highlighting your key skills and experience..."
                />
              </div>

              {/* Work Experience */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Work Experience</h4>
                  <button
                    onClick={() => addArrayItem('workExperience', {
                      jobTitle: '',
                      company: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      description: ''
                    })}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    Add Experience
                  </button>
                </div>

                {cvData.workExperience.map((exp, index) => (
                  <div key={exp.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Experience {index + 1}</h5>
                      {cvData.workExperience.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('workExperience', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={(e) => handleArrayItemChange('workExperience', index, 'jobTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Senior Software Developer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company *
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleArrayItemChange('workExperience', index, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., TechCorp Solutions"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => handleArrayItemChange('workExperience', index, 'location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Paris, France"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => handleArrayItemChange('workExperience', index, 'startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="month"
                          value={exp.endDate}
                          onChange={(e) => handleArrayItemChange('workExperience', index, 'endDate', e.target.value)}
                          disabled={exp.current}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => {
                            handleArrayItemChange('workExperience', index, 'current', e.target.checked);
                            if (e.target.checked) {
                              handleArrayItemChange('workExperience', index, 'endDate', '');
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Currently working here
                        </label>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Description
                      </label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleArrayItemChange('workExperience', index, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your responsibilities, achievements, and key contributions..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Education</h4>
                  <button
                    onClick={() => addArrayItem('education', {
                      degree: '',
                      institution: '',
                      location: '',
                      graduationDate: '',
                      gpa: '',
                      description: ''
                    })}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    Add Education
                  </button>
                </div>

                {cvData.education.map((edu, index) => (
                  <div key={edu.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Education {index + 1}</h5>
                      {cvData.education.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('education', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Degree *
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleArrayItemChange('education', index, 'degree', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Master of Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Institution *
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleArrayItemChange('education', index, 'institution', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., University of Technology"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => handleArrayItemChange('education', index, 'location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Paris, France"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Graduation Date
                        </label>
                        <input
                          type="month"
                          value={edu.graduationDate}
                          onChange={(e) => handleArrayItemChange('education', index, 'graduationDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GPA (Optional)
                        </label>
                        <input
                          type="text"
                          value={edu.gpa}
                          onChange={(e) => handleArrayItemChange('education', index, 'gpa', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 3.8/4.0"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={edu.description}
                        onChange={(e) => handleArrayItemChange('education', index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Relevant coursework, achievements, honors..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Skills</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technical Skills
                    </label>
                    <textarea
                      value={cvData.technicalSkills}
                      onChange={(e) => handleInputChange('technicalSkills', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="JavaScript, React, Node.js, Python, SQL..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soft Skills
                    </label>
                    <textarea
                      value={cvData.softSkills}
                      onChange={(e) => handleInputChange('softSkills', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leadership, Communication, Problem-solving..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Languages
                    </label>
                    <textarea
                      value={cvData.languages}
                      onChange={(e) => handleInputChange('languages', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="English (Fluent), French (Native), Spanish (Intermediate)..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CV Improvements Modal */}
      {showImprovements && (
        <CVImprovements
          cvText={generateCVText()}
          onClose={() => setShowImprovements(false)}
        />
      )}
    </div>
  );
};

export default CVBuilder;
