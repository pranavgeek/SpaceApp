import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { fetchUsers, updateUser } from "./API";

// Dynamic base URL for API calls
const BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:5001/api"
    : "http://10.0.0.25:5001/api";

/**
 * Service for handling following/follower relationships
 */
export const FollowingService = {
  followUser: async (buyerId, targetUserId) => {
    try {
      console.log(
        `FollowingService: User ${buyerId} following user ${targetUserId}`
      );

      if (!buyerId || !targetUserId)
        throw new Error("Both buyer ID and target user ID are required");

      const users = await fetchUsers();

      // Find the buyer and target user
      const buyer = users.find((u) => String(u.user_id) === String(buyerId));
      const targetUser = users.find(
        (u) => String(u.user_id) === String(targetUserId)
      );

      if (!buyer) throw new Error(`Buyer with ID ${buyerId} not found`);
      if (!targetUser)
        throw new Error(`Target user with ID ${targetUserId} not found`);

      // Validate account types
      const buyerRole =
        buyer.account_type?.toLowerCase() || buyer.role?.toLowerCase();
      const targetRole =
        targetUser.account_type?.toLowerCase() ||
        targetUser.role?.toLowerCase();

      if (buyerRole !== "buyer") {
        throw new Error(
          `Only buyers can follow. Current user is a ${buyerRole}`
        );
      }

      if (targetRole !== "seller" && targetRole !== "influencer") {
        throw new Error(
          `Cannot follow users with role ${targetRole}. Only sellers and influencers can be followed.`
        );
      }

      // 1. UPDATE TARGET USER (SELLER/INFLUENCER)
      // Initialize followers array if it doesn't exist
      if (!targetUser.followers) {
        targetUser.followers = [];
      }

      // Check if buyer is already following
      const alreadyFollowing = targetUser.followers.some((follower) =>
        typeof follower === "object"
          ? String(follower.user_id) === String(buyerId)
          : String(follower) === String(buyerId)
      );

      if (alreadyFollowing) {
        console.log(`Buyer ${buyerId} is already following ${targetUserId}`);
        return false; // No change needed
      }

      // Add buyer to followers array
      targetUser.followers.push({
        user_id: buyerId,
        name: buyer.name,
        profile_image: buyer.profile_image || "default_profile.jpg",
        follow_date: new Date().toISOString(),
      });

      // Update followers count
      targetUser.followers_count = targetUser.followers.length;

      // Update target user in database
      await updateUser(targetUserId, {
        followers: targetUser.followers,
        followers_count: targetUser.followers_count,
      });

      console.log(
        `Updated followers for user ${targetUserId}: Count=${targetUser.followers_count}`
      );

      // 2. UPDATE BUYER
      // Initialize following array if it doesn't exist
      if (!buyer.following) {
        buyer.following = [];
      }

      // Add target user to following array (as complete object)
      buyer.following.push({
        user_id: targetUserId,
        name: targetUser.name,
        profile_image: targetUser.profile_image || "default_profile.jpg",
        account_type: targetUser.account_type,
        follow_date: new Date().toISOString(),
      });

      // Update following count
      buyer.following_count = buyer.following.length;

      // Update buyer in database
      await updateUser(buyerId, {
        following: buyer.following,
        following_count: buyer.following_count,
      });

      console.log(
        `Updated following for user ${buyerId}: Count=${buyer.following_count}`
      );

      return true;
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  },

  // Similarly, update the unfollowUser function to decrease followers_count
  unfollowUser: async (buyerId, targetUserId) => {
    try {
      console.log(
        `FollowingService: User ${buyerId} unfollowing user ${targetUserId}`
      );

      if (!buyerId || !targetUserId)
        throw new Error("Both buyer ID and target user ID are required");

      const users = await fetchUsers();

      // Find the buyer and target user
      const buyer = users.find((u) => String(u.user_id) === String(buyerId));
      const targetUser = users.find(
        (u) => String(u.user_id) === String(targetUserId)
      );

      if (!buyer) throw new Error(`Buyer with ID ${buyerId} not found`);
      if (!targetUser)
        throw new Error(`Target user with ID ${targetUserId} not found`);

      // 1. UPDATE TARGET USER (SELLER/INFLUENCER)
      // Initialize followers array if it doesn't exist
      if (!targetUser.followers) {
        targetUser.followers = [];
        console.log(
          `Target user ${targetUserId} has no followers to remove from`
        );
        return false; // No change needed
      }

      // Remove buyer from followers array
      const initialLength = targetUser.followers.length;
      targetUser.followers = targetUser.followers.filter((follower) => {
        if (typeof follower === "object") {
          return String(follower.user_id) !== String(buyerId);
        } else {
          return String(follower) !== String(buyerId);
        }
      });

      // Check if anything changed
      if (targetUser.followers.length === initialLength) {
        console.log(`Buyer ${buyerId} was not following ${targetUserId}`);
        return false; // No change needed
      }

      // Update followers count
      targetUser.followers_count = targetUser.followers.length;

      // Update target user in database
      await updateUser(targetUserId, {
        followers: targetUser.followers,
        followers_count: targetUser.followers_count,
      });

      console.log(
        `Updated followers for user ${targetUserId}: Count=${targetUser.followers_count}`
      );

      // 2. UPDATE BUYER
      // Initialize following array if it doesn't exist
      if (!buyer.following) {
        buyer.following = [];
        console.log(`Buyer ${buyerId} has no following to remove from`);
        return true; // We already updated the target user
      }

      // Remove target user from following array
      if (Array.isArray(buyer.following)) {
        // Handle both array formats
        if (
          buyer.following.length > 0 &&
          typeof buyer.following[0] === "object"
        ) {
          // Array of objects
          buyer.following = buyer.following.filter(
            (f) => String(f.user_id) !== String(targetUserId)
          );
        } else {
          // Simple array of IDs
          buyer.following = buyer.following.filter(
            (id) => String(id) !== String(targetUserId)
          );
        }
      }

      // Update following count
      buyer.following_count = buyer.following.length;

      // Update buyer in database
      await updateUser(buyerId, {
        following: buyer.following,
        following_count: buyer.following_count,
      });

      console.log(
        `Updated following for user ${buyerId}: Count=${buyer.following_count}`
      );

      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  },

  /**
   * Check if a user is following another user
   *
   * @param {string|number} followerId - ID of the user who might be following
   * @param {string|number} followeeId - ID of the user who might be followed
   * @returns {Promise<boolean>} - Whether followerId is following followeeId
   */
  isFollowing: async (followerId, followeeId) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${followerId}/following`);

      if (!response.ok) {
        throw new Error(`Failed to check following status: ${response.status}`);
      }

      const following = await response.json();
      return following.some(
        (user) => String(user.user_id) === String(followeeId)
      );
    } catch (error) {
      console.error("Error in isFollowing:", error);

      // Fallback to local storage
      try {
        const followingKey = `following_${followerId}`;
        const followingJson = await AsyncStorage.getItem(followingKey);
        const following = followingJson ? JSON.parse(followingJson) : [];

        return following.some((id) => String(id) === String(followeeId));
      } catch (storageError) {
        console.error(
          "Error checking following status in local storage:",
          storageError
        );
        return false;
      }
    }
  },

  /**
   * Get list of users that a user is following
   *
   * @param {string|number} userId - ID of the user
   * @returns {Promise<Array>} - List of users that userId is following
   */
  getFollowing: async (userId) => {
    try {
      if (!userId) throw new Error("User ID is required");

      const users = await fetchUsers();
      const user = users.find((u) => String(u.user_id) === String(userId));

      if (!user) throw new Error(`User with ID ${userId} not found`);

      // Handle both array formats - simple array of IDs or array of objects
      if (Array.isArray(user.following)) {
        if (user.following.length > 0) {
          // If it's an array of IDs, convert to full objects
          if (typeof user.following[0] !== "object") {
            const followingUsers = user.following
              .map((followingId) => {
                const followedUser = users.find(
                  (u) => String(u.user_id) === String(followingId)
                );
                return followedUser
                  ? {
                      user_id: followedUser.user_id,
                      name: followedUser.name,
                      profile_image:
                        followedUser.profile_image || "default_profile.jpg",
                      account_type: followedUser.account_type,
                    }
                  : null;
              })
              .filter(Boolean); // Remove any null entries

            return followingUsers;
          }
          // It's already an array of objects
          return user.following;
        }
      }

      // Default to empty array
      return [];
    } catch (error) {
      console.error("Error getting following list:", error);
      throw error;
    }
  },

  /**
   * Get list of users who are following a user
   *
   * @param {string|number} userId - ID of the user
   * @returns {Promise<Array>} - List of users following userId
   */
  getFollowers: async (userId) => {
    try {
      if (!userId) throw new Error("User ID is required");
      
      const users = await fetchUsers();
      const user = users.find(u => String(u.user_id) === String(userId));
      
      if (!user) throw new Error(`User with ID ${userId} not found`);
      
      if (Array.isArray(user.followers)) {
        // If followers is an array of objects with user_id, use it directly
        if (user.followers.length > 0 && typeof user.followers[0] === 'object' && user.followers[0].user_id) {
          return user.followers;
        }
        
        // If followers is an array of IDs, convert to objects
        if (user.followers.length > 0) {
          // Transform simple IDs to objects
          const followerObjects = user.followers.map(followerId => {
            const followerUser = users.find(u => String(u.user_id) === String(followerId));
            if (followerUser) {
              return {
                user_id: followerUser.user_id,
                name: followerUser.name || 'Unknown User',
                account_type: followerUser.account_type || 'User',
                profile_image: followerUser.profile_image || 'default_profile.jpg',
                username: followerUser.username
              };
            }
            return null;
          }).filter(Boolean); // Remove null entries
          
          return followerObjects;
        }
      }
      
      // Default to empty array
      return [];
    } catch (error) {
      console.error("Error getting followers list:", error);
      return []; // Return empty array instead of throwing
    }
  },

  getFollowerCount: async (userId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/users/${userId}/followers/count`
      );

      if (!response.ok) {
        throw new Error(`Failed to get follower count: ${response.status}`);
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error("Error in getFollowerCount:", error);

      // Fallback to local storage
      try {
        const followersKey = `followers_${userId}`;
        const followersJson = await AsyncStorage.getItem(followersKey);
        const followers = followersJson ? JSON.parse(followersJson) : [];

        return followers.length;
      } catch (storageError) {
        console.error(
          "Error getting follower count from local storage:",
          storageError
        );
        return 0;
      }
    }
  },

  getSuggestedFollows: async (userId) => {
    try {
      console.log(`Getting suggested follows for user ${userId}`);

      const users = await fetchUsers();
      const currentUser = users.find(
        (u) => String(u.user_id) === String(userId)
      );

      if (!currentUser) throw new Error(`User with ID ${userId} not found`);

      // Get current following list
      const following = await getFollowing(userId);
      const followingIds = following.map((f) =>
        typeof f === "object" ? String(f.user_id) : String(f)
      );

      // Filter for sellers and influencers not already followed
      const suggestions = users.filter((user) => {
        // Skip the current user
        if (String(user.user_id) === String(userId)) return false;

        // Only include sellers and influencers
        const role =
          user.account_type?.toLowerCase() || user.role?.toLowerCase();
        if (role !== "seller" && role !== "influencer") return false;

        // Skip if already following
        if (followingIds.includes(String(user.user_id))) return false;

        return true;
      });

      // Sort by followers count (most popular first)
      suggestions.sort(
        (a, b) => (b.followers_count || 0) - (a.followers_count || 0)
      );

      return suggestions;
    } catch (error) {
      console.error("Error getting suggested follows:", error);
      throw error;
    }
  },
};

export default FollowingService;
