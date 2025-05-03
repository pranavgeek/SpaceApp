import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { fetchUsers } from "../backend/db/API";
import FollowingService from "../backend/db/FollowingService";

export default function UserProfileScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = route.params;

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          setLoading(true);

          // Get all users
          const users = await fetchUsers();

          // Find the specific user
          const userData = users.find(
            (u) => String(u.user_id) === String(userId)
          );

          if (!userData) {
            throw new Error("User not found");
          }

          // Get following count
          let followingCount = 0;
          if (Array.isArray(userData.following)) {
            followingCount = userData.following.length;
          }

          // Format the profile data
          setProfile({
            id: userData.user_id,
            name: userData.name || "Unknown User",
            username:
              userData.username ||
              userData.name?.toLowerCase().replace(/\s+/g, "_") ||
              "user",
            bio: userData.about_us || "",
            accountType: userData.account_type || "Buyer",
            city: userData.city || "Not specified",
            country: userData.country || "Not specified",
            languages: userData.languages || ["English"],
            profileImage: userData.profile_image?.startsWith("http")
              ? userData.profile_image
              : "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
            coverImage: userData.cover_image?.startsWith("http")
              ? userData.cover_image
              : "https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
            isFollowing: false, // Will be updated below if relevant
            stats: {
              purchases: Array.isArray(userData.products_purchased)
                ? userData.products_purchased.length
                : 0,
              following: followingCount,
            },
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          Alert.alert("Error", "Failed to load user profile");
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }, [userId])
  );

  const toggleFollow = async () => {
    if (!profile) return;

    try {
      // Get current user
      const currentUser = await getUser(); // Replace with your function to get current user

      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to follow users");
        return;
      }

      // Check if user is a buyer (only buyers can follow)
      if (currentUser.account_type?.toLowerCase() !== "buyer") {
        Alert.alert("Action not allowed", "Only buyers can follow other users");
        return;
      }

      // Call the appropriate method based on current following status
      if (profile.isFollowing) {
        await FollowingService.unfollowUser(currentUser.user_id, profile.id);
      } else {
        await FollowingService.followUser(currentUser.user_id, profile.id);
      }

      // Update the UI
      setProfile({
        ...profile,
        isFollowing: !profile.isFollowing,
      });
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Error", "Failed to update follow status");
    }
  };

  const navigateToFollowing = () => {
    navigation.navigate("Followings", {
      userId: profile.id,
      name: profile.name,
      isOtherUser: true,
    });
  };

  const navigateToChat = () => {
    navigation.navigate('Messages', {
      screen: 'Chat',
      params: { 
        chatPartner: profile.name 
      }
    });
  };

  const navigateToPurchaseHistory = () => {
    navigation.navigate("PurchaseHistory", {
      userId: profile.id,
      name: profile.name,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={colors.error || "red"}
        />
        <Text style={styles.errorText}>User profile not found</Text>
        <TouchableOpacity
          style={styles.backButtonAlt}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <ImageBackground
            source={{ uri: profile.coverImage }}
            style={styles.headerBackground}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
              style={styles.gradient}
            />

            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            {/* Header Actions */}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-social-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.headerContent}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: profile.profileImage }}
                  style={styles.profileImage}
                />
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.profileContent}>
          <View style={styles.profileInfoSection}>
            <View style={styles.nameSection}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <View style={styles.accountTypeBadge}>
                <Text style={styles.accountTypeText}>
                  {profile.accountType}
                </Text>
              </View>
            </View>

            <Text style={styles.usernameText}>@{profile.username}</Text>

            {profile.bio ? (
              <Text style={styles.bioText}>{profile.bio}</Text>
            ) : null}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  profile.isFollowing ? styles.outlineButton : {},
                ]}
                onPress={toggleFollow}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    profile.isFollowing ? styles.outlineButtonText : {},
                  ]}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageButton}
                onPress={navigateToChat}
              >
                <Text style={styles.messageButtonText}>Message</Text>
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
                  {profile.languages.join(", ")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={navigateToPurchaseHistory}
            >
              <Text style={styles.statValue}>{profile.stats.purchases}</Text>
              <Text style={styles.statLabel}>Purchases</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statItem}
              onPress={navigateToFollowing}
            >
              <Text style={styles.statValue}>{profile.stats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getDynamicStyles(colors, isDarkMode) {
  const { width, height } = Dimensions.get("window");
  const isWeb = Platform.OS === "web";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 18,
      color: colors.text,
      marginTop: 12,
      marginBottom: 20,
      textAlign: "center",
    },
    backButtonAlt: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    backButtonText: {
      color: "white",
      fontWeight: "600",
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
    backButton: {
      position: "absolute",
      top: Platform.OS === "ios" ? 40 : StatusBar.currentHeight + 10,
      left: 16,
      zIndex: 100,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerActions: {
      position: "absolute",
      top: Platform.OS === "ios" ? 40 : StatusBar.currentHeight + 10,
      right: 16,
      zIndex: 100,
      flexDirection: "row",
    },
    shareButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.3)",
      alignItems: "center",
      justifyContent: "center",
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
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginRight: 10,
    },
    usernameText: {
      fontSize: 16,
      color: colors.subtitle,
      marginBottom: 10,
    },
    bioText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      marginBottom: 16,
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
    actionButtonsRow: {
      flexDirection: "row",
      marginVertical: 16,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    primaryButtonText: {
      color: "white",
      fontWeight: "600",
      fontSize: 15,
    },
    outlineButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    outlineButtonText: {
      color: colors.primary,
    },
    messageButton: {
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    messageButtonText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 15,
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
  });
}
