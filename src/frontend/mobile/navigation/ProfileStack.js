import React from "react";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
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
          headerTitleStyle: { },
        }}
      />
      <ProfileStack.Screen
        name="Edit Profile"
        component={ProfileEditScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
      <ProfileStack.Screen
        name="Payout"
        component={PayoutScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
      <ProfileStack.Screen
        name="My Products"
        component={ProductScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
      <ProfileStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
       <ProfileStack.Screen
        name="BuyersOrders"
        component={BuyerOrderScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
      <ProfileStack.Screen
        name="InfluencerOrders"
        component={InfluencerOrderScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={TrackNotification}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
      <ProfileStack.Screen
        name="SellersOrders"
        component={SellerOrderScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
      <ProfileStack.Screen
        name="Shipping"
        component={ShippingDetailScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
      <ProfileStack.Screen
        name="Collaboration Requests"
        component={CollaborationRequestScreen}
        options={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { }
        }}
      />
    </ProfileStack.Navigator>
  );
};

export default ProfileStackNavigator;
