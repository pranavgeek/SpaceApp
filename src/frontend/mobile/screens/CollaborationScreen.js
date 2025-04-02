import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUsers } from "../backend/db/API";

const CollaborationScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    const loadSellers = async () => {
      try {
        const users = await fetchUsers();
        const filteredSellers = users.filter(
          (u) => u.account_type === "Seller"
        );
        setSellers(filteredSellers);
      } catch (err) {
        console.error("Failed to fetch sellers", err);
      }
    };

    loadSellers();
  }, []);

  const handleSwipeRight = async (cardIndex) => {
    const selectedSeller = sellers[cardIndex];

    const request = {
      requestId: Date.now().toString(),
      sellerId: selectedSeller.user_id.toString(),
      sellerName: selectedSeller.name,
      influencerId: user.id,
      influencerName: user.name,
      product: "Collaboration Request",
      status: "Pending",
    };

    try {
      // Update collaboration requests
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const existingRequests = stored ? JSON.parse(stored) : [];

      const alreadySent = existingRequests.some(
        (r) =>
          r.influencerId === user.id &&
          r.sellerId === selectedSeller.user_id.toString()
      );

      if (alreadySent) {
        Alert.alert("Already Sent", "You already sent a request to this seller.");
        return;
      }

      const updatedRequests = [...existingRequests, request];
      await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updatedRequests));

      // Store an initial message as well
      const storedMessages = await AsyncStorage.getItem("messages");
      const existingMessages = storedMessages ? JSON.parse(storedMessages) : [];

      existingMessages.push({
        message_id: Date.now(),
        user_from: user.name,
        user_to: selectedSeller.name,
        type_message: "text",
        message_content: "Hi, I'm interested in collaborating with you!",
        date_timestamp_sent: new Date().toISOString(),
      });

      await AsyncStorage.setItem("messages", JSON.stringify(existingMessages));

      Alert.alert("Request Sent", `Your request was sent to ${selectedSeller.name}.`);
    } catch (error) {
      console.error("Error sending request:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const renderCard = (seller) => (
    <View style={[styles.card, { backgroundColor: colors.baseContainerBody }]}>
      <Image
        source={{
          uri: seller.profile_image?.startsWith("http")
            ? seller.profile_image
            : `https://yourdomain.com/${seller.profile_image}`,
        }}
        style={styles.cardImage}
      />
      <Text style={[styles.cardTitle, { color: colors.text }]}>{seller.name}</Text>
      <Text style={[styles.cardSubtitle, { color: colors.subtitle }]}>
        {seller.about_us || "No description available"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Swipe Right to Collaborate
      </Text>
      {sellers.length > 0 ? (
        <Swiper
          cards={sellers}
          renderCard={renderCard}
          onSwipedRight={handleSwipeRight}
          cardIndex={0}
          backgroundColor={colors.background}
          stackSize={3}
          overlayLabels={{
            right: {
              title: "Collaborate",
              style: {
                label: {
                  backgroundColor: "green",
                  color: "white",
                  fontSize: 24,
                  padding: 10,
                },
              },
            },
          }}
        />
      ) : (
        <Text
          style={[styles.cardSubtitle, { textAlign: "center", marginTop: 20 }]}
        >
          No sellers found.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    height:
      Platform.OS === "android" || Platform.OS === "ios"
        ? Dimensions.get("window").height * 0.4
        : Dimensions.get("window").height * 0.5,
  },
  cardImage: { width: 150, height: 150, borderRadius: 75, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardSubtitle: { fontSize: 16 },
});

export default CollaborationScreen;
