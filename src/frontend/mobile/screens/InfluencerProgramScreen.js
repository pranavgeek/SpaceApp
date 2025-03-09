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

// Import the custom hook from your theme context
import { useTheme } from '../theme/ThemeContext'; // <-- adjust path as needed

export default function InfluencerProgramScreen() {
  const { width } = useWindowDimensions();
  // If on web AND width >= 768 => horizontal layout
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  // Pull colors (and optionally isDarkMode, toggleTheme) from context
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* Container for all the tier cards */}
      <View
        style={[
          styles.cardContainer,
          isDesktopWeb ? styles.rowWrap : styles.columnWrap,
        ]}
      >
        {/* Rising Tier */}
        <View style={[styles.card, { backgroundColor: colors.baseContainerBody }]}>
          {/* Pink (or theme-based) header bar */}
          <View
            style={[
              styles.headerBar,
              // If you prefer a theme-based color, use colors.primary or colors.secondary:
              // { backgroundColor: colors.secondary }
              { backgroundColor: colors.primary }, // Hard-coded pink to match your screenshot
            ]}
          >
            <Text style={[styles.starIcon, { color: '#000' }]}>★</Text>
            <Text style={[styles.baseText, { color: '#000' }]}>
              Up to $3000/mo base
            </Text>
          </View>

          {/* Card body */}
          <View style={styles.cardBody}>
            <Text style={[styles.tierTitle, { color: colors.text }]}>Rising Tier</Text>

            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                10,000+ followers
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                3%+ engagement rate
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                15% commission on sales
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                Up to $500 in bonuses
              </Text>
            </View>

            {/* Apply Now button */}
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.buttonBackground }]}
            >
              <Text style={[styles.applyButtonText, { color: colors.baseContainerHeader }]}>
                Apply Now
              </Text>
              <Text style={[styles.arrow, { color: colors.baseContainerHeader }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Established Tier */}
        <View style={[styles.card, { backgroundColor: colors.baseContainerBody }]}>
          <View
            style={[
              styles.headerBar,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.starIcon, { color: '#000' }]}>★</Text>
            <Text style={[styles.baseText, { color: '#000' }]}>
              Up to $7500/mo base
            </Text>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.tierTitle, { color: colors.text }]}>
              Established Tier
            </Text>

            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                50,000+ followers
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                4%+ engagement rate
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                20% commission on sales
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                Up to $2500 in bonuses
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.buttonBackground }]}
            >
              <Text style={[styles.applyButtonText, { color: colors.baseContainerHeader }]}>
                Apply Now
              </Text>
              <Text style={[styles.arrow, { color: colors.baseContainerHeader }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Elite Tier */}
        <View style={[styles.card, { backgroundColor: colors.baseContainerBody }]}>
          <View
            style={[
              styles.headerBar,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.starIcon, { color: '#000' }]}>★</Text>
            <Text style={[styles.baseText, { color: '#000' }]}>
              Up to $20000/mo base
            </Text>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.tierTitle, { color: colors.text }]}>Elite Tier</Text>

            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                250,000+ followers
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                5%+ engagement rate
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                25% commission on sales
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                Up to $5000 in bonuses
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.buttonBackground }]}
            >
              <Text style={[styles.applyButtonText, { color: colors.baseContainerHeader }]}>
                Apply Now
              </Text>
              <Text style={[styles.arrow, { color: colors.baseContainerHeader }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
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

  // Each card
  card: {
    width: 320,
    borderRadius: 8,
    margin: 8,
    overflow: 'hidden',
  },

  // Pink header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  starIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  baseText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Card body
  cardBody: {
    padding: 16,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // Bullet items
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    marginRight: 6,
  },
  bulletText: {
    fontSize: 14,
    flexShrink: 1,
  },

  // "Apply Now" button
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 16,
    marginLeft: 8,
  },
});
