import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  StatusBar,
  Modal,
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
  verifyProduct,
  updateAdminStatus,
  updateUserRole,
  fetchCampaignRequests,
  updateCampaignRequestStatus,
} from "../backend/db/API";
import { useAuth } from "../context/AuthContext";
import SubscriptionManagementScreen from "../components/SubscriptionManagementScreen";
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [campaignRequests, setCampaignRequests] = useState([]);

  useEffect(() => {
    loadAdminDashboard();
    loadCampaignRequests();
  }, []);

  const loadCampaignRequests = async () => {
    try {
      const requests = await fetchCampaignRequests();
      setCampaignRequests(requests);
    } catch (error) {
      console.error("Error loading campaign requests:", error);
      Alert.alert("Error", "Failed to load campaign requests.");
    }
  };

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

  // Add these console logs to your handleInfluencerApproval function in AdminDashboardScreen.js
  // to identify where any issues might be occurring

  const handleInfluencerApproval = async (adminId, userId, details) => {
    try {
      setProcessingAction(true);
      console.log(`✅ Approving influencer application for user ${userId}`);

      // Parse the application details
      let applicationDetails = {};
      try {
        applicationDetails = JSON.parse(details);
        console.log(
          "Successfully parsed application details:",
          applicationDetails
        );
      } catch (error) {
        console.error("Error parsing application details:", error);
        throw new Error("Invalid application details format");
      }

      // 1. Update the admin action status to approved
      console.log("Step 1: Updating admin action status");
      await updateAdminStatus(adminId, "approved");
      console.log("✓ Admin action status updated successfully");

      // 2. Update the user role to influencer with the selected tier
      console.log("Step 2: Updating user role to influencer");
      const selectedTier = applicationDetails.selectedTier || "Starter Tier";

      // THIS IS THE KEY FIX: Make sure you're calling updateUserRole with proper values
      // Role must be lowercase 'influencer' to match checks in your SettingsScreen
      const result = await updateUserRole(userId, "influencer", selectedTier);
      console.log(
        `✓ User ${userId} role updated to influencer with tier: ${selectedTier}`
      );
      console.log("Update result:", result);

      // 3. Create a notification for the user
      console.log("Step 3: Creating notification for user");
      const notificationData = {
        user_id: userId,
        message: `Congratulations! Your application to become an influencer has been approved. Welcome to the ${selectedTier} program.`,
        date_timestamp: new Date().toISOString(),
      };

      await createNotification(notificationData);
      console.log(`✓ Notification created for user ${userId}`);

      // 4. Refresh admin data to update the UI
      console.log("Step 4: Refreshing admin dashboard data");
      await loadAdminDashboard();
      console.log("✓ Admin dashboard refreshed");

      // Verify the user was updated correctly
      const updatedUsers = await fetchUsers();
      const updatedUser = updatedUsers.find((u) => u.user_id === userId);

      console.log("User after approval:", updatedUser);

      if (
        updatedUser &&
        (updatedUser.role === "influencer" ||
          updatedUser.account_type === "Influencer")
      ) {
        console.log(`✅ Confirmed: User ${userId} is now an influencer`);
      } else {
        console.warn(
          `⚠️ Warning: User ${userId} role may not have updated properly. Current role: ${updatedUser?.role}, account type: ${updatedUser?.account_type}`
        );
      }

      Alert.alert(
        "Success",
        `${updatedUser?.name || "User"}'s influencer application has been approved. They now have influencer access.`
      );
    } catch (error) {
      console.error("Error approving influencer application:", error);
      Alert.alert(
        "Error",
        `Failed to approve influencer application: ${error.message}`
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleInfluencerRejection = async (adminId, userId) => {
    try {
      setProcessingAction(true);
      console.log(`❌ Rejecting influencer application for user ${userId}`);

      // 1. Update the admin status to rejected
      await updateAdminStatus(adminId, "rejected");

      // 2. Find the user to get their name
      const applicant = users.find((u) => u.user_id === userId);

      if (!applicant) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // 3. Create a notification for the user
      const notificationData = {
        user_id: userId,
        message:
          "We've reviewed your influencer application. Unfortunately, we are unable to approve it at this time. Please contact support for more information.",
        date_timestamp: new Date().toISOString(),
      };

      await createNotification(notificationData);

      // 4. Refresh admin data to update the UI
      await loadAdminDashboard();

      Alert.alert(
        "Success",
        `${applicant.name}'s influencer application has been rejected.`
      );
    } catch (error) {
      console.error("Error rejecting influencer application:", error);
      Alert.alert(
        "Error",
        "Failed to reject influencer application. Please try again."
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApprove = async (adminId, userId, role, additionalData) => {
    try {
      setProcessingAction(true);
      if (role === "Influencer") {
        // ... existing influencer approval logic
      } else if (role === "Campaign") {
        // Handle campaign approval
        await updateCampaignRequestStatus(additionalData.requestId, {
          status: "approved",
        });
        Alert.alert("Success", "Campaign approved!");
      }
      await loadAdminDashboard();
      await loadCampaignRequests();
    } catch (error) {
      console.error("Error during approval:", error);
      Alert.alert("Error", "Approval failed.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCampaignApproval = async (requestId, adminId) => {
    try {
      setProcessingAction(true);
      console.log(`✅ Approving campaign request ${requestId}`);

      // 1. Update the admin action status
      if (adminId) {
        await updateAdminStatus(adminId, "approved");
      }

      // 2. Update the campaign request status
      await updateCampaignRequestStatus(requestId, "Accepted");

      // 3. Create notifications for both seller and influencer
      const campaign = campaignRequests.find((c) => c.requestId === requestId);
      if (campaign) {
        // Notify influencer
        await createNotification({
          user_id: campaign.influencerId,
          message: `Your campaign for "${campaign.productName}" has been approved. Check your Active Campaigns tab.`,
          date_timestamp: new Date().toISOString(),
        });

        // Notify seller
        await createNotification({
          user_id: campaign.sellerId,
          message: `Your campaign request with ${campaign.influencerName} for "${campaign.productName}" has been approved.`,
          date_timestamp: new Date().toISOString(),
        });
      }

      // 4. Refresh data
      await loadCampaignRequests();

      Alert.alert("Success", "Campaign has been approved successfully.");
    } catch (error) {
      console.error("Error approving campaign:", error);
      Alert.alert(
        "Error",
        "Failed to approve campaign request. Please try again."
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCampaignRejection = async (requestId) => {
    try {
      setProcessingAction(true);
      console.log(`❌ Rejecting campaign request ${requestId}`);

      // 1. Update the campaign request status
      await updateCampaignRequestStatus(requestId, "Declined");

      // 2. Create notifications for both seller and influencer
      const campaign = campaignRequests.find((c) => c.requestId === requestId);
      if (campaign) {
        // Notify influencer
        await createNotification({
          user_id: campaign.influencerId,
          message: `Campaign request for "${campaign.productName}" has been declined by admin.`,
          date_timestamp: new Date().toISOString(),
        });

        // Notify seller
        await createNotification({
          user_id: campaign.sellerId,
          message: `Your campaign request with ${campaign.influencerName} for "${campaign.productName}" was not approved.`,
          date_timestamp: new Date().toISOString(),
        });
      }

      // 3. Refresh data
      await loadCampaignRequests();

      Alert.alert("Success", "Campaign has been declined.");
    } catch (error) {
      console.error("Error rejecting campaign:", error);
      Alert.alert(
        "Error",
        "Failed to reject campaign request. Please try again."
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleProductVerify = async (productId, productName) => {
    try {
      setProcessingAction(true);
      console.log(
        `Attempting to verify product: ID ${productId}, Name: "${productName}"`
      );

      // Call the API to verify the product, passing both ID and name
      const response = await verifyProduct(productId, productName);
      console.log("API Response:", response);

      if (!response.success) {
        throw new Error(response.message || "Verification failed");
      }

      // Refresh products data
      const allProducts = await fetchProducts();

      // Verify that the product was actually updated
      const verifiedProduct = allProducts.find(
        (p) =>
          p.product_id === productId &&
          p.product_name === productName &&
          p.verified === true
      );

      if (!verifiedProduct) {
        console.warn(
          "Product may not have been verified. Product not showing as verified in database."
        );
        setProducts(allProducts);
        Alert.alert(
          "Verification Issue",
          "The product appears to have verification issues. Please check the database.",
          [{ text: "OK" }]
        );
        return;
      }

      // Successfully verified, notify the seller
      const seller = users.find(
        (u) => u.user_id === verifiedProduct.user_seller
      );

      if (seller) {
        await createNotification({
          user_id: seller.user_id,
          message: `✅ Your product "${verifiedProduct.product_name}" has been verified and is now live!`,
          date_timestamp: new Date().toISOString(),
        });
        console.log(
          `Notification sent to seller ${seller.name} (ID: ${seller.user_id})`
        );
      }

      // Update the local products state
      setProducts(allProducts);

      Alert.alert(
        "Success",
        `Product "${productName}" verified successfully and is now live on the platform.`
      );
    } catch (error) {
      console.error("Error verifying product:", error);
      Alert.alert("Error", `Failed to verify product: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTrackingApprove = async (order) => {
    try {
      setProcessingAction(true);
      console.log(`✅ Approving tracking for order ${order.order_id}`);

      // 1. Call the API to approve the tracking link
      await approveTrackingLink(order.order_id, order.pending_tracking_link);

      // 2. Find the buyer and seller details
      const buyer = users.find((u) => u.user_id === order.buyer_id);
      const seller = users.find((u) => u.user_id === order.seller_id);

      if (!buyer) {
        throw new Error(`Buyer with ID ${order.buyer_id} not found`);
      }

      // 3. Create a notification for the buyer
      const notificationData = {
        user_id: order.buyer_id,
        message: `Your tracking link for order #${order.order_id} is now available. ${seller ? `Sent by ${seller.name}` : ""}`,
        date_timestamp: new Date().toISOString(),
        link: order.pending_tracking_link,
        order_id: order.order_id,
      };

      await createNotification(notificationData);

      // 4. Update local state to remove the approved tracking
      setPendingTrackings(
        pendingTrackings.filter((t) => t.order_id !== order.order_id)
      );

      Alert.alert(
        "Success",
        `Tracking link approved and notification sent to ${buyer.name}.`
      );
    } catch (error) {
      console.error("Error approving tracking:", error);
      Alert.alert(
        "Error",
        "Failed to approve tracking link. Please try again."
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTrackingReject = async (orderId) => {
    try {
      setProcessingAction(true);
      // Implementation for rejecting tracking link would go here

      // For now, just remove from the list
      setPendingTrackings(
        pendingTrackings.filter((t) => t.order_id !== orderId)
      );
      Alert.alert("Success", "Tracking link rejected.");
    } catch (error) {
      console.error("Error rejecting tracking:", error);
      Alert.alert("Error", "Failed to reject tracking link.");
    } finally {
      setProcessingAction(false);
    }
  };

  const pendingApprovals = adminData.filter((a) => a.status === "pending");
  const confirmedAccounts = adminData.filter(
    (a) => a.status === "confirmed" || a.status === "approved"
  );

  const renderDashboardStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View
          style={[styles.statIconContainer, { backgroundColor: "#e0f2fe" }]}
        >
          <Ionicons name="people-outline" size={24} color="#0284c7" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>
            {" "}
            {users.filter((u) => u.account_type !== "admin").length}
          </Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View
          style={[styles.statIconContainer, { backgroundColor: "#dcfce7" }]}
        >
          <Ionicons name="cart-outline" size={24} color="#16a34a" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View
          style={[styles.statIconContainer, { backgroundColor: "#fef3c7" }]}
        >
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
        style={[styles.tab, activeTab === "approvals" && styles.activeTab]}
        onPress={() => setActiveTab("approvals")}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={24}
          color={activeTab === "approvals" ? colors.primary : colors.subtitle}
        />
        {pendingApprovals.length > 0 && (
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>{pendingApprovals.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "tracking" && styles.activeTab]}
        onPress={() => setActiveTab("tracking")}
      >
        <Ionicons
          name="navigate-outline"
          size={24}
          color={activeTab === "tracking" ? colors.primary : colors.subtitle}
        />
        {pendingTrackings.length > 0 && (
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>{pendingTrackings.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "campaigns" && styles.activeTab]}
        onPress={() => setActiveTab("campaigns")}
      >
        <Ionicons
          name="megaphone-outline"
          size={24}
          color={activeTab === "campaigns" ? colors.primary : colors.subtitle}
        />
        {campaignRequests.filter((c) => c.status === "Pending").length > 0 && (
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>
              {campaignRequests.filter((c) => c.status === "Pending").length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "accounts" && styles.activeTab]}
        onPress={() => setActiveTab("accounts")}
      >
        <Ionicons
          name="person-outline"
          size={24}
          color={activeTab === "accounts" ? colors.primary : colors.subtitle}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "products" && styles.activeTab]}
        onPress={() => setActiveTab("products")}
      >
        <Ionicons
          name="cube-outline"
          size={24}
          color={activeTab === "products" ? colors.primary : colors.subtitle}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "subscriptions" && styles.activeTab]}
        onPress={() => setActiveTab("subscriptions")}
      >
        <Ionicons
          name="card-outline"
          size={24}
          color={
            activeTab === "subscriptions" ? colors.primary : colors.subtitle
          }
        />
        {users.filter(
          (u) =>
            u.tier &&
            u.tier !== "basic" &&
            u.subscription_end_date &&
            new Date(u.subscription_end_date) <
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ).length > 0 && (
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>
              {
                users.filter(
                  (u) =>
                    u.tier &&
                    u.tier !== "basic" &&
                    u.subscription_end_date &&
                    new Date(u.subscription_end_date) <
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ).length
              }
            </Text>
          </View>
        )}
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
          const isInfluencerApplication =
            item.action && item.action.toLowerCase().includes("influencer");

          let applicationDetails = {};
          if (isInfluencerApplication && item.details) {
            try {
              applicationDetails = JSON.parse(item.details);
            } catch (error) {
              console.error("Error parsing application details:", error);
            }
          }

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
                    <Text style={styles.userName}>
                      {requestUser?.name || "Unknown User"}
                    </Text>
                    <Text style={styles.userAction}>{item.action}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Pending</Text>
                </View>
              </View>

              {isInfluencerApplication &&
                Object.keys(applicationDetails).length > 0 && (
                  <View style={styles.applicationDetails}>
                    <Text style={styles.applicationSection}>
                      Application Details:
                    </Text>

                    <View style={styles.applicationItem}>
                      <Text style={styles.applicationLabel}>Name:</Text>
                      <Text style={styles.applicationValue}>
                        {applicationDetails.fullName}
                      </Text>
                    </View>

                    <View style={styles.applicationItem}>
                      <Text style={styles.applicationLabel}>Email:</Text>
                      <Text style={styles.applicationValue}>
                        {applicationDetails.email}
                      </Text>
                    </View>

                    <View style={styles.applicationItem}>
                      <Text style={styles.applicationLabel}>Phone:</Text>
                      <Text style={styles.applicationValue}>
                        {applicationDetails.phone}
                      </Text>
                    </View>

                    <View style={styles.applicationItem}>
                      <Text style={styles.applicationLabel}>Social Media:</Text>
                      <Text style={styles.applicationValue}>
                        {applicationDetails.socialMediaHandles}
                      </Text>
                    </View>

                    <View style={styles.applicationItem}>
                      <Text style={styles.applicationLabel}>Followers:</Text>
                      <Text style={styles.applicationValue}>
                        {applicationDetails.followers}
                      </Text>
                    </View>

                    <View style={styles.applicationItem}>
                      <Text style={styles.applicationLabel}>Tier:</Text>
                      <Text style={styles.applicationValue}>
                        {applicationDetails.selectedTier || "Starter Tier"}
                      </Text>
                    </View>

                    <View style={styles.applicationItem}>
                      <Text style={styles.applicationLabel}>
                        Why Collaborate:
                      </Text>
                      <Text style={styles.applicationValue}>
                        {applicationDetails.whyCollaborate}
                      </Text>
                    </View>

                    {applicationDetails.priorExperience && (
                      <View style={styles.applicationItem}>
                        <Text style={styles.applicationLabel}>Experience:</Text>
                        <Text style={styles.applicationValue}>
                          {applicationDetails.priorExperience}
                        </Text>
                      </View>
                    )}

                    <View style={styles.applicationItem}>
                      <Text style={styles.applicationLabel}>Contact Via:</Text>
                      <Text style={styles.applicationValue}>
                        {applicationDetails.preferredContact}
                      </Text>
                    </View>
                  </View>
                )}

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() =>
                    isInfluencerApplication
                      ? handleInfluencerRejection(item.admin_id, item.user_id)
                      : handleApprove(item.admin_id, item.user_id, "reject")
                  }
                  disabled={processingAction}
                >
                  <Text style={styles.rejectButtonText}>
                    {processingAction ? "Processing..." : "Reject"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.approveButton,
                    processingAction && styles.disabledButton,
                  ]}
                  onPress={() =>
                    isInfluencerApplication
                      ? handleInfluencerApproval(
                          item.admin_id,
                          item.user_id,
                          item.details
                        )
                      : handleApprove(
                          item.admin_id,
                          item.user_id,
                          item.action.includes("influencer")
                            ? "Influencer"
                            : "Seller"
                        )
                  }
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
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
          const buyer = users.find((u) => u.user_id === item.buyer_id);
          const seller = users.find((u) => u.user_id === item.seller_id);

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
                  <Text style={styles.noTrackingText}>
                    No tracking link provided
                  </Text>
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
                  style={[
                    styles.approveButton,
                    processingAction && styles.disabledButton,
                  ]}
                  onPress={() => handleTrackingApprove(item)}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
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
                  <View
                    style={[
                      styles.userIconContainer,
                      { backgroundColor: "#e0f2fe" },
                    ]}
                  >
                    <Text style={[styles.userInitial, { color: "#0284c7" }]}>
                      {requestUser?.name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>
                      {requestUser?.name || "Unknown User"}
                    </Text>
                    <Text style={styles.userAction}>{item.action}</Text>
                  </View>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: "#dcfce7" }]}
                >
                  <Text style={[styles.statusText, { color: "#16a34a" }]}>
                    {item.status === "approved" ? "Approved" : "Confirmed"}
                  </Text>
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
                      item.action.includes("influencer")
                        ? "Influencer"
                        : "Seller"
                    )
                  }
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.revokeButtonText}>Revoke Access</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderProducts = () => {
    // Enhance product display by handling duplicates more intelligently
    const displayProducts = products.reduce((acc, product) => {
      // Skip products that are null or missing critical data
      if (!product || !product.product_name) return acc;

      // Create a unique key that accounts for both ID and name
      const uniqueKey = `${product.product_id}-${product.product_name}`;

      // If this unique product already exists in our accumulator
      if (acc.some((p) => `${p.product_id}-${p.product_name}` === uniqueKey)) {
        // Keep the verified version if it exists
        if (product.verified) {
          // Replace the existing one with this verified one
          return acc.map((p) =>
            `${p.product_id}-${p.product_name}` === uniqueKey ? product : p
          );
        }
        // Otherwise keep the existing one
        return acc;
      }

      // No duplicate, add to the list
      return [...acc, product];
    }, []);

    // Sort products: unverified first to prioritize verification actions
    const sortedProducts = [...displayProducts].sort((a, b) => {
      // Unverified products first
      if (a.verified && !b.verified) return 1;
      if (!a.verified && b.verified) return -1;

      // Then by creation date (newest first)
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Product Verification</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{sortedProducts.length}</Text>
          </View>
        </View>

        {sortedProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube" size={50} color="#f59e0b" />
            <Text style={styles.emptyStateText}>No products available</Text>
          </View>
        ) : (
          sortedProducts.map((product, index) => (
            <View
              key={`product-${product.product_id}-${encodeURIComponent(product.product_name)}-${index}`}
              style={styles.card}
            >
              <View style={styles.productHeader}>
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="cube-outline" size={24} color="#f59e0b" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.product_name}</Text>
                  <View style={styles.productDetails}>
                    {product.category ? (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                          {product.category}
                        </Text>
                      </View>
                    ) : null}
                    {product.verified ? (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: "#dcfce7", marginLeft: 8 },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: "#16a34a" }]}>
                          Verified
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: "#fee2e2", marginLeft: 8 },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: "#ef4444" }]}>
                          Unverified
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.productFooter}>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => {
                    setSelectedProduct(product);
                    setShowProductModal(true);
                  }}
                >
                  <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>
                {!product.verified && (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() =>
                      handleProductVerify(
                        product.product_id,
                        product.product_name
                      )
                    }
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                    ) : (
                      <Ionicons
                        name="shield-checkmark"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text style={styles.verifyButtonText}>
                      {processingAction ? "Processing..." : "Verify Product"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {/* Modal remains the same */}
        {showProductModal && selectedProduct && (
          <Modal
            visible={showProductModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowProductModal(false)}
          >
            <View style={modalStyles.modalOverlay}>
              <View style={modalStyles.modalContent}>
                <Text style={modalStyles.modalTitle}>
                  {selectedProduct.product_name}
                </Text>
                <ScrollView>
                  <Text style={modalStyles.modalText}>
                    Category: {selectedProduct.category || "Not specified"}
                  </Text>
                  <Text style={modalStyles.modalText}>
                    Price: ${selectedProduct.cost}
                  </Text>
                  <Text style={modalStyles.modalText}>
                    Summary: {selectedProduct.summary || "No summary provided"}
                  </Text>
                  <Text style={modalStyles.modalText}>Description:</Text>
                  <Text style={modalStyles.modalText}>
                    {selectedProduct.description}
                  </Text>
                  {selectedProduct.product_image && (
                    <Image
                      source={{
                        uri: selectedProduct.product_image.startsWith("http")
                          ? selectedProduct.product_image
                          : `http://10.0.0.25:5001/${selectedProduct.product_image}`,
                      }}
                      style={modalStyles.modalImage}
                    />
                  )}
                </ScrollView>
                <TouchableOpacity
                  onPress={() => setShowProductModal(false)}
                  style={modalStyles.closeButton}
                >
                  <Text style={{ color: "#fff" }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  const renderCampaignRequests = () => {
    // Filter for pending campaign requests
    const pendingCampaigns = campaignRequests.filter(
      (req) => req.status === "Pending"
    );

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Campaign Approval Requests</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{pendingCampaigns.length}</Text>
          </View>
        </View>

        {pendingCampaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone" size={50} color="#8b5cf6" />
            <Text style={styles.emptyStateText}>
              No pending campaign requests
            </Text>
          </View>
        ) : (
          pendingCampaigns.map((request) => {
            // Find the admin data related to this campaign request
            const adminAction = adminData.find(
              (action) =>
                action.details &&
                JSON.parse(action.details).campaignRequestId ===
                  request.requestId
            );

            // Find the seller and influencer
            const seller = users.find(
              (u) => u.user_id === parseInt(request.sellerId)
            );
            const influencer = users.find(
              (u) => u.user_id === parseInt(request.influencerId)
            );

            return (
              <View key={request.requestId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <View
                      style={[
                        styles.userIconContainer,
                        { backgroundColor: "#e0f2fe" },
                      ]}
                    >
                      <Text style={styles.userInitial}>
                        {seller?.name?.charAt(0).toUpperCase() || "S"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>
                        {seller?.name || "Unknown Seller"}
                      </Text>
                      <Text style={styles.userAction}>
                        Campaign Request for{" "}
                        {influencer?.name || "Unknown Influencer"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{request.status}</Text>
                  </View>
                </View>

                <View style={styles.campaignDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Product:</Text>
                    <Text style={styles.detailValue}>
                      {request.productName}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={styles.detailValue}>
                      {request.campaignDuration} days
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Commission:</Text>
                    <Text style={styles.detailValue}>
                      {request.commission}%
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Submitted:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(request.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleCampaignRejection(request.requestId)}
                    disabled={processingAction}
                  >
                    <Text style={styles.rejectButtonText}>
                      {processingAction ? "Processing..." : "Reject"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.approveButton,
                      processingAction && styles.disabledButton,
                    ]}
                    onPress={() =>
                      handleCampaignApproval(
                        request.requestId,
                        adminAction?.admin_id
                      )
                    }
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                    ) : (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 4 }}
                      />
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
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "approvals":
        return renderPendingApprovals();
      case "tracking":
        return renderPendingTrackings();
      case "accounts":
        return renderConfirmedAccounts();
      case "products":
        return renderProducts();
      case "campaigns":
        return renderCampaignRequests();
      case "subscriptions":
          return <SubscriptionManagementScreen />;
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
          <Text style={styles.headerSubtitle}>
            Manage approvals and verifications
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
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

const { width } = Dimensions.get("window");

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111827",
  },
  modalText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});

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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    position: "relative",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
  },
  iconBadge: {
    position: "absolute",
    top: 5,
    right: "auto",
    backgroundColor: "#ef4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  iconBadgeText: {
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
  orderInfo: {},
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
  productDetails: {
    flexDirection: "row",
    alignItems: "center",
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
