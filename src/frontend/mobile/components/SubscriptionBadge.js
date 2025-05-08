// SubscriptionBadge.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubscriptionBadge = ({ navigation, user, colors }) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [user]);

  const fetchSubscriptionInfo = async () => {
    try {
      setIsLoading(true);
      
      // Get the user's tier from the user object or AsyncStorage
      const tier = user?.tier || await AsyncStorage.getItem('userTier') || 'basic';
      
      // In a real app, you would fetch more details from your API
      // For now, we'll use mock data based on the tier
      const subscriptionDetails = {
        tier,
        displayName: getTierDisplayName(tier),
        badgeColor: getTierColor(tier),
        textColor: '#FFFFFF',
        iconName: getTierIcon(tier)
      };
      
      setSubscriptionInfo(subscriptionDetails);
    } catch (error) {
      console.error("Error fetching subscription info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierDisplayName = (tier) => {
    switch(tier?.toLowerCase()) {
      case 'pro':
        return 'Pro';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Basic';
    }
  };

  const getTierColor = (tier) => {
    switch(tier?.toLowerCase()) {
      case 'pro':
        return '#298fe3'; // Blue for Pro
      case 'enterprise':
        return '#6200ea'; // Purple for Enterprise
      default:
        return '#8e8e8e'; // Gray for Basic
    }
  };

  const getTierIcon = (tier) => {
    switch(tier?.toLowerCase()) {
      case 'pro':
        return 'star';
      case 'enterprise':
        return 'diamond';
      default:
        return 'person';
    }
  };

  const handlePress = () => {
    // Navigate to subscription plans screen when badge is pressed
    navigation.navigate('SellerPlansScreen');
  };

  if (isLoading || !subscriptionInfo) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={[
        styles.badgeContainer, 
        { backgroundColor: subscriptionInfo.badgeColor }
      ]}
      onPress={handlePress}
    >
      <Ionicons 
        name={subscriptionInfo.iconName} 
        size={14} 
        color={subscriptionInfo.textColor} 
      />
      <Text style={[
        styles.badgeText, 
        { color: subscriptionInfo.textColor }
      ]}>
        {subscriptionInfo.displayName}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  }
});

export default SubscriptionBadge;