import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';

const JobFormScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const editingJob = route?.params?.job;
  const isEditing = !!editingJob;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    salaryMin: '',
    salaryMax: '',
    currency: 'EUR',
    remoteAllowed: false,
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Convert database format to API format
  const convertDbToApiFormat = (dbValue) => {
    const conversionMap = {
      'full_time': 'full-time',
      'part_time': 'part-time',
      'contract': 'contract',
      'internship': 'internship',
      'freelance': 'freelance'
    };
    return conversionMap[dbValue] || dbValue;
  };

  const convertDbExperienceLevel = (dbValue) => {
    // Database and API use the same format for experience levels
    return dbValue;
  };

  useEffect(() => {
    if (isEditing && editingJob) {
      console.log('📝 Mobile - Editing job data:', editingJob); // Debug log

      // Get employment type from database format and convert to API format
      const dbEmploymentType = editingJob.employment_type || editingJob.employmentType || 'full-time';
      const apiEmploymentType = convertDbToApiFormat(dbEmploymentType);

      console.log('🔄 Mobile - Converting employment type:', dbEmploymentType, '→', apiEmploymentType); // Debug log

      // Populate form with existing job data
      setFormData({
        title: editingJob.title || '',
        description: editingJob.description || '',
        requirements: editingJob.requirements || '',
        responsibilities: editingJob.responsibilities || '',
        location: editingJob.location || '',
        employmentType: apiEmploymentType,
        experienceLevel: convertDbExperienceLevel(editingJob.experience_level || editingJob.experienceLevel || 'mid'),
        salaryMin: editingJob.salary_min?.toString() || '',
        salaryMax: editingJob.salary_max?.toString() || '',
        currency: editingJob.currency || 'EUR',
        remoteAllowed: editingJob.remote_allowed || editingJob.remoteAllowed || false,
        isActive: editingJob.is_active !== undefined ? editingJob.is_active : editingJob.isActive !== undefined ? editingJob.isActive : true
      });
    }
  }, [isEditing, editingJob]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.salaryMin && formData.salaryMax) {
      const min = parseInt(formData.salaryMin);
      const max = parseInt(formData.salaryMax);
      if (min >= max) {
        newErrors.salaryMax = 'Maximum salary must be greater than minimum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors and try again',
      });
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Mobile - Saving job:', formData); // Debug log

      // Prepare API data (same format as web version)
      const apiData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        responsibilities: formData.responsibilities || '',
        location: formData.location,
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        currency: formData.currency,
        remoteAllowed: formData.remoteAllowed || formData.location.toLowerCase().includes('remote'),
        isActive: formData.isActive
      };

      console.log('📤 Mobile - Sending API Data:', apiData); // Debug log
      console.log('📤 Mobile - Employment Type being sent:', apiData.employmentType); // Debug log

      if (isEditing) {
        // Update existing job
        await api.put(`/jobs/${editingJob.id}`, apiData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Job updated successfully',
        });
      } else {
        // Create new job
        await api.post('/jobs', apiData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Job created successfully',
        });
      }

      // Navigate back to job management (this will trigger useFocusEffect refresh)
      navigation.goBack();
    } catch (error) {
      console.error('❌ Mobile - Error saving job:', error);
      console.error('❌ Mobile - Error details:', error.response?.data); // Debug log

      // Handle validation errors
      if (error.response?.data?.error?.code === 'VALIDATION_ERROR') {
        const validationErrors = error.response.data.error.details || [];
        const errorMessage = validationErrors.map(err => `${err.path}: ${err.msg}`).join('\n');
        Toast.show({
          type: 'error',
          text1: 'Validation Failed',
          text2: errorMessage,
        });
      } else {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Unknown error';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: `${isEditing ? 'Failed to update job' : 'Failed to create job'}: ${errorMessage}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  const employmentTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' }
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'junior', label: 'Junior Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'lead', label: 'Lead/Principal' },
    { value: 'executive', label: 'Executive' }
  ];

  const currencies = ['EUR', 'USD', 'GBP', 'CAD'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={handleCancel}
          icon="arrow-left"
          style={styles.backButton}
          labelStyle={styles.backButtonText}
        >
          Cancel
        </Button>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Job' : 'Create Job'}
        </Text>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <TextInput
              label="Job Title *"
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.title}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

            <TextInput
              label="Location *"
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.location}
              placeholder="e.g., Paris, France or Remote"
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

            <TextInput
              label="Job Description *"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              error={!!errors.description}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

            <TextInput
              label="Requirements"
              value={formData.requirements}
              onChangeText={(value) => handleInputChange('requirements', value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              label="Responsibilities"
              value={formData.responsibilities}
              onChangeText={(value) => handleInputChange('responsibilities', value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Employment Details */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Employment Details</Text>
            
            <Text style={styles.fieldLabel}>Employment Type</Text>
            <View style={styles.chipContainer}>
              {employmentTypes.map((type) => (
                <Chip
                  key={type.value}
                  selected={formData.employmentType === type.value}
                  onPress={() => handleInputChange('employmentType', type.value)}
                  style={styles.chip}
                >
                  {type.label}
                </Chip>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Experience Level</Text>
            <View style={styles.chipContainer}>
              {experienceLevels.map((level) => (
                <Chip
                  key={level.value}
                  selected={formData.experienceLevel === level.value}
                  onPress={() => handleInputChange('experienceLevel', level.value)}
                  style={styles.chip}
                >
                  {level.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Salary Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Salary Information</Text>
            
            <View style={styles.salaryRow}>
              <TextInput
                label="Min Salary (k)"
                value={formData.salaryMin}
                onChangeText={(value) => handleInputChange('salaryMin', value)}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, styles.salaryInput]}
                placeholder="e.g., 50"
              />
              
              <TextInput
                label="Max Salary (k)"
                value={formData.salaryMax}
                onChangeText={(value) => handleInputChange('salaryMax', value)}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, styles.salaryInput]}
                placeholder="e.g., 80"
                error={!!errors.salaryMax}
              />
            </View>
            {errors.salaryMax && <Text style={styles.errorText}>{errors.salaryMax}</Text>}

            <Text style={styles.fieldLabel}>Currency</Text>
            <View style={styles.chipContainer}>
              {currencies.map((currency) => (
                <Chip
                  key={currency}
                  selected={formData.currency === currency}
                  onPress={() => handleInputChange('currency', currency)}
                  style={styles.chip}
                >
                  {currency}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Status */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Job Status</Text>
            
            <View style={styles.chipContainer}>
              <Chip
                selected={formData.isActive}
                onPress={() => handleInputChange('isActive', true)}
                style={styles.chip}
              >
                Active
              </Chip>
              <Chip
                selected={!formData.isActive}
                onPress={() => handleInputChange('isActive', false)}
                style={styles.chip}
              >
                Inactive
              </Chip>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  salaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  salaryInput: {
    flex: 1,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});

export default JobFormScreen;
