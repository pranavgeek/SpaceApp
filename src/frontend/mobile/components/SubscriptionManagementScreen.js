import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchUsers, updateUserRole } from "../backend/db/API";

export default function SubscriptionManagementScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  
  const [customDate, setCustomDate] = useState('');
  
  // Define tier details for display
  const tierDetails = {
    basic: {
      name: "Basic",
      color: "#9ca3af",
      productLimit: 3,
      collaborationLimit: 1,
      feePercentage: 5,
    },
    pro: {
      name: "Pro",
      color: "#3b82f6",
      productLimit: 25,
      collaborationLimit: 50,
      feePercentage: 3,
    },
    enterprise: {
      name: "Enterprise",
      color: "#8b5cf6",
      productLimit: "Unlimited",
      collaborationLimit: "Unlimited",
      feePercentage: 2,
    },
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await fetchUsers();
      
      // Sort and filter users
      const sortedUsers = fetchedUsers.sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'tier') {
          const tierA = a.tier || 'basic';
          const tierB = b.tier || 'basic';
          return tierA.localeCompare(tierB);
        } else if (sortBy === 'expiry') {
          const dateA = a.subscription_end_date ? new Date(a.subscription_end_date) : new Date(0);
          const dateB = b.subscription_end_date ? new Date(b.subscription_end_date) : new Date(0);
          return dateB - dateA; // Most recent dates first
        }
        return 0;
      });
      
      setUsers(sortedUsers);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (userData) => {
    setSelectedUser(userData);
    setModalVisible(true);
    
    // Set default custom date to 1 year from now if upgrading from basic
    if (!userData.subscription_end_date && userData.tier === 'basic') {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      setCustomDate(oneYearFromNow.toISOString().split('T')[0]);
    } else if (userData.subscription_end_date) {
      setCustomDate(userData.subscription_end_date.split('T')[0]);
    } else {
      setCustomDate('');
    }
  };

  const handleChangeTier = async (newTier) => {
    try {
      setProcessingAction(true);
      
      let subscriptionEndDate = null;
      
      // If upgrading to a paid plan, set expiration date
      if (newTier !== 'basic') {
        if (customDate) {
          // Use custom date if provided
          subscriptionEndDate = new Date(customDate).toISOString();
        } else {
          // Default to 1 year from now
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          subscriptionEndDate = oneYearFromNow.toISOString();
        }
      }
      
      const result = await updateUserRole(
        selectedUser.user_id,
        selectedUser.account_type.toLowerCase(),
        newTier,
        true, // Force update
        subscriptionEndDate
      );

      if (result) {
        Alert.alert(
          "Success",
          `Updated ${selectedUser.name}'s subscription to ${
            tierDetails[newTier].name
          } tier${subscriptionEndDate ? ` until ${new Date(subscriptionEndDate).toLocaleDateString()}` : ''}`
        );
        
        // Refresh user list
        await loadUsers();
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      Alert.alert("Error", "Failed to update subscription tier");
    } finally {
      setModalVisible(false);
      setProcessingAction(false);
      setSelectedUser(null);
    }
  };

  const handleExtendSubscription = async () => {
    try {
      if (!selectedUser || !selectedUser.tier || selectedUser.tier === 'basic') {
        Alert.alert("Error", "Cannot extend a basic subscription");
        return;
      }
      
      setProcessingAction(true);
      
      let newEndDate;
      
      if (customDate) {
        // Use custom date if provided
        newEndDate = new Date(customDate).toISOString();
      } else {
        // Default: extend by 1 year from current end date or from now
        const startDate = selectedUser.subscription_end_date 
          ? new Date(selectedUser.subscription_end_date) 
          : new Date();
          
        newEndDate = new Date(startDate);
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        newEndDate = newEndDate.toISOString();
      }
      
      const result = await updateUserRole(
        selectedUser.user_id,
        selectedUser.account_type.toLowerCase(),
        selectedUser.tier,
        true, // Force update
        newEndDate
      );

      if (result) {
        Alert.alert(
          "Success",
          `Extended ${selectedUser.name}'s ${
            tierDetails[selectedUser.tier].name
          } subscription until ${new Date(newEndDate).toLocaleDateString()}`
        );
        
        // Refresh user list
        await loadUsers();
      }
    } catch (error) {
      console.error("Error extending subscription:", error);
      Alert.alert("Error", "Failed to extend subscription");
    } finally {
      setModalVisible(false);
      setProcessingAction(false);
      setSelectedUser(null);
    }
  };

  // Returns a formatted string for display
  const formatSubscriptionDate = (dateString) => {
    if (!dateString) return "No expiration";
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid date";
    
    // Calculate days remaining
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusText = "";
    if (diffDays < 0) {
      statusText = "Expired";
    } else if (diffDays === 0) {
      statusText = "Expires today";
    } else if (diffDays === 1) {
      statusText = "Expires tomorrow";
    } else if (diffDays <= 30) {
      statusText = `Expires in ${diffDays} days`;
    } else {
      statusText = "Active";
    }
    
    return `${date.toLocaleDateString()} (${statusText})`;
  };

  const showFilterOptions = () => {
    Alert.alert(
      "Filter Options",
      "Choose how to filter users",
      [
        {
          text: "Show All Users",
          onPress: () => setShowPremiumOnly(false),
        },
        {
          text: "Show Premium Only",
          onPress: () => setShowPremiumOnly(true),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const showSortOptions = () => {
    Alert.alert(
      "Sort Options",
      "Choose how to sort users",
      [
        {
          text: "Sort by Name",
          onPress: () => setSortBy('name'),
        },
        {
          text: "Sort by Tier",
          onPress: () => setSortBy('tier'),
        },
        {
          text: "Sort by Expiry Date",
          onPress: () => setSortBy('expiry'),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  // Filter users based on search text and premium filter
  const filteredUsers = users.filter(user => {
    // Filter by name or email
    const textMatch = user.name.toLowerCase().includes(filterText.toLowerCase()) || 
                       (user.email && user.email.toLowerCase().includes(filterText.toLowerCase()));
                       
    // Filter by premium status if needed
    const premiumMatch = showPremiumOnly ? (user.tier && user.tier !== 'basic') : true;
    
    return textMatch && premiumMatch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading subscription data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscription Management</Text>
        <Text style={styles.headerSubtitle}>
          Manage user subscription tiers and expiration dates
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={filterText}
            onChangeText={setFilterText}
          />
          {filterText !== '' && (
            <TouchableOpacity onPress={() => setFilterText('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.filterButton} onPress={showFilterOptions}>
            <Ionicons name="filter" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={showSortOptions}>
            <Ionicons name="swap-vertical" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#e0f2fe" }]}>
            <Ionicons name="people-outline" size={24} color="#0284c7" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>
              {users.length}
            </Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#dcfce7" }]}>
            <Ionicons name="ribbon-outline" size={24} color="#16a34a" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>
              {users.filter(u => u.tier && u.tier !== 'basic').length}
            </Text>
            <Text style={styles.statLabel}>Premium Users</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="time-outline" size={24} color="#d97706" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>
              {users.filter(u => {
                if (!u.subscription_end_date) return false;
                const endDate = new Date(u.subscription_end_date);
                const today = new Date();
                const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                return diffDays <= 30 && diffDays >= 0;
              }).length}
            </Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={50} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No users found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search criteria</Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            // Determine user's current tier, default to basic
            const currentTier = user.tier || "basic";
            const tierDetail = tierDetails[currentTier];
            
            // Extract role from account_type or role field
            const userRole = (user.account_type || user.role || "").toLowerCase();
            
            return (
              <View key={user.user_id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatarContainer}>
                      <Text style={styles.userAvatar}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email || "No email"}</Text>
                      <Text style={styles.userType}>
                        {user.account_type || user.role || "Unknown"} 
                        {userRole === "seller" && (
                          <Text> • {tierDetail.name}</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                  {userRole === "seller" && (
                    <View style={[styles.tierBadge, { backgroundColor: tierDetail.color + "20" }]}>
                      <Text style={[styles.tierText, { color: tierDetail.color }]}>
                        {tierDetail.name}
                      </Text>
                    </View>
                  )}
                </View>

                {userRole === "seller" && (
                  <>
                    <View style={styles.divider} />
                    
                    <View style={styles.subscriptionDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Products Limit:</Text>
                        <Text style={styles.detailValue}>{tierDetail.productLimit}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Collaborations:</Text>
                        <Text style={styles.detailValue}>{tierDetail.collaborationLimit}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fee Rate:</Text>
                        <Text style={styles.detailValue}>{tierDetail.feePercentage}%</Text>
                      </View>
                      
                      {(currentTier !== 'basic' || user.subscription_end_date) && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Expires:</Text>
                          <Text 
                            style={[
                              styles.detailValue, 
                              user.subscription_end_date && new Date(user.subscription_end_date) < new Date() 
                                ? styles.expiredText 
                                : null
                            ]}
                          >
                            {formatSubscriptionDate(user.subscription_end_date)}
                          </Text>
                        </View>
                      )}
                      
                      {user.subscription_cancelled && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Status:</Text>
                          <Text style={[styles.detailValue, styles.cancelledText]}>
                            Cancelled
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleUpdateSubscription(user)}
                      >
                        <Ionicons name="sync" size={16} color="#3b82f6" />
                        <Text style={styles.actionButtonText}>Change Plan</Text>
                      </TouchableOpacity>
                      
                      {currentTier !== 'basic' && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {
                            setSelectedUser(user);
                            setModalVisible(true);
                          }}
                        >
                          <Ionicons name="calendar" size={16} color="#3b82f6" />
                          <Text style={styles.actionButtonText}>Extend</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Subscription Update Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedUser?.tier && selectedUser.tier !== 'basic' 
                ? "Update Subscription" 
                : "Change Subscription Plan"}
            </Text>
            
            {selectedUser && (
              <View style={styles.modalUser}>
                <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                <Text style={styles.modalUserEmail}>
                  Current tier: {tierDetails[selectedUser.tier || 'basic'].name}
                </Text>
                
                {selectedUser.subscription_end_date && (
                  <Text style={styles.modalUserExpiry}>
                    Expires: {formatSubscriptionDate(selectedUser.subscription_end_date)}
                  </Text>
                )}
              </View>
            )}
            
            <View style={styles.datePicker}>
              <Text style={styles.datePickerLabel}>Subscription End Date:</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={customDate}
                onChangeText={setCustomDate}
              />
            </View>
            
            <View style={styles.tierOptions}>
              <TouchableOpacity
                style={[
                  styles.tierOption,
                  {
                    backgroundColor: "#9ca3af20",
                    borderColor: "#9ca3af",
                    borderWidth: selectedUser?.tier === 'basic' ? 2 : 0,
                  },
                ]}
                onPress={() => handleChangeTier("basic")}
                disabled={processingAction}
              >
                <Text style={[styles.tierOptionName, { color: "#374151" }]}>
                  Basic
                </Text>
                <Text style={styles.tierOptionPrice}>Free</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tierOption,
                  {
                    backgroundColor: "#3b82f620",
                    borderColor: "#3b82f6",
                    borderWidth: selectedUser?.tier === 'pro' ? 2 : 0,
                  },
                ]}
                onPress={() => handleChangeTier("pro")}
                disabled={processingAction}
              >
                <Text style={[styles.tierOptionName, { color: "#1d4ed8" }]}>
                  Pro
                </Text>
                <Text style={styles.tierOptionPrice}>$29.99/mo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tierOption,
                  {
                    backgroundColor: "#8b5cf620",
                    borderColor: "#8b5cf6",
                    borderWidth: selectedUser?.tier === 'enterprise' ? 2 : 0,
                  },
                ]}
                onPress={() => handleChangeTier("enterprise")}
                disabled={processingAction}
              >
                <Text style={[styles.tierOptionName, { color: "#6d28d9" }]}>
                  Enterprise
                </Text>
                <Text style={styles.tierOptionPrice}>$99.99/mo</Text>
              </TouchableOpacity>
            </View>
            
            {selectedUser?.tier && selectedUser.tier !== 'basic' && (
              <TouchableOpacity
                style={styles.extendButton}
                onPress={handleExtendSubscription}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="calendar"
                      size={18}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.extendButtonText}>
                      Extend Current {tierDetails[selectedUser.tier].name} Plan
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              disabled={processingAction}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
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
  filterContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#1f2937",
  },
  filterActions: {
    flexDirection: "row",
  },
  filterButton: {
    marginLeft: 12,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#3b82f6",
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
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
    width: "31%",
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
  scrollContainer: {
    flex: 1,
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatar: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0284c7",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  userEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  userType: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
  },
  subscriptionDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  expiredText: {
    color: "#ef4444",
  },
  cancelledText: {
    color: "#f59e0b",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  modalUser: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  modalUserEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginVertical: 2,
  },
  modalUserExpiry: {
    fontSize: 14,
    color: "#6b7280",
    marginVertical: 2,
  },
  tierOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  tierOption: {
    width: "30%",
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tierOptionName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  tierOptionPrice: {
    fontSize: 12,
    color: "#6b7280",
  },
  datePicker: {
    marginVertical: 12,
  },
  datePickerLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  extendButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  extendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  }
});
