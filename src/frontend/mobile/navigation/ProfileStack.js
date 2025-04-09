import React from "react";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import SupportScreen from "../screens/SupportScreen";
import PaymentMethodsScreen from "../screens/PaymentsMethodsScreen";
import NotificationScreen from "../screens/NotificationScren";
import PaymentHistoryScreen from "../screens/PaymentHistoryScreen";
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

const ProfileStack = createNativeStackNavigator();

const ProfileStackNavigator = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  let ProfileScreenComponent;
  if (user.role === "seller") {
    ProfileScreenComponent = ProfileScreen;
  } else if (user.role === "buyer") {
    ProfileScreenComponent = BuyerProfileScreen;
  } else if (user.role === "influencer") {
    ProfileScreenComponent = InfluencerProfileScreen;
  }else {
    ProfileScreenComponent = BuyerProfileScreen; // default fallback
  }

  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreenComponent}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "bold" },
          // headerRight: () => (
          //     <TouchableOpacity style={{marginRight: 15}}>
          //     <Icon name="notifications-outline" size={24} color="#fff" />
          //     </TouchableOpacity>
          // ),
        }}
      />
      <ProfileStack.Screen
        name="Edit Profile"
        component={ProfileEditScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <Icon name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ProfileStack.Screen
        name="Payment History"
        component={PaymentHistoryScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <Icon name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ProfileStack.Screen
        name="My Products"
        component={ProductScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <Icon name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
       <ProfileStack.Screen
        name="BuyersOrders"
        component={BuyerOrderScreen}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={TrackNotification}
      />
      <ProfileStack.Screen
        name="SellersOrders"
        component={SellerOrderScreen}
      />
      <ProfileStack.Screen
        name="Shipping"
        component={ShippingDetailScreen}
      />
      <ProfileStack.Screen
        name="Collaboration Requests"
        component={CollaborationRequestScreen}
      />
    </ProfileStack.Navigator>
  );
};

export default ProfileStackNavigator;
