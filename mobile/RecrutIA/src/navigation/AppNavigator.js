import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../screens/LoadingScreen';
import AuthNavigator from './AuthNavigator';
import CandidateNavigator from './CandidateNavigator';
import EmployerNavigator from './EmployerNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Route based on user role
  switch (user?.role?.toLowerCase()) {
    case 'candidate':
      return <CandidateNavigator />;
    case 'employer':
      return <EmployerNavigator />;
    default:
      return <CandidateNavigator />; // Default to candidate
  }
};

export default AppNavigator;
