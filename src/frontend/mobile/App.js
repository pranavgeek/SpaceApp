import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { Host } from "react-native-portalize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from '@react-navigation/native';
// import { Amplify } from "aws-amplify";
import awsConfig from "./config/aws-config";
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
import LoginScreen from "./screens/LoginScreen";
import AdminNavigator from "./navigation/AdminNavigator";
import { ForgetPasswordProvider } from "./context/ForgetPasswordContext";
import ProfileRouter from "./components/ProfileRouter";
import { WishlistProvider } from "./context/WishlistContext";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import UserTrackingScreen from "./screens/UserTrackingScreen";
import InfluencerProgramScreen from "./screens/InfluencerProgramScreen";
import InfluencerApplicationScreen from "./screens/InfluencerApplicationScreen.js";
import CollaborationModal from "./components/CollaborationModal.js";
import SuggestedAccountsScreen from "./screens/SuggestedAccountsScreen.js";
import FollowingService from "./backend/db/FollowingService.js";

console.log("AuthProvider:", AuthProvider);
console.log("useAuth:", useAuth);
console.log("SignUpScreen:", SignUpScreen);
console.log("HomeStack:", HomeStack);
console.log("ProfileStackNavigator:", ProfileStackNavigator);
console.log("SettingsStack:", SettingsStack);
console.log("MessagesStackNavigator:", MessagesStackNavigator);
console.log("CreatePostScreen:", CreatePostScreen);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Amplify.configure(awsConfig);

