import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../theme/theme';

const NativeCVPreview = ({ cvData, template = 'modern', style }) => {
  const getTemplateStyles = () => {
    switch (template) {
      case 'modern':
        return {
          headerBg: '#667eea',
          sectionColor: '#667eea',
          fontFamily: 'System',
        };
      case 'classic':
        return {
          headerBg: '#333333',
          sectionColor: '#333333',
          fontFamily: 'serif',
        };
      case 'creative':
        return {
          headerBg: '#3498db',
          sectionColor: '#2c3e50',
          fontFamily: 'System',
        };
      default:
        return {
          headerBg: '#667eea',
          sectionColor: '#667eea',
          fontFamily: 'System',
        };
    }
  };

  const templateStyles = getTemplateStyles();

  const renderModernLayout = () => (
    <View style={styles.modernContainer}>
      {/* Sidebar */}
      <View style={[styles.sidebar, { backgroundColor: templateStyles.headerBg }]}>
        <Text style={styles.name}>
          {cvData.firstName || 'First Name'} {cvData.lastName || 'Last Name'}
        </Text>
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactText}>📧 {cvData.email || 'email@example.com'}</Text>
          <Text style={styles.contactText}>📱 {cvData.phone || 'Phone Number'}</Text>
          <Text style={styles.contactText}>📍 {cvData.address || 'Address'}</Text>
          <Text style={styles.contactText}>{cvData.city || 'City'}, {cvData.country || 'Country'}</Text>
          {cvData.linkedinUrl && <Text style={styles.contactText}>🔗 LinkedIn</Text>}
          {cvData.githubUrl && <Text style={styles.contactText}>💻 GitHub</Text>}
          {cvData.portfolioUrl && <Text style={styles.contactText}>🌐 Portfolio</Text>}
        </View>

        {cvData.technicalSkills && (
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Technical Skills</Text>
            <Text style={styles.sidebarText}>{cvData.technicalSkills}</Text>
          </View>
        )}

        {cvData.softSkills && (
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Soft Skills</Text>
            <Text style={styles.sidebarText}>{cvData.softSkills}</Text>
          </View>
        )}

        {cvData.languages && (
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Languages</Text>
            <Text style={styles.sidebarText}>{cvData.languages}</Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {cvData.professionalSummary && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: templateStyles.sectionColor }]}>
              Professional Summary
            </Text>
            <Text style={styles.sectionContent}>{cvData.professionalSummary}</Text>
          </View>
        )}

        {cvData.workExperience?.some(exp => exp.jobTitle || exp.company) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: templateStyles.sectionColor }]}>
              Work Experience
            </Text>
            {cvData.workExperience.map((exp, index) => 
              exp.jobTitle || exp.company ? (
                <View key={index} style={styles.experienceItem}>
                  <Text style={styles.itemTitle}>{exp.jobTitle || 'Job Title'}</Text>
                  <Text style={styles.itemCompany}>{exp.company || 'Company'}</Text>
                  <Text style={styles.itemDate}>
                    {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                  </Text>
                  {exp.description && (
                    <Text style={styles.itemDescription} numberOfLines={3}>
                      {exp.description}
                    </Text>
                  )}
                </View>
              ) : null
            )}
          </View>
        )}

        {cvData.education?.some(edu => edu.degree || edu.institution) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: templateStyles.sectionColor }]}>
              Education
            </Text>
            {cvData.education.map((edu, index) => 
              edu.degree || edu.institution ? (
                <View key={index} style={styles.experienceItem}>
                  <Text style={styles.itemTitle}>{edu.degree || 'Degree'}</Text>
                  <Text style={styles.itemCompany}>{edu.institution || 'Institution'}</Text>
                  <Text style={styles.itemDate}>{edu.graduationDate || 'Graduation Date'}</Text>
                  {edu.gpa && <Text style={styles.itemDescription}>GPA: {edu.gpa}</Text>}
                </View>
              ) : null
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderClassicLayout = () => (
    <View style={styles.classicContainer}>
      {/* Header */}
      <View style={[styles.classicHeader, { borderBottomColor: templateStyles.headerBg }]}>
        <Text style={[styles.classicName, { color: templateStyles.headerBg }]}>
          {cvData.firstName || 'First Name'} {cvData.lastName || 'Last Name'}
        </Text>
        <Text style={styles.classicContact}>
          {cvData.email || 'email@example.com'} • {cvData.phone || 'Phone Number'}
        </Text>
        <Text style={styles.classicContact}>
          {cvData.address || 'Address'}, {cvData.city || 'City'}, {cvData.country || 'Country'}
        </Text>
      </View>

      {/* Content */}
      {cvData.professionalSummary && (
        <View style={styles.section}>
          <Text style={[styles.classicSectionTitle, { color: templateStyles.sectionColor }]}>
            PROFESSIONAL SUMMARY
          </Text>
          <Text style={styles.sectionContent}>{cvData.professionalSummary}</Text>
        </View>
      )}

      {cvData.workExperience?.some(exp => exp.jobTitle || exp.company) && (
        <View style={styles.section}>
          <Text style={[styles.classicSectionTitle, { color: templateStyles.sectionColor }]}>
            WORK EXPERIENCE
          </Text>
          {cvData.workExperience.map((exp, index) => 
            exp.jobTitle || exp.company ? (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemTitle}>{exp.jobTitle || 'Job Title'}</Text>
                    <Text style={styles.itemCompany}>{exp.company || 'Company'}</Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                  </Text>
                </View>
                {exp.description && (
                  <Text style={styles.itemDescription} numberOfLines={3}>
                    {exp.description}
                  </Text>
                )}
              </View>
            ) : null
          )}
        </View>
      )}

      {cvData.education?.some(edu => edu.degree || edu.institution) && (
        <View style={styles.section}>
          <Text style={[styles.classicSectionTitle, { color: templateStyles.sectionColor }]}>
            EDUCATION
          </Text>
          {cvData.education.map((edu, index) => 
            edu.degree || edu.institution ? (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemTitle}>{edu.degree || 'Degree'}</Text>
                    <Text style={styles.itemCompany}>{edu.institution || 'Institution'}</Text>
                  </View>
                  <Text style={styles.itemDate}>{edu.graduationDate || 'Graduation Date'}</Text>
                </View>
              </View>
            ) : null
          )}
        </View>
      )}

      {(cvData.technicalSkills || cvData.softSkills || cvData.languages) && (
        <View style={styles.section}>
          <Text style={[styles.classicSectionTitle, { color: templateStyles.sectionColor }]}>
            SKILLS
          </Text>
          {cvData.technicalSkills && (
            <Text style={styles.sectionContent}>
              <Text style={styles.skillLabel}>Technical: </Text>
              {cvData.technicalSkills}
            </Text>
          )}
          {cvData.softSkills && (
            <Text style={styles.sectionContent}>
              <Text style={styles.skillLabel}>Soft Skills: </Text>
              {cvData.softSkills}
            </Text>
          )}
          {cvData.languages && (
            <Text style={styles.sectionContent}>
              <Text style={styles.skillLabel}>Languages: </Text>
              {cvData.languages}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderCreativeLayout = () => (
    <View style={styles.creativeContainer}>
      {/* Header */}
      <View style={[styles.creativeHeader, { backgroundColor: templateStyles.headerBg }]}>
        <Text style={styles.creativeName}>
          {cvData.firstName || 'First Name'} {cvData.lastName || 'Last Name'}
        </Text>
        <Text style={styles.creativeContact}>
          {cvData.email || 'email@example.com'} • {cvData.phone || 'Phone Number'}
        </Text>
        <Text style={styles.creativeContact}>
          {cvData.address || 'Address'}, {cvData.city || 'City'}, {cvData.country || 'Country'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.creativeContent}>
        {cvData.professionalSummary && (
          <View style={styles.section}>
            <Text style={[styles.creativeSectionTitle, { backgroundColor: templateStyles.sectionColor }]}>
              PROFESSIONAL SUMMARY
            </Text>
            <View style={styles.creativeBox}>
              <Text style={styles.sectionContent}>{cvData.professionalSummary}</Text>
            </View>
          </View>
        )}

        {(cvData.technicalSkills || cvData.softSkills || cvData.languages) && (
          <View style={styles.section}>
            <Text style={[styles.creativeSectionTitle, { backgroundColor: templateStyles.sectionColor }]}>
              SKILLS
            </Text>
            <View style={styles.skillsGrid}>
              {cvData.technicalSkills && (
                <View style={styles.skillBox}>
                  <Text style={styles.skillBoxTitle}>Technical Skills</Text>
                  <Text style={styles.skillBoxContent}>{cvData.technicalSkills}</Text>
                </View>
              )}
              {cvData.softSkills && (
                <View style={styles.skillBox}>
                  <Text style={styles.skillBoxTitle}>Soft Skills</Text>
                  <Text style={styles.skillBoxContent}>{cvData.softSkills}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {cvData.workExperience?.some(exp => exp.jobTitle || exp.company) && (
          <View style={styles.section}>
            <Text style={[styles.creativeSectionTitle, { backgroundColor: templateStyles.sectionColor }]}>
              WORK EXPERIENCE
            </Text>
            {cvData.workExperience.map((exp, index) => 
              exp.jobTitle || exp.company ? (
                <View key={index} style={styles.creativeBox}>
                  <Text style={styles.itemTitle}>{exp.jobTitle || 'Job Title'}</Text>
                  <Text style={styles.itemCompany}>{exp.company || 'Company'}</Text>
                  <Text style={styles.itemDate}>
                    {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                  </Text>
                  {exp.description && (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {exp.description}
                    </Text>
                  )}
                </View>
              ) : null
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderLayout = () => {
    switch (template) {
      case 'modern':
        return renderModernLayout();
      case 'classic':
        return renderClassicLayout();
      case 'creative':
        return renderCreativeLayout();
      default:
        return renderModernLayout();
    }
  };

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {renderLayout()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Modern Template Styles
  modernContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    minHeight: 400,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sidebar: {
    flex: 1,
    padding: 15,
  },
  mainContent: {
    flex: 2,
    padding: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  contactInfo: {
    marginBottom: 15,
  },
  contactText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 2,
  },
  sidebarSection: {
    marginBottom: 12,
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    paddingBottom: 2,
  },
  sidebarText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 2,
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 14,
    color: '#333',
  },
  experienceItem: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCompany: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
  },
  itemDescription: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
    lineHeight: 12,
  },
  // Classic Template Styles
  classicContainer: {
    backgroundColor: 'white',
    padding: 15,
    minHeight: 400,
    borderRadius: 8,
  },
  classicHeader: {
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 15,
    borderBottomWidth: 2,
  },
  classicName: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  classicContact: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  classicSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skillLabel: {
    fontWeight: 'bold',
  },
  // Creative Template Styles
  creativeContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 400,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  creativeHeader: {
    padding: 20,
    alignItems: 'center',
  },
  creativeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  creativeContact: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  creativeContent: {
    padding: 15,
  },
  creativeSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creativeBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#74b9ff',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skillBox: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    width: '48%',
    borderLeftWidth: 2,
    borderLeftColor: '#fd79a8',
  },
  skillBoxTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  skillBoxContent: {
    fontSize: 9,
    color: '#333',
    lineHeight: 11,
  },
});

export default NativeCVPreview;
