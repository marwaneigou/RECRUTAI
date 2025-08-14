import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Modal, 
  Portal, 
  Card, 
  TextInput, 
  Button, 
  ActivityIndicator,
  IconButton 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../theme/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const EmailTemplateModal = ({ 
  isOpen, 
  onClose, 
  application, 
  newStatus, 
  onEmailSent 
}) => {
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
    recipientEmail: '',
    recipientName: ''
  });

  // Email templates for different statuses (matching web version)
  const emailTemplates = {
    reviewed: {
      subject: 'Application Update - Under Review',
      body: `Dear {candidateName},

Thank you for your application for the {jobTitle} position at {companyName}.

We wanted to update you that your application is currently under review by our hiring team. We are carefully evaluating all applications and will be in touch soon with next steps.

We appreciate your patience during this process.

Best regards,
{companyName} Hiring Team`
    },
    shortlisted: {
      subject: 'Great News - You\'ve Been Shortlisted!',
      body: `Dear {candidateName},

Congratulations! We are pleased to inform you that you have been shortlisted for the {jobTitle} position at {companyName}.

Your application stood out among many qualified candidates, and we would like to move forward with the next stage of our selection process.

We will be in touch shortly to schedule the next steps.

Best regards,
{companyName} Hiring Team`
    },
    interviewed: {
      subject: 'Interview Completed - Next Steps',
      body: `Dear {candidateName},

Thank you for taking the time to interview for the {jobTitle} position at {companyName}.

We enjoyed our conversation and learning more about your experience and qualifications. We are currently reviewing all interviews and will be in touch with our decision soon.

We appreciate your continued interest in joining our team.

Best regards,
{companyName} Hiring Team`
    },
    offered: {
      subject: 'Job Offer - {jobTitle} Position',
      body: `Dear {candidateName},

We are delighted to extend an offer for the {jobTitle} position at {companyName}!

After careful consideration, we believe you would be an excellent addition to our team. We were impressed by your qualifications, experience, and the enthusiasm you demonstrated throughout the interview process.

Please find the detailed offer information attached. We would love to have you join our team and look forward to your response.

Congratulations and welcome to {companyName}!

Best regards,
{companyName} Hiring Team`
    },
    accepted: {
      subject: 'Welcome to the Team!',
      body: `Dear {candidateName},

Welcome to {companyName}! We are thrilled that you have accepted our offer for the {jobTitle} position.

We are excited to have you join our team and look forward to the contributions you will make. Our HR team will be in touch shortly with onboarding information and next steps.

Once again, welcome aboard!

Best regards,
{companyName} Team`
    },
    rejected: {
      subject: 'Application Status Update',
      body: `Dear {candidateName},

Thank you for your interest in the {jobTitle} position at {companyName} and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We were impressed by your qualifications and encourage you to apply for future opportunities that align with your skills and experience.

We wish you the best of luck in your job search.

Best regards,
{companyName} Hiring Team`
    },
    withdrawn: {
      subject: 'Application Status Update',
      body: `Dear {candidateName},

We wanted to update you regarding your application for the {jobTitle} position at {companyName}.

We understand that circumstances can change, and we have noted that your application has been withdrawn.

Thank you for your interest in {companyName}. We encourage you to apply for future opportunities that may be a good fit.

Best regards,
{companyName} Hiring Team`
    }
  };

  useEffect(() => {
    if (isOpen && application && newStatus) {
      const template = emailTemplates[newStatus];
      if (template) {
        // Replace placeholders with actual data
        const subject = template.subject
          .replace('{candidateName}', application.candidateName || 'Candidate')
          .replace('{jobTitle}', application.jobTitle || 'Position')
          .replace('{companyName}', application.companyName || 'Our Company');

        const body = template.body
          .replace(/{candidateName}/g, application.candidateName || 'Candidate')
          .replace(/{jobTitle}/g, application.jobTitle || 'Position')
          .replace(/{companyName}/g, application.companyName || 'Our Company');

        setEmailData({
          subject,
          body,
          recipientEmail: application.email || '',
          recipientName: application.candidateName || ''
        });
      }
    }
  }, [isOpen, application, newStatus]);

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail || !emailData.subject || !emailData.body) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/applications/send-status-email', {
        applicationId: application.id,
        recipientEmail: emailData.recipientEmail,
        recipientName: emailData.recipientName,
        subject: emailData.subject,
        body: emailData.body,
        status: newStatus
      });

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Email sent successfully!',
        });
        onEmailSent();
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to send email',
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send email. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Modal
        visible={isOpen}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.modalCard}>
          {/* Header */}
          <Card.Content style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="mail" size={24} color={colors.primary} />
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>Send Status Update Email</Text>
                  <Text style={styles.headerSubtitle}>
                    Status: <Text style={styles.statusText}>{newStatus}</Text> • 
                    Candidate: <Text style={styles.candidateText}>{application?.candidateName}</Text>
                  </Text>
                </View>
              </View>
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>
          </Card.Content>

          {/* Form Content */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Card.Content>
              {/* Recipient Email */}
              <TextInput
                label="Recipient Email *"
                value={emailData.recipientEmail}
                onChangeText={(value) => handleInputChange('recipientEmail', value)}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Recipient Name */}
              <TextInput
                label="Recipient Name *"
                value={emailData.recipientName}
                onChangeText={(value) => handleInputChange('recipientName', value)}
                mode="outlined"
                style={styles.input}
              />

              {/* Subject */}
              <TextInput
                label="Subject *"
                value={emailData.subject}
                onChangeText={(value) => handleInputChange('subject', value)}
                mode="outlined"
                style={styles.input}
              />

              {/* Email Body */}
              <TextInput
                label="Email Body *"
                value={emailData.body}
                onChangeText={(value) => handleInputChange('body', value)}
                mode="outlined"
                multiline
                numberOfLines={12}
                style={styles.textArea}
              />
            </Card.Content>
          </ScrollView>

          {/* Footer Actions */}
          <Card.Content style={styles.footer}>
            <View style={styles.footerActions}>
              <Button
                mode="outlined"
                onPress={onClose}
                style={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSendEmail}
                loading={loading}
                disabled={loading}
                style={styles.sendButton}
                icon="send"
              >
                Send Email
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  header: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusText: {
    fontWeight: '500',
    textTransform: 'capitalize',
    color: colors.primary,
  },
  candidateText: {
    fontWeight: '500',
    color: colors.text,
  },
  closeButton: {
    margin: 0,
  },
  formContainer: {
    maxHeight: 400,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  textArea: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 200,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    minWidth: 100,
  },
  sendButton: {
    minWidth: 120,
  },
});

export default EmailTemplateModal;
