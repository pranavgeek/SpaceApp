import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext.js";
import NotificationView from "../components/NotificationView.js";

const NotificationScreen = () => {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  const [notifications, setNotifications] = useState([
    { id: "1", title: "New Message", subtitle: "New message from Paul.", details: "You have received a new message from a new friend.", icon: "mail-outline" },
    { id: "2", title: "App Update", subtitle: "New App version available.", details: "A new update is available for the app, remember to update it.", icon: "refresh-outline" },
    { id: "3", title: "Reminder", subtitle: "Meeting tomorrow", details: "Don't forget your meeting tomorrow at 10 AM at Rogers Center.", icon: "alarm-outline" },
    { id: "4", title: "Promotion", subtitle: "New deals for you", details: "Get 20% off on your next purchase! Valid until Feb 14th", icon: "pricetag-outline" },
  ]);

  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationView
              item={item}
              expanded={expanded}
              toggleExpand={toggleExpand}
              deleteNotification={deleteNotification}
            />
          )}
        />
      ) : (
        <Text style={styles.noNotifications}>No notifications available</Text>
      )}
    </View>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    noNotifications: {
      fontSize: 18,
      color: colors.text,
      textAlign: "center",
      marginTop: 50,
    },
  });

export default NotificationScreen;
