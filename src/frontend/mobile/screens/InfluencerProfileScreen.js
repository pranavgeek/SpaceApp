// InfluencerProfileScreen.js
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
} from "react-native";
import ButtonSettings from "../components/ButtonSettings";
import ButtonMain from "../components/ButtonMain";
import ButtonIcon from "../components/ButtonIcon";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function InfluencerProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  // For consistency, we load location & languages even if you might not use them for influencer
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

  // Example influencer data; replace these with dynamic data as needed.
  const influencer = {
    name: "Jane Influencer",
    profileImage:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    campaigns: 8,
    followers: "75.0K",
    earnings: "$12.5K",
  };

  // Action Handlers (adjust navigation routes as needed)
  const handleCampaigns = () => navigation.navigate("Campaigns");
  const handlePendingCampaigns = () => navigation.navigate("PendingCampaigns");

  return (
    <ScrollView style={styles.container}>
      {isDesktopWeb && <View style={styles.headerBackground} />}
      <View style={styles.profileCard}>
        {/* PROFILE IMAGE + NAME/SUBTITLE */}
        <View style={styles.profileTopSection}>
          <Image
            source={{ uri: influencer.profileImage }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{influencer.name}</Text>
            <Text style={styles.profileSubtitle}>Influencer</Text>

            {/* Edit + Share */}
            <View style={styles.editShareContainer}>
              <ButtonMain
                style={styles.editBtn}
                onPress={() => navigation.navigate("Edit Profile")}
                buttonColor={colors.primary}
              >
                Edit Profile
              </ButtonMain>
              <ButtonIcon iconName="share-social" iconColor={colors.text} />
            </View>

            {/* Social Icons */}
            <View style={styles.socialMediaContainer}>
              <ButtonIcon iconName="logo-twitter" iconColor={colors.text} />
              <ButtonIcon iconName="logo-instagram" iconColor={colors.text} />
              <ButtonIcon iconName="logo-tiktok" iconColor={colors.text} />
              <ButtonIcon iconName="logo-linkedin" iconColor={colors.text} />
            </View>
          </View>
        </View>

        {/* LOCATION + LANGUAGE (Optional) */}
        <View style={styles.locationSection}>
          <View style={styles.profileRow}>
            <Ionicons
              name="globe-outline"
              size={18}
              color={colors.subtitle}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.profileText}>
              {location || "No location set"}
            </Text>
          </View>
          <View style={styles.profileRow}>
            <Ionicons
              name="language"
              size={18}
              color={colors.subtitle}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.profileText}>
              {languages.length > 0 ? languages.join(", ") : "No languages set"}
            </Text>
          </View>
        </View>

        {/* STATS SECTION */}
        <View style={styles.statsSection}>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{influencer.campaigns}</Text>
            <Text style={styles.statsLabel}>Campaigns</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{influencer.followers}</Text>
            <Text style={styles.statsLabel}>Followers</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{influencer.earnings}</Text>
            <Text style={styles.statsLabel}>Earnings</Text>
          </View>
        </View>

        {/* BIG BUTTON CONTAINER */}
        <View style={styles.bigButtonContainer}>
          <ButtonSettings
            iconName="megaphone-outline"
            onPress={handleCampaigns}
            title="Campaigns"
            buttonColor={colors.primary}
            iconColor={colors.text}
          />
          <ButtonSettings
            iconName="time-outline"
            onPress={handlePendingCampaigns}
            title="Pending Campaigns"
            buttonColor={colors.primary}
            iconColor={colors.text}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function getDynamicStyles(colors) {
  const { width } = Dimensions.get("window");
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && width >= 992;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: isDesktopWeb ? 0 : 10,
    },
    headerBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 140,
      backgroundColor: colors.primary,
      opacity: 0.7,
      zIndex: -1,
    },
    profileCard: {
      backgroundColor: isDesktopWeb ? colors.baseContainerHeader : colors.background,
      marginTop: isDesktopWeb ? 60 : 0,
      marginHorizontal: isDesktopWeb ? "auto" : 0,
      width: isDesktopWeb ? 800 : "100%",
      borderRadius: 8,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    profileTopSection: {
      flexDirection: isDesktopWeb ? "row" : "column",
      alignItems: isDesktopWeb ? "flex-start" : "center",
      marginBottom: 20,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      marginRight: isDesktopWeb ? 20 : 0,
      marginBottom: isDesktopWeb ? 0 : 10,
      borderWidth: isDesktopWeb ? 3 : 0,
      borderColor: "#fff",
    },
    profileInfo: {
      alignItems: isDesktopWeb ? "flex-start" : "center",
    },
    profileName: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
    },
    profileSubtitle: {
      fontSize: 16,
      color: colors.subtitle,
      marginTop: 2,
      marginBottom: 10,
    },
    editShareContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      gap: 10,
    },
    editBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    socialMediaContainer: {
      flexDirection: "row",
      gap: 10,
    },
    locationSection: {
      marginTop: 20,
      marginBottom: 20,
      alignItems: isDesktopWeb ? "flex-start" : "center",
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 2,
    },
    profileText: {
      fontSize: 14,
      color: colors.subtitle,
    },
    statsSection: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 20,
    },
    statsItem: {
      alignItems: "center",
    },
    statsValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    statsLabel: {
      fontSize: 14,
      color: colors.subtitle,
    },
    bigButtonContainer: {
      marginTop: 10,
      flexDirection: isDesktopWeb ? "row" : "column",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: isDesktopWeb ? "flex-start" : "center",
    },
  });
}