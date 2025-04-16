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
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState([]);
  const { user } = useAuth();

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

  const seller = {
    name: user?.name || "Pranav",
    city: user?.city || "N/A",
    country: user?.country || "N/A",
    accountType: user?.account_type || "N/A",
    campaigns: Array.isArray(user?.campaigns) ? user.campaigns : [],
    followers: user?.followers_count || 0,
    earnings: user?.earnings || 0,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1520333789090-1afc82db536a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
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
                  source={{
                    uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
                  }}
                  style={styles.profileImage}
                />
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.profileContent}>
          <View style={styles.profileInfoSection}>
            <View style={styles.nameSection}>
              <Text style={styles.profileName}>{seller.name}</Text>
              <View style={styles.accountTypeBadge}>
                <Text style={styles.accountTypeText}>{seller.accountType}</Text>
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
                  {languages.length > 0 ? languages.join(", ") : "No languages set"}
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
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seller.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
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
                onPress={() => navigation.navigate("My Products", { sellerId: user.user_id })}
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
                onPress={() => navigation.navigate("Notifications")}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                </View>
                <Text style={styles.buttonText}>Notifications</Text>
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
    dashboardCard: {
      backgroundColor: "#f8fafc",
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
    analyticsSection: {
      marginBottom: 24,
    },
    analyticsPreview: {
      backgroundColor: "#f8fafc",
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
      backgroundColor: "#fee2e2",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    resetButtonText: {
      color: "#dc2626",
      fontWeight: "600",
      fontSize: 14,
    },
  });
}