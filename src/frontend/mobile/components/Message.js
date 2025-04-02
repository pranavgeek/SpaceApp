import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const Message = ({ chatName, chatCategory, onPress, shortMessage, time }) => {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.buttonContent}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
          }}
          style={styles.profilePicture}
        />

        <View style={styles.container}>
          <Text style={styles.buttonText}>
            {chatName}
            {chatCategory && <Text style={styles.subtitle}>{chatCategory}</Text>}
          </Text>
          {shortMessage && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {shortMessage}
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
      color: colors.text,
      paddingVertical: 2,
    },
    subtitle: {
      fontSize: 13,
      color: colors.subtitle,
    },
    time: {
      fontSize: 13,
      color: colors.subtitle,
    },
  });

export default Message;