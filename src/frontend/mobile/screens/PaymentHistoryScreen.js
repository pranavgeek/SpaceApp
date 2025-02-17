import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PaymentHistoryScreen = () => {
  const [payments, setPayments] = useState([
    {
      id: "1",
      date: "2025-01-15",
      name: "Netflix Subscription",
      amount: "$15.99",
      status: "Completed",
      type: "subscription", // Type for icon
      details: "Monthly Netflix subscription for January 2025.",
    },
    {
      id: "2",
      date: "2025-01-10",
      name: "Amazon Order",
      amount: "$129.99",
      status: "Completed",
      type: "shopping", // Type for icon
      details: "Order #12345 from Amazon - Noise-canceling headphones.",
    },
    {
      id: "3",
      date: "2025-01-05",
      name: "Spotify Premium",
      amount: "$9.99",
      status: "Pending",
      type: "subscription", // Type for icon
      details: "Monthly Spotify Premium subscription for January 2025.",
    },
    {
      id: "4",
      date: "2025-01-03",
      name: "Restaurant Bill",
      amount: "$45.50",
      status: "Completed",
      type: "food", // Type for icon
      details: "Dinner at Bella Italia restaurant.",
    },
  ]);

  const [selectedPayment, setSelectedPayment] = useState(null);

  // Get icon based on product type
  const getIconName = (type) => {
    switch (type) {
      case "subscription":
        return "film-outline"; 
      case "shopping":
        return "cart-outline"; 
      case "food":
        return "restaurant-outline"; 
      default:
        return "help-circle-outline";
    }
  };

  const renderPayment = ({ item }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => setSelectedPayment(item)}
    >
      {/* Icon for Product Type */}
      <Ionicons
        name={getIconName(item.type)}
        size={24}
        color="#fff"
        style={styles.paymentIcon}
      />

      {/* Payment Info */}
      <View>
        <Text style={styles.paymentName}>{item.name}</Text>
        <Text style={styles.paymentDate}>{item.date}</Text>
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentAmount}>{item.amount}</Text>
        <Text
          style={[
            styles.paymentStatus,
            item.status === "Completed"
              ? styles.completedStatus
              : styles.pendingStatus,
          ]}
        >
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={renderPayment}
      />

      {/* Modal for Payment Details */}
      {selectedPayment && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedPayment}
          onRequestClose={() => setSelectedPayment(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Payment Details</Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Date:</Text> {selectedPayment.date}
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Product/Service:</Text>{" "}
                {selectedPayment.name}
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Amount:</Text> {selectedPayment.amount}
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Status:</Text> {selectedPayment.status}
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Details:</Text>{" "}
                {selectedPayment.details}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPayment(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
    padding: 20,
  },
  paymentCard: {
    backgroundColor: "#141414",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#666",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    borderColor: '#aaa',
    borderWidth: 0.5,
  },
  paymentIcon: {
    marginRight: 15,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  paymentDate: {
    fontSize: 14,
    color: "#ccc",
  },
  paymentInfo: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#aaa",
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },
  completedStatus: {
    backgroundColor: "#343434",
    color: "#fff",
  },
  pendingStatus: {
    backgroundColor: "#343434",
    color: "#fff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
  modalLabel: {
    fontWeight: "bold",
    color: "#555",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#141414",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default PaymentHistoryScreen;
