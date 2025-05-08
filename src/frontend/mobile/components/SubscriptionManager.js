// SubscriptionManager.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import RNIap, {
  withIAPContext,
  initConnection,
  endConnection,
  setup,
  getSubscriptions,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases
} from 'react-native-iap';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as API from '../backend/db/API';

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

// Map subscription IDs to the corresponding role and tier
const PLAN_MAPPING = {
  'proMonthly': { role: 'seller', tier: 'pro' },
  'proYearly': { role: 'seller', tier: 'pro' },
  'enterpriseMonthly': { role: 'seller', tier: 'enterprise' },
  'enterpriseYearly': { role: 'seller', tier: 'enterprise' },
};

const SubscriptionManager = ({ navigation }) => {
  const { user, updateRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    // Set up in-app purchase listeners
    let purchaseUpdateSubscription;
    let purchaseErrorSubscription;

    const initializeIAP = async () => {
      try {
        // Initialize StoreKit 2 on iOS
        if (Platform.OS === 'ios') {
          await setup({ storekitMode: 'STOREKIT2_MODE' });
        }

        // Connect to the store
        await initConnection();
        console.log('Connected to store');

        // Fetch available subscriptions
        const subscriptionSkus = Object.values(SUBSCRIPTION_SKUS);
        const availableProducts = await getSubscriptions({ skus: subscriptionSkus });
        console.log('Available subscriptions:', availableProducts);
        setProducts(availableProducts);
        setLoading(false);
      } catch (err) {
        console.warn('IAP initialization error', err);
        setLoading(false);
        Alert.alert('Error', 'Failed to connect to the store. Please try again later.');
      }
    };

    // Set up purchase listeners
    const setupPurchaseListeners = () => {
      // Listen for successful purchases
      purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
        try {
          const receipt = purchase.transactionReceipt || purchase.purchaseToken;
          console.log('🧾 Purchase success, receipt:', receipt);
      
          if (receipt) {
            // Complete the transaction with the platform
            console.log('⚙️ Finishing transaction with platform...');
            await finishTransaction(purchase);
            console.log('✅ Transaction finished with platform');
            
            // Get the ID from the purchased product
            const productId = purchase.productId;
            console.log('📦 Purchased product ID:', productId);
            
            let planId, planType;
            
            // Determine which plan was purchased based on the productId
            console.log('🔍 Looking for matching subscription SKU...');
            for (const [key, value] of Object.entries(SUBSCRIPTION_SKUS)) {
              console.log(`Checking if ${value} matches ${productId}`);
              if (value === productId) {
                // Extract planId and planType from the key (e.g., proMonthly)
                if (key.includes('pro')) {
                  planId = 'pro';
                } else if (key.includes('enterprise')) {
                  planId = 'enterprise';
                }
                
                planType = key.includes('Monthly') ? 'monthly' : 'yearly';
                console.log(`✅ Found match! Plan: ${planId}, Type: ${planType}`);
                break;
              }
            }
      
            // Update user role based on the purchased subscription
            if (planId) {
              const role = "seller";
              const tier = planId;
      
              console.log(`📝 Updating user ${user.user_id} to role: ${role}, tier: ${tier}`);
      
              try {
                // Update on the server
                console.log('🌐 Updating server...');
                const serverResponse = await API.updateUserRole(user.user_id, role, tier, true);
                console.log('✅ Server update response:', serverResponse);
                
                // Store locally - make sure we use exactly the same keys
                console.log('💾 Updating AsyncStorage...');
                await AsyncStorage.setItem("userRole", role);
                await AsyncStorage.setItem("userTier", tier);
                console.log('✅ AsyncStorage updated');
                
                // Update in context if available
                if (updateRole) {
                  console.log('🔄 Updating context with updateRole()...');
                  updateRole(role, tier);
                  console.log('✅ Context updated');
                } else {
                  console.warn('⚠️ updateRole function not available!');
                }
                
                // Force a refresh after everything is updated
                console.log('🔄 Forcing UI refresh...');
                setLoading(true);
                setTimeout(() => setLoading(false), 300);
              } catch (updateErr) {
                console.error('❌ Error during role/tier update:', updateErr);
              }
            } else {
              console.warn('⚠️ Could not determine plan ID from purchase!');
            }
      
            Alert.alert(
              "Subscription Successful",
              `Your subscription has been activated successfully!`,
              [
                {
                  text: "OK",
                  onPress: () => {
                    console.log('🏠 Navigating to Home with subscriptionSuccess param');
                    navigation.reset({
                      index: 0,
                      routes: [
                        { name: "Home", params: { subscriptionSuccess: true } },
                      ],
                    });
                  }
                },
              ]
            );
          }
        } catch (err) {
          console.error('❌ Failed to process purchase', err);
          Alert.alert(
            "Error",
            "There was an issue completing your purchase. Please try again."
          );
        }
      });

      // Listen for purchase errors
      purchaseErrorSubscription = purchaseErrorListener((error) => {
        console.warn('Purchase error:', error);
        
        if (error.code === 'E_USER_CANCELLED') {
          console.log('User cancelled the purchase');
        } else {
          Alert.alert('Purchase Failed', error.message || 'There was an error processing your purchase.');
        }
      });
    };

    // Run initialization
    initializeIAP();
    setupPurchaseListeners();

    // Cleanup on unmount
    return () => {
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }
      endConnection();
    };
  }, []);

  // Request a subscription purchase
  const requestPurchase = async (sku) => {
    try {
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to purchase a subscription.');
        return;
      }
      
      await requestSubscription({ sku });
    } catch (err) {
      console.warn('Subscription request error', err);
      Alert.alert('Error', 'Failed to initiate subscription. Please try again.');
    }
  };

  // Restore previous purchases
  const restorePurchases = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to restore your purchases.');
      return;
    }

    try {
      setRestoring(true);
      
      // Get available purchases from the store
      const restoredPurchases = await getAvailablePurchases();
      console.log('Restored purchases:', restoredPurchases);
      
      if (restoredPurchases.length === 0) {
        Alert.alert('No Purchases Found', 'No previous subscription purchases were found for your account.');
        setRestoring(false);
        return;
      }
      
      // Process restored purchases
      let hasActiveSubscription = false;
      
      for (const purchase of restoredPurchases) {
        const productId = purchase.productId;
        
        // Determine which plan was purchased
        for (const [key, value] of Object.entries(SUBSCRIPTION_SKUS)) {
          if (value === productId) {
            hasActiveSubscription = true;
            
            const planType = key.includes('Monthly') ? 'Monthly' : 'Yearly';
            let planId;
            
            if (key.includes('pro')) {
              planId = 'pro';
            } else if (key.includes('enterprise')) {
              planId = 'enterprise';
            }
            
            const fullKey = `${planId}${planType}`;
            
            if (PLAN_MAPPING[fullKey]) {
              const { role, tier } = PLAN_MAPPING[fullKey];
              
              // Update on the server
              await API.updateUserRole(user.user_id, role, tier);
              
              // Store locally
              await AsyncStorage.setItem('userRole', role);
              await AsyncStorage.setItem('userTier', tier);
              
              // Update in context if available
              if (updateRole) {
                updateRole(role, tier);
              }
            }
            
            break;
          }
        }
      }
      
      Alert.alert(
        hasActiveSubscription ? 'Purchases Restored' : 'No Active Subscriptions',
        hasActiveSubscription 
          ? 'Your subscriptions have been restored successfully.' 
          : 'No active subscriptions were found for your account.',
        [{ text: 'OK' }]
      );
      
    } catch (err) {
      console.warn('Restore purchases error', err);
      Alert.alert('Restore Failed', 'Failed to restore your purchases. Please try again later.');
    } finally {
      setRestoring(false);
    }
  };

  // Function to find a specific product by ID
  const findProductBySku = (sku) => {
    return products.find(product => product.productId === sku);
  };

  // Get product details by plan ID and period
  const getProductDetails = (planId, period) => {
    const skuKey = `${planId}${planType === 'monthly' ? 'Monthly' : 'Yearly'}`;
    console.log(`Looking up PLAN_MAPPING with key: ${skuKey}`);
    return findProductBySku(sku);
  };

  return {
    products,
    loading,
    restoring,
    requestPurchase,
    restorePurchases,
    getProductDetails
  };
};

export default withIAPContext(SubscriptionManager);