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
} from "react-native";
import ButtonSettings from "../components/ButtonSettings";
import ButtonMain from "../components/ButtonMain";
import ButtonIcon from "../components/ButtonIcon";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

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

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const handleResetCollaborationRequests = async () => {
    try {
      await AsyncStorage.removeItem("collaborationRequests");
      Alert.alert("Reset", "Collaboration requests have been cleared.");
    } catch (error) {
      console.error("Error clearing collaboration requests", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

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
    <ScrollView style={styles.container}>
      {isDesktopWeb && <View style={styles.headerBackground} />}
      <View style={styles.profileCard}>
        <View style={styles.profileTopSection}>
          <Image
            source={{
              uri:
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{seller.name}</Text>
            <Text style={styles.profileSubtitle}>{seller.accountType}</Text>
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
          </View>
        </View>

        <View style={styles.locationSection}>
          <View style={styles.profileRow}>
            <Ionicons name="globe-outline" size={18} color={colors.subtitle} style={{ marginRight: 6 }} />
            <Text style={styles.profileText}>{seller.city}, {seller.country}</Text>
          </View>
          <View style={styles.profileRow}>
            <Ionicons name="language" size={18} color={colors.subtitle} style={{ marginRight: 6 }} />
            <Text style={styles.profileText}>
              {languages.length > 0 ? languages.join(", ") : "No languages set"}
            </Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{seller.campaigns.length}</Text>
            <Text style={styles.statsLabel}>Campaigns</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{seller.followers}</Text>
            <Text style={styles.statsLabel}>Followers</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{seller.earnings}</Text>
            <Text style={styles.statsLabel}>Earnings</Text>
          </View>
        </View>

        <View style={styles.bigButtonContainer}>
          <ButtonSettings iconName="grid-outline" onPress={() => navigation.navigate("My Products")} title="My Products" buttonColor={colors.primary} iconColor={colors.text} />
          <ButtonSettings iconName="grid-outline" onPress={() => navigation.navigate("Collaboration Requests")} title="Collaboration Requests" buttonColor={colors.primary} iconColor={colors.text} />
          <ButtonSettings iconName="card-outline" onPress={() => navigation.navigate("Payment History")} title="Payment" buttonColor={colors.primary} iconColor={colors.text} />
          <ButtonSettings iconName="cube-outline" onPress={() => {}} title="Orders" buttonColor={colors.primary} iconColor={colors.text} />
          <ButtonSettings iconName="heart-outline" onPress={() => {}} title="Favourites" buttonColor={colors.primary} iconColor={colors.text} />
        </View>
      </View>
    </ScrollView>
  );
}

const getDynamicStyles = (colors) => {
  const { width } = Dimensions.get("window");
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && width >= 992;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: isDesktopWeb ? 0 : 10 },
    headerBackground: {
      position: "absolute", top: 0, left: 0, right: 0, height: 140,
      backgroundColor: colors.primary, opacity: 0.7, zIndex: -1,
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
      width: 120, height: 120, borderRadius: 60,
      marginRight: isDesktopWeb ? 20 : 0,
      marginBottom: isDesktopWeb ? 0 : 10,
      borderWidth: isDesktopWeb ? 3 : 0,
      borderColor: "#fff",
    },
    profileInfo: { alignItems: isDesktopWeb ? "flex-start" : "center" },
    profileName: { fontSize: 22, fontWeight: "bold", color: colors.text },
    profileSubtitle: { fontSize: 16, color: colors.subtitle, marginTop: 2, marginBottom: 10 },
    editShareContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
    bigButtonContainer: {
      marginTop: 10,
      flexDirection: isDesktopWeb ? "row" : "column",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: isDesktopWeb ? "flex-start" : "center",
    },
    locationSection: {
      marginTop: 20, marginBottom: 20,
      alignItems: isDesktopWeb ? "flex-start" : "center",
    },
    profileRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
    profileText: { fontSize: 14, color: colors.subtitle },
    statsSection: {
      flexDirection: "row",
      justifyContent: isDesktopWeb ? "flex-start" : "space-around",
      marginBottom: 20,
    },
    statsItem: { alignItems: "center", marginRight: isDesktopWeb ? 40 : 0 },
    statsValue: { fontSize: 18, fontWeight: "bold", color: colors.text },
    statsLabel: { fontSize: 14, color: colors.subtitle },

    // 👇 Reset Button Style
    downgradeButton: {
      marginTop: 20,
      backgroundColor: "#FF3B30",
      padding: 12,
      borderRadius: 8,
    },
    downgradeButtonText: {
      color: "#fff",
      fontSize: 16,
      textAlign: "center",
    },
  });
};
