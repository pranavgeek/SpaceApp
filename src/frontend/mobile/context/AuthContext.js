import React, { createContext, useState, useContext, useEffect, Platform } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiLogin } from "../backend/db/API"; // Rename the imported function
import { updateUser } from "../backend/db/API";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // On app load, try to load the user from persistent storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user", error);
      }
    };
    loadUser();
  }, []);

  // Adjusted to use the API login
  const login = async (email, password) => {
    try {
      const userData = await apiLogin(email, password); // Fetch user info from local JSON/API
      const storedRole = await AsyncStorage.getItem("userRole");

      // Only apply storedRole if it matches one of the allowed roles for the user
      const validRoles = ["buyer", "seller", "influencer"];
      const roleFromAPI = userData.account_type?.toLowerCase() || "buyer";
      const role = validRoles.includes(storedRole) ? storedRole : roleFromAPI;

      const updatedUser = {
        ...userData,
        role, // use valid role only
        id: userData.user_id.toString(),
      };
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      await AsyncStorage.setItem("userRole", updatedUser.role);
    } catch (error) {
      console.error("Login failed", error);
      throw new Error(error.message || "Login failed");
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

  const updateRole = async (newRole) => {
    if (user) {
      try {
        const updatedUser = { ...user, account_type: newRole, role: newRole };
        console.log("Sending update to server with:", updatedUser);
  
        await updateUser(user.user_id, { account_type: newRole });
  
        setUser(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        await AsyncStorage.setItem("userRole", newRole);
        await AsyncStorage.setItem("switchedRole", newRole);
        
        const storedUser = await AsyncStorage.getItem("user");
        console.log("✅ Updated AsyncStorage user:", JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to update role on server:", error);
      }
    }
  };
  

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
