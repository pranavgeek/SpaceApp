import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUsers } from "../backend/db/API";
import { Alert } from "react-native";

/**
 * Handles sending collaboration requests from influencers to sellers
 * and syncs them with backend and local storage
 */
export const CollaborationRequestSystem = {
  /**
   * Send a new collaboration request
   * @param {Object} influencer - Current logged in influencer user
   * @param {Object} seller - The seller the influencer wants to collaborate with
   * @returns {Promise<Object>} - The created request
   */
  sendRequest: async (influencer, seller) => {
    try {
      // Generate a unique request ID based on timestamp
      const requestId = Date.now().toString();
      const timestamp = new Date().toISOString();
      
      // Create the request object with right structure to match backend
      const request = {
        requestId: requestId,
        influencerId: influencer.id || influencer.user_id.toString(),
        influencerName: influencer.name,
        sellerId: seller.user_id.toString(),
        sellerName: seller.name,
        product: "General Collaboration", // This matches your existing structure
        status: "Pending",
        timestamp: timestamp,
      };
      
      console.log("Creating new collaboration request:", request);
      
      // Save to local storage
      const storedRequests = await AsyncStorage.getItem("collaborationRequests");
      const existingRequests = storedRequests ? JSON.parse(storedRequests) : [];
      
      // Check if a similar request already exists
      const alreadyExists = existingRequests.some(
        req => req.influencerId === request.influencerId && 
              req.sellerId === request.sellerId &&
              req.status === "Pending"
      );
      
      if (alreadyExists) {
        throw new Error("You already have a pending request with this seller");
      }
      
      // Add the new request and save back to storage
      const updatedRequests = [...existingRequests, request];
      await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updatedRequests));
      
      return request;
    } catch (error) {
      console.error("Error sending collaboration request:", error);
      throw error;
    }
  },
  
  /**
   * Check if the influencer already has a pending request with the seller
   * @param {String} influencerId 
   * @param {String} sellerId 
   * @returns {Promise<Boolean>}
   */
  hasPendingRequest: async (influencerId, sellerId) => {
    try {
      // Check from local storage
      const storedRequests = await AsyncStorage.getItem("collaborationRequests");
      const existingRequests = storedRequests ? JSON.parse(storedRequests) : [];
      
      return existingRequests.some(
        req => req.influencerId === influencerId && 
              req.sellerId === sellerId &&
              req.status === "Pending"
      );
    } catch (error) {
      console.error("Error checking pending requests:", error);
      return false;
    }
  },
  
  /**
   * Get all available sellers for collaboration (not already requested)
   * @param {String} influencerId - Current influencer's ID 
   * @returns {Promise<Array>} - Array of available sellers
   */
  getAvailableSellers: async (influencerId) => {
    try {
      // Fetch all users
      const users = await fetchUsers();
      
      // Filter for sellers only
      const sellers = users.filter(user => 
        user.account_type === "Seller" || user.role === "seller"
      );
      
      // Get existing pending requests
      const storedRequests = await AsyncStorage.getItem("collaborationRequests");
      const existingRequests = storedRequests ? JSON.parse(storedRequests) : [];
      
      // Mark sellers with pending requests
      const availableSellers = sellers.map(seller => {
        const alreadyRequested = existingRequests.some(
          req => req.influencerId === influencerId && 
                req.sellerId === seller.user_id.toString() &&
                req.status === "Pending"
        );
        
        return {
          ...seller,
          alreadyRequested
        };
      });
      
      return availableSellers;
    } catch (error) {
      console.error("Error getting available sellers:", error);
      throw error;
    }
  },
  
  /**
   * Sends an initial message to the seller after sending a collaboration request
   * @param {Object} user - Current influencer 
   * @param {Object} seller - Target seller
   * @returns {Promise<void>}
   */
  sendInitialMessage: async (user, seller) => {
    try {
      // Get existing messages
      const storedMessages = await AsyncStorage.getItem("messages");
      const existingMessages = storedMessages ? JSON.parse(storedMessages) : [];
      
      // Create the new message
      const message = {
        message_id: Date.now(),
        user_from: user.name,
        user_to: seller.name,
        type_message: "text",
        message_content: "Hi, I'm interested in collaborating with you as an influencer! I've sent a collaboration request.",
        date_timestamp_sent: new Date().toISOString(),
        is_read: false,
      };
      
      // Add to messages and save
      existingMessages.push(message);
      await AsyncStorage.setItem("messages", JSON.stringify(existingMessages));
      
      console.log("Initial message sent to seller");
    } catch (error) {
      console.error("Error sending initial message:", error);
      // Don't throw, as this is a non-critical operation
    }
  },

  /**
   * Update an existing collaboration request status
   * @param {String} requestId - The ID of the request to update
   * @param {String} status - New status (Pending, Accepted, Rejected)
   * @returns {Promise<boolean>} - Success indicator
   */
  updateRequestStatus: async (requestId, status) => {
    try {
      // Get existing requests
      const storedRequests = await AsyncStorage.getItem("collaborationRequests");
      const existingRequests = storedRequests ? JSON.parse(storedRequests) : [];
      
      // Find and update the request
      const updatedRequests = existingRequests.map(req => {
        if (req.requestId === requestId) {
          return { ...req, status: status, statusUpdatedAt: new Date().toISOString() };
        }
        return req;
      });
      
      // Save the updated requests
      await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updatedRequests));
      return true;
    } catch (error) {
      console.error("Error updating request status:", error);
      return false;
    }
  }
};

export default CollaborationRequestSystem;