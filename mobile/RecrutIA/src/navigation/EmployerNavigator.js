import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

// Employer Screens
import EmployerDashboardScreen from '../screens/employer/DashboardScreen';
import JobManagementScreen from '../screens/employer/JobManagementScreen';
import CandidatesScreen from '../screens/employer/CandidatesScreen';
import EmployerProfileScreen from '../screens/employer/ProfileScreen';
import JobFormScreen from '../screens/employer/JobFormScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Employer Tab Navigator (for main screens)
const EmployerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Jobs':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Candidates':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.surface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={EmployerDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobManagementScreen}
        options={{ title: 'Job Management' }}
      />
      <Tab.Screen
        name="Candidates"
        component={CandidatesScreen}
        options={{ title: 'Candidates' }}
      />
      <Tab.Screen
        name="Profile"
        component={EmployerProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Main Employer Stack Navigator (includes modal screens)
const EmployerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="EmployerTabs"
        component={EmployerTabNavigator}
      />
      <Stack.Screen
        name="JobForm"
        component={JobFormScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default EmployerNavigator;