// Create an auth stack for login, signup, and influencer flows
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Influencer Program"
        component={InfluencerProgramScreen}
      />
      <Stack.Screen
        name="Influencer Form"
        component={InfluencerApplicationScreen}
      />
      <Stack.Screen name="MainApp" component={AppContent} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isFirstLogin, setIsFirstLogin } = useAuth();
  const [followingCount, setFollowingCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add these console.logs to debug
  console.log("AppNavigator - User:", user?.name, user?.account_type);
  console.log("AppNavigator - isFirstLogin:", isFirstLogin);

  useEffect(() => {
    const fetchFollowingData = async () => {
      if (
        user &&
        (user.role?.toLowerCase() === "buyer" ||
          user.account_type?.toLowerCase() === "buyer")
      ) {
        try {
          setIsLoading(true);

          // Check if user has already seen the suggestions
          const hasSeenSuggestions = await AsyncStorage.getItem(
            `seen_suggestions_${user.user_id}`
          );
          if (hasSeenSuggestions === "true") {
            console.log("User has already seen suggestions");
            setIsFirstLogin(false);
            setIsLoading(false);
            return;
          }

          // Get following list using your existing FollowingService
          const following = await FollowingService.getFollowing(user.user_id);
          const count = following?.length || 0;

          setFollowingCount(count);
          console.log("Following count for user:", count);
        } catch (error) {
          console.error("Error fetching following data:", error);
          // Default to 0 on error to be safe
          setFollowingCount(0);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Not a buyer, no need to load following count
        setIsLoading(false);
      }
    };

    if (user) {
      fetchFollowingData();
    } else {
      setIsLoading(false);
    }
  }, [user, setIsFirstLogin]);

  // No user, show auth screens
  if (!user) {
    return <AuthStack />;
  }

  // User is a buyer logging in for the first time
  const isBuyer =
    user.role?.toLowerCase() === "buyer" ||
    user.account_type?.toLowerCase() === "buyer";
  const shouldShowSuggestions = isFirstLogin && isBuyer && followingCount === 0;

  if (shouldShowSuggestions) {
    console.log(
      "AppNavigator - Showing suggested accounts for first-time buyer with 0 followings"
    );
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="SuggestedAccounts"
          component={SuggestedAccountsScreen}
          options={{
            animation: "slide_from_bottom",
            presentation: "modal",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="MainApp" component={AppContent} />
      </Stack.Navigator>
    );
  }

  // Regular app flow
  return <AppContent />;
};

const App = () => (
  <AuthProvider>
    <LikeProvider>
      <WishlistProvider>
        <ThemeProvider>
          <CartProvider>
            <ForgetPasswordProvider>
              <NavigationContainer>
                <Host>
                  <AppNavigator />
                </Host>
              </NavigationContainer>
            </ForgetPasswordProvider>
          </CartProvider>
        </ThemeProvider>
      </WishlistProvider>
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
  const isAdmin = user.role === "admin" || user.account_type === "admin";

  const modalizeRef = useRef(null);
  const promotionsModalRef = useRef(null);
  const collaborationModalRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPromotionsModalVisible, setIsPromotionsModalVisible] =
    useState(false);
  const [isCollaborationModalVisible, setIsCollaborationModalVisible] =
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

  const navigateToDashboard = () => {
    console.log("Navigating to Dashboard");
    if (isAdmin) {
      navigation.navigate("Dashboard");
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
    navigation.dispatch(
      CommonActions.navigate({
          name: 'Form',
          params: { category: category },
      })
  );
  };

  // Toggle profile dropdown visibility (if needed)
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // Open the collaboration modal for influencers
  const openCollaborationView = () => {
    if (isInfluencer) {
      setIsCollaborationModalVisible(true);
      collaborationModalRef.current?.open();
    }
  };

  // Close the collaboration modal
  const closeCollaborationModal = () => {
    setIsCollaborationModalVisible(false);
    collaborationModalRef.current?.close();
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
              if (route.name === "TabHome") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "TabSettings") {
                iconName = focused ? "settings" : "settings-outline";
              } else if (route.name === "TabMessages") {
                iconName = focused ? "chatbubbles" : "chatbubbles-outline";
              } else if (route.name === "TabProfile") {
                iconName = focused ? "person" : "person-outline";
              } else if (route.name === "Dashboard") {
                iconName = focused ? "grid" : "grid-outline";
              } else if (route.name === "TabTracker") {
                iconName = focused ? "stats-chart" : "stats-chart-outline";
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
          <Tab.Screen name="TabHome" component={HomeStack} />
          <Tab.Screen
            name="TabMessages"
            component={MessagesStackNavigator}
            listeners={({ navigation, route }) => ({
              tabPress: (e) => {
                // Prevent default behavior
                e.preventDefault();
                // Reset the Messages stack to its first screen when the tab is pressed
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      { 
                        name: 'TabMessages',
                        state: {
                          routes: [{ name: 'Messages' }],
                          index: 0,
                        }
                      },
                    ],
                  })
                );
              },
            })}
          />

          {/* Middle button - conditionally rendered based on user role */}
          <Tab.Screen
            name={isAdmin ? "Dashboard" : "Create"}
            component={isAdmin ? AdminDashboardScreen : CreatePostScreen}
            options={{
              tabBarButton: (props) => {
                console.log("Rendering middle button");
                // Admin gets dashboard button
                if (isAdmin) {
                  console.log("Admin role detected");
                  return (
                    <TouchableOpacity
                      style={styles.middleButton}
                      {...props}
                      onPress={navigateToDashboard}
                    >
                      <Ionicons
                        name="grid-outline"
                        size={40}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  );
                }
                // Seller gets add button
                else if (isSeller) {
                  console.log("Seller role detected");
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
                }
                // Buyer and Influencer get gift button
                else if (isBuyer) {
                  return (
                    <TouchableOpacity
                      style={styles.middleButton}
                      {...props}
                      onPress={openPromotionsView}
                    >
                      <Ionicons
                        style={{ marginBottom: 5 }}
                        name="gift-outline"
                        size={30}
                        color="#FF6B6B"
                      />
                    </TouchableOpacity>
                  );
                } else if (isInfluencer) {
                  return (
                    <TouchableOpacity
                      style={styles.middleButton}
                      {...props}
                      onPress={openCollaborationView}
                    >
                      <FontAwesome5
                        style={{ marginBottom: 5 }}
                        name="handshake"
                        size={30}
                        color="#4d429a"
                      />
                    </TouchableOpacity>
                  );
                }
                // Fallback for other account types
                else {
                  return (
                    <TouchableOpacity
                      style={[styles.middleButton, { opacity: 0.5 }]}
                      {...props}
                    >
                      <Ionicons
                        style={{ marginBottom: 5 }}
                        name="add-circle-outline"
                        size={30}
                        color="#aaa"
                      />
                    </TouchableOpacity>
                  );
                }
              },
            }}
          />

          <Tab.Screen
            name={isAdmin ? "TabTracker" : "TabProfile"}
            component={isAdmin ? UserTrackingScreen : ProfileRouter}
          />
          <Tab.Screen name="TabSettings" component={SettingsStack} />
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
                </TouchableOpacity>
              </View>
            </View>
          </Modalize>
        )}

        {/* Promotions & Discounts Modal (only for buyers and influencers) */}
        {isBuyer && (
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
              </View>

              {/* Information about upcoming promotions */}
              {/* <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Stay Tuned!</Text>
                <Text style={styles.tipText}>
                  We're preparing some amazing deals and offers that will be
                  available soon. Check back regularly to take advantage of
                  exclusive promotions!
                </Text>
              </View> */}
            </View>
          </Modalize>
        )}
        {isInfluencer && (
          <CollaborationModal
            modalRef={collaborationModalRef}
            isVisible={isCollaborationModalVisible}
          />
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
