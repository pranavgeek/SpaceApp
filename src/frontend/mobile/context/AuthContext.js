import React, { createContext, useState, useContext, useEffect } from "react";
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

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("userRole"); // Uncomment this line if you want to clear the role on logout
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
