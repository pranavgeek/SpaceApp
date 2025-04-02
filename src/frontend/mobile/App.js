import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; // Correct import
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { useNavigation } from "@react-navigation/native"; // Use Navigation Hook
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth, AuthProvider } from "./context/AuthContext"; 

import ButtonMain from "./components/ButtonMain";
import ButtonSettings from "./components/ButtonSettings";
import HomeStack from "./navigation/HomeStack"; // HomeStack
import ProfileStackNavigator from "./navigation/ProfileStack";
import SettingsStack from "./navigation/SettingsStack";
import MessagesStackNavigator from "./navigation/MessagesStack";
import { LikeProvider } from "./theme/LikeContext";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import CreatePostScreen from "./screens/CreatePostScreen"; // Import CreatePostScreen
import { CartProvider } from "./context/CartContext"; // Correct import
import SignUpScreen from "./screens/SignUpScreen"
import AdminDashboard from "./screens/AdminDashboardScreen"; // Import AdminDashboard
import AdminNavigator from "./navigation/AdminNavigator"; // import it


console.log("AuthProvider:", AuthProvider);
console.log("useAuth:", useAuth);
console.log("SignUpScreen:", SignUpScreen);
console.log("HomeStack:", HomeStack);
console.log("ProfileStackNavigator:", ProfileStackNavigator);
console.log("SettingsStack:", SettingsStack);
console.log("MessagesStackNavigator:", MessagesStackNavigator);
console.log("CreatePostScreen:", CreatePostScreen);


const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const { user } = useAuth();

  if (!user) return <SignUpScreen />;

  // Admin check (can be email or a flag in your data)
  if (user.email === "kspace@example.com") {
    return <AdminNavigator />; // 🔥 show bottom tabs for admin
  }

  return <AppContent />; // normal user
};

const App = () => (
  <AuthProvider>
    <LikeProvider>
      <ThemeProvider>
        <CartProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </ThemeProvider>
    </LikeProvider>
  </AuthProvider>
);

const AppContent = () => {
  const modalizeRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // State to manage modal visibility
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const navigation = useNavigation();

  const windowWidth = Dimensions.get("window").width;
  const isMobileWeb = Platform.OS === "web" && windowWidth < 768;
  const isNativeMobile = Platform.OS !== "web";
  const isMobile = isMobileWeb || isNativeMobile;

  // Open the modal
  const openCreateView = () => {
    setIsModalVisible(true);
    modalizeRef.current?.open();
  };

  // Close the modal
  const closeModal = () => {
    setIsModalVisible(false);
    modalizeRef.current?.close();
  };

  // Close the modal when navigating to FormScreen
  const navigateToFormScreen = (category) => {
    closeModal(); // Close the modal before navigating
    navigation.navigate("Form", { category }); // Navigate to FormScreen
  };

  // Toggle profile dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        {/* Profile Dropdown for Web
        {Platform.OS === "web" && (
          <View style={styles.profileWrapper}>
            <TouchableOpacity onPress={toggleDropdown}>
              <Ionicons name="person-outline" size={30} color="#fff" />
            </TouchableOpacity>
            
            {isDropdownVisible && (
              <View style={styles.dropdown}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                  <Text style={styles.dropdownItem}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <Text style={styles.dropdownItem}>Settings</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )} */}

        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === "Home") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "Settings") {
                iconName = focused ? "settings" : "settings-outline";
              } else if (route.name === "Messages") {
                iconName = focused ? "chatbubbles" : "chatbubbles-outline";
              } else if (route.name === "Profile") {
                iconName = focused ? "person" : "person-outline";
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: colors.text,
            tabBarInactiveTintColor: colors.subtitle,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopWidth: 0.5,
              height: 95,
              padding: 5,
            },
            tabBarLabelStyle: {
              fontSize: 13,
              fontWeight: "bold",
              paddingBottom: 10,
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeStack} />
          <Tab.Screen name="Messages" component={MessagesStackNavigator} />
          <Tab.Screen
            name="Create"
            component={CreatePostScreen}
            options={{
              tabBarButton: (props) => (
                <TouchableOpacity
                  style={styles.middleButton}
                  {...props}
                  onPress={openCreateView}
                >
                  <Ionicons name="add-circle-outline" size={60} color="#aaa" />
                </TouchableOpacity>
              ),
            }}
          />
          <Tab.Screen name="Profile" component={ProfileStackNavigator} />
          <Tab.Screen name="Settings" component={SettingsStack} />
        </Tab.Navigator>

        <Modalize
          ref={modalizeRef}
          snapPoint={600}
          modalStyle={{ backgroundColor: colors.background }}
          isVisible={isModalVisible}
        >
          <View style={styles.modalContent}>
            <Ionicons
              name={"push-outline"}
              size={30}
              color={colors.text}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Create New Listing</Text>
            <Text style={styles.modalText}>
              Share your innovation with the world
            </Text>

            <View style={isMobile ? styles.mobileButtonContainer : null}>
              <ButtonSettings
                iconName={"code-sharp"}
                title={"Software Application"}
                onPress={() => navigateToFormScreen("Software")}
                subtitle={"List your software product or application"}
                rightIcon={"lock-closed-outline"}
              />
              <ButtonSettings
                iconName={"hardware-chip-outline"}
                title={"Hardware Product"}
                subtitle={"List your hardware or IoT device"}
                rightIcon={"lock-open-outline"}
              />
              <ButtonSettings
                iconName={"logo-reddit"}
                title={"AI Solution"}
                subtitle={"List your AI or machine learning solution"}
                rightIcon={"chevron-forward"}
              />
              <ButtonSettings
                iconName={"star-outline"}
                title={"Influencer Campaign"}
                subtitle={"Create a new influencer campaign"}
                rightIcon={"lock-open-outline"}
              />
            </View>

            <ButtonMain>Upgrade</ButtonMain>
          </View>
        </Modalize>
      </View>
    </GestureHandlerRootView>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mobileButtonContainer: {
      marginVertical: 8, // Adjust vertical margin as needed
      marginHorizontal: 16, // Adjust horizontal margin as needed
    },
    profileWrapper: {
      position: "absolute",
      top: 20,
      right: 20,
      zIndex: 10,
    },
    dropdown: {
      position: "absolute",
      top: 40,
      right: 0,
      backgroundColor: "#333",
      borderRadius: 5,
      padding: 10,
      minWidth: 150,
    },
    dropdownItem: {
      color: "#fff",
      fontSize: 16,
      paddingVertical: 10,
    },
    middleButton: {
      width: 70,
      height: 70,
      backgroundColor: colors.background,
      borderRadius: 35,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 70,
      color: colors.text,
    },
    modalContent: {
      alignItems: "center",
      color: colors.text,
      backgroundColor: colors.background,
    },
    modalTitle: { fontSize: 18, marginVertical: 5, color: colors.text },
    modalText: { fontSize: 14, color: colors.text, marginBottom: 5 },
    modalIcon: {
      // size: 25,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.text,
      borderRadius: 10,
      padding: 10,
      margin: 5,
    },
  });

export default App;
