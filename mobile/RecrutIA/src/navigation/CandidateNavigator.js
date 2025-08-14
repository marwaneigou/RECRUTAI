import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

// Candidate Screens
import CandidateDashboardScreen from '../screens/candidate/DashboardScreen';
import JobSearchScreen from '../screens/candidate/JobSearchScreen';
import JobDetailsScreen from '../screens/candidate/JobDetailsScreen';
import ApplicationsScreen from '../screens/candidate/ApplicationsScreen';
import CVBuilderScreen from '../screens/candidate/CVBuilderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Custom icon component to ensure proper rendering
const TabIcon = ({ name, size = 24, color = colors.primary }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons
        name={name}
        size={size}
        color={color}
        style={{
          textAlign: 'center',
          includeFontPadding: false,
        }}
      />
    </View>
  );
};

// Job Stack Navigator
const JobStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="JobSearch"
        component={JobSearchScreen}
        options={{ title: 'Job Search' }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{
          title: 'Job Details',
          headerBackTitle: 'Jobs', // iOS back button text
        }}
      />
    </Stack.Navigator>
  );
};

// Main Candidate Tab Navigator
const CandidateNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Jobs':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Applications':
              iconName = focused ? 'document' : 'document-outline';
              break;
            case 'CV Builder':
              iconName = focused ? 'create' : 'create-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }
          // Use custom TabIcon component for better rendering
          return <TabIcon name={iconName} size={size || 24} color={color || colors.primary} />;
        },
        tabBarActiveTintColor: colors.primary || '#3B82F6',
        tabBarInactiveTintColor: colors.textSecondary || '#6B7280',
        tabBarStyle: {
          backgroundColor: colors.surface || '#FFFFFF',
          borderTopColor: colors.border || '#E5E7EB',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: colors.primary || '#3B82F6',
        },
        headerTintColor: colors.surface || '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={CandidateDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobStackNavigator}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Reset the Jobs stack to JobSearch when tab is pressed
            navigation.navigate('Jobs', {
              screen: 'JobSearch',
            });
          },
        })}
      />
      <Tab.Screen 
        name="Applications" 
        component={ApplicationsScreen}
        options={{ title: 'My Applications' }}
      />
      <Tab.Screen 
        name="CV Builder" 
        component={CVBuilderScreen}
        options={{ title: 'CV Builder' }}
      />
    </Tab.Navigator>
  );
};

export default CandidateNavigator;
