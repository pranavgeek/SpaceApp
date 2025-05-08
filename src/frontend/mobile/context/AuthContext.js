import React, { createContext, useState, useContext, useEffect, useCallback, useRef, Platform } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiLogin, updateUser } from "../backend/db/API";

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
      
      // Fetch user data from the API
      const userData = await apiLogin(email, password);
      
      // Check if the user exists
      if (!userData) {
        throw new Error("Invalid credentials");
      }
      
      // Get the user's actual role from their account data
      const userRole = userData.account_type?.toLowerCase() || userData.role?.toLowerCase() || "buyer";
      console.log(`User's actual role: ${userRole}`);
      
      // Verify that the selected role matches the user's actual role
      if (selectedRole !== userRole) {
        throw new Error(`This account is registered as a ${userRole}. Please use the ${userRole} login option.`);
      }
      
      // Create the updated user object with the correct role
      const updatedUser = {
        ...userData,
        role: userRole,
        account_type: userRole.charAt(0).toUpperCase() + userRole.slice(1), // Ensure account_type is set and capitalized
        id: userData.user_id.toString(),
      };
      
      // Update state and storage
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      await AsyncStorage.setItem("userRole", userRole);
      console.log(`Successfully logged in as: ${userRole}`);
      
      // Check if this is a buyer who should see the suggested accounts
      if (userRole === 'buyer') {
        const hasSeenSuggestions = await AsyncStorage.getItem(`seen_suggestions_${updatedUser.user_id}`);
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
  
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        updateRole, 
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