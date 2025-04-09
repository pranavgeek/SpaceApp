import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import {
  fetchAdminData,
  fetchUsers,
  fetchProducts,
  fetchPendingTrackingLinks,
  approveTrackingLink,
  createNotification,
} from "../backend/db/API";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [adminData, setAdminData] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pendingTrackings, setPendingTrackings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("approvals");
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  const loadAdminDashboard = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminData();
      const allUsers = await fetchUsers();
      const allProducts = await fetchProducts();
      const trackings = await fetchPendingTrackingLinks();

      setAdminData(data);
      setUsers(allUsers);
      setProducts(allProducts);
      setPendingTrackings(trackings);
    } catch (error) {
      console.error("Error loading admin data:", error);
      Alert.alert("Error", "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (adminId, userId, role) => {
    console.log(`✅ Approved ${role} for user ${userId}`);
    // Call updateUser and updateAdminStatus here (to be implemented)
  };

  const handleTrackingApprove = async (order) => {
    try {
      setProcessingAction(true);
      console.log(`✅ Approving tracking for order ${order.order_id}`);
      
      // 1. Call the API to approve the tracking link
      await approveTrackingLink(order.order_id, order.pending_tracking_link);
      
      // 2. Find the buyer and seller details
      const buyer = users.find(u => u.user_id === order.buyer_id);
      const seller = users.find(u => u.user_id === order.seller_id);
      
      if (!buyer) {
        throw new Error(`Buyer with ID ${order.buyer_id} not found`);
      }
      
      // 3. Create a notification for the buyer
      const notificationData = {
        user_id: order.buyer_id,
        message: `Your tracking link for order #${order.order_id} is now available. ${seller ? `Sent by ${seller.name}` : ''}`,
        date_timestamp: new Date().toISOString(),
        link: order.pending_tracking_link,
        order_id: order.order_id
      };
      
      await createNotification(notificationData);
      
      // 4. Update local state to remove the approved tracking
      setPendingTrackings(pendingTrackings.filter(t => t.order_id !== order.order_id));
      
      Alert.alert(
        "Success", 
        `Tracking link approved and notification sent to ${buyer.name}.`
      );
    } catch (error) {
      console.error("Error approving tracking:", error);
      Alert.alert("Error", "Failed to approve tracking link. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTrackingReject = async (orderId) => {
    try {
      setProcessingAction(true);
      // Implementation for rejecting tracking link would go here
      
      // For now, just remove from the list
      setPendingTrackings(pendingTrackings.filter(t => t.order_id !== orderId));
      Alert.alert("Success", "Tracking link rejected.");
    } catch (error) {
      console.error("Error rejecting tracking:", error);
      Alert.alert("Error", "Failed to reject tracking link.");
    } finally {
      setProcessingAction(false);
    }
  };

  const pendingApprovals = adminData.filter(a => a.status === "pending");
  const confirmedAccounts = adminData.filter(a => a.status === "confirmed");

  const renderDashboardStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: '#e0f2fe' }]}>
          <Ionicons name="people-outline" size={24} color="#0284c7" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}>
          <Ionicons name="cart-outline" size={24} color="#16a34a" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="time-outline" size={24} color="#d97706" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{pendingApprovals.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[
          styles.tab, 
          activeTab === 'approvals' && styles.activeTab
        ]} 
        onPress={() => setActiveTab('approvals')}
      >
        <Ionicons 
          name="checkmark-circle-outline" 
          size={20} 
          color={activeTab === 'approvals' ? colors.primary : colors.subtitle} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'approvals' && styles.activeTabText
        ]}>
          Approvals
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.tab, 
          activeTab === 'tracking' && styles.activeTab
        ]} 
        onPress={() => setActiveTab('tracking')}
      >
        <Ionicons 
          name="navigate-outline" 
          size={20} 
          color={activeTab === 'tracking' ? colors.primary : colors.subtitle} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'tracking' && styles.activeTabText
        ]}>
          Tracking
        </Text>
        {pendingTrackings.length > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{pendingTrackings.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.tab, 
          activeTab === 'accounts' && styles.activeTab
        ]} 
        onPress={() => setActiveTab('accounts')}
      >
        <Ionicons 
          name="person-outline" 
          size={20} 
          color={activeTab === 'accounts' ? colors.primary : colors.subtitle} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'accounts' && styles.activeTabText
        ]}>
          Accounts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.tab, 
          activeTab === 'products' && styles.activeTab
        ]} 
        onPress={() => setActiveTab('products')}
      >
        <Ionicons 
          name="cube-outline" 
          size={20} 
          color={activeTab === 'products' ? colors.primary : colors.subtitle} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'products' && styles.activeTabText
        ]}>
          Products
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPendingApprovals = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pending Approvals</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{pendingApprovals.length}</Text>
        </View>
      </View>

      {pendingApprovals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={50} color="#10b981" />
          <Text style={styles.emptyStateText}>No pending approvals</Text>
        </View>
      ) : (
        pendingApprovals.map((item) => {
          const requestUser = users.find((u) => u.user_id === item.user_id);
          return (
            <View key={item.admin_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userIconContainer}>
                    <Text style={styles.userInitial}>
                      {requestUser?.name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{requestUser?.name || "Unknown User"}</Text>
                    <Text style={styles.userAction}>{item.action}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Pending</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.rejectButton}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() =>
                    handleApprove(
                      item.admin_id,
                      item.user_id,
                      item.action.includes("influencer") ? "Influencer" : "Seller"
                    )
                  }
                >
                  <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderPendingTrackings = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tracking Link Approvals</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{pendingTrackings.length}</Text>
        </View>
      </View>

      {pendingTrackings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="navigate" size={50} color="#3b82f6" />
          <Text style={styles.emptyStateText}>No pending tracking links</Text>
        </View>
      ) : (
        pendingTrackings.map((item) => {
          const buyer = users.find(u => u.user_id === item.buyer_id);
          const seller = users.find(u => u.user_id === item.seller_id);
          
          return (
            <View key={item.order_id} style={styles.card}>
              <View style={styles.trackingHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderLabel}>Order ID</Text>
                  <Text style={styles.orderId}>#{item.order_id}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Pending</Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>Product:</Text>
                <Text style={styles.orderDetailText}>{item.product_name}</Text>
                
                <Text style={styles.orderDetailLabel}>Buyer:</Text>
                <Text style={styles.orderDetailText}>
                  {buyer ? buyer.name : `ID: ${item.buyer_id}`}
                </Text>
                
                <Text style={styles.orderDetailLabel}>Seller:</Text>
                <Text style={styles.orderDetailText}>
                  {seller ? seller.name : `ID: ${item.seller_id}`}
                </Text>
              </View>
              
              <View style={styles.trackingLinkContainer}>
                <Ionicons name="link-outline" size={20} color="#6b7280" />
                {item.pending_tracking_link ? (
                  <Text
                    style={styles.trackingLink}
                    onPress={() => Linking.openURL(item.pending_tracking_link)}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {item.pending_tracking_link}
                  </Text>
                ) : (
                  <Text style={styles.noTrackingText}>No tracking link provided</Text>
                )}
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleTrackingReject(item.order_id)}
                  disabled={processingAction}
                >
                  <Text style={styles.rejectButtonText}>
                    {processingAction ? "Processing..." : "Reject"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.approveButton, processingAction && styles.disabledButton]}
                  onPress={() => handleTrackingApprove(item)}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 4 }} />
                  )}
                  <Text style={styles.approveButtonText}>
                    {processingAction ? "Processing..." : "Approve"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderConfirmedAccounts = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Confirmed Accounts</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{confirmedAccounts.length}</Text>
        </View>
      </View>

      {confirmedAccounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={50} color="#8b5cf6" />
          <Text style={styles.emptyStateText}>No confirmed accounts</Text>
        </View>
      ) : (
        confirmedAccounts.map((item) => {
          const requestUser = users.find((u) => u.user_id === item.user_id);
          return (
            <View key={item.admin_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.userIconContainer, { backgroundColor: "#e0f2fe" }]}>
                    <Text style={[styles.userInitial, { color: "#0284c7" }]}>
                      {requestUser?.name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{requestUser?.name || "Unknown User"}</Text>
                    <Text style={styles.userAction}>{item.action}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: "#dcfce7" }]}>
                  <Text style={[styles.statusText, { color: "#16a34a" }]}>Confirmed</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.revokeButton]}
                  onPress={() =>
                    handleApprove(
                      item.admin_id,
                      item.user_id,
                      item.action.includes("influencer") ? "Influencer" : "Seller"
                    )
                  }
                >
                  <Ionicons name="close" size={18} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.revokeButtonText}>Revoke Access</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderProducts = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Product Verification</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{products.length}</Text>
        </View>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube" size={50} color="#f59e0b" />
          <Text style={styles.emptyStateText}>No products available</Text>
        </View>
      ) : (
        products.map((product) => (
          <View key={product.product_id} style={styles.card}>
            <View style={styles.productHeader}>
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="cube-outline" size={24} color="#f59e0b" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.product_name}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{product.category}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.productFooter}>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.verifyButton}>
                <Ionicons name="shield-checkmark" size={18} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.verifyButtonText}>Verify Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'approvals':
        return renderPendingApprovals();
      case 'tracking':
        return renderPendingTrackings();
      case 'accounts':
        return renderConfirmedAccounts();
      case 'products':
        return renderProducts();
      default:
        return renderPendingApprovals();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage approvals and verifications</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {renderDashboardStats()}
          {renderTabs()}
          {renderActiveTabContent()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    width: (width - 48) / 3,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statInfo: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    position: "relative",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: 4,
  },
  activeTabText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  tabBadge: {
    position: "absolute",
    top: 8,
    right: 16,
    backgroundColor: "#ef4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  sectionContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  badgeContainer: {
    backgroundColor: "#e0f2fe",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284c7",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6b7280",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  userAction: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d97706",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  cardFooter: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "flex-end",
    gap: 12,
  },
  rejectButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  approveButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#93c5fd",
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  revokeButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  revokeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  trackingHeader: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderInfo: {
    
  },
  orderLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  orderDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  orderDetailLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
    marginTop: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: "#111827",
  },
  trackingLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  trackingLink: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: "#3b82f6",
    textDecorationLine: "underline",
  },
  noTrackingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  productHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 12,
    color: "#4b5563",
  },
  productFooter: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  verifyButton: {
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});