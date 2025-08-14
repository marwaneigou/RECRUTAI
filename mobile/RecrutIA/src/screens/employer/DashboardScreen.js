import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, shadows } from '../../theme/theme';
import api from '../../services/api';
import Toast from 'react-native-toast-message';

// Candidates Section Component with Match Score Filtering
const CandidatesSection = ({ navigation }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScoreFilter] = useState('all'); // 'all', 'high', 'medium', 'low'

  useEffect(() => {
    fetchRecentCandidates();
  }, []);

  const fetchRecentCandidates = async () => {
    try {
      setLoading(true);
      console.log('🤖 Mobile - Fetching recent candidates for dashboard...'); // Debug log

      // Fetch recent applications (limit to 5 for dashboard preview)
      const response = await api.get('/applications?limit=5');
      console.log('📋 Mobile - Recent candidates API response:', response); // Debug log

      const applicationsData = response.data?.data?.applications || response.data?.applications || [];

      // Transform applications to candidate format with match scores
      const transformedCandidates = applicationsData.map(app => ({
        id: app.id,
        candidateId: app.candidateId,
        name: app.candidateName || 'Unknown Candidate',
        email: app.email || 'No email',
        jobTitle: app.jobTitle || 'Unknown Position',
        matchScore: app.matchScore || 0,
        status: app.status || 'pending',
        appliedAt: app.appliedDate || app.createdAt,
        avatar: null // Could be added later
      }));

      console.log('✅ Mobile - Transformed candidates:', transformedCandidates); // Debug log
      setCandidates(transformedCandidates);
    } catch (error) {
      console.error('❌ Mobile - Error fetching candidates:', error);
      setCandidates([]); // Set empty array on error
    } finally {
      setLoading(false);
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

  const getScoreColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  };

  const filteredCandidates = candidates.filter(candidate => {
    switch (scoreFilter) {
      case 'high':
        return candidate.matchScore >= 80;
      case 'medium':
        return candidate.matchScore >= 60 && candidate.matchScore < 80;
      case 'low':
        return candidate.matchScore < 60;
      case 'all':
      default:
        return true;
    }
  });

  const renderCandidateItem = ({ item: candidate }) => (
    <Card style={styles.candidateCard}>
      <Card.Content style={styles.candidateContent}>
        <View style={styles.candidateHeader}>
          <Avatar.Text
            size={40}
            label={getInitials(candidate.name)}
            style={[styles.candidateAvatar, { backgroundColor: colors.primary }]}
          />
          <View style={styles.candidateInfo}>
            <Text style={styles.candidateName}>{candidate.name}</Text>
            <Text style={styles.candidateJob}>{candidate.jobTitle}</Text>
            <Text style={styles.candidateDate}>
              Applied {new Date(candidate.appliedAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.candidateScore}>
            <Chip
              style={[
                styles.scoreChip,
                { backgroundColor: getScoreColor(candidate.matchScore) + '20' }
              ]}
              textStyle={{
                color: getScoreColor(candidate.matchScore),
                fontSize: 12,
                fontWeight: 'bold'
              }}
            >
              {candidate.matchScore}%
            </Chip>
            <Text style={[
              styles.scoreLabel,
              { color: getScoreColor(candidate.matchScore) }
            ]}>
              {getScoreLabel(candidate.matchScore)} Match
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Recent Candidates</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading candidates...</Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Candidates</Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Candidates')}
            style={styles.viewAllButton}
          >
            View All
          </Button>
        </View>

        {/* Match Score Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Match Score:</Text>
          <View style={styles.filterChips}>
            {[
              { value: 'all', label: 'All' },
              { value: 'high', label: 'High (80%+)' },
              { value: 'medium', label: 'Medium (60-79%)' },
              { value: 'low', label: 'Low (<60%)' }
            ].map((filter) => (
              <Chip
                key={filter.value}
                selected={scoreFilter === filter.value}
                onPress={() => setScoreFilter(filter.value)}
                style={[
                  styles.filterChip,
                  scoreFilter === filter.value && styles.selectedFilterChip
                ]}
                textStyle={[
                  styles.filterChipText,
                  scoreFilter === filter.value && styles.selectedFilterChipText
                ]}
              >
                {filter.label}
              </Chip>
            ))}
          </View>
        </View>

        {/* Candidates List */}
        {filteredCandidates.length > 0 ? (
          <FlatList
            data={filteredCandidates}
            renderItem={renderCandidateItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {scoreFilter === 'all'
                ? 'No recent applications'
                : `No candidates with ${scoreFilter} match scores`}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const EmployerDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    companyName: user?.name || 'Your Company',
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalJobs: 0,
    reviewedApplications: 0,
    interviewApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    recentApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    fetchEmployerStats();
  }, []);

  // Auto-refresh when screen comes into focus (after job creation/editing)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Mobile - Employer Dashboard focused, refreshing stats...'); // Debug log
      fetchEmployerStats();
    }, [])
  );

  const fetchEmployerStats = async () => {
    try {
      setLoading(true);
      console.log('🤖 Mobile - Fetching employer stats...'); // Debug log

      // Fetch real stats from dedicated endpoint (same as web)
      const response = await api.get('/stats/employer');
      console.log('📊 Mobile - Full API response:', response); // Debug log

      // The API service returns response.data directly
      const statsData = response.data?.stats || {};
      console.log('📊 Mobile - Extracted employer stats:', statsData); // Debug log

      // Validate that we have the expected data
      if (statsData && typeof statsData === 'object') {
        setStats({
          ...statsData,
          companyName: statsData.companyName || user?.name || 'Your Company'
        });
        setForceUpdate(prev => prev + 1); // Force re-render
        console.log('✅ Mobile - Stats successfully set:', statsData); // Debug log
      } else {
        console.error('❌ Mobile - Invalid stats data received:', statsData);
        throw new Error('Invalid stats data format');
      }
    } catch (error) {
      console.error('❌ Mobile - Error fetching employer stats:', error);
      console.error('Mobile - Error details:', error.message, error.stack);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard data',
      });

      // Set fallback stats
      setStats({
        companyName: user?.name || 'Your Company',
        activeJobs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        totalJobs: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = fetchEmployerStats; // Alias for compatibility

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployerStats();
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
        {/* Welcome Section - Matching Web Version */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text style={styles.welcomeTitle}>
              Welcome back, {stats.companyName}! 🏢
            </Text>
            <Text style={styles.welcomeSubtitle}>
              You have {stats.totalApplications} applications and {stats.activeJobs} active job postings.
            </Text>
            <View style={styles.welcomeActions}>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => navigation.navigate('Jobs')}
                style={styles.primaryAction}
                labelStyle={styles.primaryActionText}
              >
                Post New Job
              </Button>
              <Button
                mode="outlined"
                icon="cog"
                onPress={() => navigation.navigate('Profile')}
                style={styles.secondaryAction}
                labelStyle={styles.secondaryActionText}
              >
                Manage Profile
              </Button>
              <Button
                mode="text"
                icon="refresh"
                onPress={fetchEmployerStats}
                disabled={loading}
                style={styles.refreshAction}
                labelStyle={styles.refreshActionText}
              >
                {loading ? 'Refreshing...' : 'Refresh Stats'}
              </Button>
              <Button
                mode="outlined"
                icon="logout"
                onPress={handleLogout}
                style={styles.logoutAction}
                textColor={colors.error}
              >
                Disconnect
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Grid - Matching Web Version */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="briefcase" size={32} color={colors.info} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Active Jobs</Text>
                <Text style={styles.statNumber}>{stats.activeJobs}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={32} color={colors.success} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Total Applications</Text>
                <Text style={styles.statNumber}>{stats.totalApplications}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={32} color={colors.warning} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Pending Reviews</Text>
                <Text style={styles.statNumber}>{stats.pendingApplications}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="business" size={32} color={colors.secondary} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Total Jobs</Text>
                <Text style={styles.statNumber}>{stats.totalJobs}</Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions - Matching Web Version */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <Card style={styles.quickActionCard}>
                <Card.Content style={styles.quickActionContent}>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Jobs')}
                    style={styles.quickActionButton}
                  >
                    <View style={styles.quickActionInner}>
                      <Ionicons name="add-circle-outline" size={32} color={colors.textSecondary} />
                      <Text style={styles.quickActionTitle}>Post New Job</Text>
                      <Text style={styles.quickActionSubtitle}>Create a new job posting</Text>
                    </View>
                  </Button>
                </Card.Content>
              </Card>

              <Card style={styles.quickActionCard}>
                <Card.Content style={styles.quickActionContent}>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Jobs')}
                    style={styles.quickActionButton}
                  >
                    <View style={styles.quickActionInner}>
                      <Ionicons name="briefcase-outline" size={32} color={colors.textSecondary} />
                      <Text style={styles.quickActionTitle}>Edit Jobs</Text>
                      <Text style={styles.quickActionSubtitle}>Manage job postings</Text>
                    </View>
                  </Button>
                </Card.Content>
              </Card>

              <Card style={styles.quickActionCard}>
                <Card.Content style={styles.quickActionContent}>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Candidates')}
                    style={styles.quickActionButton}
                  >
                    <View style={styles.quickActionInner}>
                      <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
                      <Text style={styles.quickActionTitle}>Job Applications</Text>
                      <Text style={styles.quickActionSubtitle}>Review applications</Text>
                    </View>
                  </Button>
                </Card.Content>
              </Card>

              <Card style={styles.quickActionCard}>
                <Card.Content style={styles.quickActionContent}>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Profile')}
                    style={styles.quickActionButton}
                  >
                    <View style={styles.quickActionInner}>
                      <Ionicons name="business-outline" size={32} color={colors.textSecondary} />
                      <Text style={styles.quickActionTitle}>Company Profile</Text>
                      <Text style={styles.quickActionSubtitle}>Manage company info</Text>
                    </View>
                  </Button>
                </Card.Content>
              </Card>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Candidates Section with Match Score Filter */}
        <CandidatesSection navigation={navigation} />

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
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  welcomeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  primaryActionText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  secondaryAction: {
    borderColor: colors.primary,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryActionText: {
    color: colors.primary,
  },
  refreshAction: {
    marginBottom: spacing.sm,
  },
  refreshActionText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  logoutAction: {
    borderColor: colors.error,
    marginBottom: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statIconContainer: {
    marginRight: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    ...shadows.sm,
  },
  quickActionContent: {
    padding: 0,
  },
  quickActionButton: {
    margin: 0,
    padding: 0,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  quickActionInner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Candidates Section Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllButton: {
    margin: 0,
    padding: 0,
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  selectedFilterChipText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  candidateCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  candidateContent: {
    paddingVertical: spacing.sm,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidateAvatar: {
    marginRight: spacing.md,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  candidateJob: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  candidateDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  candidateScore: {
    alignItems: 'center',
  },
  scoreChip: {
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
  },

});

export default EmployerDashboardScreen;
