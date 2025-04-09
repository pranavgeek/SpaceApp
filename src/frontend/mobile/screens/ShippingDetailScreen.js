import React, { useState } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { submitTrackingLink as sendTrackingToAdmin } from "../backend/db/API";

const ShippingDetailScreen = ({ route }) => {
  const { order } = route.params || {};
  const navigation = useNavigation();
  const [generating, setGenerating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [trackingLink, setTrackingLink] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const buyerName = `${order.buyer_first_name || "-"} ${order.buyer_last_name || ""}`;

  // Status indicator based on order state
  const getStatusColor = () => {
    if (order.tracking_number) return "#10b981"; // Green for shipped
    return "#f59e0b"; // Orange for pending
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
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{buyerName}</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6",
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
    color: "#111827",
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
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    flex: 2,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  addressContainer: {
    paddingVertical: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 30,
  },
  trackingButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#22c55e",
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
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#3b82f6",
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
    backgroundColor: "#f3f4f6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  backButtonText: {
    color: "#4b5563",
    fontWeight: "600",
    fontSize: 16,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  modalContainer: {
    backgroundColor: "#F6F6F6",
    padding: 20,
    width: "85%",
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
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
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  submitBtn: {
    backgroundColor: "#006AFF",
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
    borderColor: "#ccc",
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
  },  
});

export default ShippingDetailScreen;
