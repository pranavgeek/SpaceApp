// SellerPlansScreen.js - Updated to use React Native IAP
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import * as API from "../backend/db/API";
import { useFocusEffect } from "@react-navigation/native"; // Add this import

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
  getAvailablePurchases,
} from "react-native-iap";

function SellerPlansScreen({ navigation }) {
  const { width } =
    Platform.OS === "web" ? { width: window.innerWidth } : { width: 0 };
  const isDesktopWeb = Platform.OS === "web" && width >= 768;
  const { colors } = useTheme();
  const { user, updateRole } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("yearly"); // 'yearly' or 'monthly'
  const [purchaseProcessed, setPurchaseProcessed] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [subscriptionExpireDate, setSubscriptionExpireDate] = useState(null);

  // Force refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // When the screen is focused, refresh user data
      console.log("🔄 Screen focused, fetching latest user data");
      if (user && user.user_id) {
        setLoading(true);
        API.fetchUserById(user.user_id)
          .then((freshUserData) => {
            console.log("📱 Fresh user data fetched:", freshUserData);
            if (updateRole && freshUserData.tier) {
              console.log(
                `Updating local context to tier: ${freshUserData.tier}`
              );
              updateRole(freshUserData.role || "seller", freshUserData.tier);
            }

            // Fetch subscription expiration date if available
            if (freshUserData.subscription_end_date) {
              setSubscriptionExpireDate(
                new Date(freshUserData.subscription_end_date)
              );
            } else {
              // If we don't have it from the user data, try to get it from AsyncStorage
              fetchSubscriptionEndDate();
            }

            setLoading(false);
          })
          .catch((error) => {
            console.error("❌ Error fetching user data:", error);
            setLoading(false);
          });
      }
      return () => {
        // Cleanup when screen loses focus if needed
      };
    }, [user?.user_id])
  );

  // Fetch subscription end date from AsyncStorage
  const fetchSubscriptionEndDate = async () => {
    try {
      const storedDate = await AsyncStorage.getItem("subscriptionEndDate");
      if (storedDate) {
        setSubscriptionExpireDate(new Date(storedDate));
      }
    } catch (error) {
      console.error("Error fetching subscription end date:", error);
    }
  };

  // Define your subscription SKUs (matching App Store Connect & Play Console)
  const SUBSCRIPTION_SKUS = {
    // Pro Plan
    proMonthly: Platform.select({
      ios: "com.thespaceapp.sellerpro.month",
      android: "sellerpro_monthly",
    }),
    proYearly: Platform.select({
      ios: "com.thespaceapp.sellerpro.year",
      android: "sellerpro_yearly",
    }),
    // Enterprise Plan
    enterpriseMonthly: Platform.select({
      ios: "com.thespaceapp.sellerenterprise.month",
      android: "sellerenterprise_monthly",
    }),
    enterpriseYearly: Platform.select({
      ios: "com.thespaceapp.sellerenterprise.year",
      android: "sellerenterprise_yearly",
    }),
  };

  // Map plan IDs to SKU keys
  const PLAN_ID_TO_SKU = {
    pro: {
      monthly: "proMonthly",
      yearly: "proYearly",
    },
    enterprise: {
      monthly: "enterpriseMonthly",
      yearly: "enterpriseYearly",
    },
  };

  const checkStoreKitSetup = async () => {
    try {
      console.log("Checking StoreKit setup...");

      // Check if we're on a simulator
      const isSimulator =
        Platform.OS === "ios" &&
        !["iPhone", "iPad", "iPod"].includes(
          Platform.constants?.utsname?.machine || ""
        );

      console.log(`Running on ${isSimulator ? "simulator" : "device"}`);

      if (isSimulator) {
        console.log("For simulator testing, ensure:");
        console.log(
          "1. StoreKit file has .storekit extension and is added to Xcode project"
        );
        console.log("2. 'StoreKit Configuration' is enabled in Scheme options");
        console.log(
          "3. The correct configuration file is selected in Scheme options"
        );
      }

      // Try to fetch product details as a test
      const testSKUs = Object.values(SUBSCRIPTION_SKUS).filter(Boolean);
      console.log(`Testing with SKUs: ${testSKUs.join(", ")}`);

      const testProducts = await getSubscriptions({ skus: testSKUs });

      if (testProducts && testProducts.length > 0) {
        console.log(
          "✅ StoreKit is working! Found products:",
          testProducts.length
        );
        return true;
      } else {
        console.warn("⚠️ No products returned from StoreKit");
        return false;
      }
    } catch (error) {
      console.error("❌ StoreKit check failed:", error);
      return false;
    }
  };

  // Call this in your component initialization or add a button to trigger it
  useEffect(() => {
    if (__DEV__) {
      checkStoreKitSetup().then((isWorking) =>
        console.log(`StoreKit setup check: ${isWorking ? "PASSED" : "FAILED"}`)
      );
    }
  }, []);



  useEffect(() => {
    // Debug log user state changes
    console.log(
      "👤 User changed:",
      JSON.stringify(
        {
          id: user?.user_id,
          role: user?.role,
          tier: user?.tier,
        },
        null,
        2
      )
    );
  }, [user]);

  useEffect(() => {
    // This effect will run when user.tier changes
    console.log("User tier changed:", user?.tier);

    // Force a re-render to update the current plan badge
    if (user?.tier) {
      setLoading(true);
      setTimeout(() => setLoading(false), 100); // Increased timeout slightly
    }
  }, [user?.tier]);

  // Initialize IAP and fetch products
  useEffect(() => {
    let purchaseUpdateSubscription;
    let purchaseErrorSubscription;

    const initializeIAP = async () => {
      try {
        const isSimulator =
          Platform.OS === "ios" &&
          !["iPhone", "iPad", "iPod"].includes(
            Platform.constants?.utsname?.machine || ""
          );

        console.log(
          `🚀 Initializing IAP on ${Platform.OS} ${isSimulator ? "simulator" : "device"}...`
        );

        // Get the actual SKUs we'll be using based on platform
        const subscriptionSkus =
          Object.values(SUBSCRIPTION_SKUS).filter(Boolean);
        console.log("SKUs we'll be requesting:", subscriptionSkus);

        // Initialize StoreKit
        if (Platform.OS === "ios") {
          try {
            if (isSimulator) {
              // For simulator, explicitly use StoreKit 2 test mode
              await setup({
                storekitMode: "STOREKIT2_MODE",
              });
              console.log(
                "✅ iOS StoreKit2 test mode initialized for simulator"
              );
            } else {
              // For physical device, use regular setup
              await setup();
              console.log("✅ iOS StoreKit initialized for device");
            }
          } catch (setupError) {
            console.error("❌ StoreKit setup failed:", setupError);
          }
        }

        // Connect to the store
        await initConnection();
        console.log("✅ Connected to store");

        // Fetch available subscriptions
        console.log(`🔍 Fetching subscriptions with SKUs:`, subscriptionSkus);
        let availableProducts = [];

        try {
          availableProducts = await getSubscriptions({
            skus: subscriptionSkus,
          });

          console.log(
            `Got ${availableProducts.length} products:`,
            availableProducts.map((p) => p.productId || "unknown")
          );
        } catch (fetchError) {
          console.warn("❌ Error fetching products:", fetchError);
        }

        // If no products and in simulator, use hardcoded products for testing
        if (availableProducts.length === 0 && (isSimulator || __DEV__)) {
          console.log(
            "🔧 Using hardcoded products for simulator/development testing"
          );

          // Use the same pricing from your StoreKit configuration
          availableProducts = [
            {
              productId: "com.thespaceapp.sellerpro.month",
              localizedPrice: "$22.99",
              title: "Seller Pro Monthly",
              description: "50 Collaboration — $29.99/mo. Cancel anytime.",
              price: 22.99,
              currency: "USD",
            },
            {
              productId: "com.thespaceapp.sellerpro.year",
              localizedPrice: "$249.99",
              title: "Seller Pro Yearly",
              description: "600 Collaboration — $9.99/mo. Cancel anytime.",
              price: 249.99,
              currency: "USD",
            },
            {
              productId: "com.thespaceapp.sellerenterprise.month",
              localizedPrice: "$69.99",
              title: "Seller Enterprise Monthly",
              description: "Advanced tools — $99.99/mo. Cancel anytime.",
              price: 69.99,
              currency: "USD",
            },
            {
              productId: "com.thespaceapp.sellerenterprise.year",
              localizedPrice: "$899.99",
              title: "Seller Enterprise Yearly",
              description: "Advanced tools — $1199.99/mo. Cancel anytime.",
              price: 899.99,
              currency: "USD",
            },
          ];
        }

        setProducts(availableProducts);
        setLoading(false);
      } catch (err) {
        console.error("❌ IAP initialization error:", err);
        setLoading(false);

        Alert.alert(
          "Error",
          "Failed to connect to the store. Please try again later."
        );
      }
    };

    // Set up purchase listeners
    const setupPurchaseListeners = () => {
      console.log("🔄 Setting up purchase listeners...");

      // Listen for successful purchases
      purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
        try {
          // Prevent duplicate processing
          if (purchaseProcessed) {
            console.log(
              "🛑 Purchase already processed in this session, ignoring"
            );
            return;
          }

          // Log purchase details for debugging
          console.log(
            "🧾 Purchase event received:",
            JSON.stringify(purchase, null, 2)
          );

          const productId = purchase.productId;
          console.log("📦 Purchase product ID:", productId);

          // Set flag to prevent duplicate processing
          setPurchaseProcessed(true);

          // Try to complete the transaction but handle errors gracefully
          try {
            console.log("⚙️ Attempting to finish transaction...");
            // Check if transaction can be finished (has required properties)
            if (purchase.transactionId || purchase.orderId) {
              await finishTransaction({ purchase, isConsumable: false });
              console.log("✅ Transaction finished successfully");
            } else {
              console.log(
                "⚠️ Cannot finish transaction - missing required transaction ID"
              );
              // Continue with purchase flow despite not being able to finish
            }
          } catch (finishError) {
            console.warn(
              "⚠️ Could not finish transaction, continuing anyway:",
              finishError
            );
            // Continue with purchase flow despite transaction finish error
          }

          // Process purchase regardless of transaction finish success
          let planId, planType;

          // Determine which plan was purchased based on the productId
          console.log("🔍 Looking for matching subscription SKU...");
          for (const [key, value] of Object.entries(SUBSCRIPTION_SKUS)) {
            console.log(`Checking if ${value} matches ${productId}`);
            if (value === productId) {
              // Extract planId and planType from the key (e.g., proMonthly)
              if (key.includes("pro")) {
                planId = "pro";
              } else if (key.includes("enterprise")) {
                planId = "enterprise";
              }

              planType = key.includes("Monthly") ? "monthly" : "yearly";
              console.log(`✅ Found match! Plan: ${planId}, Type: ${planType}`);
              break;
            }
          }

          // Calculate and save subscription end date based on plan type
          let endDate = new Date();
          if (planType === "monthly") {
            endDate.setMonth(endDate.getMonth() + 1);
          } else {
            // yearly
            endDate.setFullYear(endDate.getFullYear() + 1);
          }

          // Store the subscription end date
          setSubscriptionExpireDate(endDate);
          await AsyncStorage.setItem(
            "subscriptionEndDate",
            endDate.toISOString()
          );
          console.log(
            `✅ Subscription will expire on: ${endDate.toLocaleDateString()}`
          );

          // Update user role based on the purchased subscription
          if (planId) {
            const role = "seller";
            const tier = planId;

            console.log(
              `📝 Updating user ${user?.user_id} to role: ${role}, tier: ${tier}`
            );

            try {
              // Update on the server
              console.log("🌐 Updating server with force flag...");
              const serverResponse = await API.updateUserRole(
                user.user_id,
                role,
                tier,
                true,
                endDate.toISOString() // Pass the subscription end date to the server
              );
              console.log("✅ Server update response:", serverResponse);

              // Store locally
              console.log("💾 Updating AsyncStorage...");
              await AsyncStorage.setItem("userRole", role);
              await AsyncStorage.setItem("userTier", tier);
              console.log("✅ AsyncStorage updated");

              // Update in context if available - wait for this to complete
              if (updateRole) {
                console.log("🔄 Updating context with updateRole()...");
                await updateRole(role, tier);
                console.log("✅ Context updated to tier:", tier);
              } else {
                console.warn("⚠️ updateRole function not available!");
              }

              // Force a UI refresh
              console.log("🔄 Forcing UI refresh...");
              setLoading(true);
              setTimeout(() => {
                setLoading(false);

                // Re-fetch user data to ensure we have the latest state
                if (user && user.user_id) {
                  API.fetchUserById(user.user_id)
                    .then((freshUserData) => {
                      console.log("🔄 Fresh user data fetched:", freshUserData);
                      if (updateRole) {
                        updateRole(
                          freshUserData.role || "seller",
                          freshUserData.tier
                        );
                        console.log(
                          "✅ User context refreshed with latest data:",
                          freshUserData.tier
                        );
                      }
                    })
                    .catch((error) => {
                      console.error(
                        "❌ Error fetching fresh user data:",
                        error
                      );
                    });
                }
              }, 300);

              // Show success alert
              Alert.alert(
                "Subscription Successful",
                `Your ${planId} subscription has been activated successfully!`,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      console.log(
                        "🏠 Navigating to Home with subscriptionSuccess param"
                      );
                      // navigation.reset({
                      //   index: 0,
                      //   routes: [
                      //     {
                      //       name: "Home",
                      //       params: { subscriptionSuccess: true },
                      //     },
                      //   ],
                      // });
                    },
                  },
                ]
              );
            } catch (updateErr) {
              console.error("❌ Error during role/tier update:", updateErr);
              setPurchaseProcessed(false); // Reset flag on error to allow retry
              Alert.alert(
                "Update Error",
                "Your purchase was successful, but we had trouble updating your account. Please try restarting the app or contact support."
              );
            }
          } else {
            console.warn("⚠️ Could not determine plan ID from purchase!");
            setPurchaseProcessed(false); // Reset flag on error to allow retry
            Alert.alert(
              "Error",
              "We couldn't determine which plan you purchased. Please contact support."
            );
          }
        } catch (err) {
          console.error("❌ Failed to process purchase:", err);
          setPurchaseProcessed(false); // Reset flag on error to allow retry
          Alert.alert(
            "Error",
            "There was an issue completing your purchase. Please try again."
          );
        }
      });

      // Listen for purchase errors
      purchaseErrorSubscription = purchaseErrorListener((error) => {
        console.warn("❌ Purchase error:", error);

        if (error.code === "E_USER_CANCELLED") {
          console.log("User cancelled the purchase");
        } else {
          Alert.alert(
            "Purchase Failed",
            error.message || "There was an error processing your purchase."
          );
        }
      });

      console.log("✅ Purchase listeners set up");
    };

    // Run initialization and setup
    initializeIAP();
    setupPurchaseListeners();

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up IAP resources...");
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }

      // Don't end connection here if you have other screens that use IAP
      // Only call this when your app is exiting
      // endConnection();
    };
  }, []); // Only run once when component mounts

  useEffect(() => {
    const syncPlanData = async () => {
      if (!user) return;

      console.log("🔄 Syncing plan data for user:", user.user_id);
      console.log("Current user tier from API:", user.tier);

      try {
        // Get stored tier
        const storedTier = await AsyncStorage.getItem("userTier");
        console.log("Tier from AsyncStorage:", storedTier);

        // Get stored subscription end date if any
        await fetchSubscriptionEndDate();

        // If user object has a tier but doesn't match stored tier,
        // update the AsyncStorage to match the user object
        if (user.tier && user.tier !== storedTier) {
          console.log(
            `Updating AsyncStorage tier: ${storedTier} -> ${user.tier}`
          );
          await AsyncStorage.setItem("userTier", user.tier);
        }

        // If user object doesn't have a tier but we have one in storage,
        // update the user context with the stored tier
        if (!user.tier && storedTier && updateRole) {
          console.log(`Updating user context with stored tier: ${storedTier}`);
          // This assumes updateRole updates the user context
          updateRole(user.role || "seller", storedTier);
        }

        // If we're on a physical device, check for purchases via the store
        if (Platform.OS !== "web" && !user.tier) {
          try {
            console.log("Checking store for previous purchases...");
            const purchases = await getAvailablePurchases();
            if (purchases && purchases.length > 0) {
              console.log("Found purchases:", purchases.length);
              // Parse purchases to find active subscriptions
              processPurchases(purchases);
            } else {
              console.log("No purchases found in store");
            }
          } catch (err) {
            console.warn("Error checking store purchases:", err);
          }
        }
      } catch (error) {
        console.error("Error syncing plan data:", error);
      }
    };

    syncPlanData();
  }, [user]);

  // Format the expiration date for display
  const formatExpirationDate = (date) => {
    if (!date) return "";

    // Format: January 1, 2025
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async (reason) => {
    if (!user || !user.tier || user.tier === "basic") {
      Alert.alert("Error", "You don't have an active subscription to cancel.");
      return;
    }
  
    try {
      setIsCancelling(true);
      console.log(
        `Starting cancellation process for plan: ${user.tier} with reason: ${reason}`
      );
  
      // For iOS and Android, we'll still show the platform-specific subscription management
      // but we'll also immediately downgrade them to basic plan in our system
      
      // First, call the API to record the cancellation
      console.log("Web/other platform detected, cancelling via backend API");
  
      try {
        // Check if the cancelSubscription function exists
        if (!API.cancelSubscription) {
          console.error("API.cancelSubscription function not found!");
          throw new Error("Cancel subscription function not available");
        }
  
        // Update the server to downgrade the account
        const result = await API.cancelSubscription(user.user_id, reason);
        console.log("Cancellation API result:", result);
  
        // After successful cancellation API call, reset to basic plan locally
        await resetToBasicPlan();
  
        // Clear the subscription end date
        await AsyncStorage.removeItem("subscriptionEndDate");
        setSubscriptionExpireDate(null);
        
        // Now direct the user to app store to actually cancel their payment
        if (Platform.OS === "ios") {
          console.log("iOS platform detected, redirecting to App Store subscriptions");
          
          Alert.alert(
            "Plan Downgraded",
            "Your account has been downgraded to the basic plan. To stop future payments, please also cancel your subscription in the App Store.",
            [
              {
                text: "Cancel in App Store",
                onPress: () => {
                  Linking.openURL("https://apps.apple.com/account/subscriptions");
                }
              },
              {
                text: "Done",
                style: "cancel",
                onPress: () => {}
              }
            ]
          );
        } else if (Platform.OS === "android") {
          console.log("Android platform detected, redirecting to Google Play subscriptions");
          
          Alert.alert(
            "Plan Downgraded",
            "Your account has been downgraded to the basic plan. To stop future payments, please also cancel your subscription in Google Play.",
            [
              {
                text: "Cancel in Google Play",
                onPress: () => {
                  Linking.openURL("https://play.google.com/store/account/subscriptions");
                }
              },
              {
                text: "Done",
                style: "cancel",
                onPress: () => {
                  // Navigate home after confirmation
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Home" }],
                  });
                }
              }
            ]
          );
        } else {
          // For web or other platforms, just show a confirmation
          Alert.alert(
            "Subscription Cancelled",
            "Your subscription has been cancelled. Your account has been downgraded to the basic plan.",
            [
              { 
                text: "OK",
                onPress: () => {
                  // Navigate home after confirmation
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "TabSettings" }],
                  });
                }
              }
            ]
          );
        }
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        Alert.alert(
          "Error",
          "Failed to cancel your subscription. Please try again or contact support."
        );
      }
    } catch (error) {
      console.error("Error processing subscription cancellation:", error);
      Alert.alert(
        "Error",
        "Failed to process your cancellation request. Please try again."
      );
    } finally {
      setIsCancelling(false);
      setCancelModalVisible(false);
    }
  };

  const clearPendingPurchases = async () => {
    try {
      console.log("🧹 Attempting to clear pending purchases...");

      // Get available purchases
      const purchases = await getAvailablePurchases();

      if (purchases && purchases.length > 0) {
        console.log(`Found ${purchases.length} purchases to clear`);

        // Try to finish each purchase
        for (const purchase of purchases) {
          try {
            if (purchase.transactionId || purchase.orderId) {
              await finishTransaction(purchase);
              console.log(`Cleared purchase: ${purchase.productId}`);
            }
          } catch (error) {
            console.warn(`Could not clear purchase: ${error}`);
          }
        }
      } else {
        console.log("No pending purchases to clear");
      }
    } catch (error) {
      console.error("Error clearing purchases:", error);
    }
  };

  // Request a subscription purchase
  const requestPurchase = async (sku) => {
    try {
      if (!user) {
        Alert.alert("Sign In Required", "Please sign in to purchase a subscription.");
        return;
      }
  
      console.log(`🛒 Initiating subscription purchase for SKU: ${sku}`);
      
      try {
        // Clear any pending transactions first
        if (Platform.OS === 'ios') {
          console.log("Clearing transaction queue before purchase...");
          try {
            await RNIap.clearTransactionIOS();
          } catch (err) {
            console.warn("Could not clear transactions:", err);
          }
        }
        
        // Use the standard approach for all subscriptions
        console.log(`Requesting subscription for ${sku}...`);
        await requestSubscription({ 
          sku
        });
        console.log(`Subscription request sent`);
      } catch (error) {
        console.warn(`Subscription request failed:`, error);
        throw error;
      }
    } catch (err) {
      console.warn("❌ Subscription request error:", err);
      
      // More helpful error message
      let errorMsg = "Failed to initiate subscription. Please try again.";
      
      if (err?.message?.includes("already owns")) {
        errorMsg = "You already own this subscription.";
      } else if (err?.message?.includes("Unable to Complete")) {
        errorMsg = "The App Store was unable to complete your request. Please try again after signing out and back in to your App Store account.";
      }
      
      Alert.alert("Subscription Error", errorMsg);
    }
  };

  const resetToBasicPlan = async () => {
    // Prevent multiple calls - guard clause
    if (isResetting) {
      console.log("Already resetting to basic plan, ignoring duplicate call");
      return;
    }

    console.log("Resetting to basic plan");
    setIsResetting(true);

    try {
      // First force clear AsyncStorage tier to prevent resync issues
      await AsyncStorage.removeItem("userTier");
      await AsyncStorage.setItem("userRole", "seller");
      await AsyncStorage.setItem("userTier", "basic");
      console.log("✅ AsyncStorage updated to basic plan");

      // Then update context - this should trigger UI updates
      if (updateRole) {
        // Force update the context with basic tier
        await updateRole("seller", "basic");
        console.log("✅ Context updated to basic plan");
      }

      // Then update the server - add a slight delay to ensure local state is updated first
      setTimeout(async () => {
        try {
          // Explicitly reset on backend with a force flag
          const response = await API.updateUserRole(
            user.user_id,
            "seller",
            "basic",
            true
          );
          console.log("✅ Server updated to basic plan:", response);

          // Fetch fresh user data to ensure everything is in sync
          const freshUserData = await API.fetchUserById(user.user_id);
          console.log("✅ Fresh user data:", freshUserData);

          // Force a refresh of the screen after server update
          setLoading(true);
          setTimeout(() => {
            console.log("⚡ Forcing UI refresh after basic plan change");
            setLoading(false);
            setIsResetting(false); // Reset the flag
          }, 300);
        } catch (error) {
          console.error("❌ Error updating server:", error);
          setIsResetting(false); // Reset the flag even on error
        }
      }, 300);
    } catch (error) {
      console.error("❌ Error resetting to basic plan:", error);
      setIsResetting(false); // Reset the flag even on error
    }
  };

  const processPurchases = async (purchases) => {
    if (!user) return;

    console.log("🔍 Processing purchases, count:", purchases.length);
    for (const purchase of purchases) {
      const productId = purchase.productId;
      console.log("Processing purchase for product:", productId);

      // Find which plan this product corresponds to
      let foundPlanId = null;
      let planType = null;

      for (const [key, value] of Object.entries(SUBSCRIPTION_SKUS)) {
        if (value === productId) {
          if (key.includes("pro")) {
            foundPlanId = "pro";
          } else if (key.includes("enterprise")) {
            foundPlanId = "enterprise";
          }

          // Determine if monthly or yearly subscription
          planType = key.includes("Monthly") ? "monthly" : "yearly";
          break;
        }
      }

      if (foundPlanId) {
        console.log(
          `Found subscription: ${foundPlanId} (${planType}) from product: ${productId}`
        );

        // Calculate expiration date based on purchase date and plan type
        // Since iOS/Android doesn't always provide exact expiration date
        // We need to approximate it from the original purchase date or current date
        const purchaseDate = purchase.transactionDate
          ? new Date(purchase.transactionDate)
          : new Date();

        let expirationDate = new Date(purchaseDate);
        if (planType === "monthly") {
          expirationDate.setMonth(expirationDate.getMonth() + 1);
        } else {
          // yearly
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        }

        // Store the expiration date
        await AsyncStorage.setItem(
          "subscriptionEndDate",
          expirationDate.toISOString()
        );
        setSubscriptionExpireDate(expirationDate);
        console.log(
          `✅ Subscription expires on: ${expirationDate.toLocaleDateString()}`
        );

        // Update AsyncStorage
        await AsyncStorage.setItem("userTier", foundPlanId);

        // Update user context if available
        if (updateRole) {
          updateRole("seller", foundPlanId);
        }

        // Update server - add a small delay to prevent race conditions
        try {
          console.log(`Updating server with found plan: ${foundPlanId}`);
          // Add delay between API calls
          await new Promise((resolve) => setTimeout(resolve, 500));
          await API.updateUserRole(
            user.user_id,
            "seller",
            foundPlanId,
            true,
            expirationDate.toISOString() // Pass expiration date to server
          );
          console.log("Updated server with role/tier");
        } catch (err) {
          console.warn("Failed to update server:", err);
        }

        break; // Stop after finding the first valid subscription
      }
    }
  };

  const handleMonthlySubscription = async (planId) => {
    try {
      console.log(`Starting monthly subscription flow for ${planId}`);
  
      // Get the SKU for this plan
      const skuKey = PLAN_ID_TO_SKU[planId]?.monthly;
      if (!skuKey) {
        console.error(`No monthly SKU found for plan ${planId}`);
        Alert.alert("Error", "Monthly subscription not available for this plan.");
        return;
      }
  
      const productId = SUBSCRIPTION_SKUS[skuKey];
      if (!productId) {
        console.error(`No product ID found for SKU key ${skuKey}`);
        Alert.alert("Error", "Product information not available.");
        return;
      }
  
      console.log(`Using product ID: ${productId} for monthly subscription`);
      
      // Use the unified requestPurchase approach for consistency
      await requestPurchase(productId);
    } catch (error) {
      console.error("Monthly subscription handler error:", error);
      Alert.alert(
        "Error",
        "Failed to set up subscription. Please try again later."
      );
    }
  };

  // Restore previous purchases
  const restorePurchases = async () => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to restore your purchases."
      );
      return;
    }

    try {
      setRestoring(true);
      console.log("🔄 Restoring purchases...");

      // Get available purchases from the store
      const restoredPurchases = await getAvailablePurchases();
      console.log("✅ Restored purchases:", restoredPurchases);

      if (restoredPurchases.length === 0) {
        Alert.alert(
          "No Purchases Found",
          "No previous subscription purchases were found for your account."
        );
        setRestoring(false);
        return;
      }

      // Process restored purchases
      let hasActiveSubscription = false;

      for (const purchase of restoredPurchases) {
        const productId = purchase.productId;
        console.log("Processing restored purchase:", productId);

        // Determine which plan was purchased
        for (const [key, value] of Object.entries(SUBSCRIPTION_SKUS)) {
          if (value === productId) {
            hasActiveSubscription = true;
            console.log(`Found matching subscription key: ${key}`);

            let planId;
            let planType;

            if (key.includes("pro")) {
              planId = "pro";
            } else if (key.includes("enterprise")) {
              planId = "enterprise";
            }

            planType = key.includes("Monthly") ? "monthly" : "yearly";

            if (planId) {
              const role = "seller";
              const tier = planId;
              console.log(
                `Restoring subscription: role=${role}, tier=${tier}, type=${planType}`
              );

              // Calculate expiration date
              const purchaseDate = purchase.transactionDate
                ? new Date(purchase.transactionDate)
                : new Date();

              let expirationDate = new Date(purchaseDate);
              if (planType === "monthly") {
                expirationDate.setMonth(expirationDate.getMonth() + 1);
              } else {
                // yearly
                expirationDate.setFullYear(expirationDate.getFullYear() + 1);
              }

              // Store the expiration date
              await AsyncStorage.setItem(
                "subscriptionEndDate",
                expirationDate.toISOString()
              );
              setSubscriptionExpireDate(expirationDate);
              console.log(
                `✅ Subscription expires on: ${expirationDate.toLocaleDateString()}`
              );

              // Update on the server with force flag
              await API.updateUserRole(
                user.user_id,
                role,
                tier,
                true,
                expirationDate.toISOString()
              );

              // Store locally
              await AsyncStorage.setItem("userRole", role);
              await AsyncStorage.setItem("userTier", tier);

              // Update in context if available
              if (updateRole) {
                updateRole(role, tier);
              }

              // Force refresh UI
              setLoading(true);
              setTimeout(() => setLoading(false), 300);
            }

            break;
          }
        }
      }

      Alert.alert(
        hasActiveSubscription
          ? "Purchases Restored"
          : "No Active Subscriptions",
        hasActiveSubscription
          ? "Your subscriptions have been restored successfully."
          : "No active subscriptions were found for your account.",
        [{ text: "OK" }]
      );
    } catch (err) {
      console.warn("Restore purchases error", err);
      Alert.alert(
        "Restore Failed",
        "Failed to restore your purchases. Please try again later."
      );
    } finally {
      setRestoring(false);
    }
  };

  // Function to find a product by plan ID and period
  const getProductDetails = (planId, period) => {
    if (planId === "basic") return null;

    // Get the SKU key for this plan and period
    const skuKey = PLAN_ID_TO_SKU[planId]?.[period];
    if (!skuKey) return null;

    // Get the product ID for this SKU
    const productId = SUBSCRIPTION_SKUS[skuKey];
    if (!productId) return null;

    // Find the product with this ID
    return products.find((product) => product.productId === productId);
  };

  // Define base plan details
  const plans = [
    {
      id: "basic",
      title: "Seller Basic",
      bullets: [
        "3 Products",
        "1 Collaboration feature",
        "Fees 5%",
        "Basic analytics",
        "Minimal branding",
        "Community access",
      ],
    },
    {
      id: "pro",
      title: "Seller Pro",
      bullets: [
        "All sellers features",
        "25 Products",
        "50 Collaboration features",
        "Fees 3%",
        "Advanced analytics",
        "Custom branding",
        "Priority support",
        "More robust tools",
      ],
    },
    {
      id: "enterprise",
      title: "Seller Enterprise",
      bullets: [
        "Unlimited Pro features + advanced tools",
        "Unlimited Products",
        "Unlimited Collaboration features",
        "Fees 2%",
        "Dedicated account manager",
        "White label solution",
        "Extended usage & resources",
        "Enterprise-level support",
      ],
    },
  ];

  // Check if user is on basic plan (default) - improved function
  const isBasicPlan = () => {
    const currentTier = user?.tier || "";
    console.log(`Checking isBasicPlan with user tier: "${currentTier}"`);
    // Only return true if user has no tier or specifically has 'basic' tier
    return (
      !currentTier ||
      currentTier.toLowerCase() === "basic" ||
      currentTier === ""
    );
  };

  // Improved hasPlan function - case insensitive and more robust
  const hasPlan = (planId) => {
    const currentTier = user?.tier || "";
    console.log(`Checking hasPlan(${planId}) with user tier: "${currentTier}"`);
    // User must exist and tier must match exactly (case insensitive)
    return currentTier.toLowerCase() === planId.toLowerCase();
  };

  // Handle plan selection
  const handleSelectPlan = (plan, period) => {
    console.log(`Selected plan: ${plan.id}, period: ${period}`);
    setSelectedPlan(plan);
    setSelectedPeriod(period);

    // Check if this is the free basic plan
    if (plan.id === "basic") {
      // For the free plan, just update the user role directly
      handleBasicPlanSelection();
      return;
    }

    // Check if user already has this plan
    // if (hasPlan(plan.id)) {
    //   Alert.alert("Plan Active", `You already have the ${plan.title} plan.`, [
    //     {
    //       text: "Manage Subscriptions",
    //       onPress: () => navigation.navigate("SubscriptionManagement"),
    //     },
    //     { text: "OK" },
    //   ]);
    //   return;
    // }

    if (period === "monthly") {
      // First show terms modal
      setTermsModalVisible(true);
    } else {
      // For yearly, just show terms modal (the normal flow works for yearly)
      setTermsModalVisible(true);
    }
  };

  // Handle basic (free) plan selection
  const handleBasicPlanSelection = async () => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to activate a seller plan.",
        [{ text: "OK" }]
      );
      return;
    }

    // Show confirmation for basic plan
    Alert.alert(
      "Confirm Basic Plan",
      "Activate the Seller Basic plan? This will convert your account to a seller account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: async () => {
            try {
              await resetToBasicPlan();

              // Clear any subscription expiration date
              setSubscriptionExpireDate(null);
              await AsyncStorage.removeItem("subscriptionEndDate");

              // Show success message after plan change
              Alert.alert(
                "Account Updated",
                "Your account has been upgraded to Seller Basic!",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Navigate home after confirmation
                      navigation.reset({
                        index: 0,
                        routes: [{ name: "Home" }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Error updating account:", error);
              Alert.alert(
                "Error",
                "Failed to update your account. Please try again later."
              );
            }
          },
        },
      ]
    );
  };

  // Proceed to purchase after terms acceptance
  const proceedToPurchase = () => {
    setTermsModalVisible(false);

    if (!selectedPlan || selectedPlan.id === "basic") return;

    // Get the product details based on the selected period (monthly or yearly)
    const product = getProductDetails(selectedPlan.id, selectedPeriod);

    if (!product) {
      Alert.alert(
        "Error",
        "Product information not available. Please try again later."
      );
      return;
    }

    console.log(
      `Initiating purchase for ${selectedPlan.id} - ${selectedPeriod} plan`
    );
    console.log(`Product ID: ${product.productId}`);

    // For monthly subscriptions, use the enhanced approach
    if (selectedPeriod === "monthly") {
      handleMonthlySubscription(selectedPlan.id);
    } else {
      // For yearly subscriptions, use the regular approach (which is working)
      requestPurchase(product.productId);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0096FF" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Blue Header Section */}
        <View style={styles.blueHeader}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}></View>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>
            The Best Way to Sell and{"\n"}Manage Your Products
          </Text>

          <Text style={styles.subtitle}>
            Subscribe to Seller Premium to unlock your{"\n"}
            advanced features, unlimited products, and{"\n"}
            dedicated support
          </Text>
          {/* {__DEV__ && (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => {
                Alert.alert(
                  "Subscription Test",
                  "Select a subscription to test",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Test Pro Monthly",
                      onPress: () => handleMonthlySubscription("pro"),
                    },
                    {
                      text: "Test Enterprise Monthly",
                      onPress: () => handleMonthlySubscription("enterprise"),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.debugButtonText}>Test Monthly</Text>
            </TouchableOpacity>
          )} */}
        </View>

        {/* Plans Content */}
        <View style={styles.plansContent}>
          {plans.map((plan, index) => {
            // Check if user already has this plan
            const isCurrentPlan =
              plan.id === "basic" ? isBasicPlan() : hasPlan(plan.id);

            // Debug log for cancel button rendering
            console.log(
              `DEBUG - Plan ${plan.id}: isCurrentPlan=${isCurrentPlan}, hasPlan=${hasPlan(plan.id)}, user.tier=${user?.tier}, condition=${isCurrentPlan && plan.id !== "basic"}`
            );

            // Get product details from store for monthly and yearly
            const monthlyProduct = getProductDetails(plan.id, "monthly");
            const yearlyProduct = getProductDetails(plan.id, "yearly");

            // Display prices from the app store products
            const monthlyPrice =
              plan.id === "basic"
                ? "$0"
                : monthlyProduct
                  ? monthlyProduct.localizedPrice
                  : "N/A";
            const yearlyPrice =
              plan.id === "basic"
                ? "$0"
                : yearlyProduct
                  ? yearlyProduct.localizedPrice
                  : "N/A";

            return (
              <View
                key={index}
                style={[
                  styles.planCard,
                  isCurrentPlan && styles.currentPlanCard,
                ]}
              >
                <Text style={styles.planTitle}>{plan.title}</Text>

                {isCurrentPlan && (
                  <View style={styles.currentPlanBadge}>
                    <Text style={styles.currentPlanText}>Current Plan</Text>
                  </View>
                )}

                {plan.bullets.map((bullet, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text
                      style={[
                        styles.bulletText,
                        isCurrentPlan && styles.fadedText,
                      ]}
                    >
                      {bullet}
                    </Text>
                  </View>
                ))}

                <View style={styles.planButtonsContainer}>
                  {/* Show Cancel Subscription button if this is the current plan and not basic */}
                  {isCurrentPlan && plan.id !== "basic" ? (
                    <View style={styles.currentPlanActionsContainer}>
                      <TouchableOpacity
                        style={styles.cancelSubscriptionButton}
                        onPress={() => setCancelModalVisible(true)}
                      >
                        <Text style={styles.cancelSubscriptionText}>
                          Cancel Subscription
                        </Text>
                      </TouchableOpacity>

                      {/* Display subscription expiration date if available */}
                      {subscriptionExpireDate && (
                        <View style={styles.expirationContainer}>
                          <Text style={styles.expirationLabel}>
                            Your plan renews on:
                          </Text>
                          <Text style={styles.expirationDate}>
                            {formatExpirationDate(subscriptionExpireDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    /* Otherwise show the regular purchase buttons */
                    <>
                      <TouchableOpacity
                        style={[
                          styles.planPriceButton,
                          styles.yearlyPlanButton,
                          isCurrentPlan && styles.disabledButton,
                        ]}
                        onPress={() => handleSelectPlan(plan, "yearly")}
                        disabled={isCurrentPlan}
                      >
                        <Text
                          style={[
                            styles.planButtonPrice,
                            isCurrentPlan && styles.fadedButtonText,
                          ]}
                        >
                          {yearlyPrice}
                        </Text>
                        <Text
                          style={[
                            styles.planButtonPeriod,
                            isCurrentPlan && styles.fadedButtonText,
                          ]}
                        >
                          Yearly
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.planPriceButton,
                          styles.monthlyPlanButton,
                          isCurrentPlan && styles.disabledButton,
                        ]}
                        onPress={() => handleSelectPlan(plan, "monthly")}
                        disabled={isCurrentPlan}
                      >
                        <Text
                          style={[
                            styles.planButtonPrice,
                            isCurrentPlan && styles.fadedButtonText,
                          ]}
                        >
                          {monthlyPrice}
                        </Text>
                        <Text
                          style={[
                            styles.planButtonPeriod,
                            isCurrentPlan && styles.fadedButtonText,
                          ]}
                        >
                          Monthly
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Restore Purchases Button */}
        {/* <TouchableOpacity
          style={styles.restoreButton}
          onPress={restorePurchases}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity> */}

        {/* Terms and Privacy Text */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By subscribing, you agree to our{" "}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL("https://yourapp.com/terms")}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL("https://yourapp.com/privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
          <Text style={styles.termsText}>
            Subscriptions renew automatically. Cancel anytime.
          </Text>
        </View>
      </ScrollView>

      {/* Manage Subscriptions Button */}
      {/* {user && user.tier && user.tier !== "basic" && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => navigation.navigate("SubscriptionManagement")}
        >
          <Text style={styles.manageButtonText}>Manage My Subscriptions</Text>
        </TouchableOpacity>
      )} */}

      {/* Terms and Conditions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsModalVisible}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>

            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>
                <Text style={styles.modalSubtitle}>Subscription Agreement</Text>
                {"\n\n"}
                By proceeding with this subscription, you agree to a recurring
                billing subscription plan. Your subscription will automatically
                renew according to your chosen frequency (monthly or yearly)
                until you cancel.
                {"\n\n"}
                <Text style={styles.modalSubtitle}>Auto-Renewal Terms</Text>
                {"\n\n"}
                Your subscription will automatically renew at the end of each
                billing period. To avoid being charged for the next billing
                period, you must cancel your subscription at least 24 hours
                before the end of the current period.
                {"\n\n"}
                <Text style={styles.modalSubtitle}>Cancellation Policy</Text>
                {"\n\n"}
                You can cancel your subscription at any time through your
                account settings or by contacting customer support. After
                cancellation, you will still have access to your subscription
                benefits until the end of your current billing period.
                {"\n\n"}
                <Text style={styles.modalSubtitle}>Refund Policy</Text>
                {"\n\n"}
                All subscription purchases are final and non-refundable, except
                as required by applicable law.
                {"\n\n"}
                <Text style={styles.modalSubtitle}>Price Changes</Text>
                {"\n\n"}
                We reserve the right to change subscription prices at any time.
                If we change the price of your subscription, we will notify you
                via email before charging the new price.
                {"\n\n"}
                <Text style={styles.modalSubtitle}>Payment Methods</Text>
                {"\n\n"}
                Subscriptions are processed through the App Store (for iOS
                users) or Google Play (for Android users). Your payment method
                will be charged according to your platform's terms.
              </Text>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setTermsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalAcceptButton]}
                onPress={proceedToPurchase}
              >
                <Text style={styles.modalAcceptButtonText}>
                  Accept & Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Subscription</Text>

            <Text style={styles.cancelModalText}>
              Are you sure you want to cancel your subscription? You will
              continue to have access until the end of your current billing
              period.
            </Text>

            {subscriptionExpireDate && (
              <View style={styles.expirationReminderContainer}>
                <Text style={styles.expirationReminderText}>
                  Your subscription is valid until{" "}
                  {formatExpirationDate(subscriptionExpireDate)}
                </Text>
              </View>
            )}

            <Text style={styles.modalSubtitle}>
              Tell us why you're cancelling (optional):
            </Text>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => setCancelReason("Too expensive")}
            >
              <Text style={styles.reasonText}>Too expensive</Text>
              {cancelReason === "Too expensive" && (
                <Text style={styles.reasonCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => setCancelReason("Not using enough")}
            >
              <Text style={styles.reasonText}>Not using enough</Text>
              {cancelReason === "Not using enough" && (
                <Text style={styles.reasonCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => setCancelReason("Found a better alternative")}
            >
              <Text style={styles.reasonText}>Found a better alternative</Text>
              {cancelReason === "Found a better alternative" && (
                <Text style={styles.reasonCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => setCancelReason("Missing features")}
            >
              <Text style={styles.reasonText}>Missing features</Text>
              {cancelReason === "Missing features" && (
                <Text style={styles.reasonCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Keep Subscription</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalDangerButton]}
                onPress={() => handleCancelSubscription(cancelReason)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalAcceptButtonText}>
                    Confirm Cancellation
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
    fontSize: 16,
  },
  // Subscription expiration styles
  currentPlanActionsContainer: {
    width: "100%",
  },
  expirationContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  expirationLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  expirationDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  expirationReminderContainer: {
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: 6,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#FFA000",
  },
  expirationReminderText: {
    fontSize: 14,
    color: "#FF6F00",
    textAlign: "center",
  },
  blueHeader: {
    backgroundColor: "#83b8d7",
    padding: 20,
    alignItems: "center",
    position: "relative",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logoBox: {},
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  featuresLink: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 20,
  },
  plansContent: {
    padding: 16,
    backgroundColor: "#fff",
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: "relative",
  },
  currentPlanCard: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
  },
  currentPlanBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#4caf50",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  currentPlanText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  bulletPoint: {
    marginRight: 8,
    color: "#666",
    fontSize: 14,
  },
  bulletText: {
    color: "#666",
    fontSize: 14,
    flex: 1,
  },
  fadedText: {
    color: "#999",
  },
  planButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 15,
  },
  planPriceButton: {
    width: "48%",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  yearlyPlanButton: {
    backgroundColor: "#69b0e1",
  },
  monthlyPlanButton: {
    backgroundColor: "#298fe3",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  planButtonPrice: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  planButtonPeriod: {
    color: "#fff",
    fontSize: 14,
  },
  fadedButtonText: {
    color: "#f0f0f0",
  },
  discountContainer: {
    alignItems: "center",
    marginBottom: 2,
  },
  originalPrice: {
    color: "#fff",
    fontSize: 14,
    textDecorationLine: "line-through",
    opacity: 0.8,
  },
  savingsLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#FF6347",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  manageButton: {
    backgroundColor: "#263980",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  manageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  restoreButton: {
    backgroundColor: "#555",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  restoreButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  termsContainer: {
    padding: 16,
    alignItems: "center",
  },
  termsText: {
    color: "#777",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  termsLink: {
    color: "#298fe3",
    textDecorationLine: "underline",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  cancelModalText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  modalSubtitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 6,
    width: "48%",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
  },
  modalButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  modalAcceptButton: {
    backgroundColor: "#298fe3",
  },
  modalDangerButton: {
    backgroundColor: "#e74c3c",
  },
  modalAcceptButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // Cancel subscription modal styles
  reasonButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 16,
    color: "#333",
  },
  reasonCheckmark: {
    fontSize: 18,
    color: "#4caf50",
    fontWeight: "bold",
  },
  cancelSubscriptionButton: {
    width: "100%",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#e74c3c",
    marginTop: 5,
  },
  cancelSubscriptionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default withIAPContext(SellerPlansScreen);
