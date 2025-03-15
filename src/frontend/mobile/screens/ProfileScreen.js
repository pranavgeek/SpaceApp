import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import ButtonSettings from "../components/ButtonSettings";
import ButtonMain from "../components/ButtonMain";
import ButtonIcon from "../components/ButtonIcon";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState([]);

  // Function to load location and languages from AsyncStorage
  const loadData = async () => {
    try {
      const storedLocation = await AsyncStorage.getItem("location");
      const storedLanguages = await AsyncStorage.getItem("languages");
      if (storedLocation) {
        setLocation(storedLocation);
      }
      if (storedLanguages) {
        setLanguages(JSON.parse(storedLanguages));
      }
    } catch (error) {
      console.error("Error loading data from AsyncStorage", error);
    }
  };

  // Reload data each time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const windowWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && windowWidth >= 992;

  return (
    <ScrollView style={styles.container}>
      {isDesktopWeb && <View style={styles.headerBackground} />}
      <View style={styles.profileCard}>
        {/* PROFILE IMAGE + NAME/SUBTITLE */}
        <View style={styles.profileTopSection}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileSubtitle}>Software Engineer</Text>

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

        {/* LOCATION + LANGUAGE */}
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

        {/* STATS */}
        <View style={styles.statsSection}>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>24</Text>
            <Text style={styles.statsLabel}>Campaigns</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>52.0K</Text>
            <Text style={styles.statsLabel}>Followers</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>125.0K</Text>
            <Text style={styles.statsLabel}>Earnings</Text>
          </View>
        </View>

        {/* BIG BUTTON CONTAINER */}
        <View style={styles.bigButtonContainer}>
          <ButtonSettings
            iconName="grid-outline"
            onPress={() => navigation.navigate("My Products")}
            title="My Products"
            buttonColor={colors.primary}
            iconColor={colors.text}
          />
          <ButtonSettings
            iconName="card-outline"
            onPress={() => navigation.navigate("Payment History")}
            title="Payment"
            buttonColor={colors.primary}
            iconColor={colors.text}
          />
          <ButtonSettings
            iconName="cube-outline"
            onPress={() => {}}
            title="Orders"
            buttonColor={colors.primary}
            iconColor={colors.text}
          />
          <ButtonSettings
            iconName="heart-outline"
            onPress={() => {}}
            title="Favourites"
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
  const isDesktopWeb = isWeb && width >= 992; // Breakpoint for "desktop"

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
      justifyContent: isDesktopWeb ? "flex-start" : "space-around",
      marginBottom: 20,
    },
    statsItem: {
      alignItems: "center",
      marginRight: isDesktopWeb ? 40 : 0,
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