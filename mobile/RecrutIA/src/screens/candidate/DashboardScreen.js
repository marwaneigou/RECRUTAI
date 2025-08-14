import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from 'react-native';
import { candidatesAPI, aiAPI } from '../../services/api';
import { colors, spacing, shadows } from '../../theme/theme';
import Toast from 'react-native-toast-message';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    applicationsSent: 0,
    jobMatches: 0,
    interviews: 0,
  });
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh when screen comes into focus (after applying to jobs)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Mobile - Candidate Dashboard focused, refreshing data...'); // Debug log
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchJobRecommendations(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard data',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await candidatesAPI.getCandidateStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchJobRecommendations = async () => {
    try {
      const response = await aiAPI.getJobRecommendations({ limit: 3 });
      console.log('🤖 Mobile - Job recommendations response:', response); // Debug log

      if (response.success) {
        const recommendationsData = response.data.recommendations || [];
        console.log('📋 Mobile - Raw recommendations:', recommendationsData); // Debug log

        // Transform the data to match the expected format (same as web)
        const transformedRecommendations = recommendationsData.map((rec, index) => {
          console.log(`🔍 Mobile - Processing recommendation ${index + 1}:`, rec); // Debug log
          console.log(`🆔 Mobile - Job ID: ${rec.jobId}, Title: ${rec.title}`); // Debug log

          const transformedJob = {
            id: rec.jobId, // Map jobId to id
            title: rec.title,
            company: rec.company,
            location: rec.location,
            matchScore: rec.matchScore,
            salary: rec.salaryMin && rec.salaryMax
              ? `${rec.salaryMin}k - ${rec.salaryMax}k ${rec.currency || 'EUR'}`
              : 'Salary not specified',
            salaryMin: rec.salaryMin,
            salaryMax: rec.salaryMax,
            currency: rec.currency || 'EUR',
            employmentType: rec.employmentType,
            experienceLevel: rec.experienceLevel,
            remote: rec.remoteAllowed,
            description: rec.description,
            requirements: rec.requirements,
            skills: rec.matchedSkills || [],
            benefits: [],
            createdAt: rec.createdAt,
            applicationDeadline: rec.applicationDeadline,
            logoUrl: rec.logoUrl,
            reasoning: rec.reasoning,
            missingSkills: rec.missingSkills || []
          };

          console.log(`✅ Mobile - Transformed job ${index + 1}:`, transformedJob); // Debug log
          console.log(`🆔 Mobile - Transformed job ID: ${transformedJob.id}, Type: ${typeof transformedJob.id}`); // Debug log

          return transformedJob;
        });

        console.log('✅ Mobile - Job recommendations successfully set:', transformedRecommendations); // Debug log
        setJobRecommendations(transformedRecommendations);
      }
    } catch (error) {
      console.error('Error fetching job recommendations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const handleJobPress = (jobId) => {
    console.log('🚀 Mobile - Job pressed with ID:', jobId, 'Type:', typeof jobId); // Debug log

    if (!jobId) {
      console.error('❌ Mobile - Job ID is undefined');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid job ID. Please try again.',
      });
      return;
    }

    // Navigate directly to JobDetails without affecting the Jobs tab stack
    navigation.navigate('Jobs', {
      screen: 'JobDetails',
      params: { jobId },
      initial: false, // Don't make this the initial screen
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <View style={styles.welcomeText}>
                <Text style={styles.welcomeTitle}>
                  Welcome back, {user?.candidateProfile?.firstName || user?.name || 'Candidate'}! 👋
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  You have {stats.jobMatches} new job matches and {stats.interviews} interview{stats.interviews !== 1 ? 's' : ''} scheduled.
                </Text>
              </View>
              <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.logoutButton}
                icon="logout"
                compact
              >
                Disconnect
              </Button>
            </View>
          </Card.Content>
        </Card>

      

        {/* AI Job Recommendations */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="sparkles" size={20} color={colors.secondary} /> AI Job Recommendations
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Jobs')}
                compact
              >
                View All
              </Button>
            </View>

            {jobRecommendations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>No Recommendations Yet</Text>
                <Text style={styles.emptyStateText}>
                  Complete your profile to get personalized job recommendations
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('CV Builder')}
                  style={styles.emptyStateButton}
                >
                  Complete Profile
                </Button>
              </View>
            ) : (
              <View style={styles.recommendationsContainer}>
                {jobRecommendations.map((job) => (
                  <Card
                    key={job.id}
                    style={styles.jobCard}
                    onPress={() => handleJobPress(job.id)}
                  >
                    <Card.Content>
                      <View style={styles.jobHeader}>
                        <View style={styles.jobInfo}>
                          <Text style={styles.jobTitle}>{job.title}</Text>
                          <Text style={styles.jobCompany}>{job.company}</Text>
                          <Text style={styles.jobLocation}>{job.location}</Text>
                        </View>
                        <Chip
                          style={[
                            styles.matchChip,
                            { backgroundColor: getMatchScoreColor(job.matchScore) + '20' }
                          ]}
                          textStyle={{ color: getMatchScoreColor(job.matchScore) }}
                        >
                          {job.matchScore}% Match
                        </Chip>
                      </View>
                      <Text style={styles.jobDescription} numberOfLines={2}>
                        {job.description}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <Button
                mode="outlined"
                icon="create"
                onPress={() => navigation.navigate('CV Builder')}
                style={styles.quickActionButton}
              >
                Build CV
              </Button>
              <Button
                mode="outlined"
                icon="search"
                onPress={() => navigation.navigate('Jobs')}
                style={styles.quickActionButton}
              >
                Search Jobs
              </Button>
              <Button
                mode="outlined"
                icon="document-text"
                onPress={() => navigation.navigate('Applications')}
                style={styles.quickActionButton}
              >
                My Applications
              </Button>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  welcomeCard: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.surface,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.surface,
    opacity: 0.9,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    flex: 1,
    marginRight: spacing.md,
  },
  logoutButton: {
    borderColor: colors.surface,
    minWidth: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    ...shadows.sm,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 16,
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
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
  },
  recommendationsContainer: {
    gap: spacing.md,
  },
  jobCard: {
    ...shadows.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  jobInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  jobCompany: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  jobLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  matchChip: {
    alignSelf: 'flex-start',
  },
  jobDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '30%',
  },
});

export default DashboardScreen;
