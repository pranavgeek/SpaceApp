import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { fetchMessages } from "../backend/db/API";
import { useAuth } from "../context/AuthContext";

export default function ChatScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { chatPartner, requestStatus: initialRequestStatus } = route.params;
  const { user: currentUser } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState([]);
  const [canSendMessages, setCanSendMessages] = useState(true);
  const [requestStatus, setRequestStatus] = useState(initialRequestStatus || null);

  const sendButtonPosition = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (inputText.trim() !== "" || images.length > 0) {
      Animated.timing(sendButtonPosition, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sendButtonPosition, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [inputText, images]);

  useEffect(() => {
    const loadMessages = async () => {
      const data = await fetchMessages();
      let updatedMessages = [...data];
  
      const storedUsers = await AsyncStorage.getItem("users");
      const users = storedUsers ? JSON.parse(storedUsers) : [];
  
      // Find chat partner's account type (Buyer, Seller, Influencer)
      const chatPartnerUser = users.find((u) => u.name === chatPartner);
      const chatPartnerType = chatPartnerUser?.account_type || null;
  
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const requests = stored ? JSON.parse(stored) : [];
  
      let request = null;
  
      if (
        currentUser.account_type === "Influencer" ||
        currentUser.account_type === "Seller"
      ) {
        // Find the collaboration request if it exists
        request = requests.find(
          (req) =>
            req.influencerName ===
              (currentUser.account_type === "Influencer"
                ? currentUser.name
                : chatPartner) &&
            req.sellerName ===
              (currentUser.account_type === "Seller"
                ? currentUser.name
                : chatPartner)
        );
      }
  
      // Set request status if request exists
      if (request?.status) setRequestStatus(request.status);
  
      // Inject message for Influencer if initiating and no request found
      if (!request && currentUser.account_type === "Influencer") {
        updatedMessages.push({
          message_id: 999,
          user_from: currentUser.name,
          user_to: chatPartner,
          type_message: "text",
          message_content: "Hey! I'm interested in promoting your product.",
          date_timestamp_sent: new Date().toISOString(),
        });
      }
  
      // Deduplicate messages by message_id
      const uniqueMessagesMap = {};
      updatedMessages.forEach((msg) => {
        if (!uniqueMessagesMap[msg.message_id]) {
          uniqueMessagesMap[msg.message_id] = msg;
        }
      });
      const deduplicatedMessages = Object.values(uniqueMessagesMap);
  
      // Filter messages for the current user and chat partner
      const filtered = deduplicatedMessages
        .filter(
          (msg) =>
            (msg.user_from === currentUser.name && msg.user_to === chatPartner) ||
            (msg.user_to === currentUser.name && msg.user_from === chatPartner)
        )
        .map((msg) => ({
          id: msg.message_id.toString(),
          text: msg.message_content,
          type: msg.user_from === currentUser.name ? "sent" : "received",
        }))
        .reverse();
  
      setMessages(filtered);
  
      // 🔐 FINAL Access Control Logic for message input
      if (currentUser.account_type === "Buyer") {
        // Buyers can always send messages
        setCanSendMessages(true);
      } else if (currentUser.account_type === "Seller") {
        // Sellers can send messages if the chat partner is a Buyer or if the request is accepted
        if (chatPartnerType === "Influencer" && requestStatus === "Accepted") {
          setCanSendMessages(true);
        } else if (chatPartnerType === "Buyer") {
          setCanSendMessages(true);
        } else if (requestStatus === "Pending") {
          setCanSendMessages(false);
        }
      } else if (currentUser.account_type === "Influencer") {
        // Influencers can always send messages
        setCanSendMessages(true);
      }
    };
  
    loadMessages();
  }, [chatPartner, currentUser]);
  

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        type: "sent",
      };
      setMessages([newMessage, ...messages]);
      setInputText("");
      saveMessage(inputText);
    }
  };

  const saveMessage = async (text) => {
    try {
      const stored = await AsyncStorage.getItem("messages");
      const all = stored ? JSON.parse(stored) : [];

      const newMessage = {
        message_id: Date.now(),
        user_from: currentUser.name,
        user_to: chatPartner,
        type_message: "text",
        message_content: text,
        date_timestamp_sent: new Date().toISOString(),
      };

      all.push(newMessage);
      await AsyncStorage.setItem("messages", JSON.stringify(all));
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const handleAccept = async () => {
    const stored = await AsyncStorage.getItem("collaborationRequests");
    const all = stored ? JSON.parse(stored) : [];

    const updated = all.map((req) =>
      req.influencerName === chatPartner && req.sellerName === currentUser.name
        ? { ...req, status: "Accepted" }
        : req
    );

    await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updated));
    setRequestStatus("Accepted");
    setCanSendMessages(true);
  };

  const handleDecline = async () => {
    const stored = await AsyncStorage.getItem("collaborationRequests");
    const all = stored ? JSON.parse(stored) : [];

    const updated = all.filter(
      (req) =>
        !(req.influencerName === chatPartner && req.sellerName === currentUser.name)
    );

    await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updated));
    setRequestStatus("Declined");
    setCanSendMessages(false);
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === "sent" ? styles.sentMessage : styles.receivedMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
            <AntDesign name="left" size={27} color={colors.primary} />
          </TouchableOpacity>
          <Image source={{ uri: "https://via.placeholder.com/50" }} style={styles.profileImage} />
          <Text style={styles.profileName}>{chatPartner}</Text>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          inverted
        />

        {requestStatus === "Pending" && currentUser.account_type === "Seller" && (
          <View style={styles.pendingActions}>
            <Text style={styles.pendingText}>Accept this collaboration request?</Text>
            <View style={styles.pendingButtons}>
              <TouchableOpacity style={[styles.button, { backgroundColor: "green" }]} onPress={handleAccept}>
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: "red" }]} onPress={handleDecline}>
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { opacity: canSendMessages ? 1 : 0.5 }]}
            placeholder={
              canSendMessages ? "Type a message..." : "Collab request not accepted yet..."
            }
            value={inputText}
            onChangeText={setInputText}
            editable={canSendMessages}
            placeholderTextColor={colors.subtitle}
          />
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => {}}
            disabled={!canSendMessages}
          >
            <Entypo name="images" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Animated.View
            style={{
              transform: [{ translateX: sendButtonPosition }],
              opacity: sendButtonPosition.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 0],
              }),
            }}
          >
            {(inputText.trim() !== "" || images.length > 0) && canSendMessages && (
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={handleSend}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function getDynamicStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    profileSection: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.baseContainerHeader,
      height: 150,
    },
    backArrow: { position: "absolute", top: 80, left: 30 },
    profileImage: { width: 50, height: 50, borderRadius: 25, marginTop: 50 },
    profileName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 5,
    },
    messageList: { flex: 1, paddingHorizontal: 10, marginVertical: 10 },
    messageContainer: {
      marginVertical: 10,
      padding: 10,
      borderRadius: 10,
      maxWidth: "70%",
    },
    sentMessage: {
      alignSelf: "flex-end",
      backgroundColor: colors.baseContainerFooter,
    },
    receivedMessage: {
      alignSelf: "flex-start",
      backgroundColor: colors.baseContainerBody,
    },
    messageText: { fontSize: 16, color: colors.text },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle,
      backgroundColor: colors.baseContainerHeader,
    },
    input: {
      flex: 1,
      height: 40,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.subtitle,
      borderRadius: 20,
      backgroundColor: colors.baseContainerBody,
      color: colors.text,
    },
    uploadButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
      marginRight: 10,
    },
    sendButton: {
      marginLeft: 10,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
    },
    sendButtonText: { color: colors.text, fontSize: 16 },
    pendingActions: {
      alignItems: "center",
      padding: 10,
      backgroundColor: colors.baseContainerBody,
    },
    pendingText: {
      color: colors.subtitle,
      fontSize: 15,
      marginBottom: 10,
    },
    pendingButtons: {
      flexDirection: "row",
      gap: 10,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "600",
    },
  });
}
