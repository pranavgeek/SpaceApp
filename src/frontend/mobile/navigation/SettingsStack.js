import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import SupportScreen from "../screens/SupportScreen";
import PaymentMethodsScreen from "../screens/PaymentsMethodsScreen";
import NotificationScreen from "../screens/NotificationScren";
import RegionLanguageScreen from "../screens/RegionLanguageScreen";
import AppearanceScreen from "../screens/AppearanceScreen";
import SecurityPrivacyScreen from "../screens/SecurityPrivacyScreen";
import InfluencerProgramScreen from "../screens/InfluencerProgramScreen";
import SellerPlansScreen from "../screens/SellerPlansScreen";
import CollaborationScreen from "../screens/CollaborationScreen"
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import { useTheme } from "../theme/ThemeContext.js";

const SettingsStack = createNativeStackNavigator();

const SettingsStackNavigator = () => {
  const { colors } = useTheme();

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: "bold" },
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 15 }}>
          <Icon
            name="notifications-outline"
            size={24}
            color={colors.background}
          />
        </TouchableOpacity>
      ),
    }),
    [colors]
  );

  return (
    <SettingsStack.Navigator screenOptions={screenOptions}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="Edit Profile" component={ProfileEditScreen} />
      <SettingsStack.Screen name="Support" component={SupportScreen} />
      <SettingsStack.Screen
        name="Payment Methods"
        component={PaymentMethodsScreen}
      />
      <SettingsStack.Screen
        name="Admin Dashboard"
        component={AdminDashboardScreen}
      />
      <SettingsStack.Screen
        name="Notifications"
        component={NotificationScreen}
      />
      <SettingsStack.Screen name="Language" component={RegionLanguageScreen} />
      <SettingsStack.Screen name="Appearance" component={AppearanceScreen} />
      <SettingsStack.Screen
        name="Security & Privacy"
        component={SecurityPrivacyScreen}
      />

      <SettingsStack.Screen
        name="Influencer Program"
        component={InfluencerProgramScreen}
        //   options={{headerShown: false}} // or your desired options
      />
      <SettingsStack.Screen
        name="Collaboration"
        component={CollaborationScreen}
        //   options={{headerShown: false}} // or your desired options
      />
      <SettingsStack.Screen
        name="Sellers Plans"
        component={SellerPlansScreen}
        //   options={{headerShown: false}}
      />
    </SettingsStack.Navigator>
  );
};

export default SettingsStackNavigator;
