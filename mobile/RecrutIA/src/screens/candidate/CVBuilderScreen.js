import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, TextInput, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { candidatesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, shadows } from '../../theme/theme';
import Toast from 'react-native-toast-message';
import NativeCVPreview from '../../components/NativeCVPreview';

const CVBuilderScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [cvData, setCvData] = useState({
    // Personal Information (same structure as web)
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

    // Skills (web format)
    technicalSkills: '',
    softSkills: '',
    languages: '',

    // Work Experience (same structure as web)
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

    // Education (same structure as web)
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



    selectedTemplate: 'modern',
    isComplete: false,
    lastGenerated: null
  });

  useEffect(() => {
    loadCVData();
  }, []);

  const loadCVData = async () => {
    try {
      setLoading(true);
      console.log('Loading CV data...');

      const response = await candidatesAPI.getCvData();
      console.log('CV API response:', response);

      // Handle response (same logic as web)
      const responseData = response.data || response;
      let cvDataFromDb = null;

      if (responseData && responseData.success) {
        cvDataFromDb = responseData.cvData || responseData.data?.cvData;
      }

      console.log('CV data from DB:', cvDataFromDb);

      if (cvDataFromDb) {
        // Map the API response structure to the frontend structure (same as web)
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
          workExperience: cvDataFromDb.workExperience || [
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
          education: cvDataFromDb.education || [
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
          projects: cvDataFromDb.projects || [
            {
              id: 1,
              name: '',
              description: '',
              technologies: '',
              url: '',
              startDate: '',
              endDate: ''
            }
          ],
          certifications: cvDataFromDb.certifications || [
            {
              id: 1,
              name: '',
              issuer: '',
              date: '',
              url: ''
            }
          ],
          selectedTemplate: cvDataFromDb.selectedTemplate || 'modern',
          isComplete: cvDataFromDb.isComplete || false,
          lastGenerated: cvDataFromDb.lastGenerated || null
        };

        setCvData(newCvData);
        setSelectedTemplate(newCvData.selectedTemplate);
        console.log('CV data loaded successfully');
      } else {
        console.log('No CV data found, using defaults');
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load CV',
        text2: 'Could not load your CV data',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCVData = async () => {
    try {
      setSaving(true);

      const dataToSave = {
        ...cvData,
        selectedTemplate,
        isComplete: isFormComplete()
      };

      console.log('Saving CV data:', dataToSave);

      const response = await candidatesAPI.saveCvData(dataToSave);
      console.log('Save response:', response);

      if (response && response.success) {
        Toast.show({
          type: 'success',
          text1: 'CV Saved!',
          text2: 'Your CV data has been saved successfully',
        });
      } else {
        throw new Error(response?.error?.message || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving CV data:', error);

      let errorMessage = 'Failed to save CV data';
      if (error.response?.error?.message) {
        errorMessage += ': ' + error.response.error.message;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: errorMessage,
      });
    } finally {
      setSaving(false);
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

  const getCompletionPercentage = () => {
    const fields = [
      cvData.firstName,
      cvData.lastName,
      cvData.email,
      cvData.phone,
      cvData.address,
      cvData.professionalSummary,
      cvData.technicalSkills,
      cvData.workExperience?.some(exp => exp.jobTitle && exp.company),
      cvData.education?.some(edu => edu.degree && edu.institution)
    ];

    const completedFields = fields.filter(field => field && field !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const handleInputChange = (field, value) => {
    setCvData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateField = (field, value) => {
    setCvData(prev => ({
      ...prev,
      [field]: value
    }));
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

      // Save CV data first (same as web)
      await saveCVData();

      const response = await candidatesAPI.generateCv(selectedTemplate, cvData);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'CV Generated!',
          text2: 'Your CV has been generated successfully',
        });

        // Update last generated timestamp
        setCvData(prev => ({
          ...prev,
          lastGenerated: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error generating CV:', error);
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'Failed to generate CV',
      });
    } finally {
      setGenerating(false);
    }
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading CV builder...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* CV Preview Section (Real-time like web) */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>CV Preview</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Live preview of your CV with the selected template
            </Text>

            {/* Real CV Preview using Native Components */}
            <View style={styles.cvPreviewContainer}>
              <NativeCVPreview
                cvData={cvData}
                template={selectedTemplate}
                style={styles.nativePreview}
              />

              {/* Template Info */}
              <View style={styles.cvFooter}>
                <Text style={styles.cvTemplateInfo}>
                  Template: {selectedTemplate} • Complete: {isFormComplete() ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>

            <Button
              mode="outlined"
              onPress={() => setPreviewVisible(true)}
              icon="eye"
              style={styles.fullPreviewButton}
            >
              View Full Preview
            </Button>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputRow}>
              <TextInput
                label="First Name"
                value={cvData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Last Name"
                value={cvData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              label="Email"
              value={cvData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              style={styles.input}
            />

            <TextInput
              label="Phone"
              value={cvData.phone}
              onChangeText={(text) => updateField('phone', text)}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              label="Address"
              value={cvData.address}
              onChangeText={(text) => updateField('address', text)}
              style={styles.input}
            />

            <View style={styles.inputRow}>
              <TextInput
                label="City"
                value={cvData.city}
                onChangeText={(text) => updateField('city', text)}
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Country"
                value={cvData.country}
                onChangeText={(text) => updateField('country', text)}
                style={[styles.input, styles.halfInput]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Professional Links */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Professional Links</Text>
            
            <TextInput
              label="LinkedIn URL"
              value={cvData.linkedinUrl}
              onChangeText={(text) => updateField('linkedinUrl', text)}
              keyboardType="url"
              style={styles.input}
              left={<TextInput.Icon icon="linkedin" />}
            />

            <TextInput
              label="GitHub URL"
              value={cvData.githubUrl}
              onChangeText={(text) => updateField('githubUrl', text)}
              keyboardType="url"
              style={styles.input}
              left={<TextInput.Icon icon="github" />}
            />

            <TextInput
              label="Portfolio URL"
              value={cvData.portfolioUrl}
              onChangeText={(text) => updateField('portfolioUrl', text)}
              keyboardType="url"
              style={styles.input}
              left={<TextInput.Icon icon="web" />}
            />
          </Card.Content>
        </Card>

        {/* Professional Summary */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <TextInput
              mode="outlined"
              label="Tell us about yourself"
              value={cvData.professionalSummary}
              onChangeText={(text) => handleInputChange('professionalSummary', text)}
              multiline
              numberOfLines={4}
              style={styles.textInput}
            />
          </Card.Content>
        </Card>

        {/* Skills (same structure as web) */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Add your technical and soft skills
            </Text>

            {/* Technical Skills */}
            <TextInput
              mode="outlined"
              label="Technical Skills"
              value={cvData.technicalSkills}
              onChangeText={(value) => handleInputChange('technicalSkills', value)}
              placeholder="JavaScript, React, Node.js, Python..."
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />

            {/* Soft Skills */}
            <TextInput
              mode="outlined"
              label="Soft Skills"
              value={cvData.softSkills}
              onChangeText={(value) => handleInputChange('softSkills', value)}
              placeholder="Communication, Leadership, Problem Solving..."
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />

            {/* Languages */}
            <TextInput
              mode="outlined"
              label="Languages"
              value={cvData.languages}
              onChangeText={(value) => handleInputChange('languages', value)}
              placeholder="English (Native), French (Intermediate)..."
              multiline
              numberOfLines={2}
              style={styles.textInput}
            />
          </Card.Content>
        </Card>

        {/* Work Experience */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Work Experience</Text>
              <Button
                mode="contained"
                onPress={() => addArrayItem('workExperience', {
                  id: Date.now(),
                  jobTitle: '',
                  company: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  current: false,
                  description: ''
                })}
                style={styles.addButton}
                icon="plus"
                compact
              >
                Add Experience
              </Button>
            </View>
            <Text style={styles.sectionDescription}>
              Add your work experience and achievements
            </Text>

            {cvData.workExperience.map((exp, index) => (
              <View key={exp.id} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>Experience {index + 1}</Text>
                  {cvData.workExperience.length > 1 && (
                    <Button
                      mode="text"
                      onPress={() => removeArrayItem('workExperience', index)}
                      icon="delete"
                      textColor={colors.error}
                      compact
                    >
                      Remove
                    </Button>
                  )}
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    mode="outlined"
                    label="Job Title *"
                    value={exp.jobTitle}
                    onChangeText={(value) => handleArrayItemChange('workExperience', index, 'jobTitle', value)}
                    placeholder="e.g., Senior Software Developer"
                    style={[styles.textInput, styles.halfWidth]}
                  />
                  <TextInput
                    mode="outlined"
                    label="Company *"
                    value={exp.company}
                    onChangeText={(value) => handleArrayItemChange('workExperience', index, 'company', value)}
                    placeholder="e.g., TechCorp Solutions"
                    style={[styles.textInput, styles.halfWidth]}
                  />
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    mode="outlined"
                    label="Location"
                    value={exp.location}
                    onChangeText={(value) => handleArrayItemChange('workExperience', index, 'location', value)}
                    placeholder="e.g., Paris, France"
                    style={[styles.textInput, styles.halfWidth]}
                  />
                  <TextInput
                    mode="outlined"
                    label="Start Date"
                    value={exp.startDate}
                    onChangeText={(value) => handleArrayItemChange('workExperience', index, 'startDate', value)}
                    placeholder="MM/YYYY"
                    style={[styles.textInput, styles.halfWidth]}
                  />
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    mode="outlined"
                    label="End Date"
                    value={exp.endDate}
                    onChangeText={(value) => handleArrayItemChange('workExperience', index, 'endDate', value)}
                    placeholder="MM/YYYY"
                    disabled={exp.current}
                    style={[styles.textInput, styles.halfWidth]}
                  />
                  <View style={styles.checkboxContainer}>
                    <Text style={styles.checkboxLabel}>Currently working here</Text>
                    <Button
                      mode={exp.current ? 'contained' : 'outlined'}
                      onPress={() => handleArrayItemChange('workExperience', index, 'current', !exp.current)}
                      compact
                    >
                      {exp.current ? 'Yes' : 'No'}
                    </Button>
                  </View>
                </View>

                <TextInput
                  mode="outlined"
                  label="Job Description"
                  value={exp.description}
                  onChangeText={(value) => handleArrayItemChange('workExperience', index, 'description', value)}
                  placeholder="Describe your responsibilities, achievements, and key contributions..."
                  multiline
                  numberOfLines={4}
                  style={styles.textInput}
                />
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Education */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="school-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Education</Text>
              <Button
                mode="contained"
                onPress={() => addArrayItem('education', {
                  id: Date.now(),
                  degree: '',
                  institution: '',
                  location: '',
                  graduationDate: '',
                  gpa: '',
                  description: ''
                })}
                style={styles.addButton}
                icon="plus"
                compact
              >
                Add Education
              </Button>
            </View>
            <Text style={styles.sectionDescription}>
              Add your educational background
            </Text>

            {cvData.education.map((edu, index) => (
              <View key={edu.id} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>Education {index + 1}</Text>
                  {cvData.education.length > 1 && (
                    <Button
                      mode="text"
                      onPress={() => removeArrayItem('education', index)}
                      icon="delete"
                      textColor={colors.error}
                      compact
                    >
                      Remove
                    </Button>
                  )}
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    mode="outlined"
                    label="Degree *"
                    value={edu.degree}
                    onChangeText={(value) => handleArrayItemChange('education', index, 'degree', value)}
                    placeholder="e.g., Master of Computer Science"
                    style={[styles.textInput, styles.halfWidth]}
                  />
                  <TextInput
                    mode="outlined"
                    label="Institution *"
                    value={edu.institution}
                    onChangeText={(value) => handleArrayItemChange('education', index, 'institution', value)}
                    placeholder="e.g., University of Technology"
                    style={[styles.textInput, styles.halfWidth]}
                  />
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    mode="outlined"
                    label="Location"
                    value={edu.location}
                    onChangeText={(value) => handleArrayItemChange('education', index, 'location', value)}
                    placeholder="e.g., Paris, France"
                    style={[styles.textInput, styles.halfWidth]}
                  />
                  <TextInput
                    mode="outlined"
                    label="Graduation Date"
                    value={edu.graduationDate}
                    onChangeText={(value) => handleArrayItemChange('education', index, 'graduationDate', value)}
                    placeholder="MM/YYYY"
                    style={[styles.textInput, styles.halfWidth]}
                  />
                </View>

                <TextInput
                  mode="outlined"
                  label="GPA (Optional)"
                  value={edu.gpa}
                  onChangeText={(value) => handleArrayItemChange('education', index, 'gpa', value)}
                  placeholder="e.g., 3.8/4.0"
                  style={styles.textInput}
                />

                <TextInput
                  mode="outlined"
                  label="Description (Optional)"
                  value={edu.description}
                  onChangeText={(value) => handleArrayItemChange('education', index, 'description', value)}
                  placeholder="Relevant coursework, achievements, honors..."
                  multiline
                  numberOfLines={3}
                  style={styles.textInput}
                />
              </View>
            ))}
          </Card.Content>
        </Card>



        {/* CV Completion Progress */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>CV Completion</Text>
              <Text style={[styles.progressStatus, {
                color: isFormComplete() ? colors.success : '#f59e0b'
              }]}>
                {isFormComplete() ? 'Complete' : 'Incomplete'}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, {
                width: `${getCompletionPercentage()}%`,
                backgroundColor: isFormComplete() ? colors.success : '#f59e0b'
              }]} />
            </View>
            <Text style={styles.progressText}>
              {getCompletionPercentage()}% complete
            </Text>
          </Card.Content>
        </Card>

        {/* Template Selection */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Choose Template</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Select a professional template for your CV
            </Text>

            {/* Template Options with Previews */}
            <View style={styles.templateGrid}>
              {/* Modern Template */}
              <View style={[styles.templateCard, selectedTemplate === 'modern' && styles.selectedTemplate]}>
                <View style={styles.templatePreview}>
                  <View style={styles.modernPreview}>
                    <View style={styles.modernSidebar} />
                    <View style={styles.modernContent}>
                      <View style={styles.previewLine} />
                      <View style={[styles.previewLine, { width: '60%' }]} />
                      <View style={[styles.previewLine, { width: '80%' }]} />
                    </View>
                  </View>
                </View>
                <Button
                  mode={selectedTemplate === 'modern' ? 'contained' : 'outlined'}
                  onPress={() => setSelectedTemplate('modern')}
                  style={styles.templateSelectButton}
                >
                  Modern Professional
                </Button>
                <Text style={styles.templateDescription}>
                  Clean, modern design with accent colors
                </Text>
              </View>

              {/* Classic Template */}
              <View style={[styles.templateCard, selectedTemplate === 'classic' && styles.selectedTemplate]}>
                <View style={styles.templatePreview}>
                  <View style={styles.classicPreview}>
                    <View style={styles.classicHeader} />
                    <View style={styles.previewLine} />
                    <View style={[styles.previewLine, { width: '70%' }]} />
                    <View style={[styles.previewLine, { width: '90%' }]} />
                  </View>
                </View>
                <Button
                  mode={selectedTemplate === 'classic' ? 'contained' : 'outlined'}
                  onPress={() => setSelectedTemplate('classic')}
                  style={styles.templateSelectButton}
                >
                  Classic Traditional
                </Button>
                <Text style={styles.templateDescription}>
                  Traditional format preferred by conservative industries
                </Text>
              </View>

              {/* Creative Template */}
              <View style={[styles.templateCard, selectedTemplate === 'creative' && styles.selectedTemplate]}>
                <View style={styles.templatePreview}>
                  <View style={styles.creativePreview}>
                    <View style={styles.creativeHeader} />
                    <View style={styles.previewLine} />
                    <View style={[styles.previewLine, { width: '65%' }]} />
                    <View style={[styles.previewLine, { width: '85%' }]} />
                  </View>
                </View>
                <Button
                  mode={selectedTemplate === 'creative' ? 'contained' : 'outlined'}
                  onPress={() => setSelectedTemplate('creative')}
                  style={styles.templateSelectButton}
                >
                  Creative Designer
                </Button>
                <Text style={styles.templateDescription}>
                  Eye-catching design for creative professionals
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons (same as web) */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.actionButtonsGrid}>
              {/* Save CV Data */}
              <Button
                mode="contained"
                onPress={saveCVData}
                loading={saving}
                disabled={saving}
                style={[styles.actionButton, { backgroundColor: '#16a34a' }]}
                icon="check"
              >
                Save CV Data
              </Button>

              {/* Preview CV */}
              <Button
                mode="contained"
                onPress={() => setPreviewVisible(true)}
                style={[styles.actionButton, { backgroundColor: '#2563eb' }]}
                icon="eye"
              >
                Preview CV
              </Button>

              {/* Download PDF */}
              <Button
                mode="outlined"
                onPress={generateCV}
                loading={generating}
                disabled={generating || !isFormComplete()}
                style={styles.actionButton}
                icon="download"
              >
                Download PDF
              </Button>

              {/* AI Improvements */}
              <Button
                mode="contained"
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'AI Improvements',
                    text2: 'Coming soon! AI will help improve your CV content.',
                  });
                }}
                style={[styles.actionButton, styles.aiButton]}
                icon="sparkles"
              >
                AI Improvements
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Full CV Preview Modal */}
      <Portal>
        <Modal
          visible={previewVisible}
          onDismiss={() => setPreviewVisible(false)}
          contentContainerStyle={styles.fullPreviewModal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>CV Preview - {selectedTemplate} Template</Text>
            <Button mode="text" onPress={() => setPreviewVisible(false)} icon="close">
              Close
            </Button>
          </View>

          <View style={styles.fullPreviewContent}>
            {/* Full CV Preview using Native Component */}
            <NativeCVPreview
              cvData={cvData}
              template={selectedTemplate}
              style={styles.fullNativePreview}
            />
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionCard: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  uploadButton: {
    borderColor: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    backgroundColor: colors.surface,
    minHeight: 100,
  },
  skillInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skillInput: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  addSkillButton: {
    backgroundColor: colors.primary,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skillChip: {
    backgroundColor: colors.primary + '20',
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionButtons: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  previewButton: {
    borderColor: colors.primary,
  },
  templateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  templateButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  previewContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  previewSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.lg + spacing.sm,
  },
  cvPreviewContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 320, // Fixed height for preview
  },
  nativePreview: {
    height: 270,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cvFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: spacing.xs,
    marginTop: spacing.sm,
  },
  cvTemplateInfo: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fullPreviewButton: {
    marginTop: spacing.sm,
  },
  fullPreviewModal: {
    backgroundColor: 'white',
    margin: spacing.md,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  fullPreviewContent: {
    flex: 1,
    padding: spacing.md,
  },
  fullNativePreview: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  addButton: {
    marginLeft: 'auto',
  },
  experienceCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  checkboxContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  checkboxLabel: {
    fontSize: 12,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  templateGrid: {
    marginTop: spacing.md,
  },
  templateCard: {
    borderWidth: 2,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  selectedTemplate: {
    borderColor: colors.primary,
    backgroundColor: '#f0f9ff',
  },
  templatePreview: {
    height: 80,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  modernPreview: {
    flexDirection: 'row',
    height: '100%',
  },
  modernSidebar: {
    width: '30%',
    backgroundColor: '#667eea',
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  modernContent: {
    flex: 1,
    justifyContent: 'space-around',
  },
  classicPreview: {
    height: '100%',
    justifyContent: 'space-around',
  },
  classicHeader: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  creativePreview: {
    height: '100%',
    justifyContent: 'space-around',
  },
  creativeHeader: {
    height: 8,
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  previewLine: {
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginBottom: 2,
  },
  templateSelectButton: {
    marginBottom: spacing.xs,
  },
  templateDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionButtonsGrid: {
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  aiButton: {
    backgroundColor: '#8b5cf6',
  },
});

export default CVBuilderScreen;
