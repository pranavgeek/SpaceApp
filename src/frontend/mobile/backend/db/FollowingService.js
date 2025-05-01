import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Dynamic base URL for API calls
const BASE_URL = Platform.OS === "web" 
  ? "http://localhost:5001/api"
  : "http://10.0.0.25:5001/api";

/**
 * Service for handling following/follower relationships
 */
export const FollowingService = {
  
    followUser: async (followerId, followeeId) => {
        try {
          console.log(`Attempting to follow user: ${followerId} → ${followeeId}`);
          
          const response = await fetch(`${BASE_URL}/users/${followerId}/follow`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ followee_id: followeeId })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error following user: ${errorText}`);
            throw new Error(`Failed to follow user: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error("Error in followUser:", error);
          
          // Fallback to local storage if backend is not available
          try {
            // Get current following list
            const followingKey = `following_${followerId}`;
            const followingJson = await AsyncStorage.getItem(followingKey);
            const following = followingJson ? JSON.parse(followingJson) : [];
            
            // Check if already following
            if (following.includes(followeeId)) {
              return { success: true, message: "Already following this user" };
            }
            
            // Add to following
            following.push(followeeId);
            await AsyncStorage.setItem(followingKey, JSON.stringify(following));
            
            // Update follower list for the followee
            const followersKey = `followers_${followeeId}`;
            const followersJson = await AsyncStorage.getItem(followersKey);
            const followers = followersJson ? JSON.parse(followersJson) : [];
            
            if (!followers.includes(followerId)) {
              followers.push(followerId);
              await AsyncStorage.setItem(followersKey, JSON.stringify(followers));
            }
            
            return { success: true, message: "Successfully followed user", isLocalOnly: true };
          } catch (storageError) {
            console.error("Error in local storage fallback:", storageError);
            throw new Error("Failed to follow user: Could not update local storage");
          }
        }
      },
  
  /**
   * Unfollow a user
   * 
   * @param {string|number} followerId - ID of the user who is unfollowing
   * @param {string|number} followeeId - ID of the user being unfollowed
   * @returns {Promise<object>} - Result of the unfollow operation
   */
  unfollowUser: async (followerId, followeeId) => {
    try {
      console.log(`Attempting to unfollow user: ${followerId} → ${followeeId}`);
      
      const response = await fetch(`${BASE_URL}/users/${followerId}/unfollow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followee_id: followeeId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error unfollowing user: ${errorText}`);
        throw new Error(`Failed to unfollow user: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in unfollowUser:", error);
      
      // Fallback to local storage if backend is not available
      try {
        // Update following list
        const followingKey = `following_${followerId}`;
        const followingJson = await AsyncStorage.getItem(followingKey);
        let following = followingJson ? JSON.parse(followingJson) : [];
        
        following = following.filter(id => id !== followeeId);
        await AsyncStorage.setItem(followingKey, JSON.stringify(following));
        
        // Update followers list
        const followersKey = `followers_${followeeId}`;
        const followersJson = await AsyncStorage.getItem(followersKey);
        let followers = followersJson ? JSON.parse(followersJson) : [];
        
        followers = followers.filter(id => id !== followerId);
        await AsyncStorage.setItem(followersKey, JSON.stringify(followers));
        
        return { success: true, message: "Successfully unfollowed user", isLocalOnly: true };
      } catch (storageError) {
        console.error("Error in local storage fallback:", storageError);
        throw new Error("Failed to unfollow user: Could not update local storage");
      }
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
      return following.some(user => String(user.user_id) === String(followeeId));
    } catch (error) {
      console.error("Error in isFollowing:", error);
      
      // Fallback to local storage
      try {
        const followingKey = `following_${followerId}`;
        const followingJson = await AsyncStorage.getItem(followingKey);
        const following = followingJson ? JSON.parse(followingJson) : [];
        
        return following.some(id => String(id) === String(followeeId));
      } catch (storageError) {
        console.error("Error checking following status in local storage:", storageError);
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
      const response = await fetch(`${BASE_URL}/users/${userId}/following`);
      
      if (!response.ok) {
        throw new Error(`Failed to get following: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getFollowing:", error);
      
      // Fallback to local storage
      try {
        const followingKey = `following_${userId}`;
        const followingJson = await AsyncStorage.getItem(followingKey);
        const followingIds = followingJson ? JSON.parse(followingJson) : [];
        
        // If we have user data cached, try to resolve the full user objects
        const usersJson = await AsyncStorage.getItem('cached_users');
        const users = usersJson ? JSON.parse(usersJson) : [];
        
        if (users.length > 0) {
          return followingIds.map(id => {
            const user = users.find(u => String(u.user_id) === String(id));
            return user || { user_id: id, name: `User ${id}`, account_type: 'Unknown' };
          });
        }
        
        // Return simple objects if no cache
        return followingIds.map(id => ({ user_id: id, name: `User ${id}`, account_type: 'Unknown' }));
      } catch (storageError) {
        console.error("Error getting following from local storage:", storageError);
        return [];
      }
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
      const response = await fetch(`${BASE_URL}/users/${userId}/followers`);
      
      if (!response.ok) {
        throw new Error(`Failed to get followers: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getFollowers:", error);
      
      // Fallback to local storage
      try {
        const followersKey = `followers_${userId}`;
        const followersJson = await AsyncStorage.getItem(followersKey);
        const followerIds = followersJson ? JSON.parse(followersJson) : [];
        
        // If we have user data cached, try to resolve the full user objects
        const usersJson = await AsyncStorage.getItem('cached_users');
        const users = usersJson ? JSON.parse(usersJson) : [];
        
        if (users.length > 0) {
          return followerIds.map(id => {
            const user = users.find(u => String(u.user_id) === String(id));
            return user || { user_id: id, name: `User ${id}`, account_type: 'Unknown' };
          });
        }
        
        // Return simple objects if no cache
        return followerIds.map(id => ({ user_id: id, name: `User ${id}`, account_type: 'Unknown' }));
      } catch (storageError) {
        console.error("Error getting followers from local storage:", storageError);
        return [];
      }
    }
  },
  
  getFollowerCount: async (userId) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/followers/count`);
      
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
        console.error("Error getting follower count from local storage:", storageError);
        return 0;
      }
    }
  },
  
  getSuggestedFollows: async (buyerId) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${buyerId}/suggested-follows`);
      
      if (!response.ok) {
        throw new Error(`Failed to get suggested follows: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getSuggestedFollows:", error);
      
      // Fallback to local implementation
      try {
        // Get all users from local storage
        const usersJson = await AsyncStorage.getItem('cached_users');
        let users = usersJson ? JSON.parse(usersJson) : [];
        
        // If no cached users, return empty array
        if (users.length === 0) {
          return [];
        }
        
        // Filter out buyers and the current user
        users = users.filter(user => 
          (user.account_type === 'Seller' || user.account_type === 'Influencer') && 
          String(user.user_id) !== String(buyerId)
        );
        
        // Get current following list
        const followingKey = `following_${buyerId}`;
        const followingJson = await AsyncStorage.getItem(followingKey);
        const following = followingJson ? JSON.parse(followingJson) : [];
        
        // Filter out users already being followed
        users = users.filter(user => 
          !following.includes(String(user.user_id))
        );
        
        // Sort by follower count (if available) or randomly
        users.sort((a, b) => {
          const followersA = a.followers_count || 0;
          const followersB = b.followers_count || 0;
          return followersB - followersA;
        });
        
        // Return top 10 suggestions
        return users.slice(0, 10);
      } catch (storageError) {
        console.error("Error getting suggested follows from local storage:", storageError);
        return [];
      }
    }
  }
};

export default FollowingService;