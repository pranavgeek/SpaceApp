import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
} from "react-native";
import ButtonSettings from "../components/ButtonSettings";
import ButtonMain from "../components/ButtonMain";
import ButtonIcon from "../components/ButtonIcon";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import BuyerOrdersScreen from "./BuyerOrdersScreen";
import { LinearGradient } from "expo-linear-gradient";
import { fetchNotifications, fetchUsers } from "../backend/db/API";

export default function BuyerProfileScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();

  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const refreshUserData = async () => {
    try {
      if (!user || !user.user_id) return;

      console.log("Refreshing buyer profile data for user:", user.user_id);

      // Fetch fresh user data
      const users = await fetchUsers();
      const refreshedUser = users.find(
        (u) => String(u.user_id) === String(user.user_id)
      );

      if (refreshedUser) {
        // Update the profile object with fresh data
        setProfile({
          name: refreshedUser.name || "User",
          city: refreshedUser.city || "N/A",
          country: refreshedUser.country || "N/A",
          accountType: refreshedUser.account_type || "N/A",
          productPurchased: Array.isArray(refreshedUser.products_purchased)
            ? refreshedUser.products_purchased
            : [],
          followingCount:
            refreshedUser.following_count ||
            (Array.isArray(refreshedUser.following)
              ? refreshedUser.following.length
              : 0),
          campaigns: Array.isArray(refreshedUser.campaigns)
            ? refreshedUser.campaigns
            : [],
          followers: refreshedUser.followers_count || 0,
          earnings: refreshedUser.earnings || 0,
        });

        console.log(
          "Updated buyer profile. Following count:",
          refreshedUser.following_count ||
            (Array.isArray(refreshedUser.following)
              ? refreshedUser.following.length
              : 0)
        );
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Load notifications when screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedLocation = await AsyncStorage.getItem("location");
          const storedLanguages = await AsyncStorage.getItem("languages");
          if (storedLocation) setLocation(storedLocation);
          if (storedLanguages) setLanguages(JSON.parse(storedLanguages));

          // Check for new notifications
          if (user && user.user_id) {
            checkForNewNotifications();
          }
          refreshUserData();
        } catch (error) {
          console.error("Error loading data from AsyncStorage", error);
        }
      };
      loadData();

      // Also check if we're coming back with orderComplete flag
      if (route.params?.orderComplete) {
        Alert.alert(
          "Order Complete",
          "Your order has been placed successfully."
        );
      }
    }, [user, route.params])
  );

  // Check for new notifications
  const checkForNewNotifications = async () => {
    try {
      const userNotifications = await fetchNotifications(user.user_id);

      if (userNotifications && userNotifications.length > 0) {
        // Check if there are unread notifications
        const hasUnread = userNotifications.some((n) => !n.read);
        setHasNewNotifications(hasUnread);
      } else {
        setHasNewNotifications(false);
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  const windowWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && windowWidth >= 992;

  const [profile, setProfile] = useState({
    name: user?.name || "Pranav",
    city: user?.city || "N/A",
    country: user?.country || "N/A",
    accountType: user?.account_type || "N/A",
    productPurchased: Array.isArray(user?.products_purchased)
      ? user.products_purchased
      : [],
    followingCount: user?.following_count || 0,
    campaigns: Array.isArray(user?.campaigns) ? user.campaigns : [],
    followers: user?.followers_count || 0,
    earnings: user?.earnings || 0,
  });

  // Render the stats section based on the account type
  const renderStats = () => {
    // Buyer
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {profile.productPurchased.length}
          </Text>
          <Text style={styles.statLabel}>Purchases</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={styles.statItem}
          onPress={() =>
            navigation.navigate("Followings", { userId: user.user_id })
          }
        >
          <Text style={styles.statValue}>{profile.followingCount}</Text>
          <Text style={styles.statLabel}>Followings</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render buttons based on account type
  const renderButtons = () => {
    // Buyer
    return (
      <View style={styles.buttonsGrid}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("BuyersOrders")}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons name="cube-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.buttonText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Notifications")}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <Text style={styles.buttonText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Favorites")}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons name="heart-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.buttonText}>Favorites</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Helper functions for influencer account
  const handleCampaigns = () => {
    // Implement campaign navigation logic
    Alert.alert("Campaigns", "Navigate to campaigns");
  };

  const handlePendingCampaigns = () => {
    // Implement pending campaigns navigation logic
    Alert.alert("Pending Campaigns", "Navigate to pending campaigns");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header with Background */}
        <View style={styles.profileHeader}>
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
            }}
            style={styles.headerBackground}
          >
            <LinearGradient
              colors={
                isDarkMode
                  ? ["rgba(0,0,0,0.5)", "rgba(0,0,0,0.8)"]
                  : ["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]
              }
              style={styles.gradient}
            />
            <View style={styles.headerContent}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
                  }}
                  style={styles.profileImage}
                />
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Profile Content Card */}
        <View style={styles.profileContent}>
          {/* Profile Info Section */}
          <View style={styles.profileInfoSection}>
            <View style={styles.nameSection}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <View style={styles.accountTypeBadge}>
                <Text style={styles.accountTypeText}>
                  {profile.accountType}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate("Edit Profile")}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton}>
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Location & Language */}
            <View style={styles.locationContainer}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.subtitle}
                />
                <Text style={styles.infoText}>
                  {profile.city}, {profile.country}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons
                  name="language-outline"
                  size={18}
                  color={colors.subtitle}
                />
                <Text style={styles.infoText}>
                  {languages.length > 0
                    ? languages.join(", ")
                    : "No languages set"}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Section */}
          {renderStats()}

          {/* Menu Buttons Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account</Text>
            {renderButtons()}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getDynamicStyles(colors, isDarkMode) {
  const { width, height } = Dimensions.get("window");
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && width >= 992;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    profileHeader: {
      width: "100%",
      height: height * 0.25,
    },
    headerBackground: {
      width: "100%",
      height: "100%",
      justifyContent: "flex-end",
    },
    gradient: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    headerContent: {
      paddingBottom: 70,
      alignItems: "center",
    },
    profileImageContainer: {
      borderWidth: 4,
      borderColor: colors.background,
      borderRadius: 70,
      height: 140,
      width: 140,
      overflow: "hidden",
      elevation: 6,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    profileImage: {
      height: "100%",
      width: "100%",
    },
    profileContent: {
      marginTop: -70,
      paddingTop: 80,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    profileInfoSection: {
      marginBottom: 20,
    },
    nameSection: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginRight: 10,
    },
    accountTypeBadge: {
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
    },
    accountTypeText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 12,
    },
    actionsRow: {
      flexDirection: "row",
      marginBottom: 16,
    },
    editProfileButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginRight: 10,
    },
    editProfileText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 14,
    },
    shareButton: {
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9",
      padding: 8,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    socialIconsContainer: {
      flexDirection: "row",
      marginBottom: 16,
    },
    socialIcon: {
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9",
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    locationContainer: {
      marginTop: 8,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    infoText: {
      marginLeft: 8,
      color: colors.subtitle,
      fontSize: 14,
    },
    statsContainer: {
      flexDirection: "row",
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#f8fafc",
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.subtitle,
    },
    statDivider: {
      width: 1,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
    },
    menuSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    buttonsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -8,
    },
    menuButton: {
      width: isDesktopWeb ? "20%" : "33.333%",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingBottom: 16,
    },
    buttonIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : `${colors.primary}10`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    buttonText: {
      fontSize: 12,
      color: colors.text,
      textAlign: "center",
    },
    settingsSection: {
      marginBottom: 20,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9",
      position: "relative",
    },
    settingIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : `${colors.primary}10`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    settingText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    settingBadge: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
      marginRight: 8,
    },
  });
}
