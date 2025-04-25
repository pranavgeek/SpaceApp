import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  RefreshControl,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications } from '../backend/db/API';

const TrackNotification = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadNotifications();
  }, [user]);
  
  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      if (!user || !user.user_id) {
        console.log("No user found");
        setLoading(false);
        return;
      }
      
      const userNotifications = await fetchNotifications(user.user_id);
      
      if (userNotifications && userNotifications.length > 0) {
        // Sort notifications by date (newest first)
        const sortedNotifications = userNotifications.sort((a, b) => 
          new Date(b.date_timestamp) - new Date(a.date_timestamp)
        );
        
        // Add a unique identifier if notification_id doesn't exist
        const notificationsWithIds = sortedNotifications.map((notification, index) => {
          if (!notification.notification_id) {
            return { ...notification, notification_id: `temp-id-${index}` };
          }
          return notification;
        });
        
        setNotifications(notificationsWithIds);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };
  
  const handleNotificationPress = (notification) => {
    // If this is a tracking notification, open the tracking link
    if (notification.link) {
      Linking.openURL(notification.link).catch(err => {
        console.error('Error opening tracking link:', err);
      });
    }
  };
  
  const renderNotificationItem = ({ item }) => {
    const isTrackingNotification = item.link && item.message && item.message.includes('tracking');
    const dateObj = new Date(item.date_timestamp);
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIconContainer}>
          {isTrackingNotification ? (
            <Ionicons name="cube-outline" size={24} color={colors.primary} />
          ) : (
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          )}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          
          <Text style={styles.notificationTime}>
            {dateObj.toLocaleDateString()} • {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          
          {isTrackingNotification && (
            <View style={styles.trackingContainer}>
              <View style={styles.trackingBadge}>
                <Text style={styles.trackingBadgeText}>Tracking Available</Text>
              </View>
              <TouchableOpacity 
                style={styles.trackingButton}
                onPress={() => handleNotificationPress(item)}
              >
                <Text style={styles.trackingButtonText}>View Tracking</Text>
                <Ionicons name="open-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Generate a truly unique key for each notification
  const keyExtractor = (item, index) => {
    // Use the notification_id if available, otherwise create a unique key from index
    if (item.notification_id) {
      return item.notification_id.toString();
    }
    // If notification_id is not available, create a unique key from index
    return `notification-${index}`;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? colors.background : '#fff'}
      />
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="notifications-off-outline" 
            size={60} 
            color={colors.subtitle} 
          />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            You'll see notifications about your orders and tracking updates here
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const getDynamicStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? colors.border : '#f1f5f9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  rightPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.subtitle,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.subtitle,
    textAlign: 'center',
    maxWidth: '80%',
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? colors.card : '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#f0f9ff',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    // Adding a solid background color to fix the shadow efficiency warning
    overflow: 'hidden',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.subtitle,
    marginBottom: 8,
  },
  trackingContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingBadge: {
    backgroundColor: isDarkMode ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackingBadgeText: {
    fontSize: 12,
    color: isDarkMode ? '#4ade80' : '#16a34a',
    fontWeight: '500',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0',
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
  },
  trackingButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
});

export default TrackNotification;