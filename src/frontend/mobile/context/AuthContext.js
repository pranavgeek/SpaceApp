import React, { createContext, useState, useContext, useEffect, useCallback, useRef, Platform } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiLogin, updateUser, switchUserRole } from "../backend/db/API";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  // Add a ref to track if update is in progress
  const isUpdating = useRef(false);

  useEffect(() => {
    console.log("🧠 AuthContext user changed:", user?.user_id);
  }, [user]);

  useEffect(() => {
    if (user) {
      console.trace("🔁 setUser() triggered — stack trace here");
    }
  }, [user]);

  // On app load, try to load the user from persistent storage
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true); // Set loading to true when starting
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user", error);
      } finally {
        setLoading(false); // Always set loading to false when done
      }
    };
    loadUser();
  }, []);

  // Add this function to update user data without triggering refreshes
  const updateUserSilently = async (patch) => {
    try {
      const storedUserStr = await AsyncStorage.getItem("user");
      if (!storedUserStr) return;
      const storedUser = JSON.parse(storedUserStr);
  
      const newUser = { ...storedUser, ...patch };
  
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      console.log("✅ User silently updated in AsyncStorage");
      
      // 🚫 Don't call setUser(newUser) here
    } catch (error) {
      console.error("Failed to silently update user:", error);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Get the selected account type from AsyncStorage
      const selectedRole = await AsyncStorage.getItem("userRole") || "buyer";
      console.log(`Attempting to login as: ${selectedRole}`);
      
      // Check if this is a recently reset password login
      const recentlyResetEmail = await AsyncStorage.getItem("recentlyResetEmail");
      const recentlyResetPassword = await AsyncStorage.getItem("recentlyResetPassword");
      
      // IMPORTANT: If we have recently reset credentials, use them
      if (recentlyResetEmail === email && recentlyResetPassword) {
        console.log("Detected login with recently reset password");
        console.log(`Using stored password (length: ${recentlyResetPassword.length})`);
        password = recentlyResetPassword;
        
        // Only clear these after successful login to allow retries
      }
      
      // Fetch user data from the API
      console.log(`Calling apiLogin with email: ${email}`);
      const userData = await apiLogin(email, password);
      
      // Check if the user exists
      if (!userData) {
        throw new Error("Invalid credentials");
      }
      
      console.log("Login successful, processing user data");
      
      // Get the user's actual role from their account data
      const userRole = userData.account_type?.toLowerCase() || userData.role?.toLowerCase() || "buyer";
      console.log(`User's actual role: ${userRole}`);
      
      // Create the updated user object with the correct role
      const updatedUser = {
        ...userData,
        role: userRole,
        account_type: userRole.charAt(0).toUpperCase() + userRole.slice(1),
        // Handle different ID formats
        id: userData.user_id ? userData.user_id.toString() : 
            userData.id ? userData.id.toString() : "0",
        user_id: userData.user_id ? userData.user_id.toString() : 
                 userData.id ? userData.id.toString() : "0",
      };
      
      // Only now clear the reset credentials since login was successful
      if (recentlyResetEmail === email && recentlyResetPassword) {
        await AsyncStorage.removeItem("recentlyResetEmail");
        await AsyncStorage.removeItem("recentlyResetPassword");
        console.log("Cleared temporary reset credentials");
      }
      
      // Update state and storage
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      await AsyncStorage.setItem("userRole", userRole);
      console.log(`Successfully logged in as: ${userRole}`);
      
      // Check if this is a buyer who should see the suggested accounts
      if (userRole === 'buyer') {
        const hasSeenSuggestions = await AsyncStorage.getItem(`seen_suggestions_${updatedUser.user_id || updatedUser.id}`);
        setIsFirstLogin(!hasSeenSuggestions);
        console.log(`First login status for buyer: ${!hasSeenSuggestions}`);
      } else {
        setIsFirstLogin(false);
      }
      
      return updatedUser;
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const storage = {
    setItem: async (key, value) => {
      try {
        // For React Native
        await AsyncStorage.setItem(key, value);
        // For web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error('Storage setItem error:', error);
      }
    },
    getItem: async (key) => {
      try {
        // Try React Native first
        const value = await AsyncStorage.getItem(key);
        // If no value and we're on web, try localStorage
        if (!value && typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return value;
      } catch (error) {
        console.error('Storage getItem error:', error);
        return null;
      }
    },
    removeItem: async (key) => {
      try {
        // For React Native
        await AsyncStorage.removeItem(key);
        // For web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Storage removeItem error:', error);
      }
    }
  };
  
  // Then use it in your logout function
  const logout = async () => {
    setUser(null);
    await storage.removeItem("user");
    await storage.removeItem("userRole");
  };

  const updateRole = async (newRole, tier = null) => {
    if (user) {
      setLoading(true);
      try {
        console.log(`Updating user ${user.user_id} to role ${newRole} with tier ${tier || 'none'}`);
        
        const normalizedRole = newRole.toLowerCase();
        const displayRole = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
        
        const storedUserStr = await AsyncStorage.getItem("user");
        const storedUser = storedUserStr ? JSON.parse(storedUserStr) : user;
        
        const updatedUser = { 
          ...storedUser,  
          account_type: displayRole,
          role: normalizedRole
        };
        
        // 👇 FIX: Ensure tier is updated correctly for sellers
        if (tier && (normalizedRole === "influencer" || normalizedRole === "seller")) {
          updatedUser.tier = tier;
          if (normalizedRole === "influencer") {
            updatedUser.influencer_tier = tier;
          }
        } else if (normalizedRole === "seller" && !tier) {
          updatedUser.tier = "basic"; // default tier for sellers
        }
        
        await updateUser(user.user_id, {
          role: normalizedRole,
          account_type: displayRole,
          tier: updatedUser.tier,
        });
        console.log("✅ User role updated in the backend");
  
        setUser(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        await AsyncStorage.setItem("userRole", normalizedRole);
        await AsyncStorage.setItem("userTier", updatedUser.tier);
        console.log("✅ User data saved to AsyncStorage");
        
        return updatedUser;
      } catch (error) {
        console.error("Failed to update role:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      console.error("Cannot update role: No user is logged in");
      throw new Error("No user logged in");
    }
  };

  // Function to toggle seller mode
  const toggleSellerMode = async (activate = true) => {
    if (!user) {
      console.error("Cannot toggle seller mode: No user is logged in");
      throw new Error("No user logged in");
    }
  
    setLoading(true);
    try {
      // Only buyers can activate seller mode
      if (activate && user.role !== "buyer") {
        throw new Error("Only buyers can activate seller mode");
      }
  
      // Call the backend API to switch roles
      const response = await switchUserRole(user.user_id, "seller", activate);
      
      if (!response.success) {
        throw new Error(response.message || "Failed to toggle seller mode");
      }
      
      // Update the user state with the new data
      setUser(response.user);
      
      console.log(activate ? 
        "✅ User switched to seller mode" : 
        "✅ User returned to buyer mode"
      );
      
      return response.user;
    } catch (error) {
      console.error("Failed to toggle seller mode:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        updateRole,
        toggleSellerMode, 
        loading, 
        isFirstLogin, 
        setIsFirstLogin, 
        updateUserSilently // Add the new function to the context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);