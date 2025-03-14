import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext'; // Adjust path as needed

export default function CreatorPlansScreen() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  // Access the theme context
  const { colors } = useTheme();

  // Example plan data (from your screenshot-like content)
  const plans = [
    {
      title: 'Creator Basic',
      price: '$0 / month',
      bullets: [
        'Essential plan for individual creators',
        'Basic analytics',
        'Minimal branding',
        'Community access',
      ],
    },
    {
      title: 'Creator Pro',
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
      title: 'Creator Enterprise',
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

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* <Text style={[styles.screenTitle, { color: colors.text }]}>Creator Plans</Text> */}

      {/* Container for plan cards */}
      <View
        style={[
          styles.cardContainer,
          isDesktopWeb ? styles.rowWrap : styles.columnWrap,
        ]}
      >
        {plans.map((plan, index) => (
          <View
            key={index}
            style={[
              styles.card,
              { backgroundColor: colors.baseContainerBody },
            ]}
          >
            <Text style={[styles.planTitle, { color: colors.text }]}>
              {plan.title}
            </Text>
            <Text style={[styles.planPrice, { color: colors.subtitle }]}>
              {plan.price}
            </Text>

            {/* Bullet points */}
            {plan.bullets.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.text }]}>
                  {item}
                </Text>
              </View>
            ))}

            {/* Select Plan button */}
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: "#1e40af" }]}
            >
              <Text style={[styles.selectButtonText, { color: colors.baseContainerHeader }]}>
                Select Plan
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Desktop web layout: side by side
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Mobile layout: stacked
  columnWrap: {
    flexDirection: 'column',
  },

  /* Each plan card */
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

  /* Bullet items */
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

  /* "Select Plan" button */
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
