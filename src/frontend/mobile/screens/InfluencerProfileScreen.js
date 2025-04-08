import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
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
import { LinearGradient } from "expo-linear-gradient";

export default function InfluencerProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { user, updateRole } = useAuth();
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState([]);

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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const windowWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && windowWidth >= 992;

  // Example influencer data; replace with dynamic data as needed.
  const influencer = {
    name: user?.name || "pranav Influencer",
    accountType: user.account_type || "N/A",
    profileImage: user?.profileImage
      ? `http://192.168.1.x:5000/images/${user.profile_image}`
      : "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    campaigns: Array.isArray(user?.campaigns) ? user.campaigns : [],
    followers: user?.followers_count || 0,
    earnings: user?.earnings || 0,
  };

  // Action Handlers (adjust navigation routes as needed)
  const handleCampaigns = () => navigation.navigate("Campaigns");
  const handlePendingCampaigns = () => navigation.navigate("PendingCampaigns");

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
            source={{
              uri: "https://images.unsplash.com/photo-1504805572947-34fad45aed93?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
            }}
            style={styles.headerBackground}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]}
              style={styles.gradient}
            />
            <View style={styles.headerContent}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: influencer.profileImage }}
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
              <Text style={styles.profileName}>{influencer.name}</Text>
              <View style={styles.accountTypeBadge}>
                <Text style={styles.accountTypeText}>
                  {influencer.accountType}
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

            {/* Social Media Icons */}
            <View style={styles.socialMediaContainer}>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-instagram" size={20} color="#C13584" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-tiktok" size={20} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
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
                  {location || "No location set"}
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
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {influencer.campaigns.length}
              </Text>
              <Text style={styles.statLabel}>Campaigns</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{influencer.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${influencer.earnings}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>

          {/* Campaign Management Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Campaign Management</Text>
            <View style={styles.buttonsGrid}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleCampaigns}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons
                    name="megaphone-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.buttonText}>Active Campaigns</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={handlePendingCampaigns}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons
                    name="time-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.buttonText}>Pending Campaigns</Text>
              </TouchableOpacity>
            </View>
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
      backgroundColor: "#fef3c7",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
    },
    accountTypeText: {
      color: "#d97706",
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
    socialMediaContainer: {
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
    audienceCard: {
      backgroundColor: "#f8fafc",
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
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
    audienceStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    audienceStat: {
      flexDirection: "row",
      alignItems: "center",
    },
    audienceIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    audienceStatValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    audienceStatLabel: {
      fontSize: 12,
      color: colors.subtitle,
    },
    menuSection: {
      marginBottom: 24,
    },
    buttonsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 16,
      marginHorizontal: -8,
    },
    menuButton: {
      width: "33.333%",
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
    activitySection: {
      marginBottom: 20,
    },
    activityList: {
      backgroundColor: "#f8fafc",
      borderRadius: 12,
      padding: 16,
    },
    activityItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    activityDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    activityDescription: {
      fontSize: 12,
      color: colors.subtitle,
    },
    activityTime: {
      fontSize: 12,
      color: colors.subtitle,
    },
    activityDivider: {
      height: 1,
      backgroundColor: "#e2e8f0",
    },
  });
}
