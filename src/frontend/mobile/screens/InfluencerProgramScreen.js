import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext"; // Adjust path as needed
import { useAuth } from "../context/AuthContext";

export default function InfluencerProgramScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 768;
  const { colors } = useTheme();
  const { user, updateRole } = useAuth();

  const plans = [
    {
      title: "Rising Tier",
      price: "Up to $3000/mo base",
      bullets: [
        "10,000+ followers",
        "3%+ engagement rate",
        "15% commission on sales",
        "Up to $500 in bonuses",
      ],
    },
    {
      title: "Established Tier",
      price: "Up to $7500/mo base",
      bullets: [
        "50,000+ followers",
        "4%+ engagement rate",
        "20% commission on sales",
        "Up to $2500 in bonuses",
      ],
    },
    {
      title: "Elite Tier",
      price: "Up to $20000/mo base",
      bullets: [
        "250,000+ followers",
        "5%+ engagement rate",
        "25% commission on sales",
        "Up to $5000 in bonuses",
      ],
    },
  ];

  const handleSelectTier = async (tier) => {
    if (user && user.role === "buyer") {
      if (tier === "Rising Tier") {
        try {
          await updateRole("influencer"); // 🔁 API + AsyncStorage + state
          await AsyncStorage.setItem("switchedRole", "Influencer");
          navigation.navigate("Home");
           // Delay before reset to allow AsyncStorage to save
           setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          }, 100); // ⏱️ Short delay
        } catch (err) {
          console.error("Switch to influencer failed:", err);
          Alert.alert("Error", "Unable to switch account. Try again.");
        }
      } else {
        Alert.alert(
          "Paid Tier",
          "This tier requires payment. Please complete payment first.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Proceed",
              onPress: () =>
                navigation.navigate("PaymentProcess", { tier }),
            },
          ]
        );
      }
    } else {
      navigation.navigate("Home");
    }
  };
  

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContainer}
    >
      <View
        style={[
          styles.cardContainer,
          isDesktopWeb ? styles.rowWrap : styles.columnWrap,
        ]}
      >
        {plans.map((plan, index) => (
          <View
            key={index}
            style={[styles.card, { backgroundColor: colors.baseContainerBody }]}
          >
            <View style={styles.cardBody}>
              <Text style={[styles.tierTitle, { color: colors.text }]}>
                {plan.title}
              </Text>
              <Text style={[styles.baseText, { color: colors.subtitle }]}>
                {plan.price}
              </Text>
              {plan.bullets.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    {item}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: "#1e40af" }]}
                onPress={() => handleSelectTier(plan.title)}
              >
                <Text
                  style={[
                    styles.applyButtonText,
                    { color: colors.baseContainerHeader },
                  ]}
                >
                  Apply Now
                </Text>
                <Text
                  style={[styles.arrow, { color: colors.baseContainerHeader }]}
                >
                  →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContainer: {
    paddingVertical: 16,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  columnWrap: {
    flexDirection: "column",
  },
  card: {
    width: 320,
    borderRadius: 8,
    margin: 8,
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  starIcon: {
    fontSize: 18,
    fontWeight: "bold",
  },
  baseText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 16,
  },
  cardBody: {
    padding: 16,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 7,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bullet: {
    marginRight: 6,
  },
  bulletText: {
    fontSize: 14,
    flexShrink: 1,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  arrow: {
    fontSize: 16,
    marginLeft: 8,
  },
});