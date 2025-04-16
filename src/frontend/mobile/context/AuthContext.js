import React, { createContext, useState, useContext, useEffect, Platform } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiLogin } from "../backend/db/API"; // Rename the imported function
import { updateUser } from "../backend/db/API";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Adjusted to use the API login
  // const login = async (email, password) => {
  //   try {
  //     const userData = await apiLogin(email, password); // Fetch user info from local JSON/API
  //     const storedRole = await AsyncStorage.getItem("userRole");

  //     // Only apply storedRole if it matches one of the allowed roles for the user
  //     const validRoles = ["buyer", "seller", "influencer"];
  //     const roleFromAPI = userData.account_type?.toLowerCase() || "buyer";
  //     const role = validRoles.includes(storedRole) ? storedRole : roleFromAPI;

  //     const updatedUser = {
  //       ...userData,
  //       role, // use valid role only
  //       id: userData.user_id.toString(),
  //     };
  //     setUser(updatedUser);
  //     await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  //     await AsyncStorage.setItem("userRole", updatedUser.role);
  //   } catch (error) {
  //     console.error("Login failed", error);
  //     throw new Error(error.message || "Login failed");
  //   }
  // };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userData = await apiLogin(email, password);
      const storedRole = await AsyncStorage.getItem("userRole");

      // Only apply storedRole if it matches one of the allowed roles for the user
      const validRoles = ["buyer", "seller", "influencer"];
      const roleFromAPI = userData.account_type?.toLowerCase() || "buyer";
      const role = validRoles.includes(storedRole) ? storedRole : roleFromAPI;

      const updatedUser = {
        ...userData,
        role, // use valid role only
        account_type: role.charAt(0).toUpperCase() + role.slice(1), // Ensure account_type is set and capitalized
        id: userData.user_id.toString(),
      };
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      await AsyncStorage.setItem("userRole", updatedUser.role);
      return updatedUser;
    } catch (error) {
      console.error("Login failed", error);
      throw new Error(error.message || "Login failed");
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

  // const updateRole = async (newRole) => {
  //   if (user) {
  //     try {
  //       const updatedUser = { ...user, account_type: newRole, role: newRole };
  //       console.log("Sending update to server with:", updatedUser);
  
  //       await updateUser(user.user_id, { account_type: newRole });
  
  //       setUser(updatedUser);
  //       await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  //       await AsyncStorage.setItem("userRole", newRole);
  //       await AsyncStorage.setItem("switchedRole", newRole);
        
  //       const storedUser = await AsyncStorage.getItem("user");
  //       console.log("✅ Updated AsyncStorage user:", JSON.parse(storedUser));
  //     } catch (error) {
  //       console.error("Failed to update role on server:", error);
  //     }
  //   }
  // };

  const updateRole = async (newRole) => {
    if (user) {
      setLoading(true);
      try {
        // Normalize role format
        const normalizedRole = newRole.toLowerCase();
        const displayRole = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
        
        // Get the most recent user data from storage to ensure we have all fields
        const storedUserStr = await AsyncStorage.getItem("user");
        const storedUser = storedUserStr ? JSON.parse(storedUserStr) : user;
        
        const updatedUser = { 
          ...storedUser,  // Use all stored user data
          account_type: displayRole,
          role: normalizedRole
        };
        
        console.log("Sending update to server with:", updatedUser);
        
        // Only send the account_type to the server update
        await updateUser(user.user_id, { account_type: displayRole });
  
        // But update the local storage with the complete user object
        setUser(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        await AsyncStorage.setItem("userRole", normalizedRole);
        await AsyncStorage.setItem("switchedRole", displayRole);
        
        console.log("✅ Updated AsyncStorage user:", updatedUser);
        return updatedUser;
      } catch (error) {
        console.error("Failed to update role on server:", error);
        throw error;
      } finally {
        setLoading(false);
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
