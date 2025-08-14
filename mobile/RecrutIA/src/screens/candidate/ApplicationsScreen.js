import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { Card, Button, Chip, ActivityIndicator, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { applicationsAPI } from '../../services/api';
import { colors, spacing, shadows } from '../../theme/theme';
import Toast from 'react-native-toast-message';

const ApplicationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  // Auto-refresh when screen comes into focus (after applying to new jobs)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Mobile - Applications screen focused, refreshing applications...'); // Debug log
      fetchApplications();
    }, [])
  );

  // Check for status changes periodically (mobile version)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchApplications();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getApplications();
      console.log('Mobile Applications API Response:', response);

      // Handle different response structures (same as web)
      const applicationsData = response.data?.applications || response.applications || [];

      // Transform data to match expected format (same as web)
      const transformedApplications = applicationsData.map(app => ({
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle || 'Unknown Position',
        company: app.companyName || 'Unknown Company',
        status: app.status,
        appliedAt: app.appliedDate || app.appliedAt,
        lastUpdated: app.updatedAt || app.appliedDate || app.appliedAt,
        jobLocation: app.location || 'Remote',
        employmentType: app.employmentType || 'Full-time',
        salary: app.salaryRange || 'Competitive',
        matchScore: app.matchScore || 0,
        coverLetter: app.coverLetter,
        cvSnapshot: app.cvSnapshot,
        matchAnalysis: app.matchAnalysis,
        matchStrengths: app.matchStrengths,
        matchGaps: app.matchGaps,
        notes: app.notes,
        rating: app.rating,
        reviewedAt: app.reviewedAt,
        interviewDate: app.interviewDate,
        feedback: app.feedback
      }));

      console.log('Mobile Transformed applications:', transformedApplications);
      setApplications(transformedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Applications',
        text2: 'Please try again later'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      interview: applications.filter(app => app.status === 'interview').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
  };

  const statusCounts = getStatusCounts();

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: '#f59e0b', bgColor: '#fef3c7', icon: 'time-outline', text: 'Pending Review' },
      interview: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'chatbubbles-outline', text: 'Interview Scheduled' },
      accepted: { color: '#10b981', bgColor: '#d1fae5', icon: 'checkmark-circle-outline', text: 'Accepted' },
      rejected: { color: '#ef4444', bgColor: '#fee2e2', icon: 'close-circle-outline', text: 'Not Selected' }
    };
    return configs[status] || configs.pending;
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewJobDetails = (application) => {
    setSelectedApplication(application);
    setShowJobDetails(true);
  };

  const handleViewCV = (application) => {
    // Handle both old and new CV snapshot structures
    const cvSnapshotData = application.cvSnapshot?.cvData || application.cvSnapshot;
    console.log('Mobile - Viewing CV for application:', application.id);
    console.log('Mobile - CV snapshot structure:', application.cvSnapshot);
    console.log('Mobile - CV data to display:', cvSnapshotData);

    setSelectedApplication({
      ...application,
      cvSnapshot: cvSnapshotData
    });
    setShowCVModal(true);
  };

  const handleViewCoverLetter = (application) => {
    // Handle both old and new cover letter structures
    const coverLetterData = application.coverLetter?.content || application.coverLetter;
    console.log('Mobile - Viewing cover letter for application:', application.id);
    console.log('Mobile - Cover letter structure:', application.coverLetter);
    console.log('Mobile - Cover letter content to display:', coverLetterData);

    setSelectedApplication({
      ...application,
      coverLetter: coverLetterData
    });
    setShowCoverLetterModal(true);
  };

  const renderStatusFilters = () => (
    <Card style={styles.filtersCard}>
      <Card.Content>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersContainer}>
            {[
              { key: 'all', label: `All (${statusCounts.all})` },
              { key: 'pending', label: `Pending (${statusCounts.pending})` },
              { key: 'interview', label: `Interviews (${statusCounts.interview})` },
              { key: 'accepted', label: `Accepted (${statusCounts.accepted})` },
              { key: 'rejected', label: `Not Selected (${statusCounts.rejected})` }
            ].map((filterOption) => (
              <Button
                key={filterOption.key}
                mode={filter === filterOption.key ? 'contained' : 'outlined'}
                onPress={() => setFilter(filterOption.key)}
                style={styles.filterButton}
                compact
              >
                {filterOption.label}
              </Button>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );

  const renderApplicationCard = (application) => {
    const statusConfig = getStatusConfig(application.status);
    const matchScoreColor = getMatchScoreColor(application.matchScore);

    return (
      <Card key={application.id} style={styles.applicationCard}>
        <Card.Content>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.jobTitle}>{application.jobTitle}</Text>
              <View style={styles.badgeContainer}>
                <Chip
                  style={[styles.matchChip, { backgroundColor: `${matchScoreColor}20` }]}
                  textStyle={{ color: matchScoreColor, fontSize: 12 }}
                >
                  {application.matchScore}% Match
                </Chip>
                <Chip
                  style={[styles.statusChip, { backgroundColor: statusConfig.bgColor }]}
                  textStyle={{ color: statusConfig.color, fontSize: 12 }}
                  icon={() => <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />}
                >
                  {statusConfig.text}
                </Chip>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleViewJobDetails(application)} style={styles.actionButton}>
                <Ionicons name="eye-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleViewCV(application)} style={styles.actionButton}>
                <Ionicons name="document-text-outline" size={20} color="#10b981" />
              </TouchableOpacity>
              {application.coverLetter && (
                <TouchableOpacity onPress={() => handleViewCoverLetter(application)} style={styles.actionButton}>
                  <Ionicons name="mail-outline" size={20} color="#8b5cf6" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Company and Details */}
          <View style={styles.companyInfo}>
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.companyText}>{application.company}</Text>
            </View>
            <View style={styles.companyRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.companyText}>Applied {formatDate(application.appliedAt)}</Text>
            </View>
            <View style={styles.companyRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.companyText}>{application.jobLocation} • {application.employmentType}</Text>
            </View>
            <Text style={styles.salaryText}>Salary: {application.salary}</Text>
          </View>

          {/* Match Score Display */}
          <View style={styles.matchScoreContainer}>
            <View style={styles.matchScoreHeader}>
              <Text style={styles.matchScoreLabel}>Match Score:</Text>
              <View style={styles.matchScoreRight}>
                <Text style={[styles.matchScoreValue, { color: matchScoreColor }]}>
                  {application.matchScore}%
                </Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${application.matchScore}%`,
                        backgroundColor: matchScoreColor
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
            {application.matchAnalysis && (
              <Text style={styles.matchAnalysis}>{application.matchAnalysis}</Text>
            )}
            {application.matchScore === 0 && (
              <Text style={styles.matchScorePlaceholder}>
                Match score will be calculated after review
              </Text>
            )}
          </View>

          {/* Interview Information */}
          {application.interviewDate && (
            <View style={styles.interviewContainer}>
              <View style={styles.interviewHeader}>
                <Ionicons name="chatbubbles-outline" size={16} color="#3b82f6" />
                <Text style={styles.interviewTitle}>Interview Scheduled</Text>
              </View>
              <Text style={styles.interviewDate}>{formatDate(application.interviewDate)}</Text>
            </View>
          )}

          {/* Feedback */}
          {application.feedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackLabel}>Feedback:</Text>
              <Text style={styles.feedbackText}>{application.feedback}</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.lastUpdated}>
              Last updated: {formatDate(application.lastUpdated)}
            </Text>
            <View style={styles.footerActions}>
              {application.status === 'interview' && (
                <Button mode="text" textColor="#3b82f6" compact>
                  Prepare for Interview →
                </Button>
              )}
              {application.status === 'accepted' && (
                <Button mode="text" textColor="#10b981" compact>
                  View Offer Details →
                </Button>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>
        {filter === 'all' ? 'No Applications Yet' : `No ${filter} Applications`}
      </Text>
      <Text style={styles.emptyStateText}>
        {filter === 'all' 
          ? 'Start applying to jobs to track your applications here'
          : `You don't have any ${filter} applications at the moment`
        }
      </Text>
      {filter === 'all' && (
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Jobs')}
          style={styles.emptyStateButton}
        >
          Browse Jobs
        </Button>
      )}
    </View>
  );

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interviewed', label: 'Interviewed' },
    { value: 'offered', label: 'Offered' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>My Applications</Text>
          </View>
          <Text style={styles.headerSubtitle}>Track the status of your job applications</Text>
        </View>

        {/* Status Filters */}
        {renderStatusFilters()}

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'Start applying to jobs to track your applications here'
                  : `No applications with ${filter} status found`
                }
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.applicationsList}>
            {filteredApplications.map(renderApplicationCard)}
          </View>
        )}
      </ScrollView>

      {/* Stats Summary */}
      {applications.length > 0 && (
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{applications.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {applications.filter(app => app.status === 'pending').length}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {applications.filter(app => ['shortlisted', 'interviewed', 'offered'].includes(app.status)).length}
                  </Text>
                  <Text style={styles.statLabel}>In Progress</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {applications.filter(app => app.status === 'rejected').length}
                  </Text>
                  <Text style={styles.statLabel}>Rejected</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Job Details Modal */}
      <Portal>
        <Modal
          visible={showJobDetails}
          onDismiss={() => setShowJobDetails(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Job Details</Text>
              <TouchableOpacity onPress={() => setShowJobDetails(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedApplication && (
              <View style={styles.modalContent}>
                <Text style={styles.modalJobTitle}>{selectedApplication.jobTitle}</Text>
                <Text style={styles.modalCompany}>{selectedApplication.company}</Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Job Information</Text>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.modalInfoText}>{selectedApplication.jobLocation}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.modalInfoText}>{selectedApplication.employmentType}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.modalInfoText}>{selectedApplication.salary}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Application Status</Text>
                  <View style={styles.statusRow}>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusConfig(selectedApplication.status).bgColor }]}
                      textStyle={{ color: getStatusConfig(selectedApplication.status).color }}
                      icon={() => <Ionicons name={getStatusConfig(selectedApplication.status).icon} size={14} color={getStatusConfig(selectedApplication.status).color} />}
                    >
                      {getStatusConfig(selectedApplication.status).text}
                    </Chip>
                  </View>
                  <Text style={styles.modalInfoText}>Applied: {formatDate(selectedApplication.appliedAt)}</Text>
                  <Text style={styles.modalInfoText}>Last updated: {formatDate(selectedApplication.lastUpdated)}</Text>
                </View>

                {selectedApplication.interviewDate && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Interview Information</Text>
                    <View style={styles.interviewInfo}>
                      <Ionicons name="chatbubbles-outline" size={16} color="#3b82f6" />
                      <Text style={styles.interviewText}>Scheduled for {formatDate(selectedApplication.interviewDate)}</Text>
                    </View>
                  </View>
                )}

                {selectedApplication.feedback && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Employer Feedback</Text>
                    <Text style={styles.feedbackText}>{selectedApplication.feedback}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>

      {/* CV Modal */}
      <Portal>
        <Modal
          visible={showCVModal}
          onDismiss={() => setShowCVModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CV Snapshot</Text>
              <TouchableOpacity onPress={() => setShowCVModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedApplication?.cvSnapshot && (
              <View style={styles.cvContent}>
                <Text style={styles.cvName}>
                  {selectedApplication.cvSnapshot.first_name} {selectedApplication.cvSnapshot.last_name}
                </Text>
                <Text style={styles.cvContact}>
                  {selectedApplication.cvSnapshot.email} • {selectedApplication.cvSnapshot.phone}
                </Text>
                <Text style={styles.cvAddress}>
                  {selectedApplication.cvSnapshot.address}, {selectedApplication.cvSnapshot.city}, {selectedApplication.cvSnapshot.country}
                </Text>

                {selectedApplication.cvSnapshot.professional_summary && (
                  <View style={styles.cvSection}>
                    <Text style={styles.cvSectionTitle}>Professional Summary</Text>
                    <Text style={styles.cvSectionText}>{selectedApplication.cvSnapshot.professional_summary}</Text>
                  </View>
                )}

                {selectedApplication.cvSnapshot.technical_skills && (
                  <View style={styles.cvSection}>
                    <Text style={styles.cvSectionTitle}>Technical Skills</Text>
                    <Text style={styles.cvSectionText}>{selectedApplication.cvSnapshot.technical_skills}</Text>
                  </View>
                )}

                {selectedApplication.cvSnapshot.work_experience?.length > 0 && (
                  <View style={styles.cvSection}>
                    <Text style={styles.cvSectionTitle}>Work Experience</Text>
                    {selectedApplication.cvSnapshot.work_experience.map((exp, index) => (
                      <View key={index} style={styles.cvExperience}>
                        <Text style={styles.cvExpTitle}>{exp.jobTitle} at {exp.company}</Text>
                        <Text style={styles.cvExpDate}>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</Text>
                        <Text style={styles.cvExpDesc}>{exp.description}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedApplication.cvSnapshot.education?.length > 0 && (
                  <View style={styles.cvSection}>
                    <Text style={styles.cvSectionTitle}>Education</Text>
                    {selectedApplication.cvSnapshot.education.map((edu, index) => (
                      <View key={index} style={styles.cvEducation}>
                        <Text style={styles.cvEduTitle}>{edu.degree} from {edu.institution}</Text>
                        <Text style={styles.cvEduDate}>{edu.graduationDate}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Cover Letter Modal */}
      <Portal>
        <Modal
          visible={showCoverLetterModal}
          onDismiss={() => setShowCoverLetterModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cover Letter</Text>
              <TouchableOpacity onPress={() => setShowCoverLetterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedApplication?.coverLetter && (
              <View style={styles.coverLetterContent}>
                <Text style={styles.coverLetterText}>
                  {selectedApplication.coverLetter || 'No cover letter content available'}
                </Text>
              </View>
            )}
          </ScrollView>
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
  filterContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  filtersCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    marginRight: spacing.xs,
  },
  applicationsList: {
    padding: spacing.md,
  },
  applicationCard: {
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  applicationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  companyName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  applicationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  separator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  matchScore: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flex: 1,
  },
  appliedDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  updatedDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  typeChip: {
    height: 24,
    backgroundColor: colors.textSecondary + '20',
  },
  notesContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
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
  statsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  statsCard: {
    ...shadows.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // New web-inspired styles
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  matchChip: {
    height: 28,
  },
  statusChip: {
    height: 28,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  companyInfo: {
    marginBottom: spacing.md,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  companyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  salaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  matchScoreContainer: {
    backgroundColor: '#f8f9fa',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  matchScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchScoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  matchScoreRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  matchScoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    width: 80,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  matchAnalysis: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  matchScorePlaceholder: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  interviewContainer: {
    backgroundColor: '#dbeafe',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  interviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  interviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
    marginLeft: spacing.sm,
  },
  interviewDate: {
    fontSize: 14,
    color: '#1d4ed8',
  },
  feedbackContainer: {
    backgroundColor: '#f8f9fa',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalJobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalCompany: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  statusRow: {
    marginBottom: spacing.md,
  },
  interviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: spacing.md,
    borderRadius: 8,
  },
  interviewText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: spacing.sm,
  },
  // CV Modal styles
  cvContent: {
    padding: spacing.lg,
  },
  cvName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cvContact: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cvAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cvSection: {
    marginBottom: spacing.lg,
  },
  cvSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: spacing.sm,
  },
  cvSectionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  cvExperience: {
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
  },
  cvExpTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cvExpDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cvExpDesc: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  cvEducation: {
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
  },
  cvEduTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cvEduDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Cover Letter Modal styles
  coverLetterContent: {
    padding: spacing.lg,
  },
  coverLetterText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
});

export default ApplicationsScreen;
