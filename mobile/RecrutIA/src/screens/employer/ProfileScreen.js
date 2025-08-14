import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, shadows } from '../../theme/theme';
import api from '../../services/api';
import Toast from 'react-native-toast-message';

const EmployerProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    description: '',
    address: '',
    city: '',
    country: '',
    foundedYear: '',
    logoUrl: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('🤖 Mobile - Fetching employer profile...'); // Debug log

      const response = await api.get('/employers/profile');
      console.log('📋 Mobile - Profile API response:', response); // Debug log

      const employerData = response.data?.employer || response.data;
      setProfile(employerData);
      setFormData({
        companyName: employerData.companyName || '',
        industry: employerData.industry || '',
        companySize: employerData.companySize || '',
        website: employerData.website || '',
        description: employerData.description || '',
        address: employerData.address || '',
        city: employerData.city || '',
        country: employerData.country || '',
        foundedYear: employerData.foundedYear?.toString() || '',
        logoUrl: employerData.logoUrl || ''
      });
    } catch (error) {
      console.error('❌ Mobile - Error fetching profile:', error);
      if (error.response?.status === 404) {
        Toast.show({
          type: 'error',
          text1: 'Profile Not Found',
          text2: 'Employer profile not found. Please contact support.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.error?.message || 'Failed to load profile',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'foundedYear' ? (value ? parseInt(value) : '') : value
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

    // Required fields
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    // Optional fields - only validate if they have values
    if (formData.website && formData.website.trim() && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Please enter a valid URL (starting with http:// or https://)';
    }

    if (formData.foundedYear && formData.foundedYear.trim()) {
      const year = parseInt(formData.foundedYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        newErrors.foundedYear = `Founded year must be between 1800 and ${currentYear}`;
      }
    }

    if (formData.logoUrl && formData.logoUrl.trim() && !formData.logoUrl.match(/^https?:\/\/.+/)) {
      newErrors.logoUrl = 'Please enter a valid URL (starting with http:// or https://)';
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
      setSaving(true);
      console.log('💾 Mobile - Saving profile:', formData); // Debug log

      // Prepare data for API - only include non-empty optional fields
      const apiData = {
        companyName: formData.companyName,
        industry: formData.industry || undefined,
        companySize: formData.companySize || undefined,
        website: formData.website || undefined,
        description: formData.description || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        logoUrl: formData.logoUrl || undefined
      };

      // Remove undefined values to avoid sending empty strings
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === undefined || apiData[key] === '') {
          delete apiData[key];
        }
      });

      console.log('📤 Mobile - Sending API data:', apiData); // Debug log

      const response = await api.put('/employers/profile', apiData);
      console.log('✅ Mobile - Profile saved:', response); // Debug log

      const updatedProfile = response.data?.employer || response.data;
      setProfile(updatedProfile);
      setEditing(false);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully!',
      });
    } catch (error) {
      console.error('❌ Mobile - Error saving profile:', error);

      // Handle validation errors
      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        const newErrors = {};
        details.forEach(detail => {
          newErrors[detail.path] = detail.msg;
        });
        setErrors(newErrors);

        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please fix the errors and try again',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.error?.message || 'Failed to update profile',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || '',
        industry: profile.industry || '',
        companySize: profile.companySize || '',
        website: profile.website || '',
        description: profile.description || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
        foundedYear: profile.foundedYear?.toString() || '',
        logoUrl: profile.logoUrl || ''
      });
    }
    setErrors({});
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const companySizeOptions = [
    { value: '', label: 'Select company size' },
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '50-200', label: '50-200 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="business" size={32} color={colors.primary} />
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>Company Profile</Text>
                  <Text style={styles.headerSubtitle}>
                    {profile?.companyName || 'Update your company information'}
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                {!editing ? (
                  <Button
                    mode="contained"
                    onPress={() => setEditing(true)}
                    icon="pencil"
                    style={styles.editButton}
                  >
                    Edit
                  </Button>
                ) : (
                  <View style={styles.editActions}>
                    <Button
                      mode="outlined"
                      onPress={handleCancel}
                      style={styles.cancelButton}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSave}
                      loading={saving}
                      disabled={saving}
                      style={styles.saveButton}
                    >
                      Save
                    </Button>
                  </View>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Basic Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <TextInput
              label="Company Name *"
              value={formData.companyName}
              onChangeText={(value) => handleInputChange('companyName', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.companyName}
              editable={editing}
              right={editing ? null : <TextInput.Icon icon="lock" />}
            />
            {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}

            <TextInput
              label="Industry"
              value={formData.industry}
              onChangeText={(value) => handleInputChange('industry', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.industry}
              editable={editing}
              placeholder="e.g., Technology, Healthcare, Finance"
              right={editing ? null : <TextInput.Icon icon="lock" />}
            />
            {errors.industry && <Text style={styles.errorText}>{errors.industry}</Text>}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Company Size</Text>
              {editing ? (
                <View style={styles.chipContainer}>
                  {companySizeOptions.slice(1).map((option) => (
                    <Chip
                      key={option.value}
                      selected={formData.companySize === option.value}
                      onPress={() => handleInputChange('companySize', option.value)}
                      style={[
                        styles.sizeChip,
                        formData.companySize === option.value && styles.selectedChip
                      ]}
                      textStyle={[
                        styles.chipText,
                        formData.companySize === option.value && styles.selectedChipText
                      ]}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </View>
              ) : (
                <Text style={styles.displayValue}>
                  {formData.companySize || 'Not specified'}
                </Text>
              )}
            </View>

            <TextInput
              label="Website"
              value={formData.website}
              onChangeText={(value) => handleInputChange('website', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.website}
              editable={editing}
              placeholder="https://example.com"
              keyboardType="url"
              autoCapitalize="none"
              right={editing ? null : <TextInput.Icon icon="lock" />}
            />
            {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}

            <TextInput
              label="Founded Year"
              value={formData.foundedYear}
              onChangeText={(value) => handleInputChange('foundedYear', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.foundedYear}
              editable={editing}
              keyboardType="numeric"
              placeholder="e.g., 2020"
              right={editing ? null : <TextInput.Icon icon="lock" />}
            />
            {errors.foundedYear && <Text style={styles.errorText}>{errors.foundedYear}</Text>}
          </Card.Content>
        </Card>

        {/* Location Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Location Information</Text>

            <View style={styles.locationRow}>
              <TextInput
                label="City"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                editable={editing}
                placeholder="e.g., Paris"
                right={editing ? null : <TextInput.Icon icon="lock" />}
              />

              <TextInput
                label="Country"
                value={formData.country}
                onChangeText={(value) => handleInputChange('country', value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                editable={editing}
                placeholder="e.g., France"
                right={editing ? null : <TextInput.Icon icon="lock" />}
              />
            </View>

            <TextInput
              label="Full Address"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              mode="outlined"
              style={styles.input}
              editable={editing}
              placeholder="Street address"
              right={editing ? null : <TextInput.Icon icon="lock" />}
            />
          </Card.Content>
        </Card>

        {/* Company Description */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Company Description</Text>

            <TextInput
              label="About Your Company"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              mode="outlined"
              style={styles.textArea}
              multiline
              numberOfLines={4}
              editable={editing}
              placeholder="Tell us about your company, culture, and what makes you unique..."
              right={editing ? null : <TextInput.Icon icon="lock" />}
            />
          </Card.Content>
        </Card>

        {/* Additional Settings (only when editing) */}
        {editing && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Additional Settings</Text>

              <TextInput
                label="Logo URL"
                value={formData.logoUrl}
                onChangeText={(value) => handleInputChange('logoUrl', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.logoUrl}
                placeholder="https://example.com/logo.png"
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.logoUrl && <Text style={styles.errorText}>{errors.logoUrl}</Text>}
            </Card.Content>
          </Card>
        )}

        {/* Account Actions */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account</Text>

            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
              textColor={colors.error}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>


      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  profileCard: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  editProfileButton: {
    borderColor: colors.primary,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  logoutButton: {
    borderColor: colors.error,
  },

  // New Profile Form Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerCard: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerActions: {
    marginLeft: spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    minWidth: 80,
  },
  cancelButton: {
    minWidth: 80,
  },
  saveButton: {
    minWidth: 80,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  textArea: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 120,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  displayValue: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sizeChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  selectedChipText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
});

export default EmployerProfileScreen;
