import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([
    { id: "1", title: "New Message", subtitle: "New message from Paul.",  details: "You have received a new message from a new friend.", icon: "mail-outline" },
    { id: "2", title: "App Update", subtitle: "New App version available.", details: "A new update is available for the app, remember to update it.", icon: "refresh-outline" },
    { id: "3", title: "Reminder Reminder Reminder Reminder", subtitle: "Meeting tomorrow", details: "Don't forget your meeting tomorrow at 10 AM at Rogers Center.", icon: "alarm-outline" },
    { id: "4", title: "Promotion", subtitle: "New deals for you", details: "Get 20% off on your next purchase! Valid until Feb 14th", icon: "pricetag-outline" },
  ]);

  const [expanded, setExpanded] = useState({}); // Track expanded notifications

  // Toggle notification details
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete a notification
  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => toggleExpand(item.id)}
      style={styles.card}
    >
      {/* Delete Icon at the Top Right */}
      <TouchableOpacity
        style={styles.deleteIcon}
        onPress={() => deleteNotification(item.id)}
      >
        <Ionicons name="close" size={20} color="#aaa" />
      </TouchableOpacity>

      {/* Card Header with Icon and Title */}
      <View style={styles.cardHeader}>
        <Ionicons name={item.icon} size={24} color="#aaa" style={styles.icon} />
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      </View>

      <Text style={styles.subtitle}>{item.subtitle}</Text>

      {/* Expanded Details */}
      {expanded[item.id] && (
        <Animated.View style={styles.detailsContainer}>
          <Text style={styles.details}>{item.details}</Text>
        </Animated.View>
      )}

      {/* Expand/Minimize Icon */}
      <View style={styles.expandIcon}>
        <Ionicons
          name={expanded[item.id] ? "chevron-up-outline" : "chevron-down-outline"}
          size={20}
          color="#777"
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
        />
      ) : (
        <Text style={styles.noNotifications}>No notifications available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#141414",
  },
  card: {
    backgroundColor: "#141414",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#777',
    padding: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    position: "relative",
  },
  deleteIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    /*alignItems: 'flex-end',*/
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
    borderRadius: 5,
    padding: 5,
    borderColor: '#777',
    borderWidth: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    maxWidth: '80%',
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    maxWidth: '80%',
  },
  expandIcon: {
    /*position: "absolute",
    bottom: 10,
    right: 10,*/
    alignItems: 'flex-end'
  },
  detailsContainer: {
    marginTop: 5,
    padding: 10,
    backgroundColor: "#141414",
    borderRadius: 5,
  },
  details: {
    fontSize: 14,
    color: "#999",
  },
  noNotifications: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 50,
  },
});

export default NotificationScreen;
