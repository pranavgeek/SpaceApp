import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { submitTrackingLink as sendTrackingToAdmin, fetchUserById } from "../backend/db/API";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

const ShippingDetailScreen = ({ route }) => {
  const { order } = route.params || {};
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);

  const [generating, setGenerating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [trackingLink, setTrackingLink] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [accountType, setAccountType] = useState("Buyer"); // Default to Buyer

  // Add useEffect to fetch the account type based on buyer_id
  useEffect(() => {
    const fetchBuyerAccountType = async () => {
      try {
        if (order && order.buyer_id) {
          // Fetch the user data using the buyer_id
          const userData = await fetchUserById(order.buyer_id);
          
          // If we found the user, get their account type
          if (userData) {
            const type = userData.account_type || userData.role || "Buyer";
            setAccountType(type);
            console.log(`Buyer ID ${order.buyer_id} has account type: ${type}`);
          }
        }
      } catch (error) {
        console.error("Error fetching buyer account type:", error);
      }
    };
    
    fetchBuyerAccountType();
  }, [order]);
  

  const buyerName = `${order.buyer_first_name || "-"} ${order.buyer_last_name || ""}`;
  // const accountType = order.buyer_account_type || order.account_type || "Buyer";

  const getAccountTypeColor = () => {
    switch (accountType.toLowerCase()) {
      case "influencer":
        return colors.primary;
      case "buyer":
        return "#4CAF50"; // Green color for buyers
      default:
        return colors.subtitle;
    }
  };

  // Status indicator based on order state
  const getStatusColor = () => {
    if (order.tracking_number) return colors.success; // Green for shipped
    return colors.warning; // Orange for pending
  };

  const getStatusText = () => {
    if (order.tracking_number) return "Shipped";
    return "Ready to Ship";
  };

  const handleGenerateTracking = () => {
    setSelectedOrderId(order.order_id);
    setModalVisible(true);
  };

  const submitTrackingLink = async () => {
    if (!trackingLink.trim()) {
      Alert.alert("Validation Error", "Please enter a valid tracking link.");
      return;
    }

    try {
      setGenerating(true);
      await sendTrackingToAdmin(order.order_id, trackingLink);

      Alert.alert("Submitted", "Tracking link sent for admin approval.");
      setModalVisible(false);
      setTrackingLink("");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to submit tracking link.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? colors.background : "#f3f4f6"}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Order Details</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor()}20` },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor() },
                ]}
              />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>#{order.order_id}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product</Text>
            <Text style={styles.infoValue}>{order.product_name}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity</Text>
            <Text style={styles.infoValue}>{order.quantity}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price</Text>
            <Text style={styles.infoValue}>${order.amount}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product ID</Text>
            <Text style={styles.infoValue}>{order.product_id}</Text>
          </View>
          {order.tracking_number && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tracking #</Text>
                <Text style={styles.infoValue}>{order.tracking_number}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <View style={styles.accountTypeRow}>
              <View style={styles.iconContainer}>
                {accountType.toLowerCase() === 'influencer' ? (
                  <Ionicons name="person-circle" size={18} color={getAccountTypeColor()} />
                ) : (
                  <Ionicons name="cart" size={18} color={getAccountTypeColor()} />
                )}
              </View>
              <Text style={[styles.accountTypeValueText, { color: getAccountTypeColor() }]}>
                {accountType}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={styles.customerInfoContainer}>
              <Text style={styles.infoValue}>{buyerName}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{order.buyer_email || "-"}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{order.buyer_phone || "-"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Address</Text>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>
              {order.shipping_address || order.shipping_info?.address || "-"}
            </Text>
            <Text style={styles.addressText}>
              {order.shipping_city || order.shipping_info?.city || "-"},
              {order.shipping_province || order.shipping_info?.province || "-"}
            </Text>
            <Text style={styles.addressText}>
              {order.shipping_country || order.shipping_info?.country || "-"} -
              {order.shipping_postal_code ||
                order.shipping_info?.postal_code ||
                "-"}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!order.tracking_number ? (
            <TouchableOpacity
              style={styles.trackingButton}
              onPress={handleGenerateTracking}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.trackingButtonText}>
                  Generate Tracking Number
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                Alert.alert(
                  "Tracking Information",
                  "Tracking details sent to customer."
                )
              }
            >
              <Text style={styles.secondaryButtonText}>
                Resend Tracking Info
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Submit Tracking Link</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter tracking URL"
              placeholderTextColor={isDarkMode ? "#888" : "#999"}
              value={trackingLink}
              onChangeText={setTrackingLink}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={submitTrackingLink}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getDynamicStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: isDarkMode ? 0.3 : 0.05,
      shadowRadius: 2.22,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.subtitle,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      flex: 2,
      textAlign: "right",
    },
    customerInfoContainer: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    accountTypeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 8,
    },
    accountTypeText: {
      fontSize: 12,
      fontWeight: "500",
    },
    accountTypeRow: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    iconContainer: {
      marginRight: 6,
    },
    accountTypeValueText: {
      fontSize: 14,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode ? colors.border : "#e5e7eb",
    },
    addressContainer: {
      paddingVertical: 8,
    },
    addressText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
    },
    buttonContainer: {
      marginTop: 8,
      marginBottom: 30,
    },
    trackingButton: {
      backgroundColor: colors.success,
      paddingVertical: 14,
      borderRadius: 10,
      marginBottom: 12,
      alignItems: "center",
      shadowColor: colors.success,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
      elevation: 5,
    },
    trackingButtonText: {
      color: "white",
      fontWeight: "700",
      fontSize: 16,
    },
    secondaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      marginBottom: 12,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
      elevation: 5,
    },
    secondaryButtonText: {
      color: "white",
      fontWeight: "700",
      fontSize: 16,
    },
    backButton: {
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#f3f4f6",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : "#d1d5db",
    },
    backButtonText: {
      color: colors.subtitle,
      fontWeight: "600",
      fontSize: 16,
    },
    // Modal styles
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
      backgroundColor: isDarkMode ? colors.card : "#F6F6F6",
      padding: 20,
      width: "85%",
      borderRadius: 12,
      elevation: 5,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 10,
      color: colors.text,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : "#ccc",
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      marginBottom: 16,
      color: colors.text,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "white",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    submitBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 8,
      marginLeft: 10,
    },
    submitText: {
      color: "white",
      fontWeight: "700",
    },
    cancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : "#ccc",
    },
    cancelText: {
      color: colors.text,
      fontWeight: "600",
    },
  });

export default ShippingDetailScreen;