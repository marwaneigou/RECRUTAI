import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { Text, Card, Chip, Button, Avatar, ActivityIndicator, Menu, Divider, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, shadows } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import EmailTemplateModal from '../../components/EmailTemplateModal';

const CandidatesScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const jobId = route?.params?.jobId; // Optional job filter from navigation
  const jobTitle = route?.params?.jobTitle; // Optional job title from navigation

  // State management (matching web version)
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Modal states
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalData, setEmailModalData] = useState({ application: null, newStatus: null });
  const [menuVisible, setMenuVisible] = useState({});

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  // Auto-refresh when screen comes into focus (after status updates)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Mobile - Candidates screen focused, refreshing applications...'); // Debug log
      fetchApplications();
    }, [jobId])
  );

  // API Integration (matching web version)
  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('🤖 Mobile - Fetching applications...', jobId ? `for job ${jobId}` : 'all'); // Debug log

      const response = await api.get('/applications');
      console.log('📋 Mobile - Applications API response:', response); // Debug log

      let applicationsData = response.data?.data?.applications || response.data?.applications || [];
      console.log('📋 Mobile - Raw applications:', applicationsData); // Debug log

      // Filter by job if jobId is provided
      if (jobId) {
        // The backend response might have jobId in different places, let's check multiple locations
        applicationsData = applicationsData.filter(app => {
          const appJobId = app.jobId || app.cvSnapshot?.jobId || app.coverLetter?.jobId;
          return appJobId === parseInt(jobId);
        });
        console.log('📋 Mobile - Filtered applications for job', jobId, ':', applicationsData); // Debug log
      }

      // Transform applications to match mobile UI expectations
      const transformedApplications = applicationsData.map(app => {
        const matchScore = calculateMatchScore(app);

        return {
          id: app.id,
          candidateId: app.candidateId,
          jobId: app.jobId,
          // Use the direct fields from backend response
          name: app.candidateName || 'Unknown Candidate',
          email: app.email || 'No email',
          jobTitle: app.jobTitle || 'Unknown Position',
          status: app.status || 'pending',
          matchScore: matchScore,
          appliedAt: app.appliedDate || app.createdAt,
          // Extract location and experience from CV data
          experience: app.cvData?.workExperience?.length > 0 ?
            `${app.cvData.workExperience.length} position${app.cvData.workExperience.length > 1 ? 's' : ''}` :
            'Not specified',
          location: app.cvData?.city && app.cvData?.country ?
            `${app.cvData.city}, ${app.cvData.country}` :
            app.cvData?.city || app.cvData?.country || 'Not specified',
          coverLetter: app.coverLetter,
          cvSnapshot: app.cvSnapshot,
          cvData: app.cvSnapshot?.cvData || app.cvData,
          // Additional fields for mobile
          candidate: {
            name: app.candidateName,
            email: app.email,
            firstName: app.cvData?.firstName || app.cvData?.first_name,
            lastName: app.cvData?.lastName || app.cvData?.last_name
          },
          job: {
            title: app.jobTitle
          },
          createdAt: app.appliedDate || app.createdAt,
          updatedAt: app.updatedAt
        };
      });

      console.log('✅ Mobile - Transformed applications:', transformedApplications); // Debug log
      console.log('✅ Mobile - Number of applications:', transformedApplications.length); // Debug log
      setApplications(transformedApplications);
    } catch (error) {
      console.error('❌ Mobile - Error fetching applications:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load applications',
      });
    } finally {
      setLoading(false);
    }
  };

  // Match score calculation (same as web version)
  const calculateMatchScore = (application) => {
    // Use the calculated match score from database if available
    if (application.matchScore !== null && application.matchScore !== undefined && application.matchScore > 0) {
      return application.matchScore;
    }

    // Fallback to simple calculation if no AI score available
    let score = 60; // Base score

    // Check MongoDB CV data (handle both field name formats)
    const cvData = application.cvSnapshot?.cvData || application.cvData;
    if (cvData) {
      // Technical skills check (both camelCase and snake_case)
      const technicalSkills = cvData.technicalSkills || cvData.technical_skills;
      if (technicalSkills && technicalSkills.length > 0) {
        score += 15; // Has technical skills
        console.log('Added 15 points for technical skills:', technicalSkills);
      }

      // Work experience check (both camelCase and snake_case)
      const workExperience = cvData.workExperience || cvData.work_experience;
      if (workExperience && workExperience.length > 0) {
        score += 15; // Has work experience
        console.log('Added 15 points for work experience:', workExperience.length, 'positions');
      }

      // Education check
      if (cvData.education && cvData.education.length > 0) {
        score += 10; // Has education
        console.log('Added 10 points for education:', cvData.education.length, 'entries');
      }
    }

    // Cap the score at 100
    return Math.min(score, 100);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return colors.warning;
      case 'reviewed': return colors.info;
      case 'shortlisted': return colors.success;
      case 'interviewed': return colors.secondary;
      case 'offered': return colors.accent;
      case 'accepted': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Action handlers (matching web version)
  const handleViewCV = async (application) => {
    console.log('🔍 Mobile - Viewing CV for application:', application.id); // Debug log
    console.log('🔍 Mobile - Full application data:', application); // Debug log
    console.log('🔍 Mobile - CV snapshot structure:', application.cvSnapshot); // Debug log
    console.log('🔍 Mobile - CV data structure:', application.cvData); // Debug log

    try {
      // Try multiple sources for CV data (backend provides multiple formats)
      let cvDataToDisplay = null;

      // Priority order: cvSnapshot.cvData -> cvData -> cvSnapshot
      if (application.cvSnapshot?.cvData) {
        cvDataToDisplay = application.cvSnapshot.cvData;
        console.log('🔍 Mobile - Using cvSnapshot.cvData:', cvDataToDisplay);
      } else if (application.cvData) {
        cvDataToDisplay = application.cvData;
        console.log('🔍 Mobile - Using direct cvData:', cvDataToDisplay);
      } else if (application.cvSnapshot) {
        cvDataToDisplay = application.cvSnapshot;
        console.log('🔍 Mobile - Using cvSnapshot directly:', cvDataToDisplay);
      }

      console.log('🔍 Mobile - Final CV data to display:', cvDataToDisplay); // Debug log

      if (cvDataToDisplay && (cvDataToDisplay.first_name || cvDataToDisplay.firstName)) {
        setSelectedCV(cvDataToDisplay);
        setShowCVModal(true);

        Toast.show({
          type: 'success',
          text1: 'CV Loaded',
          text2: `Viewing CV for ${cvDataToDisplay.first_name || cvDataToDisplay.firstName} ${cvDataToDisplay.last_name || cvDataToDisplay.lastName}`,
        });
      } else {
        console.log('❌ Mobile - No valid CV data found in any location');
        Toast.show({
          type: 'error',
          text1: 'No CV Data',
          text2: 'CV information is not available for this application',
        });
      }
    } catch (error) {
      console.error('❌ Mobile - Error viewing CV:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load CV',
      });
    }
  };

  const handleViewCoverLetter = async (application) => {
    console.log('📄 Mobile - Viewing cover letter for application:', application.id); // Debug log
    console.log('📄 Mobile - Cover letter structure:', application.coverLetter); // Debug log

    try {
      // Extract cover letter content from multiple possible locations
      let coverLetterContent = null;

      if (application.coverLetter?.content) {
        coverLetterContent = application.coverLetter.content;
        console.log('📄 Mobile - Using coverLetter.content:', coverLetterContent);
      } else if (typeof application.coverLetter === 'string') {
        coverLetterContent = application.coverLetter;
        console.log('📄 Mobile - Using coverLetter as string:', coverLetterContent);
      } else if (application.coverLetter) {
        // If coverLetter is an object but no content field, try to stringify
        coverLetterContent = JSON.stringify(application.coverLetter, null, 2);
        console.log('📄 Mobile - Using coverLetter object as JSON:', coverLetterContent);
      }

      console.log('📄 Mobile - Final cover letter content:', coverLetterContent); // Debug log

      if (coverLetterContent && coverLetterContent.trim().length > 0) {
        setSelectedCoverLetter(coverLetterContent);
        setShowCoverLetterModal(true);

        Toast.show({
          type: 'success',
          text1: 'Cover Letter Loaded',
          text2: 'Viewing cover letter for this application',
        });
      } else {
        console.log('❌ Mobile - No cover letter content found');
        Toast.show({
          type: 'info',
          text1: 'No Cover Letter',
          text2: 'This application does not include a cover letter',
        });
      }
    } catch (error) {
      console.error('❌ Mobile - Error viewing cover letter:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load cover letter',
      });
    }
  };

  const handleStatusUpdate = async (application, newStatus) => {
    console.log('🔄 Mobile - Updating status for application:', application.id, 'to:', newStatus); // Debug log

    // First update the status
    try {
      const response = await api.put(`/applications/${application.id}/status`, {
        status: newStatus
      });

      console.log('📊 Mobile - Full response:', response);
      console.log('📊 Mobile - Response success:', response.success);

      // The api service returns the data directly, so check response.success
      if (response.success) {
        // Update the local state
        setApplications(prev => prev.map(app =>
          app.id === application.id ? { ...app, status: newStatus } : app
        ));

        // Open email modal for status notification
        setEmailModalData({
          application: {
            ...application,
            status: newStatus
          },
          newStatus
        });
        setShowEmailModal(true);

        console.log('✅ Mobile - Status updated successfully in UI');
      } else {
        console.error('Failed to update status - Response:', response);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update status',
        });
      }
    } catch (error) {
      console.error('❌ Mobile - Error updating status:', error);
      console.error('❌ Mobile - Error details:', error.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error updating status. Please try again.',
      });
    }
  };

  const handleEmailSent = () => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Status update email sent successfully!',
    });
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailModalData({ application: null, newStatus: null });
  };

  const toggleMenu = (applicationId) => {
    setMenuVisible(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
  };

  const filteredApplications = applications.filter(application => {
    if (filter === 'all') return true;
    return application.status?.toLowerCase() === filter;
  });

  const renderApplicationItem = ({ item: application }) => (
    <Card style={styles.applicationCard}>
      <Card.Content>
        <View style={styles.applicationHeader}>
          <View style={styles.applicationInfo}>
            <Avatar.Text
              size={48}
              label={getInitials(application.name)}
              style={styles.avatar}
            />
            <View style={styles.applicationDetails}>
              <Text style={styles.candidateName}>{application.name}</Text>
              <Text style={styles.candidateEmail}>{application.email}</Text>
              <Text style={styles.jobTitle}>Applied for: {application.jobTitle}</Text>
              <View style={styles.applicationMeta}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{application.location}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.metaText}>{application.experience}</Text>
              </View>
            </View>
          </View>

          <View style={styles.applicationActions}>
            <Chip
              style={[
                styles.matchChip,
                { backgroundColor: colors.success + '20' }
              ]}
              textStyle={{ color: colors.success, fontSize: 12 }}
            >
              {application.matchScore}% Match
            </Chip>

            <Menu
              visible={menuVisible[application.id] || false}
              onDismiss={() => toggleMenu(application.id)}
              anchor={
                <Button
                  mode="text"
                  compact
                  onPress={() => toggleMenu(application.id)}
                  icon="dots-vertical"
                  style={styles.menuButton}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleViewCV(application);
                }}
                title="View CV"
                leadingIcon="account"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleViewCoverLetter(application);
                }}
                title="View Cover Letter"
                leadingIcon="email"
              />
              <Divider />

              {/* Status Change Options */}
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleStatusUpdate(application, 'pending');
                }}
                title="Mark as Pending"
                leadingIcon="clock"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleStatusUpdate(application, 'reviewed');
                }}
                title="Mark as Reviewed"
                leadingIcon="check"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleStatusUpdate(application, 'shortlisted');
                }}
                title="Shortlist"
                leadingIcon="star"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleStatusUpdate(application, 'interviewed');
                }}
                title="Mark as Interviewed"
                leadingIcon="account-voice"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleStatusUpdate(application, 'offered');
                }}
                title="Make Offer"
                leadingIcon="handshake"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleStatusUpdate(application, 'accepted');
                }}
                title="Mark as Accepted"
                leadingIcon="check-circle"
                titleStyle={{ color: colors.success }}
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleStatusUpdate(application, 'rejected');
                }}
                title="Reject"
                leadingIcon="close"
                titleStyle={{ color: colors.error }}
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(application.id);
                  handleStatusUpdate(application, 'withdrawn');
                }}
                title="Mark as Withdrawn"
                leadingIcon="arrow-left"
                titleStyle={{ color: colors.textSecondary }}
              />
            </Menu>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(application.status) + '20' }
            ]}
            textStyle={{ color: getStatusColor(application.status) }}
          >
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Chip>

          <Text style={styles.appliedDate}>
            Applied {new Date(application.appliedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.quickActions}>
          <Button
            mode="contained"
            compact
            onPress={() => handleViewCV(application)}
            style={styles.primaryButton}
            icon="account"
          >
            View CV
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => handleViewCoverLetter(application)}
            style={styles.secondaryButton}
            icon="email"
          >
            Cover Letter
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Applications</Text>
      <Text style={styles.emptyStateText}>
        {jobId ? 'No applications for this job yet' : 'No applications received yet'}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading applications...</Text>
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
        {jobId && (
          <View style={styles.backButtonContainer}>
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              icon="arrow-left"
              style={styles.backButton}
              labelStyle={styles.backButtonText}
            >
              Back to Jobs
            </Button>
          </View>
        )}
        <Text style={styles.headerTitle}>
          {jobId ? (jobTitle || 'Job Applications') : 'All Applications'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {jobId && jobTitle ? `Applications for ${jobTitle}` : `${filteredApplications.length} application${filteredApplications.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected'].map((status) => (
          <Chip
            key={status}
            selected={filter === status}
            onPress={() => setFilter(status)}
            style={[
              styles.filterChip,
              filter === status && styles.selectedFilterChip
            ]}
            textStyle={[
              styles.filterChipText,
              filter === status && styles.selectedFilterChipText
            ]}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Chip>
        ))}
      </ScrollView>

      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.applicationsList,
          filteredApplications.length === 0 && styles.emptyListContainer
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

      {/* CV Modal */}
      <Portal>
        <Modal
          visible={showCVModal}
          onDismiss={() => setShowCVModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Candidate CV</Text>
              <Button
                mode="text"
                onPress={() => setShowCVModal(false)}
                icon="close"
              >
                Close
              </Button>
            </View>
            {selectedCV && (
              <View style={styles.cvContent}>
                <Text style={styles.cvSection}>Personal Information</Text>
                <Text style={styles.cvText}>
                  Name: {selectedCV.first_name || selectedCV.firstName} {selectedCV.last_name || selectedCV.lastName}
                </Text>
                <Text style={styles.cvText}>Email: {selectedCV.email}</Text>
                <Text style={styles.cvText}>Phone: {selectedCV.phone}</Text>
                <Text style={styles.cvText}>
                  Address: {selectedCV.address} {selectedCV.city && selectedCV.country ? `${selectedCV.city}, ${selectedCV.country}` : ''}
                </Text>

                {/* Professional Summary */}
                {(selectedCV.professional_summary || selectedCV.professionalSummary) && (
                  <>
                    <Text style={styles.cvSection}>Professional Summary</Text>
                    <Text style={styles.cvText}>
                      {selectedCV.professional_summary || selectedCV.professionalSummary}
                    </Text>
                  </>
                )}

                {/* Technical Skills */}
                {((selectedCV.technical_skills && selectedCV.technical_skills.length > 0) ||
                  (selectedCV.technicalSkills && selectedCV.technicalSkills.length > 0)) && (
                  <>
                    <Text style={styles.cvSection}>Technical Skills</Text>
                    <Text style={styles.cvText}>
                      {Array.isArray(selectedCV.technical_skills)
                        ? selectedCV.technical_skills.join(', ')
                        : Array.isArray(selectedCV.technicalSkills)
                        ? selectedCV.technicalSkills.join(', ')
                        : selectedCV.technical_skills || selectedCV.technicalSkills}
                    </Text>
                  </>
                )}

                {/* Soft Skills */}
                {(selectedCV.soft_skills || selectedCV.softSkills) && (
                  <>
                    <Text style={styles.cvSection}>Soft Skills</Text>
                    <Text style={styles.cvText}>
                      {selectedCV.soft_skills || selectedCV.softSkills}
                    </Text>
                  </>
                )}

                {/* Languages */}
                {(selectedCV.languages) && (
                  <>
                    <Text style={styles.cvSection}>Languages</Text>
                    <Text style={styles.cvText}>{selectedCV.languages}</Text>
                  </>
                )}

                {/* Work Experience */}
                {((selectedCV.work_experience && selectedCV.work_experience.length > 0) ||
                  (selectedCV.workExperience && selectedCV.workExperience.length > 0)) && (
                  <>
                    <Text style={styles.cvSection}>Work Experience</Text>
                    {(selectedCV.work_experience || selectedCV.workExperience).map((exp, index) => (
                      <View key={index} style={styles.experienceItem}>
                        <Text style={styles.cvSubsection}>
                          {exp.job_title || exp.jobTitle} at {exp.company}
                        </Text>
                        <Text style={styles.cvText}>
                          {exp.start_date || exp.startDate} - {exp.end_date || exp.endDate}
                        </Text>
                        <Text style={styles.cvText}>{exp.description}</Text>
                        {exp.location && (
                          <Text style={styles.cvText}>📍 {exp.location}</Text>
                        )}
                      </View>
                    ))}
                  </>
                )}

                {/* Education */}
                {(selectedCV.education && selectedCV.education.length > 0) && (
                  <>
                    <Text style={styles.cvSection}>Education</Text>
                    {selectedCV.education.map((edu, index) => (
                      <View key={index} style={styles.educationItem}>
                        <Text style={styles.cvSubsection}>
                          {edu.degree} from {edu.institution}
                        </Text>
                        <Text style={styles.cvText}>
                          {edu.start_date || edu.startDate} - {edu.end_date || edu.endDate || edu.graduation_date || edu.graduationDate}
                        </Text>
                        {edu.location && (
                          <Text style={styles.cvText}>📍 {edu.location}</Text>
                        )}
                        {edu.gpa && (
                          <Text style={styles.cvText}>GPA: {edu.gpa}</Text>
                        )}
                      </View>
                    ))}
                  </>
                )}

                {/* Projects */}
                {(selectedCV.projects && selectedCV.projects.length > 0) && (
                  <>
                    <Text style={styles.cvSection}>Projects</Text>
                    {selectedCV.projects.map((project, index) => (
                      <View key={index} style={styles.experienceItem}>
                        <Text style={styles.cvSubsection}>{project.name}</Text>
                        <Text style={styles.cvText}>{project.description}</Text>
                        {project.technologies && (
                          <Text style={styles.cvText}>🛠️ {project.technologies}</Text>
                        )}
                        {project.url && (
                          <Text style={styles.cvText}>🔗 {project.url}</Text>
                        )}
                        {project.start_date && project.end_date && (
                          <Text style={styles.cvText}>
                            📅 {project.start_date} - {project.end_date}
                          </Text>
                        )}
                      </View>
                    ))}
                  </>
                )}

                {/* Links */}
                {(selectedCV.linkedin_url || selectedCV.linkedinUrl ||
                  selectedCV.github_url || selectedCV.githubUrl ||
                  selectedCV.portfolio_url || selectedCV.portfolioUrl) && (
                  <>
                    <Text style={styles.cvSection}>Links</Text>
                    {(selectedCV.linkedin_url || selectedCV.linkedinUrl) && (
                      <Text style={styles.cvText}>
                        LinkedIn: {selectedCV.linkedin_url || selectedCV.linkedinUrl}
                      </Text>
                    )}
                    {(selectedCV.github_url || selectedCV.githubUrl) && (
                      <Text style={styles.cvText}>
                        GitHub: {selectedCV.github_url || selectedCV.githubUrl}
                      </Text>
                    )}
                    {(selectedCV.portfolio_url || selectedCV.portfolioUrl) && (
                      <Text style={styles.cvText}>
                        Portfolio: {selectedCV.portfolio_url || selectedCV.portfolioUrl}
                      </Text>
                    )}
                  </>
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
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cover Letter</Text>
              <Button
                mode="text"
                onPress={() => setShowCoverLetterModal(false)}
                icon="close"
              >
                Close
              </Button>
            </View>
            {selectedCoverLetter && (
              <View style={styles.coverLetterContent}>
                <Text style={styles.coverLetterText}>{selectedCoverLetter}</Text>
              </View>
            )}
          </ScrollView>
        </Modal>

        {/* Email Template Modal */}
        <EmailTemplateModal
          isOpen={showEmailModal}
          onClose={handleCloseEmailModal}
          application={emailModalData.application}
          newStatus={emailModalData.newStatus}
          onEmailSent={handleEmailSent}
        />
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
  backButtonContainer: {
    marginBottom: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
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
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
  },
  selectedFilterChipText: {
    color: colors.surface,
  },
  applicationsList: {
    padding: spacing.md,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  applicationCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  applicationInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.md,
  },
  applicationDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  applicationActions: {
    alignItems: 'flex-end',
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  candidateEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  jobTitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  applicationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  separator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  matchChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  menuButton: {
    margin: 0,
    padding: 0,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  appliedDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickActions: {
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
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  cvContent: {
    gap: spacing.md,
  },
  cvSection: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  cvSubsection: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cvText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  experienceItem: {
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
  },
  educationItem: {
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.secondary,
  },
  coverLetterContent: {
    padding: spacing.md,
  },
  coverLetterText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
});

export default CandidatesScreen;
