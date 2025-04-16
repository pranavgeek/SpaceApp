import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth, AuthProvider } from "./context/AuthContext";

import ButtonMain from "./components/ButtonMain";
import ButtonSettings from "./components/ButtonSettings";
import HomeStack from "./navigation/HomeStack";
import ProfileStackNavigator from "./navigation/ProfileStack";
import SettingsStack from "./navigation/SettingsStack";
import MessagesStackNavigator from "./navigation/MessagesStack";
import { LikeProvider } from "./theme/LikeContext";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import CreatePostScreen from "./screens/CreatePostScreen"; // Import CreatePostScreen
import { CartProvider } from "./context/CartContext";
import SignUpScreen from "./screens/SignUpScreen";
import AdminDashboard from "./screens/AdminDashboardScreen";
import AdminNavigator from "./navigation/AdminNavigator";
import { ForgetPasswordProvider } from "./context/ForgetPasswordContext";
import ProfileRouter from "./components/ProfileRouter";

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
    return <AdminNavigator />;
  }

  return <AppContent />;
};

const App = () => (
  <AuthProvider>
    <LikeProvider>
      <ThemeProvider>
        <CartProvider>
          <ForgetPasswordProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ForgetPasswordProvider>
        </CartProvider>
      </ThemeProvider>
    </LikeProvider>
  </AuthProvider>
);

