import React, { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { CommonActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import NotificationScreen from "../screens/NotificationScren";
import ProductScreen from "../screens/ProductScreen";
import { useTheme } from "../theme/ThemeContext.js";
import { useAuth } from "../context/AuthContext";
import BuyerProfileScreen from "../screens/BuyerProfileScreen";
import CollaborationRequestScreen from "../screens/CollaborationRequestScreen";
import InfluencerProfileScreen from "../screens/InfluencerProfileScreen.js";
import BuyerOrderScreen from "../screens/BuyerOrdersScreen.js";
import SellerOrderScreen from "../screens/SellerOrderScreen.js";
import ShippingDetailScreen from "../screens/ShippingDetailScreen.js";
import TrackNotification from "../screens/TrackNotification.js";
import FavoritesScreen from "../screens/FavoritesScreen.js";
import PayoutScreen from "../screens/PayoutScreen.js";
import InfluencerOrderScreen from "../screens/InfluencerOrderScreen.js";
import ActiveCampaignsScreen from "../screens/ActiveCampaignsScreen.js";
import PendingCampaignsScreen from "../screens/PendingCampaignsScreen.js";
import ClosedCampaignsScreen from "../screens/ClosedCampaignsScreen.js";
import FollowerScreen from "../screens/FollowerScreen.js";
import UserProfileScreen from "../screens/UserProfileScreen.js";
import FollowingScreen from "../screens/FollowingScreen.js";
import ViewProfileScreen from "../screens/ViewProfileScreen.js";
import FormScreen from "../screens/FormScreen.js";
import SellerPlansScreen from "../screens/SellerPlansScreen.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUserById } from "../backend/db/API";

const ProfileStack = createNativeStackNavigator();

const ProfileStackNavigator = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, setUser } = useAuth();

  // This effect will run every time the component is rendered
  useEffect(() => {
    let isMounted = true;

    const refreshUserProfile = async () => {
      try {
        // Always fetch fresh user data from the server
        const freshUserData = await fetchUserById(user.user_id);

        if (!isMounted) return;

        if (freshUserData) {
          // Log the user data for debugging
          console.log(
            "Fresh user data from server:",
            JSON.stringify(freshUserData)
          );
          console.log("Server account_type:", freshUserData.account_type);
          console.log("Server role:", freshUserData.role);

          // Compare with what's in AsyncStorage
          const storedUserStr = await AsyncStorage.getItem("user");
          const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

          // Determine if update is needed
          const needsUpdate =
            !storedUser ||
            storedUser.account_type !== freshUserData.account_type ||
            storedUser.role !== freshUserData.role;

          if (needsUpdate) {
            console.log(
              "USER DATA NEEDS UPDATE - Outdated information detected"
            );

            // Update AsyncStorage
            const updatedUser = {
              ...user,
              ...freshUserData,
              // Ensure both fields are set
              account_type: freshUserData.account_type,
              role: freshUserData.role?.toLowerCase(),
            };

            await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
            console.log("AsyncStorage updated with fresh user data");

            // Update context
            if (setUser) {
              setUser(updatedUser);
              console.log("Auth context updated with fresh user data");
            }

            // Force a complete app reload to refresh all components
            if (navigation && navigation.dispatch) {
              console.log("FORCING NAVIGATION RESET");
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Profile" }],
                })
              );
            }
          }
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    };

    refreshUserProfile();

    // Set up a timer to check for updates every 10 seconds
    const intervalId = setInterval(refreshUserProfile, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Determine the correct profile component based on user role
  const getUserRole = () => {
    // Always check both fields
    const isInfluencer =
      user?.account_type?.toLowerCase() === "influencer" ||
      user?.role?.toLowerCase() === "influencer";

    const isSeller =
      user?.account_type?.toLowerCase() === "seller" ||
      user?.role?.toLowerCase() === "seller";

    if (isInfluencer) {
      console.log("USER IS INFLUENCER");
      return "influencer";
    } else if (isSeller) {
      console.log("USER IS SELLER");
      return "seller";
    } else {
      console.log("USER IS BUYER");
      return "buyer";
    }
  };

  const userRole = getUserRole();

  let ProfileScreenComponent;
  switch (userRole) {
    case "influencer":
      ProfileScreenComponent = InfluencerProfileScreen;
      break;
    case "seller":
      ProfileScreenComponent = ProfileScreen;
      break;
    default:
      ProfileScreenComponent = BuyerProfileScreen;
  }

  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreenComponent}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      {/* Rest of your screen definitions... */}
      <ProfileStack.Screen
        name="Edit Profile"
        component={ProfileEditScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      {/* Include all your other screens here */}
      <ProfileStack.Screen
        name="Payout"
        component={PayoutScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="My Products"
        component={ProductScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="BuyersOrders"
        component={BuyerOrderScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="InfluencerOrders"
        component={InfluencerOrderScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={TrackNotification}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="SellersOrders"
        component={SellerOrderScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="Followers"
        component={FollowerScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="Followings"
        component={FollowingScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="ViewProfile"
        component={UserProfileScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="SIViewProfile"
        component={ViewProfileScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="ActiveCampaigns"
        component={ActiveCampaignsScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="PendingCampaigns"
        component={PendingCampaignsScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="ClosedCampaigns"
        component={ClosedCampaignsScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="Shipping"
        component={ShippingDetailScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="Collaboration Requests"
        component={CollaborationRequestScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: {},
        }}
      />
      <ProfileStack.Screen
        name="Subscriptions"
        component={SellerPlansScreen}
        //   options={{headerShown: false}}
      />
      <ProfileStack.Screen
        name="Form"
        component={FormScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </ProfileStack.Navigator>
  );
};

export default ProfileStackNavigator;
