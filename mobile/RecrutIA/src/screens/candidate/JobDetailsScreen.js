import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider, Portal, Modal, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { jobsAPI, applicationsAPI, authAPI, aiAPI, candidatesAPI } from '../../services/api';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

const ANALYSIS_BASE = (Platform.OS === 'android') ? 'http://10.0.2.2:5002' : 'http://localhost:5002';

import { colors, spacing, shadows } from '../../theme/theme';
import Toast from 'react-native-toast-message';

const JobDetailsScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [applyVisible, setApplyVisible] = useState(false);
  const [cvText, setCvText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [matchScore, setMatchScore] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [cvData, setCvData] = useState(null);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJobById(jobId);
      if (response.success) {
        setJob(response.data.job);
      }
    } catch (error) {
      console.error('Error loading job details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load job details',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    // Load CV data when opening modal (exactly like web JobApplicationModal.js)
    try {
      const response = await candidatesAPI.getCvData();
      console.log('Mobile - API response:', response);
      console.log('Mobile - Response data:', response.data);

      // Handle different possible response structures (same as web)
      let cvDataFromApi = null;
      if (response.data && response.data.success) {
        cvDataFromApi = response.data.cvData || response.data.data?.cvData;
      } else if (response.data && response.data.cvData) {
        cvDataFromApi = response.data.cvData;
      } else if (response.cvData) {
        cvDataFromApi = response.cvData;
      }

      console.log('Mobile - Parsed CV data:', cvDataFromApi);
      console.log('Mobile - CV data fields check:', {
        firstName: cvDataFromApi?.firstName,
        lastName: cvDataFromApi?.lastName,
        email: cvDataFromApi?.email,
        isComplete: cvDataFromApi?.isComplete,
        workExperience: cvDataFromApi?.workExperience?.length,
        education: cvDataFromApi?.education?.length
      });
      setCvData(cvDataFromApi);

      // Convert CV data to text format (same as web)
      if (cvDataFromApi) {
        const cvTextFormatted = `
Name: ${cvDataFromApi.firstName || ''} ${cvDataFromApi.lastName || ''}
Email: ${cvDataFromApi.email || ''}
Phone: ${cvDataFromApi.phone || ''}
Location: ${cvDataFromApi.address || ''}, ${cvDataFromApi.city || ''}, ${cvDataFromApi.country || ''}

Professional Summary: ${cvDataFromApi.professionalSummary || ''}

Technical Skills: ${cvDataFromApi.technicalSkills || ''}
Soft Skills: ${cvDataFromApi.softSkills || ''}
Languages: ${cvDataFromApi.languages || ''}

Work Experience: ${cvDataFromApi.workExperience?.map(exp =>
  `${exp.jobTitle || ''} at ${exp.company || ''} (${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}): ${exp.description || ''}`
).join('\n') || 'No work experience listed'}

Education: ${cvDataFromApi.education?.map(edu =>
  `${edu.degree || ''} from ${edu.institution || ''} (${edu.graduationDate || ''})`
).join('\n') || 'No education listed'}
        `.trim();

        setCvText(cvTextFormatted);
      }
    } catch (error) {
      console.error('Error fetching CV data:', error);
      setCvData(null);
    }

    setApplyVisible(true);
  };

  const submitApplication = async () => {
    try {
      setApplying(true);
      const response = await applicationsAPI.applyToJob(jobId, {
        coverLetter: '', // You can add a cover letter input later
      });

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Application Submitted!',
          text2: 'Your application has been sent successfully',
        });

        console.log('🎉 Mobile - Application submitted successfully, navigating back to trigger refresh'); // Debug log

        // Navigate back (this will trigger useFocusEffect refresh in Dashboard and Applications screens)
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      Toast.show({
        type: 'error',
        text1: 'Application Failed',
        text2: error.response?.data?.error?.message || 'Failed to submit application',
      });
    } finally {
      setApplying(false);
    }
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

  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `From ${currency} ${min.toLocaleString()}`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Job not found</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button Header */}
      <View style={styles.backButtonContainer}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          labelStyle={styles.backButtonText}
        >
          Back
        </Button>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Job Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.jobHeader}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobCompany}>{job.company}</Text>
                <View style={styles.jobMeta}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.jobLocation}>{job.location}</Text>
                  {job.remote && (
                    <>
                      <Text style={styles.separator}>•</Text>
                      <Text style={styles.remoteTag}>Remote</Text>
                    </>
                  )}
                </View>
              </View>
              {job.matchScore && (
                <Chip
                  style={[
                    styles.matchChip,
                    { backgroundColor: colors.success + '20' }
                  ]}
                  textStyle={{ color: colors.success }}
                >
                  {job.matchScore}% Match
                </Chip>
              )}
            </View>

            <View style={styles.jobTags}>
              <Chip
                style={[
                  styles.typeChip,
                  { backgroundColor: getEmploymentTypeColor(job.employmentType) + '20' }
                ]}
                textStyle={{ color: getEmploymentTypeColor(job.employmentType) }}
              >
                {job.employmentType}
              </Chip>
              {job.experienceLevel && (
                <Chip style={styles.experienceChip}>
                  {job.experienceLevel}
                </Chip>
              )}
              {job.department && (
                <Chip style={styles.departmentChip}>
                  {job.department}
                </Chip>
              )}
            </View>

            {(job.salaryMin || job.salaryMax) && (
              <View style={styles.salaryContainer}>
                <Ionicons name="cash-outline" size={20} color={colors.success} />
                <Text style={styles.salaryText}>
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Job Description */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </Card.Content>
        </Card>

        {/* Requirements */}
        {job.requirements && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <Text style={styles.requirementsText}>{job.requirements}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Benefits */}
        {job.benefits && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Benefits</Text>
              <Text style={styles.benefitsText}>{job.benefits}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Required Skills</Text>
              <View style={styles.skillsContainer}>
                {job.skills.map((skill, index) => (
                  <Chip key={index} style={styles.skillChip}>
                    {skill}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Company Info */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>About {job.company}</Text>
            <Text style={styles.companyDescription}>
              {job.companyDescription || 'No company description available.'}
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.jobMetaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {job.applicationDeadline && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.warning} />
                  <Text style={styles.metaText}>
                    Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {job.applicationsCount && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {job.applicationsCount} applications
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.applyContainer}>
        <Button
          mode="contained"
          onPress={handleApply}
          loading={applying}
          disabled={applying || job.hasApplied}
          style={[
            styles.applyButton,
            job.hasApplied && styles.appliedButton
          ]}
          contentStyle={styles.applyButtonContent}
          icon={job.hasApplied ? 'check' : 'send'}
        >
          {job.hasApplied ? 'Already Applied' : applying ? 'Applying...' : 'Apply Now'}
        </Button>
      </View>

      <Portal>
        <Modal visible={applyVisible} onDismiss={() => setApplyVisible(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Apply to {job?.title}</Text>

          {/* Job Details (same as web) */}
          <View style={styles.jobDetailsContainer}>
            <Text style={styles.modalLabel}>Job Details</Text>
            <View style={styles.jobDetailsCard}>
              <Text style={styles.jobTitle}>{job?.title}</Text>
              <Text style={styles.jobCompany}>{job?.company || job?.employer?.companyName} • {job?.location}</Text>
              <Text style={styles.jobSalary}>{job?.salary}</Text>
            </View>
          </View>

          {/* CV Status (exactly like web) */}
          <View style={styles.cvStatusContainer}>
            <Text style={styles.modalLabel}>Your CV</Text>
            {cvData ? (
              <View style={[styles.statusCard, { backgroundColor: cvData.isComplete ? '#f0fdf4' : '#fef3c7', borderColor: cvData.isComplete ? '#16a34a' : '#f59e0b' }]}>
                <View style={styles.statusRow}>
                  <Ionicons name="document-text" size={20} color={cvData.isComplete ? '#16a34a' : '#f59e0b'} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.statusText, { color: cvData.isComplete ? '#15803d' : '#92400e' }]}>
                      CV {cvData.isComplete ? 'Ready' : 'Incomplete'}: {cvData.firstName || 'No name'} {cvData.lastName || ''}
                    </Text>
                    <Text style={[styles.statusSubtext, { color: cvData.isComplete ? '#16a34a' : '#f59e0b' }]}>
                      Template: {cvData.selectedTemplate || 'modern'} • {cvData.isComplete ? 'Complete' : 'Please complete all required fields'}
                    </Text>
                    {!cvData.isComplete && (
                      <View>
                        <Text style={[styles.statusSubtext, { color: '#ef4444', fontSize: 12, marginTop: 4 }]}>
                          Missing: {!cvData.firstName ? 'Name, ' : ''}{!cvData.email ? 'Email, ' : ''}{!cvData.professionalSummary ? 'Summary, ' : ''}{(!cvData.workExperience || cvData.workExperience.length === 0 || !cvData.workExperience[0]?.jobTitle) ? 'Work Experience' : ''}
                        </Text>
                        <Button
                          mode="outlined"
                          onPress={() => {
                            setApplyVisible(false);
                            navigation.navigate('CVBuilder');
                          }}
                          style={{ marginTop: 8 }}
                          compact
                        >
                          Complete CV
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.statusCard, { backgroundColor: '#fef2f2', borderColor: '#ef4444' }]}>
                <View style={styles.statusRow}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.statusText, { color: '#991b1b' }]}>
                      No CV found. Please create your CV first.
                    </Text>
                    <Text style={[styles.statusSubtext, { color: '#ef4444', fontSize: 12, marginTop: 4 }]}>
                      Go to CV Builder → Fill your information → Save CV Data
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setApplyVisible(false);
                        navigation.navigate('CVBuilder');
                      }}
                      style={{ marginTop: 8 }}
                      compact
                    >
                      Go to CV Builder
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>

          <Text style={styles.modalLabel}>CV Text (auto-loaded from your profile)</Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={6}
            value={cvText}
            onChangeText={setCvText}
            placeholder="Paste your CV here to calculate match score"
            style={styles.textArea}
          />

          <View style={styles.modalRow}>
            <Button mode="outlined" onPress={async () => {
              try {
                setCalculating(true);

                // Validate CV text (same as web logic)
                if (!cvText.trim()) {
                  Toast.show({
                    type: 'error',
                    text1: 'CV Required',
                    text2: 'Please paste your CV text or load from profile'
                  });
                  return;
                }

                const res = await fetch(`${ANALYSIS_BASE}/api/analyze/calculate-match-score`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    cvText: cvText.trim(),
                    jobTitle: job?.title,
                    jobDescription: job?.description,
                    jobRequirements: job?.requirements || job?.description,
                    company: job?.company || job?.employer?.companyName
                  })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                console.log('Match score response:', data);

                // Set match score data in same format as web version
                const matchScoreData = {
                  matchScore: data.matchScore ?? null,
                  analysis: data.analysis || '',
                  strengths: data.strengths || [],
                  gaps: data.gaps || []
                };

                setMatchScore(matchScoreData);
                Toast.show({ type: 'success', text1: `Match score: ${data.matchScore ?? 'N/A'}%` });
              } catch (err) {
                const errorMsg = err.message.includes('400') ?
                  'CV text and job description cannot be empty' :
                  'Failed to calculate score';
                Toast.show({ type: 'error', text1: 'Calculation Failed', text2: errorMsg });
              } finally {
                setCalculating(false);
              }
            }} loading={calculating} icon="calculator">
              Calculate Match Score
            </Button>
            {matchScore && matchScore.matchScore !== null && (
              <Chip style={{ marginLeft: 12 }} icon="star">{matchScore.matchScore}%</Chip>
            )}
          </View>

          <View style={styles.modalRow}>
            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Cover letter (optional)</Text>
            <Button mode="outlined" onPress={async () => {
              try {
                setGeneratingCoverLetter(true);

                // Use direct analysis service call (same as web)
                const personalInfo = cvData?.personalInfo || {};
                const cvTextForGeneration = cvText || `
Name: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}
Email: ${personalInfo.email || ''}
Phone: ${personalInfo.phone || ''}
Location: ${personalInfo.address || ''}

Professional Summary: ${cvData?.professionalSummary || ''}

Technical Skills: ${cvData?.skills?.filter(s => ['Programming', 'Frontend', 'Backend'].includes(s.category))
  .map(s => s.name).join(', ') || ''}

Work Experience: ${cvData?.workExperience?.map(exp =>
  `${exp.jobTitle || ''} at ${exp.company || ''} (${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}): ${exp.description || ''}`
).join('\n') || 'No work experience listed'}
                `.trim();

                const response = await fetch(`${ANALYSIS_BASE}/api/analyze/generate-cover-letter`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    cvText: cvTextForGeneration,
                    jobTitle: job?.title,
                    jobDescription: job?.description,
                    company: job?.company || job?.employer?.companyName || 'the company',
                    candidateName: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 'Candidate'
                  })
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const result = await response.json();
                if (result.coverLetter) {
                  setCoverLetter(result.coverLetter);
                  Toast.show({
                    type: 'success',
                    text1: 'AI Cover Letter Generated!',
                    text2: `${result.wordCount || 0} words`
                  });
                } else {
                  throw new Error('Invalid response format');
                }
              } catch (err) {
                console.error('Error generating cover letter:', err);
                Toast.show({ type: 'error', text1: 'Failed to generate cover letter' });
              } finally {
                setGeneratingCoverLetter(false);
              }
            }} loading={generatingCoverLetter} icon="robot" style={{ marginLeft: 12, marginTop: 8 }}>
              🤖 AI Generate
            </Button>
          </View>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={8}
            value={coverLetter}
            onChangeText={setCoverLetter}
            placeholder="Write your cover letter or use AI to generate one..."
            style={styles.textArea}
          />

          <View style={styles.modalActions}>
            <Button mode="text" onPress={() => setApplyVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={async () => {
              try {
                setApplying(true);

                // Validation (exactly like web JobApplicationModal.js)
                if (!coverLetter.trim()) {
                  Toast.show({ type: 'error', text1: 'Cover Letter Required', text2: 'Please write a cover letter' });
                  return;
                }

                if (!cvData) {
                  Toast.show({ type: 'error', text1: 'No CV Found', text2: 'Please create your CV first in the CV Builder' });
                  return;
                }

                if (!cvData.isComplete) {
                  Toast.show({ type: 'error', text1: 'CV Incomplete', text2: 'Please complete your CV before applying' });
                  return;
                }

                // Additional validation for empty CV data
                if (!cvData.firstName || !cvData.lastName || !cvData.email) {
                  Toast.show({
                    type: 'error',
                    text1: 'CV Missing Basic Info',
                    text2: 'Please fill in your name and email in CV Builder'
                  });
                  return;
                }

                if (!matchScore || !matchScore.matchScore) {
                  Toast.show({ type: 'error', text1: 'Match Score Required', text2: 'Please calculate the match score before applying' });
                  return;
                }

                // Create CV snapshot for this application (same as web)
                const cvSnapshot = {
                  first_name: cvData.firstName || '',
                  last_name: cvData.lastName || '',
                  email: cvData.email || '',
                  phone: cvData.phone || '',
                  address: cvData.address || '',
                  city: cvData.city || '',
                  country: cvData.country || '',
                  linkedin_url: cvData.linkedinUrl || '',
                  github_url: cvData.githubUrl || '',
                  portfolio_url: cvData.portfolioUrl || '',
                  professional_summary: cvData.professionalSummary || '',
                  technical_skills: cvData.technicalSkills || '',
                  soft_skills: cvData.softSkills || '',
                  languages: cvData.languages || '',
                  work_experience: cvData.workExperience || [],
                  education: cvData.education || [],
                  selected_template: cvData.selectedTemplate || 'modern'
                };

                console.log('Mobile - CV snapshot being created:', cvSnapshot);
                console.log('Mobile - CV snapshot validation:', {
                  hasName: !!(cvSnapshot.first_name && cvSnapshot.last_name),
                  hasEmail: !!cvSnapshot.email,
                  hasWorkExp: cvSnapshot.work_experience?.length > 0,
                  hasEducation: cvSnapshot.education?.length > 0,
                  isComplete: cvData.isComplete
                });

                const applicationData = {
                  coverLetter: coverLetter.trim(),
                  cvSnapshot: cvSnapshot,
                  // Include match score data if calculated (same as web)
                  ...(matchScore && {
                    matchScore: matchScore.matchScore,
                    matchAnalysis: matchScore.analysis,
                    matchStrengths: matchScore.strengths,
                    matchGaps: matchScore.gaps
                  })
                };

                console.log('Submitting application:', applicationData);
                const response = await applicationsAPI.applyToJob(Number(jobId), applicationData);

                console.log('Application response:', response);
                if (response.success) {
                  setJob(prev => ({ ...prev, hasApplied: true }));
                  setApplyVisible(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Application submitted successfully!',
                    text2: `Match score: ${matchScore.matchScore}%`
                  });
                } else {
                  throw new Error(response.error?.message || 'Failed to submit application');
                }
              } catch (error) {
                const msg = error?.response?.data?.error?.message || error?.error?.message || 'Failed to submit application';
                Toast.show({ type: 'error', text1: 'Application Failed', text2: msg });
              } finally {
                setApplying(false);
              }
            }} loading={applying} icon="send">
              Submit Application
            </Button>
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
  backButtonContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm, // Align with content
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginVertical: spacing.lg,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  headerCard: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.md,
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
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  jobCompany: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  separator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  remoteTag: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  matchChip: {
    alignSelf: 'flex-start',
  },
  jobTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  textArea: {
    minHeight: 100,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cvStatusContainer: {
    marginBottom: 16,
  },
  statusCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  jobDetailsContainer: {
    marginBottom: 16,
  },
  jobDetailsCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  jobSalary: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeChip: {
    marginRight: spacing.xs,
  },
  experienceChip: {
    backgroundColor: colors.textSecondary + '20',
    marginRight: spacing.xs,
  },
  departmentChip: {
    backgroundColor: colors.info + '20',
    marginRight: spacing.xs,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: 8,
  },
  salaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    marginLeft: spacing.sm,
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
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  requirementsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  benefitsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
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
  companyDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  jobMetaInfo: {
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  applyContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  appliedButton: {
    backgroundColor: colors.success,
  },
  applyButtonContent: {
    paddingVertical: spacing.sm,
  },
});

export default JobDetailsScreen;
