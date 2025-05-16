import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { fetchUsers, canSwitchBackToOriginalRole } from "../backend/db/API";
import SubscriptionBadge from "../components/SubscriptionBadge";

export default function ProfileScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState([]);
  const { user, toggleSellerMode } = useAuth();
  const [canSwitchBack, setCanSwitchBack] = useState(false);

  // Add this useEffect to check if the user can switch back
  useEffect(() => {
    const checkSwitchCapability = async () => {
      try {
        if (user && user.user_id) {
          const result = await canSwitchBackToOriginalRole(user.user_id);
          setCanSwitchBack(result.canSwitchBack);
        }
      } catch (error) {
        console.error("Error checking switch capability:", error);
      }
    };

    checkSwitchCapability();
  }, [user]);

  const loadData = async () => {
    try {
      const storedLocation = await AsyncStorage.getItem("location");
      const storedLanguages = await AsyncStorage.getItem("languages");
      if (storedLocation) setLocation(storedLocation);
      if (storedLanguages) setLanguages(JSON.parse(storedLanguages));
    } catch (error) {
      console.error("Error loading data from AsyncStorage", error);
    }
  };

  const handleSwitchToBuyer = () => {
    Alert.alert(
      "Switch to Buyer Mode",
      "Do you want to switch back to buyer mode?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Switch",
          onPress: async () => {
            try {
              await toggleSellerMode(false); // false to deactivate seller mode
              // Navigate back to buyer home screen
              navigation.reset({
                index: 0,
                routes: [{ name: "TabProfile" }],
              });
            } catch (error) {
              Alert.alert(
                "Error",
                error.message || "Failed to switch to buyer mode"
              );
            }
          },
        },
      ]
    );
  };

  const refreshUserData = async () => {
    try {
      // First try to get fresh user data from AsyncStorage
      const storedUserData = await AsyncStorage.getItem("user");
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);

        // Update the seller state with this data
        setSeller({
          name: userData.name || "User",
          city: userData.city || "N/A",
          country: userData.country || "N/A",
          accountType: userData.account_type || "N/A",
          profilePhoto: userData.profile_image || null,
          campaigns: Array.isArray(userData.campaigns)
            ? userData.campaigns
            : [],
          followers: userData.followers_count || 0,
          earnings: userData.earnings || 0,
        });

        console.log(
          "Refreshed user data from AsyncStorage:",
          userData.profile_image
        );
      }

      // Optionally, also try to fetch from API for even fresher data
      const users = await fetchUsers();
      const refreshedUser = users.find(
        (u) => String(u.user_id) === String(user.user_id)
      );

      if (refreshedUser) {
        setSeller({
          name: refreshedUser.name || "User",
          city: refreshedUser.city || "N/A",
          country: refreshedUser.country || "N/A",
          accountType: refreshedUser.account_type || "N/A",
          profilePhoto: refreshedUser.profile_image || null,
          campaigns: Array.isArray(refreshedUser.campaigns)
            ? refreshedUser.campaigns
            : [],
          followers: refreshedUser.followers_count || 0,
          earnings: refreshedUser.earnings || 0,
        });

        console.log(
          "Refreshed user data from API:",
          refreshedUser.profile_image
        );
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const [seller, setSeller] = useState({
    name: user?.name || "User",
    city: user?.city || "N/A",
    country: user?.country || "N/A",
    accountType: user?.account_type || "N/A",
    profilePhoto: user?.profile_image || null,
    campaigns: Array.isArray(user?.campaigns) ? user.campaigns : [],
    followers: user?.followers_count || 0,
    earnings: user?.earnings || 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
      refreshUserData();
    }, [])
  );

  const windowWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && windowWidth >= 992;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
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
                    uri: seller.profilePhoto
                      ? `${seller.profilePhoto}?t=${Date.now()}`
                      : "https://via.placeholder.com/150",
                  }}
                  style={styles.profileImage}
                  onError={(e) =>
                    console.error(
                      "Profile image load error:",
                      e.nativeEvent.error,
                      seller.profilePhoto
                    )
                  }
                />
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.profileContent}>
          <View style={styles.profileInfoSection}>
            <View style={styles.nameSection}>
              <Text style={styles.profileName}>{seller.name}</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.accountTypeBadge}>
                  <Text style={styles.accountTypeText}>
                    {seller.accountType}
                  </Text>
                </View>
                {/* Add the subscription badge if user is a seller */}
                {seller.accountType.toLowerCase() === "seller" && (
                  <SubscriptionBadge
                    navigation={navigation}
                    user={user}
                    colors={colors}
                  />
                )}
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

            <View style={styles.locationContainer}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.subtitle}
                />
                <Text style={styles.infoText}>
                  {seller.city}, {seller.country}
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

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seller.campaigns.length}</Text>
              <Text style={styles.statLabel}>Campaigns</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                navigation.navigate("Followers", { userId: user.user_id })
              }
            >
              <Text style={styles.statValue}>{seller.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${seller.earnings}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Management</Text>
            <View style={styles.buttonsGrid}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() =>
                  navigation.navigate("My Products", { sellerId: user.user_id })
                }
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons
                    name="grid-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.buttonText}>My Products</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate("Collaboration Requests")}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons
                    name="people-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.buttonText}>Collaborations</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate("Payout")}
              >
                <View style={styles.buttonIconContainer}>
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.buttonText}>Payout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate("SellersOrders")}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons
                    name="cube-outline"
                    size={24}
                    color={colors.primary}
                  />
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
                  <Ionicons
                    name="heart-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.buttonText}>Favorites</Text>
              </TouchableOpacity>
            </View>
            {canSwitchBack && (
              <TouchableOpacity
                style={styles.modeSwitchBanner}
                onPress={handleSwitchToBuyer}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerIconContainer}>
                    <Ionicons
                      name="person-outline"
                      size={24}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerTitle}>Return to Buyer Mode</Text>
                    <Text style={styles.bannerDescription}>
                      Switch back to your buyer account
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
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
      shadowColor: "#000",
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
      marginBottom: 12,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8, // Added margin to separate name from badges
    },
    badgeContainer: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
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
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)",
      padding: 8,
      borderRadius: 8,
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
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.03)",
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
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    },
    dashboardCard: {
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.03)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    dashboardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    seeAllButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    seeAllText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    dashboardStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dashboardStatItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    dashboardIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    dashboardStatValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    dashboardStatLabel: {
      fontSize: 12,
      color: colors.subtitle,
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
        : `${colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    buttonText: {
      fontSize: 12,
      color: colors.text,
      textAlign: "center",
    },
    analyticsSection: {
      marginBottom: 24,
    },
    analyticsPreview: {
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.03)",
      borderRadius: 12,
      padding: 16,
    },
    analyticsChart: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 120,
    },
    barContainer: {
      alignItems: "center",
      width: "12%",
    },
    bar: {
      width: 16,
      borderRadius: 8,
    },
    barLabel: {
      marginTop: 8,
      fontSize: 12,
      color: colors.subtitle,
    },
    devSection: {
      marginTop: 10,
      marginBottom: 20,
      alignItems: "center",
    },
    resetButton: {
      backgroundColor: isDarkMode ? "rgba(220,38,38,0.3)" : "#fee2e2",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    resetButtonText: {
      color: isDarkMode ? "#ff6b6b" : "#dc2626",
      fontWeight: "600",
      fontSize: 14,
    },
    modeSwitchBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : colors.cardBackground || "#f1f5f9",
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      marginTop: 10,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    bannerContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    bannerIconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    bannerTextContainer: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    bannerDescription: {
      fontSize: 14,
      color: colors.subtitle,
    },
  });
}
