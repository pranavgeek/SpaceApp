import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import AdminSettingsScreen from "../screens/AdminSettingsScreen";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") {
            iconName = "grid-outline";
          } else if (route.name === "Settings") {
            iconName = "settings-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#1e40af",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Settings" component={AdminSettingsScreen} />
    </Tab.Navigator>
  );
}
