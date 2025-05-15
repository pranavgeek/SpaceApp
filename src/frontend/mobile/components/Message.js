
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

const Message = ({ 
  chatName, 
  chatCategory, 
  onPress, 
  shortMessage, 
  time, 
  hasCollabRequest,
  collabStatus,
  profileImage
}) => {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  
  // Format the message preview
  const messagePreview = shortMessage && typeof shortMessage === 'string' 
    ? shortMessage.length > 30 
      ? shortMessage.substring(0, 27) + '...' 
      : shortMessage
    : '';
    
  // Get correct collaboration badge
  const renderCollabBadge = () => {
    if (!hasCollabRequest) return null;
    
    switch (collabStatus) {
      case 'Pending':
        return (
          <View style={[styles.badge, styles.pendingBadge]}>
            <Text style={styles.badgeText}>Pending</Text>
          </View>
        );
      case 'Accepted':
        return (
          <View style={[styles.badge, styles.acceptedBadge]}>
            <Text style={styles.badgeText}>Accepted</Text>
          </View>
        );
      case 'Declined':
        return (
          <View style={[styles.badge, styles.declinedBadge]}>
            <Text style={styles.badgeText}>Declined</Text>
          </View>
        );
      default:
        return null;
    }
  };
    
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.buttonContent}>
        <Image
          source={{
            uri: profileImage || "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
          }}
          style={styles.profilePicture}
        />

        <View style={styles.container}>
          <View style={styles.nameContainer}>
            <Text style={styles.buttonText}>
              {chatName}
            </Text>
            {renderCollabBadge()}
          </View>
          
          {chatCategory && (
            <Text style={styles.categoryText} numberOfLines={1}>
              {chatCategory}
            </Text>
          )}
          
          {messagePreview && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {messagePreview}
            </Text>
          )}
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 14,
      padding: 12,
      marginVertical: 5,
      backgroundColor: colors.baseContainerBody,
    },
    profilePicture: {
      width: 40,
      height: 40,
      borderRadius: 60,
      backgroundColor: colors.subtitle,
      margin: 5,
    },
    container: {
      flexDirection: "column",
      flex: 1,
      paddingLeft: 5,
    },
    nameContainer: {
      flexDirection: "row", 
      alignItems: "center",
      justifyContent: "flex-start",
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    timeContainer: {
      marginLeft: "auto",
      alignSelf: "flex-start",
      paddingTop: 2,
    },
    icon: {
      marginRight: 10,
      color: colors.text,
      fontSize: 20,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      paddingVertical: 2,
      marginRight: 8,
    },
    categoryText: {
      fontSize: 14,
      color: colors.subtitle,
      marginVertical: 2,
    },
    subtitle: {
      fontSize: 13,
      color: colors.subtitle,
    },
    time: {
      fontSize: 13,
      color: colors.subtitle,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 2,
    },
    pendingBadge: {
      backgroundColor: "#FFA500",
    },
    acceptedBadge: {
      backgroundColor: "#4CAF50",
    },
    declinedBadge: {
      backgroundColor: "#FF6B6B",
    },
    badgeText: {
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
    }
  });

export default Message;