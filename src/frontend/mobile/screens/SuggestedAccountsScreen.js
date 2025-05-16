import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUsers } from "../backend/db/API";
import FollowingService from "../backend/db/FollowingService";

export default function SuggestedAccountsScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user, updateUserSilently } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  console.log("🟩 SuggestedAccountsScreen mounted");

  useEffect(() => {
    return () => {
      console.log("🟥 SuggestedAccountsScreen unmounted");
    };
  }, []);

  // Load all sellers and influencers when screen is focused
  useEffect(() => {
    const fetchSuggestedAccounts = async () => {
      try {
        if (!user) return;

        setLoading(true);

        // Fetch all users from the API
        const allUsers = await fetchUsers();

        if (!allUsers || !Array.isArray(allUsers)) {
          throw new Error("Failed to fetch users");
        }

        // Filter for sellers and influencers only
        const sellersAndInfluencers = allUsers.filter(
          (account) =>
            account.account_type?.toLowerCase() === "seller" ||
            account.account_type?.toLowerCase() === "influencer"
        );

        // Don't show current user
        const filteredAccounts = sellersAndInfluencers.filter(
          (account) => String(account.user_id) !== String(user.user_id)
        );

        console.log(
          `Found ${filteredAccounts.length} potential accounts to follow`
        );

        // Get list of accounts the user is already following (if any)
        let followingIds = [];
        try {
          const following = await FollowingService.getFollowing(user.user_id);
          followingIds = following.map((f) => String(f.user_id));
          console.log("User is following:", followingIds);
        } catch (error) {
          console.log("No existing following list found");
        }

        // Mark accounts as already followed if appropriate
        const accountsWithFollowStatus = filteredAccounts.map((account) => ({
          ...account,
          isFollowing: followingIds.includes(String(account.user_id)),
        }));

        // Sort by account type (influencers first) and then by followers count
        accountsWithFollowStatus.sort((a, b) => {
          if (
            a.account_type?.toLowerCase() === "influencer" &&
            b.account_type?.toLowerCase() !== "influencer"
          ) {
            return -1;
          }
          if (
            a.account_type?.toLowerCase() !== "influencer" &&
            b.account_type?.toLowerCase() === "influencer"
          ) {
            return 1;
          }
          return (b.followers_count || 0) - (a.followers_count || 0);
        });

        setAccounts(accountsWithFollowStatus);
        setFilteredAccounts(accountsWithFollowStatus);
      } catch (error) {
        console.error("Error fetching suggested accounts:", error);
        Alert.alert(
          "Error",
          "Unable to load suggested accounts. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedAccounts();
  }, [user]);

  // Filter accounts based on search and filter selection
  useEffect(() => {
    let result = accounts;

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (account) =>
          account.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (account.username &&
            account.username
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (account.about_us &&
            account.about_us.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply account type filter
    if (activeFilter !== "All") {
      result = result.filter(
        (account) =>
          account.account_type?.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    setFilteredAccounts(result);
  }, [searchQuery, activeFilter, accounts]);

  // Handle follow/unfollow
  const handleFollow = async (account) => {
    try {
      console.log("➡️ FOLLOW clicked for", account.user_id);

      if (!user) {
        Alert.alert("Error", "You must be logged in to follow accounts");
        return;
      }

      // Show loading for this account
      setFollowingInProgress((prev) => ({
        ...prev,
        [account.user_id]: true,
      }));

      if (!account.isFollowing) {
        await FollowingService.followUser(user.user_id, account.user_id, {
          updateUserSilently,
        });

        // ✅ Mark this user as having seen suggestions and exit to main app
        await AsyncStorage.setItem(`seen_suggestions_${user.user_id}`, "true");
        // navigation.replace("MainApp");
      } else {
        await FollowingService.unfollowUser(user.user_id, account.user_id, {
          updateUserSilently,
        });
      }

      // Update local state
      setAccounts((prevAccounts) =>
        prevAccounts.map((a) =>
          a.user_id === account.user_id
            ? { ...a, isFollowing: !a.isFollowing }
            : a
        )
      );

      setFilteredAccounts((prevAccounts) =>
        prevAccounts.map((a) =>
          a.user_id === account.user_id
            ? { ...a, isFollowing: !a.isFollowing }
            : a
        )
      );
    } catch (error) {
      console.error("Error following/unfollowing account:", error);
      Alert.alert(
        "Error",
        `Failed to ${account.isFollowing ? "unfollow" : "follow"} this account. Please try again.`
      );
    } finally {
      setFollowingInProgress((prev) => ({
        ...prev,
        [account.user_id]: false,
      }));
    }
  };

  // Navigate to View Profile
  const navigateToProfile = (account) => {
    navigation.navigate("Profile", {
      userId: account.user_id,
    });
  };

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    setActiveFilter(filter);
  };

  // Continue to main app and mark as having seen suggestions
  const continueToMainApp = async () => {
    try {
      // Mark that this user has seen suggestions
      if (user) {
        await AsyncStorage.setItem(`seen_suggestions_${user.user_id}`, "true");
      }

      // Navigate to the main app
      navigation.navigate("MainApp");
    } catch (error) {
      console.error("Error saving seen status:", error);
    }
  };

  // Render a single account card
  const renderAccountCard = ({ item: account }) => {
    const isLoading = followingInProgress[account.user_id];

    return (
      <View style={styles.accountCard}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigateToProfile(account)}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: account.profile_image?.startsWith("http")
                ? account.profile_image
                : "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
            }}
            style={styles.profileImage}
          />

          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountUsername}>
              @
              {account.username ||
                account.name.toLowerCase().replace(/\s+/g, "_")}
            </Text>

            <View style={styles.detailsRow}>
              <View style={styles.accountTypeBadge}>
                <Text style={styles.accountTypeText}>
                  {account.account_type}
                </Text>
              </View>

              {account.followers_count > 0 && (
                <Text style={styles.followerCount}>
                  <Text style={styles.followerCountNumber}>
                    {account.followers_count}
                  </Text>{" "}
                  {account.followers_count === 1 ? "follower" : "followers"}
                </Text>
              )}
            </View>

            {account.about_us && (
              <Text style={styles.accountBio} numberOfLines={2}>
                {account.about_us}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.followButton,
            account.isFollowing ? styles.followingButton : {},
          ]}
          onPress={() => handleFollow(account)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={account.isFollowing ? colors.primary : "#FFF"}
            />
          ) : (
            <Text
              style={[
                styles.followButtonText,
                account.isFollowing ? styles.followingButtonText : {},
              ]}
            >
              {account.isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome to KSpace!</Text>
        <Text style={styles.welcomeText}>
          Follow sellers and influencers to see their products and campaigns in
          your feed.
        </Text>
      </View>

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
          placeholder="Search for accounts"
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

      {/* Filters */}
      {/* <View style={styles.filtersContainer}>
        <ScrollableFilters 
          options={["All", "Seller", "Influencer"]} 
          activeFilter={activeFilter}
          onSelectFilter={handleFilterSelect}
          colors={colors}
          isDarkMode={isDarkMode}
        />
      </View> */}

      {/* Accounts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredAccounts.length > 0 ? (
        <FlatList
          data={filteredAccounts}
          renderItem={renderAccountCard}
          keyExtractor={(item) => item.user_id?.toString()}
          contentContainerStyle={styles.accountsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={60} color={`${colors.primary}50`} />
          <Text style={styles.emptyText}>No accounts found</Text>
          <Text style={styles.emptySubText}>
            {searchQuery
              ? "Try a different search term"
              : "Check back later for new accounts to follow"}
          </Text>
        </View>
      )}

      {/* Continue Button */}
      <View style={styles.continueContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={continueToMainApp}
        >
          <Text style={styles.continueButtonText}>Continue to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Scrollable Filter Component
const ScrollableFilters = ({
  options,
  activeFilter,
  onSelectFilter,
  colors,
  isDarkMode,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingRight: 16,
      }}
    >
      {options.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            {
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
            },
            activeFilter === filter
              ? {
                  backgroundColor: colors.primary,
                }
              : {},
          ]}
          onPress={() => onSelectFilter(filter)}
        >
          <Text
            style={[
              {
                fontSize: 14,
                color: colors.text,
              },
              activeFilter === filter
                ? {
                    color: "#fff",
                    fontWeight: "600",
                  }
                : {},
            ]}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ScrollView compatibility component for web
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

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight + 10,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    welcomeContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.02)",
    },
    welcomeTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    welcomeText: {
      fontSize: 14,
      color: colors.subtitle,
      lineHeight: 20,
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
    filtersContainer: {
      marginBottom: 16,
      paddingLeft: 16,
    },
    accountsList: {
      padding: 16,
      paddingBottom: 80, // Extra padding at bottom for the Continue button
    },
    accountCard: {
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#FFFFFF",
      borderRadius: 12,
      marginBottom: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    profileSection: {
      flexDirection: "row",
      marginBottom: 12,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 12,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    accountUsername: {
      fontSize: 14,
      color: colors.subtitle,
      marginBottom: 4,
    },
    detailsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    accountTypeBadge: {
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginRight: 8,
    },
    accountTypeText: {
      color: colors.primary,
      fontWeight: "500",
      fontSize: 12,
    },
    followerCount: {
      fontSize: 13,
      color: colors.subtitle,
    },
    followerCountNumber: {
      fontWeight: "600",
      color: colors.text,
    },
    accountBio: {
      fontSize: 13,
      color: colors.text,
      marginTop: 4,
    },
    followButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    followingButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    followButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 14,
    },
    followingButtonText: {
      color: colors.primary,
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
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
    },
    emptySubText: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: "center",
      marginTop: 8,
    },
    continueContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    },
    continueButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
    },
    continueButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 16,
    },
  });
}
