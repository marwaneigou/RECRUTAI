import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Chip, FAB, ActivityIndicator, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, shadows } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';

const JobManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    fetchJobs(statusFilter);
  }, [statusFilter]);

  // Auto-refresh when screen comes into focus (after returning from job form)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Mobile - JobManagement screen focused, refreshing data...'); // Debug log
      fetchJobs(statusFilter);
    }, [statusFilter])
  );

  const fetchJobs = async (filterStatus = 'all') => {
    try {
      setLoading(true);
      console.log('🤖 Mobile - Fetching employer jobs with status:', filterStatus); // Debug log

      // Fetch jobs for current employer with status filter
      const response = await api.get(`/jobs/my-jobs?status=${filterStatus}`);
      console.log('📋 Mobile - My Jobs API response:', response); // Debug log

      // Handle the nested response structure: response.data.data.jobs
      const allJobs = response.data?.data?.jobs || response.data?.jobs || [];
      console.log('📋 Mobile - All jobs:', allJobs); // Debug log

      // Format jobs to match mobile UI expectations (same as web)
      const formattedJobs = allJobs.map(job => ({
        id: job.id,
        title: job.title,
        department: job.employer?.industry || 'General',
        location: job.location,
        type: job.employmentType || 'full-time',
        salary: formatSalary(job.salaryMin, job.salaryMax, job.currency),
        status: job.isActive ? 'Active' : 'Inactive',
        applications: job.applicationCount || 0,
        postedDate: new Date(job.createdAt).toISOString().split('T')[0],
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        employment_type: job.employmentType,
        experience_level: job.experienceLevel,
        salary_min: job.salaryMin,
        salary_max: job.salaryMax,
        currency: job.currency,
        remote_allowed: job.remoteAllowed,
        is_active: job.isActive,
        employer: job.employer,
        // Mobile-specific fields
        employmentType: job.employmentType || 'full-time',
        applicationsCount: job.applicationCount || 0,
        createdAt: job.createdAt
      }));

      console.log('✅ Mobile - Formatted jobs:', formattedJobs); // Debug log
      setJobs(formattedJobs);
    } catch (error) {
      console.error('❌ Mobile - Error fetching jobs:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load jobs',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min, max, currency = 'EUR') => {
    if (min && max) {
      return `${min}k - ${max}k ${currency}`;
    } else if (min) {
      return `${min}k+ ${currency}`;
    } else if (max) {
      return `Up to ${max}k ${currency}`;
    }
    return 'Salary not specified';
  };

  const formatEmploymentType = (employmentType) => {
    // Convert API format to display format
    switch (employmentType) {
      case 'full-time': return 'Full Time';
      case 'part-time': return 'Part Time';
      case 'contract': return 'Contract';
      case 'internship': return 'Internship';
      case 'freelance': return 'Freelance';
      default: return employmentType || 'Full Time';
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs(statusFilter);
    setRefreshing(false);
  };

  const handleCreateJob = () => {
    console.log('🚀 Mobile - Creating new job'); // Debug log
    navigation.navigate('JobForm');
  };

  const handleEditJob = (job) => {
    console.log('✏️ Mobile - Editing job:', job.id); // Debug log
    navigation.navigate('JobForm', { job });
  };

  const handleDeleteJob = async (jobId) => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Mobile - Deleting job:', jobId); // Debug log
              await api.delete(`/jobs/${jobId}`);

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Job deleted successfully',
              });

              // Refresh the jobs list
              fetchJobs(statusFilter);
            } catch (error) {
              console.error('❌ Mobile - Error deleting job:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete job',
              });
            }
          }
        }
      ]
    );
  };

  const handleViewApplications = (jobId, jobTitle) => {
    console.log('👀 Mobile - Viewing applications for job:', jobId, jobTitle); // Debug log

    // Navigate to CandidatesScreen with jobId filter (same as web version logic)
    navigation.navigate('Candidates', {
      jobId: jobId,
      jobTitle: jobTitle || 'Job Applications'
    });

    Toast.show({
      type: 'info',
      text1: 'Loading Applications',
      text2: `Showing applications for ${jobTitle || 'this job'}`,
    });
  };

  // Convert database format to API format for employment type
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

  const toggleJobStatus = async (job) => {
    try {
      console.log('🔄 Mobile - Toggling job status:', job.id, !job.is_active); // Debug log
      console.log('🔄 Mobile - Current job data:', job); // Debug log

      // Only send the necessary fields with proper format conversion
      const updateData = {
        title: job.title,
        description: job.description,
        requirements: job.requirements || '',
        responsibilities: job.responsibilities || '',
        location: job.location,
        employmentType: convertDbToApiFormat(job.employment_type || job.employmentType),
        experienceLevel: job.experience_level || job.experienceLevel,
        salaryMin: job.salary_min ? parseInt(job.salary_min) : null,
        salaryMax: job.salary_max ? parseInt(job.salary_max) : null,
        currency: job.currency || 'EUR',
        remoteAllowed: job.remote_allowed || job.remoteAllowed || false,
        isActive: !job.is_active // Toggle the status
      };

      console.log('📤 Mobile - Sending update data:', updateData); // Debug log
      console.log('📤 Mobile - Employment type being sent:', updateData.employmentType); // Debug log

      await api.put(`/jobs/${job.id}`, updateData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Job ${updateData.isActive ? 'activated' : 'deactivated'} successfully`,
      });

      // Refresh the jobs list
      fetchJobs(statusFilter);
    } catch (error) {
      console.error('❌ Mobile - Error updating job status:', error);
      console.error('❌ Mobile - Error details:', error.response?.data); // Debug log
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update job status',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return colors.success;
      case 'inactive': return colors.error;
      case 'paused': return colors.warning;
      case 'closed': return colors.error;
      case 'draft': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const toggleMenu = (jobId) => {
    setMenuVisible(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  // Jobs are already filtered by the backend based on statusFilter

  const renderJobItem = ({ item: job }) => (
    <Card style={styles.jobCard}>
      <Card.Content>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobDepartment}>{job.department}</Text>
            <View style={styles.jobMeta}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.jobLocation}>{job.location}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.jobType}>{formatEmploymentType(job.employmentType)}</Text>
            </View>
            <View style={styles.jobSalary}>
              <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.salaryText}>{job.salary}</Text>
            </View>
          </View>

          <View style={styles.jobHeaderRight}>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(job.status) + '20' }
              ]}
              textStyle={{ color: getStatusColor(job.status) }}
            >
              {job.status}
            </Chip>

            <Menu
              visible={menuVisible[job.id] || false}
              onDismiss={() => toggleMenu(job.id)}
              anchor={
                <Button
                  mode="text"
                  compact
                  onPress={() => toggleMenu(job.id)}
                  icon="dots-vertical"
                  style={styles.menuButton}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  toggleMenu(job.id);
                  handleEditJob(job);
                }}
                title="Edit Job"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(job.id);
                  handleViewApplications(job.id, job.title);
                }}
                title="View Applications"
                leadingIcon="account-group"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(job.id);
                  toggleJobStatus(job);
                }}
                title={job.is_active ? 'Deactivate' : 'Activate'}
                leadingIcon={job.is_active ? 'pause' : 'play'}
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  toggleMenu(job.id);
                  handleDeleteJob(job.id);
                }}
                title="Delete Job"
                leadingIcon="delete"
                titleStyle={{ color: colors.error }}
              />
            </Menu>
          </View>
        </View>

        <View style={styles.jobStats}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>{job.applications} applications</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.jobActions}>
          <Button
            mode="contained"
            compact
            onPress={() => handleEditJob(job)}
            style={styles.primaryButton}
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => handleViewApplications(job.id, job.title)}
            style={styles.secondaryButton}
          >
            Applications ({job.applications})
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => {
    const getEmptyStateContent = () => {
      switch (statusFilter) {
        case 'active':
          return {
            title: 'No Active Jobs',
            text: 'You don\'t have any active job postings at the moment',
            showButton: jobs.length === 0
          };
        case 'inactive':
          return {
            title: 'No Inactive Jobs',
            text: 'You don\'t have any inactive job postings',
            showButton: false
          };
        default:
          return {
            title: 'No Jobs Posted',
            text: 'Start by posting your first job to attract candidates',
            showButton: true
          };
      }
    };

    const content = getEmptyStateContent();

    return (
      <View style={styles.emptyState}>
        <Ionicons name="briefcase-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyStateTitle}>{content.title}</Text>
        <Text style={styles.emptyStateText}>{content.text}</Text>
        {content.showButton && (
          <Button
            mode="contained"
            onPress={handleCreateJob}
            style={styles.emptyStateButton}
          >
            Post Your First Job
          </Button>
        )}
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading jobs...</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Management</Text>
        <Text style={styles.headerSubtitle}>
          {jobs.length} job{jobs.length !== 1 ? 's' : ''} {statusFilter === 'all' ? 'total' : statusFilter}
        </Text>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <View style={styles.filterChips}>
          {[
            { value: 'all', label: 'All Jobs' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ].map((filter) => (
            <Chip
              key={filter.value}
              selected={statusFilter === filter.value}
              onPress={() => setStatusFilter(filter.value)}
              style={[
                styles.filterChip,
                statusFilter === filter.value && styles.selectedFilterChip
              ]}
              textStyle={[
                styles.filterChipText,
                statusFilter === filter.value && styles.selectedFilterChipText
              ]}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.jobsList,
          jobs.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateJob}
        label="Post Job"
      />
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  selectedFilterChipText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  jobsList: {
    padding: spacing.md,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  jobCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  jobInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  jobHeaderRight: {
    alignItems: 'flex-end',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  jobDepartment: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  jobSalary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  salaryText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  separator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  jobType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  menuButton: {
    margin: 0,
    padding: 0,
  },
  jobStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    flex: 1,
    borderColor: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default JobManagementScreen;
