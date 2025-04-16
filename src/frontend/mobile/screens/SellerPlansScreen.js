import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SellerPlansScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const { colors } = useTheme();
  const { user, updateRole } = useAuth();

  const plans = [
    {
      title: 'Seller Basic',
      price: '$0 / month',
      bullets: [
        'Essential plan for individual Sellers',
        'Basic analytics',
        'Minimal branding',
        'Community access',
      ],
    },
    {
      title: 'Seller Pro',
      price: '$29.99 / month',
      bullets: [
        'Collaboration features',
        'Advanced analytics',
        'Custom branding',
        'Priority support',
        'More robust tools',
      ],
    },
    {
      title: 'Seller Enterprise',
      price: '$99.99 / month',
      bullets: [
        'All Pro features + advanced tools',
        'Dedicated account manager',
        'White label solution',
        'Extended usage & resources',
        'Enterprise-level support',
      ],
    },
  ];

  const handleSelectPlan = async (plan) => {
    if (!user) return;

    // For a buyer account (the default account)
    if (user.role === "buyer") {
      if (plan.title === "Seller Basic") {
        // Buyer selects free plan – update account to Seller
        try {
          await updateRole("Seller");
          await AsyncStorage.setItem("switchedRole", "Seller");
          Alert.alert("Success", "Your account has been switched to Seller Basic.");
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          }, 100);
        } catch (err) {
          console.error("Switch to seller failed:", err);
          Alert.alert("Error", "Unable to switch to seller. Please try again.");
        }
      } else {
        // Buyer selecting a paid plan: ask for payment confirmation
        Alert.alert(
          "Paid Tier",
          "This tier requires payment. Please complete payment first.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Proceed",
              onPress: () => navigation.navigate("PaymentProcess", { tier: plan.title }),
            },
          ]
        );
      }
    }
    // For a seller account
    else if (user.role === "seller") {
      if (plan.title === "Seller Basic") {
        // Already on the free plan
        Alert.alert("Already on Seller Basic", "You are currently using the Seller Basic plan.");
      } else {
        // For paid plans, ask for payment confirmation
        Alert.alert(
          "Paid Tier",
          "This tier requires payment. Please complete payment first.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Proceed",
              onPress: () => navigation.navigate("PaymentProcess", { tier: plan.title }),
            },
          ]
        );
      }
    } else {
      // Fallback: navigate to home
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
        {plans.map((plan, index) => {
          // Fade the Seller Basic plan if the current account is a seller
          const isBasicDisabled = user?.role === "seller" && plan.title === "Seller Basic";

          return (
            <View
              key={index}
              style={[
                styles.card,
                { backgroundColor: colors.baseContainerBody },
                isBasicDisabled && { opacity: 0.5 },
              ]}
            >
              <Text style={[styles.planTitle, { color: colors.text }]}>
                {plan.title}
              </Text>
              <Text style={[styles.planPrice, { color: colors.subtitle }]}>
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
                style={[styles.selectButton, { backgroundColor: "#1e40af" }]}
                onPress={() => handleSelectPlan(plan)}
                disabled={isBasicDisabled}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    { color: colors.baseContainerHeader },
                  ]}
                >
                  Select Plan
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
    paddingHorizontal: 8,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  columnWrap: {
    flexDirection: 'column',
  },
  card: {
    width: 320,
    borderRadius: 8,
    margin: 8,
    padding: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    marginRight: 6,
    fontSize: 16,
  },
  bulletText: {
    flexShrink: 1,
  },
  selectButton: {
    borderRadius: 4,
    paddingVertical: 12,
    marginTop: 16,
  },
  selectButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
