import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ProfileStackNavigator from '../navigation/ProfileStack';

export default function ProfileRouter(props) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  // We simply return the ProfileStackNavigator which will handle
  // the screen selection internally based on user.role/account_type
  return <ProfileStackNavigator {...props} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});