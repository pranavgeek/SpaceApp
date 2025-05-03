import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Dimensions,
  TextInput,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import FollowingService from "../backend/db/FollowingService";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SuggestedAccountsScreen from "./SuggestedAccountsScreen";

export default function FollowingScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [filteredFollowing, setFilteredFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const { height } = Dimensions.get("window");
  const modalizeRef = useRef(null);

  // Get following list when screen loads
  useFocusEffect(
    useCallback(() => {
      const fetchFollowing = async () => {
        try {
          setLoading(true);
          // Get the user ID from route params or use the logged-in user's ID
          const userId = route.params?.userId || user?.user_id;
          const name = route.params?.name || user?.name;

          // Set screen title based on whether viewing own following or someone else's
          const isOtherUser =
            route.params?.isOtherUser ||
            String(userId) !== String(user?.user_id);
          const title = isOtherUser ? `${name}'s Following` : "Following";

          navigation.setOptions({ title });

          console.log("Fetching following for user ID:", userId);

          // Fetch following from API
          const data = await FollowingService.getFollowing(userId);
          console.log("Following data received:", data);

          setFollowing(data);
          setFilteredFollowing(data);
        } catch (error) {
          console.error("Error fetching following:", error);
          Alert.alert(
            "Error",
            "Unable to load following. Please try again later."
          );
        } finally {
          setLoading(false);
        }
      };

      fetchFollowing();

      // This empty return function will be called when the screen loses focus
      return () => {
        // Cleanup if needed
      };
    }, [user?.user_id, route.params?.userId])
  );

  // Filter following based on search query and active filter
  useEffect(() => {
    let result = following;

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (follow) =>
          follow.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (follow.username &&
            follow.username.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply account type filter
    if (activeFilter !== "All") {
      result = result.filter(
        (follow) =>
          follow.account_type === activeFilter ||
          follow.account_type?.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    setFilteredFollowing(result);
  }, [searchQuery, activeFilter, following]);

  // Handle unfollowing a user
  const handleUnfollow = async (followingId) => {
    try {
      // Check if user can unfollow (only buyers can follow/unfollow)
      if (user?.account_type?.toLowerCase() !== "buyer") {
        Alert.alert("Action Not Allowed", "Only buyers can unfollow users.");
        return;
      }

      // Confirm unfollow action
      Alert.alert("Unfollow", "Are you sure you want to unfollow this user?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unfollow",
          onPress: async () => {
            setLoading(true);

            // Call API to unfollow
            await FollowingService.unfollowUser(user.user_id, followingId);

            // Update UI by removing the unfollowed user
            const updatedFollowing = following.filter(
              (item) => String(item.user_id) !== String(followingId)
            );

            setFollowing(updatedFollowing);
            setFilteredFollowing(updatedFollowing);
            setLoading(false);
          },
        },
      ]);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      Alert.alert("Error", "Failed to unfollow user. Please try again.");
      setLoading(false);
    }
  };

  // Navigate to user profile
  const navigateToProfile = (userId, accountType) => {
    navigation.navigate("SIViewProfile", { userId, accountType });
  };

  // Refresh following list
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const userId = route.params?.userId || user?.user_id;
      const data = await FollowingService.getFollowing(userId);
      setFollowing(data);
      setFilteredFollowing(data);
    } catch (error) {
      console.error("Error refreshing following list:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Render a single following item
  const renderFollowingItem = ({ item }) => {
    // Check if item is valid and has a user_id
    if (!item || !item.user_id) {
      console.error("Invalid following item:", item);
      return null;
    }

    // Determine if it's the current user's following list
    const isCurrentUserList =
      String(route.params?.userId || user?.user_id) === String(user?.user_id);

    return (
      <TouchableOpacity
        style={styles.followingItem}
        onPress={() => navigateToProfile(item.user_id, item.account_type)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: item.profile_image?.startsWith("http")
              ? item.profile_image
              : "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
          }}
          style={styles.profileImage}
        />

        <View style={styles.followingInfo}>
          <Text style={styles.followingName}>
            {item.name || "Unknown User"}
          </Text>
          <View style={styles.usernameRow}>
            <Text style={styles.followingUsername}>
              @
              {item.username ||
                (item.name
                  ? item.name.toLowerCase().replace(/\s+/g, "_")
                  : "user")}
            </Text>
            {item.account_type && (
              <View style={styles.accountTypeBadge}>
                <Text style={styles.accountTypeText}>{item.account_type}</Text>
              </View>
            )}
          </View>
        </View>

        {isCurrentUserList && (
          <TouchableOpacity
            style={styles.unfollowButton}
            onPress={() => handleUnfollow(item.user_id)}
          >
            <Text style={styles.unfollowButtonText}>Unfollow</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Filter options
  const filterOptions = ["All", "Seller", "Influencer"];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.subtitle}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search following"
          placeholderTextColor={colors.subtitle}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.subtitle} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Pills */}
      {/* <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter ? styles.activeFilterPill : {},
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter ? styles.activeFilterText : {},
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View> */}

      {/* Following Count */}
      <View style={styles.followingCountContainer}>
        <Text style={styles.followingCount}>
          {filteredFollowing.length}{" "}
          {filteredFollowing.length === 1 ? "Account" : "Accounts"}
        </Text>
      </View>

      {/* Empty state with "Explore users" button */}
      {!loading && filteredFollowing.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={60} color={`${colors.primary}50`} />
          <Text style={styles.emptyText}>Not following anyone</Text>
          {searchQuery ? (
            <Text style={styles.emptySubText}>
              Try a different search or filter
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.exploreButtonText}>Explore users</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Following List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredFollowing.length > 0 ? (
        <FlatList
          data={filteredFollowing}
          renderItem={renderFollowingItem}
          keyExtractor={(item) =>
            String(item.user_id || item.id || Math.random())
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : null}

      {/* Modal for Suggested Accounts with GestureHandlerRootView */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Suggested Accounts</Text>
            </View>

            {/* Full height content area */}
            <View style={{ flex: 1 }}>
              <SuggestedAccountsScreen
                navigation={navigation}
                onClose={() => setModalVisible(false)}
              />
            </View>
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
    </SafeAreaView>
  );
}

// Helper component for horizontal scrollable filters
const ScrollView = ({ children, ...props }) => {
  return Platform.OS === "web" ? (
    <View {...props}>
      <View style={props.contentContainerStyle}>{children}</View>
    </View>
  ) : (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[{ key: "content" }]}
      renderItem={() => <View>{children}</View>}
      {...props}
    />
  );
};

function getDynamicStyles(colors, isDarkMode) {
  const { width } = Dimensions.get("window");
  const isWeb = Platform.OS === "web";
  const isDesktopWeb = isWeb && width >= 992;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.05)",
      borderRadius: 10,
      paddingHorizontal: 12,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: "100%",
      fontSize: 16,
      color: colors.text,
    },
    filterContainer: {
      marginBottom: 12,
      marginLeft: 16,
    },
    filterScrollContent: {
      paddingRight: 16,
      flexDirection: "row",
    },
    filterPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.05)",
    },
    activeFilterPill: {
      backgroundColor: colors.primary,
    },
    filterText: {
      fontSize: 14,
      color: colors.text,
    },
    activeFilterText: {
      color: "#fff",
      fontWeight: "600",
    },
    followingCountContainer: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    followingCount: {
      fontSize: 14,
      color: colors.subtitle,
      fontWeight: "500",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    followingItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)",
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    followingInfo: {
      flex: 1,
    },
    followingName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    usernameRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    followingUsername: {
      fontSize: 14,
      color: colors.subtitle,
      marginRight: 8,
    },
    accountTypeBadge: {
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    accountTypeText: {
      color: colors.primary,
      fontWeight: "500",
      fontSize: 12,
    },
    unfollowButton: {
      backgroundColor: "transparent",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
      minWidth: 90,
      alignItems: "center",
    },
    unfollowButtonText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 12,
    },
    emptySubText: {
      fontSize: 14,
      color: colors.subtitle,
      marginTop: 8,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)",
      backgroundColor: colors.background,
      position: "relative",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      position: "absolute",
      left: 16,
      padding: 4,
    },
    exploreButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 20,
    },
    exploreButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
