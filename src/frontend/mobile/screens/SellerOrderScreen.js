import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Image,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getSellerReceivedOrders } from "../backend/db/API";
import { useAuth } from "../context/AuthContext";

const SellerOrderScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await getSellerReceivedOrders(user.user_id);
      setOrders(result);
    } catch (err) {
      console.error("Error fetching received orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderItem = ({ item, index }) => {
    // Calculate a status color based on the order ID (just for UI variation)
    const statusColors = ['#10b981', '#f59e0b', '#3b82f6'];
    const statusColor = statusColors[index % statusColors.length];
    
    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={styles.orderId}>Order #{item.order_id}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.cardContent}>
            <View style={styles.productInfo}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: 'https://via.placeholder.com/100' }} 
                  style={styles.productImage}
                />
              </View>
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{item.product_name}</Text>
                <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
              </View>
            </View>
            
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status || 'Processing'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cardFooter}>  
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("Shipping", { order: item })}
            >
              <Text style={styles.editText}>Update Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{ uri: 'https://via.placeholder.com/150' }} 
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        You haven't received any orders yet. When customers purchase your products, they'll appear here.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Your Sales</Text>
      <Text style={styles.headerSubtitle}>Manage and process your customer orders</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : (
        <FlatList
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.container}
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.order_id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3b82f6"]}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: "#6b7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
  },
  cardContent: {
    padding: 16,
  },
  productInfo: {
    flexDirection: "row",
    marginBottom: 16,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: "#f3f4f6",
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
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 14,
    color: "#4b5563",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    marginLeft: 8,
    alignItems: "center",
  },
  editText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default SellerOrderScreen;