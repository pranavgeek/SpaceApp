import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/ThemeContext.js";
import { Ionicons } from "@expo/vector-icons";

const BaseContainer = ({ title, subtitle, titleIcon, children, footer }) => {
  const { isDarkMode, colors, toggleTheme } = useTheme();
  const styles = getDynamicStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      {(title || subtitle || titleIcon) && (
        <View style={styles.header}>
          {titleIcon && (
            <Ionicons name={titleIcon} size={24} style={styles.titleIcon} />
          )}
          {(title || subtitle) && (
            <View style={styles.headerContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}
        </View>
      )}

      {/* Content Section */}
      <View style={[styles.content, { backgroundColor: "#1e40af" }]}>
        {children}

        {/* Footer Section */}
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </View>
  );
};

// Dynamic styles based on theme colors
const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      paddingTop: 8,
      paddingHorizontal: 4,
      backgroundColor: colors.baseContainerHeader,
      borderRadius: 10,
      margin: 8,
    },
    headerContainer: {
      paddingHorizontal: 4,
      margin: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      margin: 8,
      marginRight: 24,
    },
    titleIcon: {
      width: 48,
      height: 48,
      marginRight: 8,
      color: colors.text,
      borderColor: colors.text,
      backgroundColor: colors.background,
      borderRadius: 24,
      padding: 12,
    },
    title: {
      fontSize: 19,
      fontWeight: "bold",
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
    },
    content: {
      borderRadius: 10,
      padding: 16,
      marginVertical: 8,
      backgroundColor: colors.baseContainerHeader,
      // iOS shadow properties
      shadowColor: "#080A1A",
      // Negative offset to cast the shadow upward
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.9,
      shadowRadius: 4,

      // Android elevation (drawn below by default, so it may not perfectly match iOS)
      elevation: 4,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.baseContainerFooter,
      color: colors.text,
      borderRadius: 25,
      marginTop: 8,
    },
  });

export default BaseContainer;
