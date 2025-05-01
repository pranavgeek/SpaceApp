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
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import FollowingService from "../backend/db/FollowingService";

export default function FollowersScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  // Get followers when screen loads
  useFocusEffect(
    useCallback(() => {
      const fetchFollowers = async () => {
        try {
          setLoading(true);
          // Get the user ID from route params or use the logged-in user's ID
          const userId = route.params?.userId || user?.user_id;
          const name = route.params?.name || user?.name;
          
          // Set screen title based on whether viewing own followers or someone else's
          const isOtherUser = route.params?.isOtherUser || String(userId) !== String(user?.user_id);
          const title = isOtherUser 
            ? `${name}'s Followers` 
            : "Followers";
            
          navigation.setOptions({ title });
          
          console.log("Fetching followers for user ID:", userId);
          
          // Fetch followers from API
          const data = await FollowingService.getFollowers(userId);
          console.log("Followers data received:", data);
          
          setFollowers(data);
          setFilteredFollowers(data);
        } catch (error) {
          console.error("Error fetching followers:", error);
          Alert.alert(
            "Error",
            "Unable to load followers. Please try again later."
          );
        } finally {
          setLoading(false);
        }
      };

      fetchFollowers();
      
      // This empty return function will be called when the screen loses focus
      return () => {
        // Cleanup if needed
      };
    }, [user?.user_id, route.params?.userId])
  );

  // Filter followers based on search query and active filter
  useEffect(() => {
    let result = followers;
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter((follower) => 
        follower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (follower.username && follower.username.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply account type filter
    if (activeFilter !== "All") {
      result = result.filter((follower) => 
        follower.account_type === activeFilter ||
        follower.account_type === activeFilter + 'er' // Handle "Seller" vs "Sell" if needed
      );
    }
    
    setFilteredFollowers(result);
  }, [searchQuery, activeFilter, followers]);

  // Handle following/unfollowing a user
  const toggleFollow = async (followeeId, isCurrentlyFollowing) => {
    try {
      // Only buyers can follow others
      if (user?.account_type.toLowerCase() !== 'buyer') {
        Alert.alert(
          "Action Not Allowed",
          "Only buyers can follow other users."
        );
        return;
      }
      
      if (isCurrentlyFollowing) {
        // Unfollow
        await FollowingService.unfollowUser(user.user_id, followeeId);
      } else {
        // Follow
        await FollowingService.followUser(user.user_id, followeeId);
      }
      
      // Update UI
      const updatedFollowers = followers.map((follower) => {
        if (follower.user_id === followeeId) {
          return { ...follower, isFollowing: !isCurrentlyFollowing };
        }
        return follower;
      });
      
      setFollowers(updatedFollowers);
    } catch (error) {
      console.error(`Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'} user:`, error);
      Alert.alert(
        "Error",
        `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user. Please try again.`
      );
    }
  };

  // Check if current user is following each follower
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        if (!user || user.account_type.toLowerCase() !== 'buyer') return;
        
        // Get list of users the current user is following
        const following = await FollowingService.getFollowing(user.user_id);
        const followingIds = following.map(f => String(f.user_id));
        
        // Update follower objects with isFollowing status
        const updatedFollowers = followers.map(follower => ({
          ...follower,
          isFollowing: followingIds.includes(String(follower.user_id))
        }));
        
        setFollowers(updatedFollowers);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };
    
    if (followers.length > 0 && user) {
      checkFollowStatus();
    }
  }, [followers.length, user]);

  // Navigate to user profile
  const navigateToProfile = (userId) => {
    navigation.navigate("UserProfile", { userId });
  };
  
  // Refresh followers list
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const userId = route.params?.userId || user?.user_id;
      const data = await FollowingService.getFollowers(userId);
      setFollowers(data);
      setFilteredFollowers(data);
    } catch (error) {
      console.error("Error refreshing followers:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Render a single follower item
  const renderFollowerItem = ({ item }) => {
    // Determine if the follow button should be shown
    // Only buyers can follow, and we don't show follow button for the current user
    const showFollowButton = 
      user && 
      user.account_type.toLowerCase() === 'buyer' && 
      String(item.user_id) !== String(user.user_id);
      
    // Don't show follow button for other buyers
    const isFollowable = 
      item.account_type.toLowerCase() === 'seller' || 
      item.account_type.toLowerCase() === 'influencer';
    
    return (
      <TouchableOpacity 
        style={styles.followerItem}
        onPress={() => navigation.navigate("UserProfile", { userId: item.user_id })}
        activeOpacity={0.7}
      >
        <Image 
          source={{ 
            uri: item.profile_image?.startsWith('http') 
              ? item.profile_image 
              : 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
          }} 
          style={styles.profileImage} 
        />
        
        <View style={styles.followerInfo}>
          <Text style={styles.followerName}>{item.name}</Text>
          <View style={styles.usernameRow}>
            <Text style={styles.followerUsername}>
              @{item.username || item.name.toLowerCase().replace(/\s+/g, '_')}
            </Text>
            <View style={styles.accountTypeBadge}>
              <Text style={styles.accountTypeText}>{item.account_type}</Text>
            </View>
          </View>
        </View>
        
        {showFollowButton && isFollowable && (
          <TouchableOpacity 
            style={[
              styles.followButton, 
              item.isFollowing ? styles.followingButton : {}
            ]}
            onPress={() => toggleFollow(item.user_id, item.isFollowing)}
          >
            <Text style={[
              styles.followButtonText,
              item.isFollowing ? styles.followingButtonText : {}
            ]}>
              {item.isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Filter options
  const filterOptions = ["All", "Seller", "Buyer", "Influencer"];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.subtitle} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search followers"
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
                activeFilter === filter ? styles.activeFilterPill : {}
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter ? styles.activeFilterText : {}
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View> */}
      
      {/* Follower Count */}
      <View style={styles.followerCountContainer}>
        <Text style={styles.followerCount}>
          {filteredFollowers.length} {filteredFollowers.length === 1 ? 'Follower' : 'Followers'}
        </Text>
      </View>
      
      {/* Followers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredFollowers.length > 0 ? (
        <FlatList
          data={filteredFollowers}
          renderItem={renderFollowerItem}
          keyExtractor={(item) => item.user_id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={60} color={`${colors.primary}50`} />
          <Text style={styles.emptyText}>No followers found</Text>
          {searchQuery ? (
            <Text style={styles.emptySubText}>
              Try a different search or filter
            </Text>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

// Helper component for horizontal scrollable filters
const ScrollView = ({ children, ...props }) => {
  return Platform.OS === 'web' ? (
    <View {...props}>
      <View style={props.contentContainerStyle}>
        {children}
      </View>
    </View>
  ) : (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[{ key: 'content' }]}
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 10 : StatusBar.currentHeight + 10,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
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
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
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
    followerCountContainer: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    followerCount: {
      fontSize: 14,
      color: colors.subtitle,
      fontWeight: "500",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    followerItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    followerInfo: {
      flex: 1,
    },
    followerName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    usernameRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    followerUsername: {
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
    followButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 90,
      alignItems: "center",
    },
    followingButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    followButtonText: {
      color: "#fff",
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
  });
}