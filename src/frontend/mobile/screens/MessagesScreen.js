import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Message from '../components/Message';
import { useTheme } from '../theme/ThemeContext';
import { fetchMessages } from '../backend/db/API';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { user: currentUser } = useAuth();

  const [messagesData, setMessagesData] = useState([]);
  const [collabRequests, setCollabRequests] = useState([]);

  useEffect(() => {
    if (!currentUser || !currentUser.name) return;

    const fetchAllData = async () => {
      try {
        const [messages, storedRequests] = await Promise.all([
          fetchMessages(),
          AsyncStorage.getItem("collaborationRequests")
        ]);

        const allRequests = storedRequests ? JSON.parse(storedRequests) : [];
        setCollabRequests(allRequests);

        let updatedMessages = [...messages];

        if (currentUser.account_type === "Influencer") {
          const hasPending = allRequests.find(
            (req) =>
              req.influencerName === currentUser.name &&
              req.sellerName === "Sarah Smith" &&
              req.status === "Pending"
          );

          const alreadyMessaged = messages.some(
            (msg) =>
              msg.user_from === currentUser.name &&
              msg.user_to === "Sarah Smith"
          );

          if (hasPending && !alreadyMessaged) {
            updatedMessages.push({
              message_id: 999,
              user_from: currentUser.name,
              user_to: "Sarah Smith",
              type_message: "text",
              message_content: "Hi Sarah, I'd love to collaborate!",
              date_timestamp_sent: new Date().toISOString(),
            });
          }
        }

        setMessagesData(updatedMessages);
      } catch (error) {
        console.error("Error loading messages or requests:", error);
      }
    };

    fetchAllData();
  }, [currentUser]);

  const chatPartners = useMemo(() => {
    const map = {};

    messagesData.forEach((msg, index) => {
      const isSender = msg.user_from === currentUser.name;
      const isReceiver = msg.user_to === currentUser.name;

      if (!isSender && !isReceiver) return;

      const partnerName = isSender ? msg.user_to : msg.user_from;
      const key = `${partnerName}-${index}`;

      if (!map[partnerName]) {
        map[partnerName] = {
          chatName: partnerName,
          shortMessage: msg.message_content,
          time: new Date(msg.date_timestamp_sent).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      }
    });

    return map;
  }, [messagesData, currentUser.name]);

  const handleChatOpen = (chatName) => {
    if (currentUser.account_type !== "Seller") {
      navigation.navigate("Chat", {
        chatPartner: chatName,
        requestStatus: "Accepted",
      });
      return;
    }

    const request = collabRequests.find(
      (req) =>
        req.sellerName === currentUser.name &&
        req.influencerName === chatName
    );

    let requestStatus = "Accepted";
    if (request) {
      requestStatus = request.status;
    }

    navigation.navigate("Chat", {
      chatPartner: chatName,
      requestStatus,
    });
  };

  const clearAllCollabData = async () => {
    try {
      const storedRequests = await AsyncStorage.getItem("collaborationRequests");
      const allRequests = storedRequests ? JSON.parse(storedRequests) : [];
      const messages = await fetchMessages();

      const filteredMessages = messages.filter(msg => {
        const isCollabMessage = allRequests.some(
          req => 
            (req.influencerName === msg.user_from && req.sellerName === msg.user_to) ||
            (req.influencerName === msg.user_to && req.sellerName === msg.user_from)
        );

        return !isCollabMessage;
      });

      await AsyncStorage.setItem("messages", JSON.stringify(filteredMessages));
      await AsyncStorage.removeItem("collaborationRequests");
      setMessagesData(filteredMessages);
      setCollabRequests([]);
    } catch (error) {
      console.error("Failed to clear collab data:", error);
    }
  };

  if (!currentUser || !currentUser.name) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        {Object.values(chatPartners).length > 0 ? (
          Object.values(chatPartners).map((chat, index) => (
            <Message
              key={`${chat.chatName}-${index}`}
              chatName={chat.chatName}
              shortMessage={chat.shortMessage}
              time={chat.time}
              onPress={() => handleChatOpen(chat.chatName)}
            />
          ))
        ) : (
          <Text style={{ color: colors.subtitle, textAlign: 'center', marginTop: 30 }}>
            No messages yet.
          </Text>
        )}
      </View>

      {currentUser.account_type === "Seller" && (
        <TouchableOpacity
          onPress={clearAllCollabData}
          style={{
            alignSelf: 'center',
            marginVertical: 20,
            padding: 12,
            backgroundColor: "#FF3B30",
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="trash-outline" size={18} color="white" style={{ marginRight: 6 }} />
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Reset Collaboration Data</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const getDynamicStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 5,
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});