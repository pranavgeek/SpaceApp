import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  Linking,     
} from "react-native";
import { getUserOrders, cancelOrder, fetchNotifications } from "../backend/db/API";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import userData from "../backend/db/data.json"; // Import the local data directly

const InfluencerOrderScreen = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch both orders and notifications
      const [orderData, notificationData] = await Promise.all([
        getUserOrders(user.user_id),
        fetchNotifications(user.user_id)
      ]);

      console.log(`Fetched ${orderData.length} orders and ${notificationData.length} notifications for influencer`);

      // Create a map of order IDs to tracking links from notifications
      const trackingMap = {};
      notificationData.forEach(notification => {
        if (notification.link && notification.order_id) {
          trackingMap[notification.order_id] = notification.link;
          console.log(`Found tracking in notification for order ${notification.order_id}: ${notification.link}`);
        }
      });

      // Also pull tracking from local data.json as a fallback
      const localOrders = userData.orders.filter(o => 
        o.buyer_id === parseInt(user.user_id) || o.buyer_id === user.user_id
      );
      localOrders.forEach(order => {
        if (order.tracking_number && !trackingMap[order.order_id]) {
          trackingMap[order.order_id] = order.tracking_number;
          console.log(`Found tracking in local data for order ${order.order_id}: ${order.tracking_number}`);
        }
      });

      // Enhance orders with tracking from notifications or local data
      const enhancedOrders = orderData.map(order => {
        if (!order.tracking_number && trackingMap[order.order_id]) {
          console.log(`Adding tracking to order ${order.order_id} from notification/local data`);
          return {
            ...order,
            tracking_number: trackingMap[order.order_id]
          };
        }
        return order;
      });

      setOrders(enhancedOrders);
      setNotifications(notificationData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const isCancellable = (orderDate) => {
    const now = new Date();
    const placed = new Date(orderDate);
    const diffHours = Math.abs(now - placed) / 36e5; // milliseconds to hours
    return diffHours <= 24;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'shipped':
        return colors.info;
      case 'processing':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.subtitle;
    }
  };

  const getFormattedDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel Order",
          style: "destructive",
          onPress: () => confirmCancelOrder(orderId)
        }
      ]
    );
  };

  const confirmCancelOrder = async (orderId) => {
    try {
      setCancellingOrderId(orderId);
      
      const success = await cancelOrder(orderId);
      
      if (success) {
        // Remove the order from local state
        setOrders(prevOrders => prevOrders.filter(order => order.order_id !== orderId));
        
        Alert.alert(
          "Order Cancelled",
          "Your order has been successfully cancelled.",
          [{ text: "OK" }]
        );
      } else {
        throw new Error("Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      Alert.alert(
        "Error",
        "There was a problem cancelling your order. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setCancellingOrderId(null);
    }
  };

  // open tracking link
  const handleTrack = (link) => {
    console.log("Attempting to open tracking link:", link);
    
    if (!link || link.trim() === "") {
      Alert.alert("No Tracking Available", "Tracking information is not yet available for this order.");
      return;
    }
    
    // Ensure link has a protocol
    let formattedLink = link;
    if (!/^https?:\/\//i.test(link)) {
      formattedLink = `https://${link}`;
    }
    
    console.log("Opening URL:", formattedLink);
    
    Linking.canOpenURL(formattedLink)
      .then((supported) => {
        if (supported) {
          console.log("URL is supported, opening now");
          return Linking.openURL(formattedLink);
        } else {
          console.log("URL is not supported by device");
          throw new Error("Cannot open URL");
        }
      })
      .catch((error) => {
        console.error("Error opening tracking link:", error);
        Alert.alert(
          "Error Opening Link", 
          "Could not open tracking link. The link may be invalid.",
          [{ text: "OK" }]
        );
      });
  };

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const isCancelling = cancellingOrderId === item.order_id;
    const hasTrackingLink = item.tracking_number && item.tracking_number.trim() !== "";
    
    console.log(`Order ${item.order_id} tracking:`, item.tracking_number);
    
    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>ORDER #</Text>
              <Text style={styles.orderId}>{item.order_id}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status || 'Processing'}
              </Text>
            </View>
          </View>
          
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color={colors.subtitle} />
            <Text style={styles.dateText}>
              {getFormattedDate(item.order_date) || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.productSection}>
            <View style={styles.productImageContainer}>
              <Image 
                source={{ uri: item.product_image || 'https://via.placeholder.com/100' }} 
                style={styles.productImage}
              />
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{item.product_name || 'Product'}</Text>
              <Text style={styles.productQuantity}>Quantity: {item.quantity || '1'}</Text>
              <Text style={styles.productPrice}>${item.amount || '0.00'}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>Card (Moneris)</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={styles.detailValue}>${item.amount || '0.00'}</Text>
            </View>
          </View>
          
          <View style={styles.shippingSection}>
            <View style={styles.shippingHeader}>
              <Ionicons name="location-outline" size={18} color={colors.subtitle} />
              <Text style={styles.shippingTitle}>Shipping Address</Text>
            </View>
            <Text style={styles.shippingAddress}>
              {item.shipping_address || 'Address'}, {item.shipping_postal_code || 'Postal Code'}
            </Text>
            <Text style={styles.shippingCity}>
              {item.shipping_city || 'City'}, {item.shipping_province || 'Province'}, {item.shipping_country || 'Country'}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.trackButton,
                !hasTrackingLink && styles.disabledTrackButton,
              ]}
              disabled={!hasTrackingLink}
              onPress={() => handleTrack(item.tracking_number)}
            >
              <Ionicons
                name="location"
                size={18}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.trackText}>
                {hasTrackingLink ? "Track Order" : "No Tracking Yet"}
              </Text>
            </TouchableOpacity>
            
            {isCancellable(item.order_date) && item.status?.toLowerCase() !== 'cancelled' && (
              <TouchableOpacity 
                style={[styles.cancelButton, isCancelling && styles.disabledButton]}
                onPress={() => handleCancelOrder(item.order_id)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#ffffff" style={styles.buttonIcon} />
                ) : (
                  <Ionicons name="close-circle" size={18} color="#ffffff" style={styles.buttonIcon} />
                )}
                <Text style={styles.cancelText}>
                  {isCancelling ? "Cancelling..." : "Cancel"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="box-open" size={70} color={isDarkMode ? "#444" : "#d1d5db"} />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        This is where your orders will appear. Start browsing to find products to promote!
      </Text>
      <TouchableOpacity style={styles.shopNowButton}>
        <Text style={styles.shopNowText} onPress={() => navigation.navigate('Home')}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>My Orders</Text>
      <Text style={styles.headerSubtitle}>
        Track and manage your product orders
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? colors.background : "#fff"}
        translucent={false}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContainer}
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.order_id?.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadData}
        />
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const getDynamicStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.subtitle,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: colors.card,
  },  
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
  },
  orderIdContainer: {
    flexDirection: 'column',
  },
  orderIdLabel: {
    fontSize: 12,
    color: colors.subtitle,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.subtitle,
  },
  divider: {
    height: 1,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
  },
  productSection: {
    flexDirection: 'row',
    padding: 16,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  detailsSection: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.subtitle,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  trackingLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  shippingSection: {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
  },
  shippingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shippingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtitle,
    marginLeft: 6,
  },
  shippingAddress: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 4,
  },
  shippingCity: {
    fontSize: 14,
    color: colors.subtitle,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
  },
  trackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  disabledTrackButton: {
    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.5)' : '#93c5fd',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.6)' : '#f87171', // Lighter red when cancelling
    opacity: 0.8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  trackText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.subtitle,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.subtitle,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopNowText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default InfluencerOrderScreen;