const AppContent = () => {
  const { user } = useAuth();
  // Determine user role
  const isSeller = user && user.role === "seller";
  const isBuyer =
    user && (user.role === "buyer" || user.account_type === "Buyer");
  const isInfluencer =
    user && (user.role === "influencer" || user.account_type === "Influencer");

  const modalizeRef = useRef(null);
  const promotionsModalRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPromotionsModalVisible, setIsPromotionsModalVisible] =
    useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const navigation = useNavigation();

  const windowWidth = Dimensions.get("window").width;
  const isMobileWeb = Platform.OS === "web" && windowWidth < 768;
  const isNativeMobile = Platform.OS !== "web";
  const isMobile = isMobileWeb || isNativeMobile;

  // Open the seller modal
  const openCreateView = () => {
    if (isSeller) {
      setIsModalVisible(true);
      modalizeRef.current?.open();
    }
  };

  // Open the promotions modal for buyers and influencers
  const openPromotionsView = () => {
    if (isBuyer || isInfluencer) {
      setIsPromotionsModalVisible(true);
      promotionsModalRef.current?.open();
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    modalizeRef.current?.close();
  };

  const closePromotionsModal = () => {
    setIsPromotionsModalVisible(false);
    promotionsModalRef.current?.close();
  };

  // Close the modal before navigating
  const navigateToFormScreen = (category) => {
    closeModal();
    navigation.navigate("Form", { category });
  };

  // Toggle profile dropdown visibility (if needed)
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Bottom Tab Navigator */}
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarShowLabel: false,
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
              return <Ionicons name={iconName} size={24} color={color} />;
            },
            tabBarActiveTintColor: colors.text,
            tabBarInactiveTintColor: colors.subtitle,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopWidth: 0.5,
              height: 80,
              padding: 5,
            },
            tabBarLabelStyle: {
              fontSize: 11,
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
              tabBarButton: (props) => {
                // Different buttons based on user role
                if (isSeller) {
                  return (
                    <TouchableOpacity
                      style={styles.middleButton}
                      {...props}
                      onPress={openCreateView}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={40}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  );
                } else if (isBuyer || isInfluencer) {
                  return (
                    <TouchableOpacity
                      style={styles.middleButton}
                      {...props}
                      onPress={openPromotionsView}
                    >
                      <Ionicons name="gift-outline" size={40} color="#FF6B6B" />
                    </TouchableOpacity>
                  );
                } else {
                  // Fallback for any other unspecified role
                  return (
                    <TouchableOpacity
                      style={[styles.middleButton, { opacity: 0.5 }]}
                      disabled
                      {...props}
                    >
                      <Ionicons
                        name="help-circle-outline"
                        size={40}
                        color="#aaa"
                      />
                    </TouchableOpacity>
                  );
                }
              },
            }}
          />
          <Tab.Screen name="Profile" component={ProfileRouter} />
          <Tab.Screen name="Settings" component={SettingsStack} />
        </Tab.Navigator>

        {/* Create New Listing Modal (only for sellers) */}
        {isSeller && (
          <Modalize
            ref={modalizeRef}
            snapPoint={500}
            modalHeight={600}
            modalStyle={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
            }}
            handleStyle={{
              backgroundColor: colors.subtitle + "50",
              width: 80,
            }}
            isVisible={isModalVisible}
            closeOnOverlayTap={true}
          >
            <View style={styles.modalContent}>
              {/* Header with icon and close button */}
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="add" size={24} color="#fff" />
                  </View>
                  <Text style={styles.modalTitle}>Create New Listing</Text>
                </View>

                {/* Close button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Subtitle */}
              <Text style={styles.modalSubtitle}>
                Share your innovation with the world
              </Text>

              {/* Option cards */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => navigateToFormScreen("Software")}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="code-sharp"
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Software Application</Text>
                    <Text style={styles.optionDescription}>
                      List your software product or application
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.subtitle}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard} activeOpacity={0.8}>
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: "#FF8C0040" },
                    ]}
                  >
                    <Ionicons
                      name="hardware-chip-outline"
                      size={28}
                      color="#FF8C00"
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Hardware Product</Text>
                    <Text style={styles.optionDescription}>
                      List your hardware or IoT device
                    </Text>
                  </View>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modalize>
        )}

        {/* Promotions & Discounts Modal (only for buyers and influencers) */}
        {/* Promotions & Discounts Modal (only for buyers and influencers) */}
        {(isBuyer || isInfluencer) && (
          <Modalize
            ref={promotionsModalRef}
            snapPoint={500}
            modalHeight={600}
            modalStyle={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
            }}
            handleStyle={{
              backgroundColor: colors.subtitle + "50",
              width: 80,
            }}
            isVisible={isPromotionsModalVisible}
            closeOnOverlayTap={true}
          >
            <View style={styles.modalContent}>
              {/* Header with icon and close button */}
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: "#FF6B6B" },
                    ]}
                  >
                    <Ionicons name="gift" size={24} color="#fff" />
                  </View>
                  <Text style={styles.modalTitle}>Special Offers</Text>
                </View>

                {/* Close button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closePromotionsModal}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Subtitle */}
              <Text style={styles.modalSubtitle}>
                Exclusive discounts and promotions just for you
              </Text>

              {/* Promotions cards */}
              <View style={styles.optionsContainer}>
                <View
                  style={[
                    styles.optionCard,
                    {
                      borderLeftWidth: 4,
                      borderLeftColor: "#4CAF50",
                      opacity: 0.7,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: "#4CAF5020" },
                    ]}
                  >
                    <Ionicons name="ticket-outline" size={28} color="#4CAF50" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>
                      20% Off First Purchase
                    </Text>
                    <Text style={styles.optionDescription}>
                      Use code WELCOME20 at checkout
                    </Text>
                  </View>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.optionCard,
                    {
                      borderLeftWidth: 4,
                      borderLeftColor: "#FF9800",
                      opacity: 0.7,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: "#FF980020" },
                    ]}
                  >
                    <Ionicons name="flash-outline" size={28} color="#FF9800" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>
                      Flash Sale - 24hrs Only
                    </Text>
                    <Text style={styles.optionDescription}>
                      30% off on all tech accessories
                    </Text>
                  </View>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.optionCard,
                    {
                      borderLeftWidth: 4,
                      borderLeftColor: "#2196F3",
                      opacity: 0.7,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: "#2196F320" },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={28}
                      color="#2196F3"
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Weekend Special</Text>
                    <Text style={styles.optionDescription}>
                      Buy one, get one 50% off on software tools
                    </Text>
                  </View>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                </View>

                {isInfluencer && (
                  <View
                    style={[
                      styles.optionCard,
                      {
                        borderLeftWidth: 4,
                        borderLeftColor: "#9C27B0",
                        opacity: 0.7,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.optionIconContainer,
                        { backgroundColor: "#9C27B020" },
                      ]}
                    >
                      <Ionicons name="star-outline" size={28} color="#9C27B0" />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>
                        Influencer Exclusive
                      </Text>
                      <Text style={styles.optionDescription}>
                        Special perks for promoting our products
                      </Text>
                    </View>
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>COMING SOON</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Information about upcoming promotions */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Stay Tuned!</Text>
                <Text style={styles.tipText}>
                  We're preparing some amazing deals and offers that will be
                  available soon. Check back regularly to take advantage of
                  exclusive promotions!
                </Text>
              </View>
            </View>
          </Modalize>
        )}
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
      marginVertical: 8,
      marginHorizontal: 16,
    },
    middleButton: {
      width: 70,
      height: 70,
      backgroundColor: colors.background,
      borderRadius: 35,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 70,
    },
    modalContent: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 20,
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.cardBackground || "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 15,
      color: colors.subtitle,
      marginBottom: 30,
      paddingLeft: 4,
    },
    optionsContainer: {
      marginBottom: 24,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground || "#FFFFFF", // Solid color for shadow
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    optionIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 13,
      color: colors.subtitle,
    },
    comingSoonBadge: {
      backgroundColor: colors.subtitle + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    comingSoonText: {
      fontSize: 10,
      fontWeight: "bold",
      color: colors.subtitle,
    },
    tipsContainer: {
      backgroundColor: colors.cardBackground || "#FFFFFF", // Solid color for shadow
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    tipText: {
      fontSize: 14,
      color: colors.subtitle,
      marginBottom: 6,
      lineHeight: 20,
    },
    badgeContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "bold",
    },
  });

export default App;
