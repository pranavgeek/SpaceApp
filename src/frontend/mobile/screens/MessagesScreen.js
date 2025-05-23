import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { fetchMessages, BASE_URL, fetchUsers } from "../backend/db/API";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TermsOfUseManager from "../components/TermsOfUseModal";
import Swipeable from "react-native-gesture-handler/Swipeable";

const { width } = Dimensions.get("window");

// Enhanced date formatting for more natural display and shorter times
const formatMessageDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();

  // Same day - show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  // Within last week - show day name (e.g., "Mon", "Tue")
  const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  // This year - show month and day (e.g., "Mar 15")
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  // Different year - include year (e.g., "Mar 15, 2024")
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format message preview - truncate if needed, add sender prefix if received
const formatMessagePreview = (message, isFromCurrentUser) => {
  // If the message is from current user (sent), add "You: " prefix
  const prefix = isFromCurrentUser ? "You: " : "";

  // Get message content, trim whitespace
  const content = (message || "").trim();

  // Truncate if it's too long
  const maxLength = 40;
  const truncated =
    content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;

  return prefix + truncated;
};

// Improved ConversationItem component with robust image handling
const ConversationItem = ({ chat, onPress, onDelete, storedUsers }) => {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const { user } = useAuth();

  // Find the chat partner in stored users - with better error handling
  const chatPartner = useMemo(() => {
    if (!storedUsers || !Array.isArray(storedUsers) || storedUsers.length === 0) {
      console.log(`No stored users available for ${chat.chatName}`);
      return null;
    }
    return storedUsers.find(u => u.name === chat.chatName);
  }, [storedUsers, chat.chatName]);
  
  // Get profile image URL with better fallback handling
  const getProfileImageUrl = (imagePath) => {
    if (
      !imagePath ||
      typeof imagePath !== "string" ||
      imagePath.trim() === "" ||
      imagePath === "default_profile.jpg"
    ) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.chatName)}&background=random&color=fff`;
    }
  
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
  
    return `${BASE_URL}/uploads/profile/${imagePath}`;
  };

  // Determine the image source URI
  const profileImageUri = chatPartner && chatPartner.profile_image
    ? getProfileImageUrl(chatPartner.profile_image)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.chatName)}&background=random&color=fff`;

  // Render the right swipe actions (delete)
  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
        <Animated.View
          style={[
            styles.deleteActionContent,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Format message preview with appropriate prefix
  const messagePreview = formatMessagePreview(
    chat.shortMessage,
    chat.isFromCurrentUser
  );

  // Format timestamp for display
  const formattedTime = chat.timestamp ? formatMessageDate(chat.timestamp) : "";

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[styles.conversationItem, chat.isNew && styles.newConversation]}
        onPress={onPress}
      >
        {imageLoadFailed ? (
          <View style={[styles.profileImage, styles.fallbackAvatar]}>
            <Text style={styles.fallbackAvatarText}>
              {chat.chatName.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: profileImageUri }}
            style={styles.profileImage}
            onError={() => {
              console.log(`Profile image load error for: ${chat.chatName}`);
              setImageLoadFailed(true);
            }}
          />
        )}

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {chat.chatName}
            </Text>
            <Text style={[styles.timeStamp, chat.isNew && styles.newTimeStamp]}>
              {formattedTime}
            </Text>
          </View>

          <View style={styles.previewContainer}>
            <Text
              style={[
                styles.messagePreview,
                chat.isNew && styles.newMessagePreview,
              ]}
              numberOfLines={1}
            >
              {messagePreview}
            </Text>

            {chat.isNew && <View style={styles.newMessageIndicator} />}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default function MessagesScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { user: currentUser } = useAuth();

  const [messagesData, setMessagesData] = useState([]);
  const [collabRequests, setCollabRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [storedUsers, setStoredUsers] = useState([]);

  // Initial users data loading
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Try to get users from storage first
        const usersData = await AsyncStorage.getItem("users");
        let parsedUsers = [];
        
        if (usersData) {
          parsedUsers = JSON.parse(usersData);
          console.log(`Loaded ${parsedUsers.length} users from storage`);
        }
        
        // If no users in storage, fetch from API
        if (!parsedUsers || parsedUsers.length === 0) {
          console.log("No users in storage, fetching from API...");
          parsedUsers = await fetchUsers();
          
          // Cache the users
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            await AsyncStorage.setItem("users", JSON.stringify(parsedUsers));
            console.log(`Cached ${parsedUsers.length} users from API`);
          }
        }
        
        // Set the users in state
        setStoredUsers(parsedUsers);
      } catch (error) {
        console.error("Error initializing users data:", error);
      }
    };
    
    initializeData();
  }, []);

  // Load stored users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await AsyncStorage.getItem("users");
        if (usersData) {
          setStoredUsers(JSON.parse(usersData));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch data when currentUser changes
  useEffect(() => {
    if (!currentUser || !currentUser.name) return;

    fetchAllData();
  }, [currentUser]);

  // Enhanced fetchAllData function with better error handling
  const fetchAllData = async () => {
    if (!currentUser || !currentUser.name) return;

    try {
      setRefreshing(true);
      const [messages, storedRequests, usersData] = await Promise.all([
        fetchMessages(),
        AsyncStorage.getItem("collaborationRequests"),
        AsyncStorage.getItem("users"),
      ]);

      // Parse and validate users data
      let parsedUsers = [];
      try {
        if (usersData) {
          parsedUsers = JSON.parse(usersData);
          console.log(`Loaded ${parsedUsers.length} users from storage`);
        }
      } catch (error) {
        console.error("Error parsing users data:", error);
      }

      // If no users in storage or invalid data, fetch from API
      if (!parsedUsers || parsedUsers.length === 0) {
        try {
          console.log("Fetching users from API...");
          parsedUsers = await fetchUsers();
          
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            await AsyncStorage.setItem("users", JSON.stringify(parsedUsers));
            console.log(`Cached ${parsedUsers.length} users from API`);
          } else {
            console.error("API returned invalid users data");
          }
        } catch (err) {
          console.error("❌ Failed to fetch users from API:", err);
        }
      }

      // Set the users in state
      setStoredUsers(parsedUsers);

      // Parse collaboration requests
      const allRequests = storedRequests ? JSON.parse(storedRequests) : [];
      setCollabRequests(allRequests);

      // Process messages
      let updatedMessages = [...messages];

      // Add demo message for influencers if needed
      if (currentUser.account_type === "Influencer") {
        const hasPending = allRequests.find(
          (req) =>
            req.influencerName === currentUser.name &&
            req.sellerName === "Sarah Smith" &&
            req.status === "Pending"
        );

        const alreadyMessaged = messages.some(
          (msg) =>
            msg.user_from === currentUser.name && msg.user_to === "Sarah Smith"
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
    } finally {
      setRefreshing(false);
    }
  };

  const chatPartners = useMemo(() => {
    if (!currentUser || !currentUser.name) return [];

    const map = {};
    const currentUserId = String(currentUser.id || currentUser.user_id);
    const currentUserName = currentUser.name;

    messagesData.forEach((msg) => {
      // Get all possible identifiers from the message
      const fromId = String(msg.user_from || msg.sender_id || "");
      const toId = String(msg.user_to || msg.receiver_id || "");
      const fromName = String(msg.from_name || "");
      const toName = String(msg.to_name || "");

      // Check if the current user is the sender or recipient using either ID or name
      const isSender =
        fromId === currentUserId ||
        fromName === currentUserName ||
        msg.user_from === currentUserName;

      const isReceiver =
        toId === currentUserId ||
        toName === currentUserName ||
        msg.user_to === currentUserName;

      // Skip if not relevant to current user
      if (!isSender && !isReceiver) return;

      // Determine the chat partner name
      let partnerName;
      if (isSender) {
        // Current user is sender, partner is recipient
        partnerName = toName || msg.user_to || toId;
      } else {
        // Current user is recipient, partner is sender
        partnerName = fromName || msg.user_from || fromId;
      }

      // Skip if no partner name found
      if (!partnerName) return;

      // Look up the actual name if we have an ID
      if (partnerName.match(/^\d+$/)) {
        // This looks like an ID, try to find the name
        const partnerUser = (storedUsers || []).find(
          (u) =>
            String(u.user_id) === partnerName || String(u.id) === partnerName
        );

        if (partnerUser) {
          partnerName = partnerUser.name;
        }
      }

      // Get timestamp - handle different message formats
      let timestamp;
      if (msg.date_timestamp_sent) {
        timestamp = msg.date_timestamp_sent;
      } else if (msg.timestamp) {
        timestamp = msg.timestamp;
      } else {
        timestamp = new Date().toISOString(); // Fallback
      }

      // We want to keep only the most recent message for each chat partner
      const existingTimestamp = map[partnerName]?.timestamp
        ? new Date(map[partnerName].timestamp).getTime()
        : 0;
      const newTimestamp = new Date(timestamp).getTime();

      if (!map[partnerName] || newTimestamp > existingTimestamp) {
        // Check if this is a new message (less than 24 hours old and not from current user)
        const isNew =
          !isSender && // Only mark messages from others as new
          newTimestamp > Date.now() - 24 * 60 * 60 * 1000; // Less than 24 hours old

        map[partnerName] = {
          chatName: partnerName,
          shortMessage: msg.message_content || msg.content, // Handle different message formats
          time: formatMessageDate(timestamp),
          timestamp: timestamp,
          isNew: isNew,
          isFromCurrentUser: isSender,
        };
      }
    });

    // Convert to array and sort by timestamp (newest first)
    return Object.values(map).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [messagesData, currentUser]);

  // Filter chat partners based on search query
  const filteredChatPartners = useMemo(() => {
    if (!searchQuery.trim()) return chatPartners;

    const query = searchQuery.toLowerCase().trim();
    return chatPartners.filter(
      (partner) =>
        partner.chatName.toLowerCase().includes(query) ||
        partner.shortMessage.toLowerCase().includes(query)
    );
  }, [chatPartners, searchQuery]);

  const handleChatOpen = (chatName) => {
    if (currentUser.account_type !== "Seller") {
      navigation.navigate("Chat", {
        chatPartner: chatName,
        requestStatus: "Accepted",
      });
      return;
    }

    // Try to find collaboration request by name or ID
    const request = collabRequests.find(
      (req) =>
        (req.sellerName === currentUser.name &&
          req.influencerName === chatName) ||
        (String(req.sellerId) === String(currentUser.user_id) &&
          (String(req.influencerId) === chatName ||
            req.influencerName === chatName))
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

  const handleDeleteConversation = async (chatName) => {
    Alert.alert(
      "Delete Conversation",
      `Are you sure you want to delete your conversation with ${chatName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Get all messages
              const messages = await fetchMessages();

              // Get current user ID and name
              const currentUserId = String(
                currentUser.id || currentUser.user_id
              );

              // Try to find chat partner ID
              let chatPartnerId = null;
              const partnerUser = storedUsers.find((u) => u.name === chatName);
              if (partnerUser) {
                chatPartnerId = String(partnerUser.id || partnerUser.user_id);
              }

              // Filter out messages for this conversation
              const filteredMessages = messages.filter((msg) => {
                // Check sender/recipient combinations using both ID and name
                const fromId = String(msg.user_from || msg.sender_id || "");
                const toId = String(msg.user_to || msg.receiver_id || "");
                const fromName = String(msg.from_name || msg.user_from || "");
                const toName = String(msg.to_name || msg.user_to || "");

                // Check if this message is between current user and chat partner
                const isMessageInConversation =
                  // User is sender, partner is recipient
                  ((fromId === currentUserId ||
                    fromName === currentUser.name) &&
                    (toId === chatPartnerId || toName === chatName)) ||
                  // User is recipient, partner is sender
                  ((toId === currentUserId || toName === currentUser.name) &&
                    (fromId === chatPartnerId || fromName === chatName));

                // Keep messages that are NOT in this conversation
                return !isMessageInConversation;
              });

              // Save filtered messages
              await AsyncStorage.setItem(
                "messages",
                JSON.stringify(filteredMessages)
              );

              // Update state
              setMessagesData(filteredMessages);
            } catch (error) {
              console.error("Failed to delete conversation:", error);
            }
          },
        },
      ]
    );
  };

  const clearAllCollabData = async () => {
    try {
      const storedRequests = await AsyncStorage.getItem(
        "collaborationRequests"
      );
      const allRequests = storedRequests ? JSON.parse(storedRequests) : [];
      const messages = await fetchMessages();

      const filteredMessages = messages.filter((msg) => {
        const isCollabMessage = allRequests.some(
          (req) =>
            (req.influencerName === msg.user_from &&
              req.sellerName === msg.user_to) ||
            (req.influencerName === msg.user_to &&
              req.sellerName === msg.user_from)
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

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchQuery("");
    }
  };

  if (!currentUser || !currentUser.name) return null;

  return (
    <TermsOfUseManager>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />

        {/* Header */}
        <View style={styles.header}>
          {isSearching ? (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={colors.subtitle}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search messages..."
                placeholderTextColor={colors.subtitle}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={toggleSearch}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.subtitle}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.headerTitle}>Chats</Text>

              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={toggleSearch}
                >
                  <Ionicons name="search" size={22} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Reset Data",
                      "Are you sure you want to reset all collaboration data?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Reset",
                          style: "destructive",
                          onPress: clearAllCollabData,
                        },
                      ]
                    )
                  }
                  style={styles.headerButton}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color="#fff" />
          <Text style={styles.infoText}>
            All conversations must remain within the app for your safety
          </Text>
        </View>

        {/* Conversations List */}
        <FlatList
          data={filteredChatPartners}
          renderItem={({ item }) => (
            <ConversationItem
              chat={item}
              currentUser={currentUser}
              onPress={() => handleChatOpen(item.chatName)}
              onDelete={() => handleDeleteConversation(item.chatName)}
              storedUsers={storedUsers}
            />
          )}
          keyExtractor={(item, index) => `${item.chatName}-${index}`}
          contentContainerStyle={[
            styles.conversationsList,
            filteredChatPartners.length === 0 && styles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={fetchAllData}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name={searchQuery ? "magnify-close" : "message-text-outline"}
                size={80}
                color={colors.subtitle + "50"}
              />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No matching conversations"
                  : "No conversations yet"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Try a different search term"
                  : "Messages from sellers and collaborators will appear here"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </TermsOfUseManager>
  );
}

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 16,
      paddingBottom: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.subtitle + "20",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
    },
    headerButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerButton: {
      padding: 8,
      marginLeft: 8,
      borderRadius: 20,
      backgroundColor: colors.cardBackground,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 10,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 16,
      color: colors.text,
    },
    clearSearchButton: {
      padding: 4,
    },
    infoBanner: {
      backgroundColor: colors.primary,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    infoText: {
      marginLeft: 8,
      color: "#fff",
      fontSize: 13,
      flex: 1,
    },
    conversationsList: {
      flexGrow: 1,
    },
    emptyListContent: {
      flex: 1,
      justifyContent: "center",
    },
    conversationItem: {
      flexDirection: "row",
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.subtitle + "10",
    },
    newConversation: {
      backgroundColor: colors.primary + "08", // Very subtle highlight
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
    },
    profileInitials: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    conversationInfo: {
      flex: 1,
      marginLeft: 14,
      justifyContent: "center",
    },
    conversationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    chatName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1, // Take available space
      marginRight: 8,
    },
    timeStamp: {
      fontSize: 12,
      color: colors.subtitle,
    },
    newTimeStamp: {
      color: colors.primary,
      fontWeight: "500",
    },
    previewContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    messagePreview: {
      fontSize: 14,
      color: colors.subtitle,
      flex: 1,
      marginRight: 8,
    },
    newMessagePreview: {
      color: colors.text,
      fontWeight: "500",
    },
    newMessageIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    deleteAction: {
      backgroundColor: "#FF3B30",
      width: 100,
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
    },
    deleteActionContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    deleteActionText: {
      color: "#fff",
      fontSize: 13,
      marginTop: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: "center",
      marginTop: 8,
    },
    // New styles for fallback avatar
    fallbackAvatar: {
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackAvatarText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.primary,
    },
  });