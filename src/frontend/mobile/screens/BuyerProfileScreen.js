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
import { fetchNotifications } from "../backend/db/API";

export default function BuyerProfileScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { user } = useAuth();

  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

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
        const hasUnread = userNotifications.some(n => !n.read);
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

  const profile = {
    name: user?.name || "Pranav",
    city: user?.city || "N/A",
    country: user?.country || "N/A",
    accountType: user?.account_type || "N/A",
    productPurchased: Array.isArray(user?.products_purchased) ? user.products_purchased : [],
    followingCount: user?.following_count || 0,
    campaigns: Array.isArray(user?.campaigns) ? user.campaigns : [],
    followers: user?.followers_count || 0,
    earnings: user?.earnings || 0,
  };

  // Render the stats section based on the account type
  const renderStats = () => {
    if (profile.accountType === "Seller") {
      return (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.campaigns.length}</Text>
            <Text style={styles.statLabel}>Campaigns</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${profile.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      );
    } else if (profile.accountType === "Influencer") {
      return (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.campaigns.length}</Text>
            <Text style={styles.statLabel}>Campaigns</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${profile.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      );
    } else {
      // Buyer
      return (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.productPurchased.length}</Text>
            <Text style={styles.statLabel}>Purchases</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      );
    }
  };

  // Render buttons based on account type
  const renderButtons = () => {
    if (profile.accountType === "Seller") {
      return (
        <View style={styles.buttonsGrid}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("My Products")}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="grid-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>My Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("Collaboration Requests")}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="people-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>Collaborations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("Payment History")}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="card-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("SellersOrders")}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="cube-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {}}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="heart-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("Notifications")}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
              {hasNewNotifications && <View style={styles.settingBadge} />}
              <Ionicons name="chevron-forward" size={18} color={colors.subtitle} />
            </TouchableOpacity>
        </View>
      );
    } else if (profile.accountType === "Influencer") {
      return (
        <View style={styles.buttonsGrid}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => handleCampaigns()}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="megaphone-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>Campaigns</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => handlePendingCampaigns()}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>Pending</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Buyer
      return (
        <View style={styles.buttonsGrid}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("Favourites")}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="heart-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>Favorites</Text>
          </TouchableOpacity>

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
            onPress={() => navigation.navigate("Payment")}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="card-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.buttonText}>Payment</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Social media icons for influencers
  const renderSocialIcons = () => {
    if (profile.accountType === "Influencer") {
      return (
        <View style={styles.socialIconsContainer}>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-twitter" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-instagram" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-tiktok" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-linkedin" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      );
    }
    return null;
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
        barStyle="dark-content" 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header with Background */}
        <View style={styles.profileHeader}>
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" }}
            style={styles.headerBackground}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
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
                <Text style={styles.accountTypeText}>{profile.accountType}</Text>
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
                <Ionicons name="share-social-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Social Media Icons for Influencer */}
            {renderSocialIcons()}

            {/* Location & Language */}
            <View style={styles.locationContainer}>
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={18} color={colors.subtitle} />
                <Text style={styles.infoText}>
                  {profile.city}, {profile.country}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="language-outline" size={18} color={colors.subtitle} />
                <Text style={styles.infoText}>
                  {languages.length > 0 ? languages.join(", ") : "No languages set"}
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

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("Notifications")}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
              {hasNewNotifications && <View style={styles.settingBadge} />}
              <Ionicons name="chevron-forward" size={18} color={colors.subtitle} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingText}>Privacy</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.subtitle} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.subtitle} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getDynamicStyles(colors) {
  const { width, height } = Dimensions.get("window");
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && width >= 992;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f8f9fa",
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
      position: 'absolute',
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
      borderColor: "#fff",
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
      backgroundColor: "#fff",
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
      backgroundColor: `${colors.primary}15`,
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
      backgroundColor: "#f1f5f9",
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
      backgroundColor: "#f1f5f9",
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
      backgroundColor: "#f8fafc",
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
      backgroundColor: "#e2e8f0",
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
      backgroundColor: `${colors.primary}10`,
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
      borderBottomColor: "#f1f5f9",
      position: "relative",
    },
    settingIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}10`,
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
      backgroundColor: "#ef4444",
      marginRight: 8,
    }
  });
}