import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { fetchAdminData, fetchUsers, fetchProducts } from "../backend/db/API";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth(); // 🧠 Include logout function
  const [adminData, setAdminData] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadAdminDashboard = async () => {
      const data = await fetchAdminData();
      const allUsers = await fetchUsers();
      const allProducts = await fetchProducts();
      setAdminData(data);
      setUsers(allUsers);
      setProducts(allProducts);
    };
    loadAdminDashboard();
  }, []);

  const handleApprove = (adminId, userId, role) => {
    console.log(`✅ Approved ${role} for user ${userId}`);
    // Call updateUser and updateAdminStatus here (to be implemented)
  };

  return (
    <ScrollView style={{ padding: 16, backgroundColor: colors.background }}>
      {/* LOGOUT BUTTON */}
      {/* <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 }}>
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutBtn(colors)}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Logout</Text>
        </TouchableOpacity>
      </View> */}

      {/* PENDING ACCOUNT APPROVALS */}
      <Text style={{ fontSize: 18, marginBottom: 6, color: colors.text }}>
        Pending Approvals
      </Text>
      {adminData
        .filter((a) => a.status === "pending")
        .map((item) => {
          const requestUser = users.find((u) => u.user_id === item.user_id);
          return (
            <View key={item.admin_id} style={styles.card(colors)}>
              <Text style={{ color: colors.text }}>{item.action}</Text>
              <Text style={{ color: colors.subtitle }}>
                User: {requestUser?.name}
              </Text>
              <TouchableOpacity
                style={styles.approveBtn(colors)}
                onPress={() =>
                  handleApprove(
                    item.admin_id,
                    item.user_id,
                    item.action.includes("influencer") ? "Influencer" : "Seller"
                  )
                }
              >
                <Text style={{ color: "#fff" }}>Approve</Text>
              </TouchableOpacity>
            </View>
          );
        })}

      {/* CONFIRMED ACCOUNTS */}
      <Text style={{ fontSize: 18, marginTop: 20, marginBottom: 6, color: colors.text }}>
        Confirmed Accounts
      </Text>
      {adminData
        .filter((a) => a.status === "confirmed")
        .map((item) => {
          const requestUser = users.find((u) => u.user_id === item.user_id);
          return (
            <View key={item.admin_id} style={styles.card(colors)}>
              <Text style={{ color: colors.text }}>{item.action}</Text>
              <Text style={{ color: colors.subtitle }}>
                User: {requestUser?.name}
              </Text>
              <TouchableOpacity
                style={styles.approveBtn(colors)}
                onPress={() =>
                  handleApprove(
                    item.admin_id,
                    item.user_id,
                    item.action.includes("influencer") ? "Influencer" : "Seller"
                  )
                }
              >
                <Text style={{ color: "#fff" }}>Revoke</Text>
              </TouchableOpacity>
            </View>
          );
        })}

      {/* PRODUCT VERIFICATION */}
      <Text style={{ fontSize: 18, marginTop: 20, marginBottom: 6, color: colors.text }}>
        Product Verification
      </Text>
      {products.map((product) => (
        <View key={product.product_id} style={styles.card(colors)}>
          <Text style={{ color: colors.text }}>{product.product_name}</Text>
          <Text style={{ color: colors.subtitle }}>{product.category}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: (colors) => ({
    backgroundColor: colors.baseContainerBody,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  }),
  approveBtn: (colors) => ({
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "flex-start",
  }),
  logoutBtn: (colors) => ({
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
  }),
});
