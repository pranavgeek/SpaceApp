// SubscriptionManagementScreen.js - Updated for React Native IAP
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as API from '../backend/db/API';
import RNIap, {
  withIAPContext,
  getAvailablePurchases,
  finishTransaction,
  requestSubscription,
} from 'react-native-iap';

const SubscriptionManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define your subscription SKUs (must match App Store Connect & Play Console)
  const SUBSCRIPTION_SKUS = {
    // Pro Plan
    proMonthly: Platform.select({
      ios: 'com.thespaceapp.sellerpro.monthly', 
      android: 'sellerpro_monthly'
    }),
    proYearly: Platform.select({ 
      ios: 'com.thespaceapp.sellerpro.yearly', 
      android: 'sellerpro_yearly'
    }),
    // Enterprise Plan
    enterpriseMonthly: Platform.select({
      ios: 'com.thespaceapp.sellerenterprise.monthly', 
      android: 'sellerenterprise_monthly'
    }),
    enterpriseYearly: Platform.select({ 
      ios: 'com.thespaceapp.sellerenterprise.yearly', 
      android: 'sellerenterprise_yearly'
    }),
  };

  // Fetch subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Format display name based on product ID
  const formatPlanName = (productId) => {
    // Check which plan this is
    for (const [key, value] of Object.entries(SUBSCRIPTION_SKUS)) {
      if (value === productId) {
        if (key.includes('pro')) {
          return key.includes('Monthly') ? 'Seller Pro (Monthly)' : 'Seller Pro (Yearly)';
        } else if (key.includes('enterprise')) {
          return key.includes('Monthly') ? 'Seller Enterprise (Monthly)' : 'Seller Enterprise (Yearly)';
        }
      }
    }
    return 'Unknown Subscription';
  };

  // Fetch user's subscriptions from the store
  const fetchSubscriptions = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get purchases from the app store
      const availablePurchases = await getAvailablePurchases();
      
      // Filter for active subscriptions
      const validSubscriptions = availablePurchases.filter(purchase => {
        // On iOS, check the expirationDate
        if (Platform.OS === 'ios' && purchase.expirationDate) {
          const expiryDate = new Date(purchase.expirationDate);
          const now = new Date();
          return expiryDate > now;
        }
        
        // On Android, we can use purchase state
        return purchase.isSubscription && !purchase.isCancelled;
      });
      
      // Format the subscriptions for display
      const formattedSubscriptions = validSubscriptions.map(subscription => {
        // Extract relevant data
        const startDate = subscription.transactionDate 
          ? new Date(subscription.transactionDate) 
          : new Date();
        
        let expirationDate = null;
        if (subscription.expirationDate) {
          expirationDate = new Date(subscription.expirationDate);
        }
        
        return {
          id: subscription.transactionId || subscription.purchaseToken,
          plan_name: formatPlanName(subscription.productId),
          status: 'active',
          start_date: startDate.toISOString(),
          expiration_date: expirationDate ? expirationDate.toISOString() : null,
          recur_unit: subscription.productId.includes('yearly') ? 'year' : 'month',
          amount: subscription.price || '0.00',
          productId: subscription.productId,
          payment_method: {
            card_type: Platform.OS === 'ios' ? 'App Store' : 'Google Play',
            last_digits: '****'
          }
        };
      });
      
      setSubscriptions(formattedSubscriptions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Could not load your subscriptions. Please try again later.');
      setLoading(false);
    }
  };

  // Handle subscription cancellation - redirects to the appropriate store
  const handleCancelSubscription = (subscription) => {
    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel your ${subscription.plan_name} subscription? You will lose access at the end of your billing period.`,
      [
        {
          text: 'No, Keep It',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // Redirect to the appropriate store to manage the subscription
            if (Platform.OS === 'ios') {
              Linking.openURL('https://apps.apple.com/account/subscriptions');
            } else if (Platform.OS === 'android') {
              Linking.openURL('https://play.google.com/store/account/subscriptions');
            } else {
              Alert.alert(
                'Cancel Subscription',
                'To cancel your subscription, please visit the App Store on iOS or Google Play Store on Android.'
              );
            }
          },
        },
      ]
    );
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate next billing date
  const getNextBillingDate = (subscription) => {
    if (subscription.status !== 'active') {
      return null;
    }
    
    if (subscription.expiration_date) {
      return new Date(subscription.expiration_date);
    }
    
    const startDate = new Date(subscription.start_date);
    const today = new Date();
    let nextBilling = new Date(startDate);
    
    // Adjust based on recur_unit
    if (subscription.recur_unit === 'year') {
      // For yearly subscriptions, increment year until we find a future date
      while (nextBilling < today) {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      }
    } else {
      // For monthly subscriptions, increment month until we find a future date
      while (nextBilling < today) {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }
    }
    
    return nextBilling;
  };

  // Render each subscription item
  const renderSubscriptionItem = ({ item }) => {
    const nextBillingDate = getNextBillingDate(item);
    const isActive = item.status === 'active';
    
    return (
      <View style={[styles.subscriptionCard, !isActive && styles.inactiveCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.planName}>{item.plan_name}</Text>
          <View style={[
            styles.statusBadge,
            isActive ? styles.activeStatus : styles.cancelledStatus
          ]}>
            <Text style={styles.statusText}>
              {isActive ? 'Active' : 'Cancelled'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Billing Amount:</Text>
            <Text style={styles.detailValue}>{item.amount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Billing Cycle:</Text>
            <Text style={styles.detailValue}>
              {item.recur_unit === 'year' ? 'Yearly' : 'Monthly'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started On:</Text>
            <Text style={styles.detailValue}>{formatDate(item.start_date)}</Text>
          </View>
          
          {isActive && nextBillingDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Billing:</Text>
              <Text style={styles.detailValue}>
                {formatDate(nextBillingDate)}
              </Text>
            </View>
          )}
          
          {!isActive && item.cancellation_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cancelled On:</Text>
              <Text style={styles.detailValue}>{formatDate(item.cancellation_date)}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>
              {item.payment_method?.card_type || Platform.OS === 'ios' ? 'App Store' : 'Google Play'} 
              {item.payment_method?.last_digits ? ` ending in ${item.payment_method.last_digits}` : ''}
            </Text>
          </View>
        </View>
        
        {isActive && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelSubscription(item)}
          >
            <Text style={styles.cancelButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0096FF" />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchSubscriptions}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render no subscriptions state
  if (subscriptions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Subscriptions</Text>
          <Text style={styles.emptyMessage}>
            You don't have any active or past subscriptions. 
            Subscribe to a plan to access premium features.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('SellerPlansScreen')}
          >
            <Text style={styles.browseButtonText}>Browse Plans</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render subscription list
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Subscriptions</Text>
        <Text style={styles.headerSubtitle}>
          Subscriptions are managed through {Platform.OS === 'ios' ? 'the App Store' : 'Google Play'}
        </Text>
      </View>
      
      <FlatList
        data={subscriptions}
        renderItem={renderSubscriptionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={fetchSubscriptions}
      >
        <Text style={styles.refreshButtonText}>Refresh Subscriptions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => navigation.navigate('SellerPlansScreen')}
      >
        <Text style={styles.upgradeButtonText}>Change or Upgrade Plan</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  inactiveCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  activeStatus: {
    backgroundColor: '#e6f7eb',
  },
  cancelledStatus: {
    backgroundColor: '#ffe6e6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#777',
    fontSize: 14,
  },
  detailValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButtonText: {
    color: '#298fe3',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0096FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  browseButton: {
    backgroundColor: '#0096FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#0096FF',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default withIAPContext(SubscriptionManagementScreen);