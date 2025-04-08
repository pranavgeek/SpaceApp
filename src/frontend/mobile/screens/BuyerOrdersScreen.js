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
} from "react-native";
import { getUserOrders } from "../backend/db/API";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const BuyerOrderScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getUserOrders(user.user_id);
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const isCancellable = (orderDate) => {
    const now = new Date();
    const placed = new Date(orderDate);
    const diffHours = Math.abs(now - placed) / 36e5; // milliseconds to hours
    return diffHours <= 24;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'shipped':
        return '#3b82f6';
      case 'processing':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
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

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>ORDER #</Text>
              <Text style={styles.orderId}>{item.order_id}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status || 'Processing'}
              </Text>
            </View>
          </View>
          
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.dateText}>
              {getFormattedDate(item.order_date) || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.productSection}>
            <View style={styles.productImageContainer}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/100' }} 
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
              <Ionicons name="location-outline" size={18} color="#4b5563" />
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
            <TouchableOpacity style={styles.trackButton}>
              <Ionicons name="location" size={18} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.trackText}>Track Order</Text>
            </TouchableOpacity>
            
            {isCancellable(item.order_date) && (
              <TouchableOpacity style={styles.cancelButton}>
                <Ionicons name="close-circle" size={18} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{ uri: 'https://via.placeholder.com/200' }} 
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        When you place orders, they will appear here. Start shopping to see your orders!
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>My Orders</Text>
      <Text style={styles.headerSubtitle}>
        Track and manage your purchases
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
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
        />
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#ffffff', // Add this line
  },  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderIdContainer: {
    flexDirection: 'column',
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    backgroundColor: '#f8fafc',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#f3f4f6',
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
    color: '#111827',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  shippingSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  shippingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shippingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginLeft: 6,
  },
  shippingAddress: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  shippingCity: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  trackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
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
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BuyerOrderScreen;