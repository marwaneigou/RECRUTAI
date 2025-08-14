import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, Chip, Button, ActivityIndicator, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { jobsAPI } from '../../services/api';
import { colors, spacing, shadows } from '../../theme/theme';
import Toast from 'react-native-toast-message';

const JobSearchScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    employmentType: 'all',
    experienceLevel: 'all',
    remote: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadJobs();
  }, []);

  // Auto-refresh when screen comes into focus (to show new jobs)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Mobile - Job Search focused, refreshing jobs...'); // Debug log
      loadJobs();
    }, [])
  );

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '')) {
        searchJobs();
      } else {
        loadJobs();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, filters, sortBy]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJobs({ sortBy });
      if (response.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load jobs',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchJobs = async () => {
    try {
      setLoading(true);
      const searchParams = {
        query: searchQuery,
        location: filters.location,
        employmentType: filters.employmentType !== 'all' ? filters.employmentType : undefined,
        experienceLevel: filters.experienceLevel !== 'all' ? filters.experienceLevel : undefined,
        remote: filters.remote !== 'all' ? filters.remote === 'yes' : undefined,
        sortBy,
      };

      const response = await jobsAPI.searchJobs(searchParams);
      if (response.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to search jobs',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      employmentType: 'all',
      experienceLevel: 'all',
      remote: 'all',
    });
    setSearchQuery('');
  };

  const getEmploymentTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'full-time': return colors.success;
      case 'part-time': return colors.warning;
      case 'contract': return colors.info;
      case 'internship': return colors.secondary;
      default: return colors.textSecondary;
    }
  };

  const renderJobItem = ({ item: job }) => (
    <Card
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
    >
      <Card.Content>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobCompany}>{job.company}</Text>
            <View style={styles.jobMeta}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.jobLocation}>{job.location}</Text>
              {job.remote && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.remoteTag}>Remote</Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.jobActions}>
            {job.matchScore && (
              <Chip
                style={[
                  styles.matchChip,
                  { backgroundColor: colors.success + '20' }
                ]}
                textStyle={{ color: colors.success, fontSize: 12 }}
              >
                {job.matchScore}% Match
              </Chip>
            )}
          </View>
        </View>

        <Text style={styles.jobDescription} numberOfLines={2}>
          {job.description}
        </Text>

        <View style={styles.jobFooter}>
          <View style={styles.jobTags}>
            <Chip
              style={[
                styles.typeChip,
                { backgroundColor: getEmploymentTypeColor(job.employmentType) + '20' }
              ]}
              textStyle={{ color: getEmploymentTypeColor(job.employmentType), fontSize: 11 }}
            >
              {job.employmentType}
            </Chip>
            {job.experienceLevel && (
              <Chip
                style={styles.experienceChip}
                textStyle={{ fontSize: 11 }}
              >
                {job.experienceLevel}
              </Chip>
            )}
          </View>
          <Text style={styles.jobDate}>
            {new Date(job.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Jobs Found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your search criteria or filters
      </Text>
      <Button
        mode="outlined"
        onPress={clearFilters}
        style={styles.emptyStateButton}
      >
        Clear Filters
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <Searchbar
          placeholder="Search jobs, companies..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterRow}>
          <Button
            mode={showFilters ? 'contained' : 'outlined'}
            icon="filter"
            onPress={() => setShowFilters(!showFilters)}
            compact
            style={styles.filterButton}
          >
            Filters
          </Button>
          
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="sort"
                onPress={() => setSortMenuVisible(true)}
                compact
                style={styles.sortButton}
              >
                Sort
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortBy('newest');
                setSortMenuVisible(false);
              }}
              title="Newest First"
              leadingIcon={sortBy === 'newest' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('relevance');
                setSortMenuVisible(false);
              }}
              title="Most Relevant"
              leadingIcon={sortBy === 'relevance' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('salary');
                setSortMenuVisible(false);
              }}
              title="Highest Salary"
              leadingIcon={sortBy === 'salary' ? 'check' : undefined}
            />
          </Menu>
        </View>

        {/* Filter Panel */}
        {showFilters && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterTitle}>Filters</Text>
            
            {/* Location Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Location</Text>
              <Searchbar
                placeholder="Enter location..."
                onChangeText={(text) => setFilters({ ...filters, location: text })}
                value={filters.location}
                style={styles.locationInput}
              />
            </View>

            {/* Employment Type Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Employment Type</Text>
              <View style={styles.chipContainer}>
                {['all', 'full-time', 'part-time', 'contract', 'internship'].map((type) => (
                  <Chip
                    key={type}
                    selected={filters.employmentType === type}
                    onPress={() => setFilters({ ...filters, employmentType: type })}
                    style={styles.filterChip}
                  >
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Experience Level Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Experience Level</Text>
              <View style={styles.chipContainer}>
                {['all', 'entry', 'mid', 'senior', 'executive'].map((level) => (
                  <Chip
                    key={level}
                    selected={filters.experienceLevel === level}
                    onPress={() => setFilters({ ...filters, experienceLevel: level })}
                    style={styles.filterChip}
                  >
                    {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Remote Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Remote Work</Text>
              <View style={styles.chipContainer}>
                {['all', 'yes', 'no'].map((remote) => (
                  <Chip
                    key={remote}
                    selected={filters.remote === remote}
                    onPress={() => setFilters({ ...filters, remote })}
                    style={styles.filterChip}
                  >
                    {remote === 'all' ? 'All Jobs' : remote === 'yes' ? 'Remote Only' : 'On-site Only'}
                  </Chip>
                ))}
              </View>
            </View>

            <Button
              mode="text"
              onPress={clearFilters}
              style={styles.clearFiltersButton}
            >
              Clear All Filters
            </Button>
          </View>
        )}
      </View>

      {/* Jobs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Searching jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.jobsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    ...shadows.sm,
  },
  searchBar: {
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  filterButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sortButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  filterPanel: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  filterGroup: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  locationInput: {
    height: 40,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  clearFiltersButton: {
    alignSelf: 'center',
    marginTop: spacing.sm,
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
  jobsList: {
    padding: spacing.md,
  },
  jobCard: {
    marginBottom: spacing.md,
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
    marginBottom: spacing.xs,
  },
  jobCompany: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  separator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  remoteTag: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  jobActions: {
    alignItems: 'flex-end',
  },
  matchChip: {
    alignSelf: 'flex-start',
  },
  jobDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    height: 24,
  },
  experienceChip: {
    height: 24,
    backgroundColor: colors.textSecondary + '20',
  },
  jobDate: {
    fontSize: 12,
    color: colors.textSecondary,
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
  },
  emptyStateButton: {
    borderColor: colors.primary,
  },
});

export default JobSearchScreen;
