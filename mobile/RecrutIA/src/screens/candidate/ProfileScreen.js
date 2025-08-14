import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Switch, Divider, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, shadows } from '../../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({
    jobRecommendations: true,
    applicationUpdates: true,
    newMessages: true,
    marketingEmails: false,
  });

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

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={80}
                label={getInitials(user?.name)}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <Text style={styles.userRole}>
                  {user?.role === 'candidate' ? 'Job Seeker' : user?.role}
                </Text>
              </View>
            </View>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('CV Builder')}
              style={styles.editProfileButton}
              icon="pencil"
            >
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            
            <List.Item
              title="Personal Information"
              description="Update your personal details"
              left={props => <List.Icon {...props} icon="account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('CV Builder')}
            />
            
            <Divider />
            
            <List.Item
              title="Change Password"
              description="Update your password"
              left={props => <List.Icon {...props} icon="lock" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navigate to change password screen
                Alert.alert('Coming Soon', 'Change password feature coming soon!');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Privacy Settings"
              description="Manage your privacy preferences"
              left={props => <List.Icon {...props} icon="shield-account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Coming Soon', 'Privacy settings coming soon!');
              }}
            />
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Job Recommendations</Text>
                <Text style={styles.notificationDescription}>
                  Get notified about new job matches
                </Text>
              </View>
              <Switch
                value={notifications.jobRecommendations}
                onValueChange={() => toggleNotification('jobRecommendations')}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Application Updates</Text>
                <Text style={styles.notificationDescription}>
                  Updates on your job applications
                </Text>
              </View>
              <Switch
                value={notifications.applicationUpdates}
                onValueChange={() => toggleNotification('applicationUpdates')}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>New Messages</Text>
                <Text style={styles.notificationDescription}>
                  Messages from employers
                </Text>
              </View>
              <Switch
                value={notifications.newMessages}
                onValueChange={() => toggleNotification('newMessages')}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Marketing Emails</Text>
                <Text style={styles.notificationDescription}>
                  Tips and career advice
                </Text>
              </View>
              <Switch
                value={notifications.marketingEmails}
                onValueChange={() => toggleNotification('marketingEmails')}
              />
            </View>
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>App Settings</Text>
            
            <List.Item
              title="Language"
              description="English"
              left={props => <List.Icon {...props} icon="translate" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Coming Soon', 'Language settings coming soon!');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Theme"
              description="System default"
              left={props => <List.Icon {...props} icon="palette" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Coming Soon', 'Theme settings coming soon!');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Data & Storage"
              description="Manage app data"
              left={props => <List.Icon {...props} icon="database" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Coming Soon', 'Data settings coming soon!');
              }}
            />
          </Card.Content>
        </Card>

        {/* Support & Info */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Support & Information</Text>
            
            <List.Item
              title="Help Center"
              description="Get help and support"
              left={props => <List.Icon {...props} icon="help-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Help Center', 'Contact support at support@recrutia.com');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="About RecrutIA"
              description="Version 1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert(
                  'About RecrutIA',
                  'RecrutIA v1.0.0\nAI-Powered Recruitment Platform\n\n© 2024 RecrutIA. All rights reserved.'
                );
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Terms of Service"
              description="Read our terms"
              left={props => <List.Icon {...props} icon="file-document" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Coming Soon', 'Terms of service coming soon!');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={props => <List.Icon {...props} icon="shield-check" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Coming Soon', 'Privacy policy coming soon!');
              }}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              textColor={colors.error}
              icon="logout"
            >
              Disconnect
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
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  notificationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  notificationTitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  logoutButton: {
    borderColor: colors.error,
  },
});

export default ProfileScreen;
