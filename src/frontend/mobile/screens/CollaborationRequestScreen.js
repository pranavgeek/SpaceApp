import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

const CollaborationRequestScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const allRequests = stored ? JSON.parse(stored) : [];
      const sellerRequests = allRequests.filter(
        (req) => req && req.requestId && req.sellerId === user.id
      );
      setRequests(sellerRequests);
    } catch (error) {
      console.error("Error loading collaboration requests", error);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const allRequests = stored ? JSON.parse(stored) : [];
      let updatedRequests;
      if (newStatus === "Declined") {
        // Remove the request if declined.
        updatedRequests = allRequests.filter((req) => req.requestId !== requestId);
      } else {
        // Update the status for accepted requests.
        updatedRequests = allRequests.map((req) =>
          req.requestId === requestId ? { ...req, status: newStatus } : req
        );
      }
      await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updatedRequests));
      const sellerRequests = updatedRequests.filter(
        (req) => req && req.requestId && req.sellerId === user.id
      );
      setRequests(sellerRequests);
    } catch (error) {
      console.error("Error updating request status", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [user])
  );
  
  const renderItem = ({ item }) => (
    <View style={styles.requestItem}>
      <Text style={styles.requestText}>
        {item.influencerName} requested to collaborate on {item.product} ({item.status})
      </Text>
      {item.status === "Pending" && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => updateRequestStatus(item.requestId, "Accepted")}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={() => updateRequestStatus(item.requestId, "Declined")}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <FlatList
        data={requests}
        keyExtractor={(item, index) =>
          item && item.requestId ? item.requestId.toString() : index.toString()
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No collaboration requests yet.
          </Text>
        }
        contentContainerStyle={requests.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
};

const getDynamicStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: colors.background 
  },
  requestItem: {
    padding: 12,
    backgroundColor: isDarkMode ? colors.card : "#f2f2f2",
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.2 : 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestText: { 
    fontSize: 16, 
    marginBottom: 8,
    color: colors.text
  },
  buttonContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  button: {
    flex: 0.48,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  acceptButton: { 
    backgroundColor: colors.success || "green" 
  },
  declineButton: { 
    backgroundColor: colors.error || "red" 
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16,
    fontWeight: "600" 
  },
  emptyText: { 
    textAlign: "center", 
    fontSize: 16, 
    color: colors.subtitle 
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default CollaborationRequestScreen;