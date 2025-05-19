import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
  Dimensions,
  Alert
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { fetchUsers } from "../backend/db/API"; 
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { BASE_URL } from "../backend/db/API";

export default function UserTrackingScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [allUsers, setAllUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("buyer"); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInputText, setSearchInputText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [userStats, setUserStats] = useState({
    buyers: 0,
    sellers: 0,
    influencers: 0
  });

  // Apply debounce to search
  useEffect(() => {
    const timerId = setTimeout(() => {
      setSearchText(searchInputText);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timerId);
  }, [searchInputText]);

  // Effect to update the selected role when search results change
  useEffect(() => {
    if (searchText.trim() !== "") {
      const searchQuery = searchText.toLowerCase().trim();
      const searchResults = allUsers.filter(u => {
        const name = u.name || "";
        const email = u.email || "";
        
        return name.toLowerCase().includes(searchQuery) || 
              email.toLowerCase().includes(searchQuery);
      });
      
      // If we have search results, check for role patterns
      if (searchResults.length > 0) {
        // Get all account types from search results
        const resultRoles = searchResults.map(u => u.account_type?.toLowerCase()).filter(Boolean);
        
        // If all results have the same role and it's not the current selection, switch to that role
        if (resultRoles.length > 0 && resultRoles.every(role => role === resultRoles[0])) {
          const commonRole = resultRoles[0];
          if (["buyer", "seller", "influencer"].includes(commonRole) && commonRole !== selectedRole) {
            setSelectedRole(commonRole);
          }
        }
      }
    }
  }, [searchText, allUsers, selectedRole]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const users = await fetchUsers();
      
      if (!users || users.length === 0) {
        console.warn("No users returned from API");
        Alert.alert("Data Error", "Could not load users. Please try again later.");
        return;
      }
      
      console.log(`Loaded ${users.length} users from API`);
      
      // Filter out admin users
      const nonAdminUsers = users.filter(u => u.account_type?.toLowerCase() !== "admin");
      console.log(`After filtering: ${nonAdminUsers.length} non-admin users`);
      
      setAllUsers(nonAdminUsers);

      // Calculate stats for each role
      const stats = {
        buyers: nonAdminUsers.filter(u => u.account_type?.toLowerCase() === "buyer").length,
        sellers: nonAdminUsers.filter(u => u.account_type?.toLowerCase() === "seller").length,
        influencers: nonAdminUsers.filter(u => u.account_type?.toLowerCase() === "influencer").length
      };
      
      console.log("User stats:", stats);
      setUserStats(stats);
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert(
        "Error", 
        "Failed to load user data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
  };

  const getFilteredUsers = () => {
    // If there's a search query, search across ALL user types
    if (searchText.trim() !== "") {
      const searchQuery = searchText.toLowerCase().trim();
      return allUsers.filter(u => {
        const name = u.name || "";
        const email = u.email || "";
        
        return name.toLowerCase().includes(searchQuery) || 
               email.toLowerCase().includes(searchQuery);
      });
    }
    
    // If no search query, filter by the selected role
    return allUsers.filter(u => u.account_type?.toLowerCase() === selectedRole);
  };

  const getTotalCount = () => {
    const filtered = getFilteredUsers();
    return filtered.length;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (userId) => {
    const colors = [
      "#3b82f6", "#10b981", "#f97316", "#8b5cf6", 
      "#ec4899", "#14b8a6", "#f59e0b", "#6366f1"
    ];
    // Use the userId to pick a consistent color for each user
    const index = userId.toString().charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
      return 'https://via.placeholder.com/150x150?text=Profile'; // Default fallback
    }
  
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
  
    return `${BASE_URL}/uploads/profile/${imagePath}`;
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>User Tracking</Text>
          <Text style={styles.subtitle}>Monitor all platform users</Text>
        </View>
        <View style={styles.statsChips}>
          <View style={styles.statsChip}>
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text style={styles.statsChipText}>
              {userStats.buyers + userStats.sellers + userStats.influencers} Total
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={20} color={colors.subtitle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchInputText}
            onChangeText={setSearchInputText}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholderTextColor={colors.subtitle}
          />
          {searchInputText !== "" && (
            <TouchableOpacity onPress={() => setSearchInputText("")}>
              <Ionicons name="close-circle" size={20} color={colors.subtitle} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.roleMetrics}>
        <TouchableOpacity 
          style={[styles.metricCard, selectedRole === "buyer" && styles.selectedMetricCard]}
          onPress={() => setSelectedRole("buyer")}
        >
          <View style={[styles.metricIconBg, { backgroundColor: "#e0f2fe" }]}>
            <Ionicons name="person" size={22} color="#0284c7" />
          </View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricValue}>{userStats.buyers}</Text>
            <Text style={styles.metricLabel}>Buyers</Text>
          </View>
          {selectedRole === "buyer" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.metricCard, selectedRole === "seller" && styles.selectedMetricCard]} 
          onPress={() => setSelectedRole("seller")}
        >
          <View style={[styles.metricIconBg, { backgroundColor: "#dcfce7" }]}>
            <Ionicons name="briefcase" size={22} color="#16a34a" />
          </View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricValue}>{userStats.sellers}</Text>
            <Text style={styles.metricLabel}>Sellers</Text>
          </View>
          {selectedRole === "seller" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.metricCard, selectedRole === "influencer" && styles.selectedMetricCard]} 
          onPress={() => setSelectedRole("influencer")}
        >
          <View style={[styles.metricIconBg, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="star" size={22} color="#d97706" />
          </View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricValue}>{userStats.influencers}</Text>
            <Text style={styles.metricLabel}>Influencers</Text>
          </View>
          {selectedRole === "influencer" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} List
        </Text>
        <Text style={styles.listCount}>{getTotalCount()} users</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {getFilteredUsers().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={50} color={colors.subtitle} />
              <Text style={styles.emptyStateText}>
                {searchText ? "No users match your search" : `No ${selectedRole}s found`}
              </Text>
            </View>
          ) : (
            getFilteredUsers().map((user) => (
              <View key={user.user_id} style={styles.userCard}>
                <View style={styles.userCardHeader}>
                  <View style={styles.userInfo}>
                    <View 
                      style={[styles.userAvatar, { backgroundColor: getRandomColor(user.user_id) }]}
                    >
                      {user.profile_image ? (
                        <Image 
                          source={{ uri: getProfileImageUrl(user.profile_image) }} 
                          style={styles.userImage} 
                        />
                      ) : (
                        <Text style={styles.userInitials}>{getInitials(user.name)}</Text>
                      )}
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user.name || "Unnamed User"}</Text>
                      <Text style={styles.userEmail}>{user.email || "No email provided"}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.userCardBody}>
                  <View style={styles.userMetadata}>
                    <View style={styles.metadataItem}>
                      <Text style={styles.metadataLabel}>Joined</Text>
                      <Text style={styles.metadataValue}>
                        {formatDate(user.created_at)}
                      </Text>
                    </View>
                    
                    <View style={styles.metadataItem}>
                      <Text style={styles.metadataLabel}>Status</Text>
                      <View style={[
                        styles.statusBadge, 
                        user.active ? styles.statusActive : styles.statusInactive
                      ]}>
                        <Text style={[
                          styles.statusText,
                          user.active ? styles.statusActiveText : styles.statusInactiveText
                        ]}>
                          {user.active ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                    
                    {user.last_login && (
                      <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>Last Login</Text>
                        <Text style={styles.metadataValue}>
                          {formatDate(user.last_login)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.userCardFooter}>
                  <TouchableOpacity style={styles.userCardButton}>
                    <Ionicons name="mail-outline" size={16} color={colors.primary} />
                    <Text style={styles.userCardButtonText}>Contact</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.userCardButton}>
                    <Ionicons name="eye-outline" size={16} color={colors.primary} />
                    <Text style={styles.userCardButtonText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={styles.listFooter} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => {
  const { width } = Dimensions.get('window');
  
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background || "#f9fafb",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || "#f1f5f9",
      backgroundColor: colors.card || "#ffffff",
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text || "#111827",
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtitle || "#6b7280",
      marginTop: 2,
    },
    statsChips: {
      flexDirection: "row",
    },
    statsChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground || "#f3f4f6",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statsChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.subtitle || "#6b7280",
      marginLeft: 4,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card || "#ffffff",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground || "#f3f4f6",
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "transparent",
    },
    searchBarFocused: {
      borderColor: colors.primary || "#3b82f6",
      backgroundColor: colors.background || "#f9fafb",
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      fontSize: 15,
      color: colors.text || "#111827",
    },
    roleMetrics: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    metricCard: {
      width: (width - 48) / 3,
      padding: 12,
      backgroundColor: colors.card || "#ffffff",
      borderRadius: 12,
      position: "relative",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2.22,
      elevation: 2,
    },
    selectedMetricCard: {
      backgroundColor: colors.cardBackground || "#f3f4f6",
      borderWidth: 1,
      borderColor: colors.primary + "40" || "#3b82f620",
    },
    metricIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    metricInfo: {
      justifyContent: "center",
    },
    metricValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text || "#111827",
    },
    metricLabel: {
      fontSize: 12,
      color: colors.subtitle || "#6b7280",
      marginTop: 2,
    },
    activeIndicator: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: colors.primary || "#3b82f6",
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    listTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text || "#111827",
    },
    listCount: {
      fontSize: 14,
      color: colors.subtitle || "#6b7280",
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      color: colors.subtitle || "#6b7280",
      fontSize: 16,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 50,
    },
    emptyStateText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.subtitle || "#6b7280",
      textAlign: "center",
    },
    userCard: {
      backgroundColor: colors.card || "#ffffff",
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2.22,
      elevation: 2,
    },
    userCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || "#f1f5f9",
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    userAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    userImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    userInitials: {
      fontSize: 16,
      fontWeight: "700",
      color: "#ffffff",
    },
    userDetails: {
      justifyContent: "center",
    },
    userName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text || "#111827",
    },
    userEmail: {
      fontSize: 14,
      color: colors.subtitle || "#6b7280",
      marginTop: 2,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.cardBackground || "#f3f4f6",
    },
    userCardBody: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || "#f1f5f9",
    },
    userMetadata: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    metadataItem: {
      marginRight: 16,
      marginBottom: 8,
    },
    metadataLabel: {
      fontSize: 12,
      color: colors.subtitle || "#6b7280",
      marginBottom: 4,
    },
    metadataValue: {
      fontSize: 14,
      color: colors.text || "#111827",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusActive: {
      backgroundColor: "#dcfce7",
    },
    statusInactive: {
      backgroundColor: "#fee2e2",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    statusActiveText: {
      color: "#16a34a",
    },
    statusInactiveText: {
      color: "#ef4444",
    },
    userCardFooter: {
      flexDirection: "row",
      padding: 12,
    },
    userCardButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border || "#f1f5f9",
      marginHorizontal: 4,
    },
    userCardButtonText: {
      marginLeft: 6,
      fontSize: 14,
      fontWeight: "500",
      color: colors.primary || "#3b82f6",
    },
    listFooter: {
      height: 16,
    },
  });
};