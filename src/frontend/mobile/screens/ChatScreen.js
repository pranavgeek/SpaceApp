import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Pressable,
  StatusBar,
  SafeAreaView
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { fetchMessages, sendMessage } from "../backend/db/API";
import { useAuth } from "../context/AuthContext";
import { processMessage, WARNING_MESSAGE } from "../Utils/messageFilter";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";

// ErrorBoundary to catch render and lifecycle errors.
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  componentDidCatch(error, info) {
    console.error("Error caught in ErrorBoundary:", error, info);
    this.setState({ hasError: true });
  }
  render() {
    if (this.state.hasError) {
      return <Text>Something went wrong.</Text>;
    }
    return this.props.children;
  }
}

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
  const [warningVisible, setWarningVisible] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState({});
  const [processedMessages, setProcessedMessages] = useState([]);

  const sendButtonPosition = useRef(new Animated.Value(100)).current;
  const flatListRef = useRef(null);
  const swipeableRefs = useRef({});

  // Generate a profile color based on the chat partner's name.
  const getProfileColor = (name) => {
    const profileColors = ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f39c12'];
    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return profileColors[charSum % profileColors.length];
  };
  const profileColor = getProfileColor(chatPartner);

  // Get initials from name.
  const getInitials = (name) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  useEffect(() => {
    Animated.timing(sendButtonPosition, {
      toValue: (inputText.trim() !== "" || images.length > 0) ? 0 : 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [inputText, images]);

  // Helper: format date.
  const formatMessageDate = (date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    const yesterdayDate = new Date(yesterday);
    yesterdayDate.setHours(0, 0, 0, 0);
    const messageDate = new Date(date);
    const messageDateNoTime = new Date(messageDate);
    messageDateNoTime.setHours(0, 0, 0, 0);
    if (messageDateNoTime.getTime() === todayDate.getTime()) return "Today";
    if (messageDateNoTime.getTime() === yesterdayDate.getTime()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Helper: format time.
  const formatMessageTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
  };

  // Process messages to include date separators.
  const processMessagesWithDateSeparators = useCallback((messageList) => {
    if (!messageList.length) return [];
    const result = [];
    let lastDateLabel = null;
    messageList.forEach((message, index) => {
      if (lastDateLabel !== message.date) {
        result.push({ id: `date-${message.date}-${index}`, type: "date", date: message.date });
        lastDateLabel = message.date;
      }
      result.push(message);
    });
    return result;
  }, []);

  useEffect(() => {
    const processedList = processMessagesWithDateSeparators(messages);
    setProcessedMessages(processedList);
  }, [messages, processMessagesWithDateSeparators]);

  // Wrap loadMessages in try/catch to catch async errors.
  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchMessages();
      let updatedMessages = [...data];

      // Retrieve local stored users.
      const storedUsers = await AsyncStorage.getItem("users");
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const chatPartnerUser = users.find((u) => u.name === chatPartner);
      const chatPartnerType = chatPartnerUser?.account_type || null;

      // Get collaboration requests.
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const requests = stored ? JSON.parse(stored) : [];
      let request = null;
      if (currentUser.account_type === "Influencer" || currentUser.account_type === "Seller") {
        request = requests.find(
          (req) =>
            req.influencerName === (currentUser.account_type === "Influencer" ? currentUser.name : chatPartner) &&
            req.sellerName === (currentUser.account_type === "Seller" ? currentUser.name : chatPartner)
        );
      }
      if (request?.status) setRequestStatus(request.status);
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

      // Deduplicate messages.
      const uniqueMessagesMap = {};
      updatedMessages.forEach((msg) => {
        if (!uniqueMessagesMap[msg.message_id]) {
          uniqueMessagesMap[msg.message_id] = msg;
        }
      });
      const deduplicatedMessages = Object.values(uniqueMessagesMap);

      // Filter and format messages.
      const filtered = deduplicatedMessages
        .filter(
          (msg) =>
            (msg.user_from === currentUser.name && msg.user_to === chatPartner) ||
            (msg.user_to === currentUser.name && msg.user_from === chatPartner)
        )
        .map((msg) => {
          const messageDate = new Date(msg.date_timestamp_sent || msg.timestamp || Date.now());
          return {
            id: msg.message_id.toString(),
            text: msg.message_content || msg.content,
            type: msg.user_from === currentUser.name ? "sent" : "received",
            isFiltered: false,
            timestamp: formatMessageTime(messageDate),
            date: formatMessageDate(messageDate),
            fullDate: messageDate,
          };
        })
        .sort((a, b) => a.fullDate - b.fullDate);

      setMessages(filtered);

      // Access control for message sending.
      if (currentUser.account_type === "Buyer") {
        setCanSendMessages(true);
      } else if (currentUser.account_type === "Seller") {
        if (chatPartnerType === "Influencer" && requestStatus === "Accepted") {
          setCanSendMessages(true);
        } else if (chatPartnerType === "Buyer") {
          setCanSendMessages(true);
        } else if (requestStatus === "Pending") {
          setCanSendMessages(false);
        }
      } else if (currentUser.account_type === "Influencer") {
        setCanSendMessages(true);
      }
    } catch (error) {
      console.error("Error in loadMessages:", error);
      // Optionally show an alert so users know something went wrong.
      Alert.alert("Error", "Failed to load messages.");
    }
  }, [chatPartner, currentUser, requestStatus]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    if (inputText.trim()) {
      const { filteredMessage, isFiltered } = processMessage(inputText);
      if (isFiltered) {
        setWarningVisible(true);
        setTimeout(() => setWarningVisible(false), 3000);
      }
      const timestamp = new Date();
      const newMessage = {
        id: timestamp.getTime().toString(),
        text: filteredMessage,
        type: "sent",
        isFiltered,
        timestamp: formatMessageTime(timestamp),
        date: formatMessageDate(timestamp),
        fullDate: timestamp,
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputText("");
      await saveMessage(filteredMessage, timestamp);
      setTimeout(() => {
        if (flatListRef.current && flatListRef.current.scrollToEnd) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  };

  const saveMessage = async (text, timestamp) => {
    try {
      const newMessage = {
        user_from: currentUser.name,
        user_to: chatPartner,
        type_message: "text",
        message_content: text,
        date_timestamp_sent: timestamp.toISOString(),
      };
      console.log("📤 Sending message to backend");
      await sendMessage(newMessage);
      console.log("✅ Message sent");
    } catch (error) {
      console.error("Failed to save message:", error);
      Alert.alert("Error", "Could not send message. Please try again.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      if (swipeableRefs.current[messageId]) {
        swipeableRefs.current[messageId].close();
      }
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId));
      const stored = await AsyncStorage.getItem("messages");
      const all = stored ? JSON.parse(stored) : [];
      const filteredMessages = all.filter((msg) => msg.message_id.toString() !== messageId);
      await AsyncStorage.setItem("messages", JSON.stringify(filteredMessages));
    } catch (error) {
      console.error("Failed to delete message:", error);
      loadMessages();
    }
  };

  const handleAccept = async () => {
    try {
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
    } catch (error) {
      console.error("Error in handleAccept:", error);
    }
  };

  const handleDecline = async () => {
    try {
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const all = stored ? JSON.parse(stored) : [];
      const updated = all.filter(
        (req) => !(req.influencerName === chatPartner && req.sellerName === currentUser.name)
      );
      await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updated));
      setRequestStatus("Declined");
      setCanSendMessages(false);
    } catch (error) {
      console.error("Error in handleDecline:", error);
    }
  };

  const handleMessageLongPress = (message) => {
    if (isSelecting) {
      handleMessageSelect(message);
    } else {
      setIsSelecting(true);
      setSelectedMessages({ [message.id]: true });
    }
  };

  const handleMessageSelect = (message) => {
    setSelectedMessages((prev) => {
      const newSelected = { ...prev };
      if (newSelected[message.id]) {
        delete newSelected[message.id];
        if (Object.keys(newSelected).length === 0) {
          setIsSelecting(false);
        }
      } else {
        newSelected[message.id] = true;
      }
      return newSelected;
    });
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
    setSelectedMessages({});
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(selectedMessages);
    if (!selectedIds.length) return;
    Alert.alert(
      "Delete Messages",
      `Delete ${selectedIds.length} message${selectedIds.length > 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedMessages = messages.filter((msg) => !selectedMessages[msg.id]);
              setMessages(updatedMessages);
              const stored = await AsyncStorage.getItem("messages");
              const all = stored ? JSON.parse(stored) : [];
              const filteredMessages = all.filter(
                (msg) => !selectedIds.includes(msg.message_id?.toString())
              );
              await AsyncStorage.setItem("messages", JSON.stringify(filteredMessages));
              setIsSelecting(false);
              setSelectedMessages({});
            } catch (error) {
              console.error("Failed to delete messages:", error);
              loadMessages();
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={() => handleDeleteMessage(item.id)}>
        <Animated.View style={[styles.deleteActionContent, { transform: [{ translateX: trans }] }]}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{item.date}</Text>
        </View>
      );
    }
    const canSwipe = item.type === "sent";
    const MessageContent = () => (
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: item.type === "sent" ? "flex-end" : "flex-start",
        }}
      >
        <Pressable
          onLongPress={() => handleMessageLongPress(item)}
          delayLongPress={300}
          onPress={() => (isSelecting ? handleMessageSelect(item) : null)}
          style={[
            styles.messageContainer,
            item.type === "sent" ? styles.sentMessage : styles.receivedMessage,
            item.isFiltered && styles.filteredMessage,
            isSelecting && selectedMessages[item.id] && styles.selectedMessage,
          ]}
        >
          {isSelecting && (
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  selectedMessages[item.id] && styles.checkboxSelected,
                ]}
              >
                {selectedMessages[item.id] && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </View>
          )}
          <Text style={styles.messageText}>{item.text}</Text>
          <View style={styles.messageFooter}>
            <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
            {item.isFiltered && <Text style={styles.filteredWarning}>Filtered</Text>}
          </View>
        </Pressable>
      </View>
    );
    if (canSwipe && !isSelecting) {
      return (
        <Swipeable
          ref={(ref) => (swipeableRefs.current[item.id] = ref)}
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
          overshootRight={false}
        >
          <MessageContent />
        </Swipeable>
      );
    }
    return <MessageContent />;
  };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
        >
          <StatusBar barStyle="light-content" />
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <SafeAreaView>
                <View style={styles.headerContent}>
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.profilePreview}>
                    <View style={[styles.profileImage, { backgroundColor: profileColor }]}>
                      <Text style={styles.profileInitials}>{getInitials(chatPartner)}</Text>
                    </View>
                    <View style={styles.nameContainer}>
                      <Text style={styles.profileName} numberOfLines={1}>
                        {chatPartner}
                      </Text>
                      <Text style={styles.onlineStatus}>Online</Text>
                    </View>
                  </View>
                  {isSelecting ? (
                    <View style={styles.selectionActions}>
                      <TouchableOpacity style={styles.selectionActionButton} onPress={handleCancelSelection}>
                        <Ionicons name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.selectionActionButton}
                        onPress={handleDeleteSelected}
                        disabled={Object.keys(selectedMessages).length === 0}
                      >
                        <Ionicons name="trash-outline" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.menuButton} onPress={() => {}}>
                      <MaterialIcons name="more-vert" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </SafeAreaView>
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  For your safety, please keep all conversations within the app.
                </Text>
              </View>
            </View>
            {warningVisible && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={18} color="#fff" />
                <Text style={styles.warningText}>{WARNING_MESSAGE}</Text>
              </View>
            )}
            <FlatList
              ref={flatListRef}
              data={processedMessages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              initialNumToRender={20}
              onContentSizeChange={() => {
                if (processedMessages.length > 0 && flatListRef.current && flatListRef.current.scrollToEnd) {
                  flatListRef.current.scrollToEnd({ animated: false });
                }
              }}
            />
            {requestStatus === "Pending" && currentUser.account_type === "Seller" && (
              <View style={styles.pendingActions}>
                <Text style={styles.pendingText}>Accept this collaboration request?</Text>
                <View style={styles.pendingButtons}>
                  <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAccept}>
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={handleDecline}>
                    <Text style={styles.actionButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { opacity: canSendMessages ? 1 : 0.5 }]}
                  placeholder={
                    canSendMessages ? "Type a message..." : "Collab request not accepted yet..."
                  }
                  value={inputText}
                  onChangeText={setInputText}
                  editable={canSendMessages}
                  placeholderTextColor={colors.subtitle}
                  multiline
                />
                <TouchableOpacity style={styles.attachButton} onPress={() => {}} disabled={!canSendMessages}>
                  <Ionicons name="attach" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {inputText.trim() !== "" && canSendMessages ? (
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.micButton} onPress={() => {}} disabled={!canSendMessages}>
                  <Ionicons name="mic" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

function getDynamicStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 16,
      height: Platform.OS === "ios" ? 50 : 60,
    },
    backButton: {
      padding: 4,
      marginRight: 8,
    },
    profilePreview: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    nameContainer: {
      flex: 1,
      justifyContent: "center",
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    profileInitials: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    profileName: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    onlineStatus: {
      color: "#fff",
      fontSize: 12,
      opacity: 0.8,
    },
    menuButton: {
      padding: 4,
    },
    selectionActions: {
      flexDirection: "row",
    },
    selectionActionButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    infoBanner: {
      backgroundColor: colors.primary + "CC",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    infoText: {
      color: "#fff",
      fontSize: 12,
      textAlign: "center",
    },
    warningBanner: {
      backgroundColor: "#FF3B30",
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    warningText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 8,
    },
    messageList: {
      flex: 1,
    },
    messageListContent: {
      padding: 10,
      paddingBottom: 20,
    },
    dateHeader: {
      alignItems: "center",
      marginVertical: 10,
    },
    dateHeaderText: {
      backgroundColor: colors.subtitle + "30",
      color: colors.text,
      fontSize: 12,
      fontWeight: "500",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      overflow: "hidden",
      textAlign: "center",
    },
    messageContainer: {
      marginVertical: 4,
      padding: 12,
      borderRadius: 18,
      maxWidth: "80%",
      minWidth: 60,
    },
    sentMessage: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary + "20",
      borderBottomRightRadius: 4,
    },
    receivedMessage: {
      alignSelf: "flex-start",
      backgroundColor: colors.cardBackground,
      borderBottomLeftRadius: 4,
    },
    filteredMessage: {
      borderWidth: 1,
      borderColor: "#FF3B30",
    },
    selectedMessage: {
      backgroundColor: colors.primary + "40",
      borderWidth: 2,
      borderColor: colors.primary,
    },
    checkboxContainer: {
      position: "absolute",
      top: -8,
      left: -8,
      zIndex: 1,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: "white",
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
    },
    messageText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 22,
    },
    messageFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 5,
      alignItems: "center",
    },
    messageTimestamp: {
      fontSize: 10,
      color: colors.subtitle,
    },
    filteredWarning: {
      fontSize: 10,
      color: "#FF3B30",
      fontStyle: "italic",
    },
    deleteAction: {
      backgroundColor: "#FF3B30",
      justifyContent: "center",
      alignItems: "center",
      width: 80,
      marginVertical: 4,
      borderRadius: 18,
    },
    deleteActionContent: {
      justifyContent: "center",
      alignItems: "center",
    },
    pendingActions: {
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.baseContainerBody,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle + "20",
    },
    pendingText: {
      color: colors.text,
      fontSize: 15,
      marginBottom: 12,
    },
    pendingButtons: {
      flexDirection: "row",
    },
    actionButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      minWidth: 100,
      alignItems: "center",
    },
    acceptButton: {
      backgroundColor: "#34C759",
    },
    declineButton: {
      backgroundColor: "#FF3B30",
    },
    actionButtonText: {
      color: "#fff",
      fontWeight: "600",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle + "20",
    },
    inputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      paddingHorizontal: 12,
      marginRight: 8,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      color: colors.text,
      paddingVertical: 8,
    },
    attachButton: {
      padding: 4,
    },
    sendButton: {
      backgroundColor: colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    micButton: {
      backgroundColor: colors.cardBackground,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
