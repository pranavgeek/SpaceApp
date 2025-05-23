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
  Image,
  KeyboardAvoidingView,
  Alert,
  Pressable,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import {
  fetchMessages,
  sendMessage,
  deleteMessageById,
} from "../backend/db/API";
import {
  fetchCollaborationRequests,
  updateCollaborationStatus,
} from "../backend/db/API";
import { useAuth } from "../context/AuthContext";
import { processMessage, WARNING_MESSAGE } from "../Utils/messageFilter";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

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
  const {
    chatPartner,
    recipientName,
    requestStatus: initialRequestStatus,
    fromCollaborationModal,
  } = route.params || {};

  const { user: currentUser } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState([]);
  const [canSendMessages, setCanSendMessages] = useState(true); // Initially allow, adjusted in useEffect
  const [requestStatus, setRequestStatus] = useState(
    fromCollaborationModal ? "Pending" : initialRequestStatus || null
  );
  const [warningVisible, setWarningVisible] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState({});
  const [processedMessages, setProcessedMessages] = useState([]);
  const [hasHandledAccept, setHasHandledAccept] = useState(false);

  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [chatPartnerImageUri, setChatPartnerImageUri] = useState(null);
  const [chatPartnerData, setChatPartnerData] = useState(null);

  const sendButtonPosition = useRef(new Animated.Value(100)).current;
  const flatListRef = useRef(null);
  const swipeableRefs = useRef({});

  //Profile image URI generation
  useEffect(() => {
    const fetchChatPartnerProfile = async () => {
      try {
        // Try to get users from AsyncStorage
        const storedUsers = await AsyncStorage.getItem("users");
        if (!storedUsers) {
          console.log("No stored users found");
          return;
        }
  
        const users = JSON.parse(storedUsers);
        if (!Array.isArray(users) || users.length === 0) {
          console.log("No users in the stored data");
          return;
        }
  
        // Try to find the chat partner by name or ID
        const partner = users.find(user => {
          if (typeof chatPartner === 'string') {
            return user.name === chatPartner || 
                   String(user.user_id) === chatPartner || 
                   String(user.id) === chatPartner;
          }
          return false;
        });
  
        if (partner) {
          console.log(`Found chat partner in stored users: ${partner.name}`);
          setChatPartnerData(partner);
          
          // Generate the profile image URI
          let imageUri = null;
          
          if (partner.profile_image) {
            // Handle default profile image case
            if (partner.profile_image === 'default_profile.jpg') {
              imageUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=random&color=fff`;
            } 
            // Handle URLs
            else if (partner.profile_image.startsWith('http://') || partner.profile_image.startsWith('https://')) {
              imageUri = partner.profile_image;
            } 
            // Handle server paths
            else if (typeof partner.profile_image === 'string' && partner.profile_image.trim() !== '') {
              imageUri = `${BASE_URL}/uploads/profile/${partner.profile_image}`;
            }
          }
          
          // If no valid image URL was generated, use UI Avatars
          if (!imageUri) {
            imageUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=random&color=fff`;
          }
          
          console.log(`Setting chat partner image URI: ${imageUri}`);
          setChatPartnerImageUri(imageUri);
        } else {
          console.log(`Chat partner "${chatPartner}" not found in stored users`);
          
          // Use UI Avatars as fallback
          const fallbackUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatPartner || 'User')}&background=random&color=fff`;
          setChatPartnerImageUri(fallbackUri);
        }
      } catch (error) {
        console.error("Error fetching chat partner profile:", error);
        
        // Use UI Avatars as fallback on error
        const fallbackUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatPartner || 'User')}&background=random&color=fff`;
        setChatPartnerImageUri(fallbackUri);
      }
    };
  
    if (chatPartner) {
      fetchChatPartnerProfile();
    }
  }, [chatPartner]);

  useEffect(() => {
    const checkIfAccepted = async () => {
      try {
        // First check local storage
        const key = getCollaborationStatusKey();
        const status = await AsyncStorage.getItem(key);
        if (status === "Accepted") {
          console.log("Found ACCEPTED status in AsyncStorage");
          setHasHandledAccept(true);
          setRequestStatus("Accepted");
          setCanSendMessages(true);
        } else {
          // Then check backend
          const requests = await fetchCollaborationRequests();
          const matchingRequest = requests.find(
            (req) =>
              (String(req.sellerId) === String(currentUser.user_id) &&
                (String(req.influencerId) === String(chatPartner) ||
                  req.influencerName === chatPartner)) ||
              (String(req.influencerId) === String(currentUser.user_id) &&
                (String(req.sellerId) === String(chatPartner) ||
                  req.sellerName === chatPartner))
          );

          if (matchingRequest && matchingRequest.status === "Accepted") {
            console.log("Found ACCEPTED status in backend");
            setHasHandledAccept(true);
            setRequestStatus("Accepted");
            setCanSendMessages(true);
          }
        }
      } catch (error) {
        console.error("Error checking accepted status:", error);
      }
    };

    checkIfAccepted();
  }, [currentUser.user_id, chatPartner]);

  useEffect(() => {
    const checkForCollaborationRequest = async () => {
      try {
        console.log("Checking for collaboration requests...");
        // Get all collaboration requests
        const requests = await fetchCollaborationRequests();
        console.log(`Fetched ${requests.length} collaboration requests`);

        // Look for a request involving these users
        const foundRequest = requests.find((req) => {
          // Seller receiving request from influencer
          const isSellerReceivingRequest =
            currentUser.account_type === "Seller" &&
            String(req.sellerId) === String(currentUser.user_id) &&
            (String(req.influencerId) === String(chatPartner) ||
              req.influencerName === chatPartner);

          return isSellerReceivingRequest;
        });

        if (foundRequest) {
          console.log("Found matching collaboration request:", foundRequest);
          // Override the status if a request was found
          setRequestStatus(foundRequest.status);
          return;
        }

        // If no request found but this is from collab modal, keep it as Pending
        if (fromCollaborationModal) {
          console.log(
            "No request found, but fromCollaborationModal is true. Setting to Pending."
          );
          setRequestStatus("Pending");
        }

        // Check if there's a collaboration message from influencer
        if (currentUser.account_type === "Seller") {
          try {
            const allMessages = await fetchMessages();
            // Find messages from this partner about collaboration
            const collaborationMessage = allMessages.find(
              (msg) =>
                (String(msg.user_from) === String(chatPartner) ||
                  String(msg.sender_id) === String(chatPartner) ||
                  String(msg.from_name) === chatPartner) &&
                msg.message_content &&
                msg.message_content.toLowerCase().includes("collaborat")
            );

            if (collaborationMessage) {
              console.log(
                "Found collaboration message, setting status to Pending"
              );
              setRequestStatus("Pending");
            }
          } catch (error) {
            console.error("Error checking messages:", error);
          }
        }
      } catch (error) {
        console.error("Error checking collaboration requests:", error);
      }
    };

    checkForCollaborationRequest();
  }, [currentUser, chatPartner]);

  const getProfileColor = (name) => {
    const profileColors = [
      "#1abc9c",
      "#3498db",
      "#9b59b6",
      "#e74c3c",
      "#f39c12",
    ];

    // Thorough safety check
    if (name === undefined || name === null || typeof name !== "string") {
      console.log(`Warning: Invalid name in getProfileColor: ${typeof name}`);
      return profileColors[0]; // Return the first color as default
    }

    try {
      // Split and reduce safely with additional error handling
      const charSum = name
        .split("")
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return profileColors[charSum % profileColors.length];
    } catch (error) {
      console.log(`Error in getProfileColor: ${error.message}`);
      return profileColors[0]; // Safe fallback on any error
    }
  };

  // Fixed getInitials function with robust error handling
  const getInitials = (name) => {
    // Thorough safety check
    if (name === undefined || name === null || typeof name !== "string") {
      console.log(`Warning: Invalid name in getInitials: ${typeof name}`);
      return "?"; // Return a question mark for unknown names
    }

    try {
      // Handle name safely with additional error handling
      return (
        name
          .split(" ")
          .map((n) => (n && n[0] ? n[0] : ""))
          .join("")
          .toUpperCase() || "?"
      ); // Fallback to "?" if result is empty
    } catch (error) {
      console.log(`Error in getInitials: ${error.message}`);
      return "?"; // Safe fallback on any error
    }
  };

  // Add a safety check when using these functions
  const safePartnerName = chatPartner || "Unknown";
  const profileColor = getProfileColor(safePartnerName);

  useEffect(() => {
    Animated.timing(sendButtonPosition, {
      toValue: inputText.trim() !== "" || images.length > 0 ? 0 : 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [inputText, images]);

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
    if (messageDateNoTime.getTime() === yesterdayDate.getTime())
      return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMessageTime = (date) => {
    return date
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  };

  const processMessagesWithDateSeparators = useCallback((messageList) => {
    if (!messageList.length) return [];
    const result = [];
    let lastDateLabel = null;
    messageList.forEach((message, index) => {
      if (lastDateLabel !== message.date) {
        result.push({
          id: `date-${message.date}-${index}`,
          type: "date",
          date: message.date,
        });
        lastDateLabel = message.date;
      }
      result.push(message);
    });
    return result;
  }, []);

  const findCollaborationRequest = useCallback(async () => {
    try {
      console.log(
        "Finding collaboration request between",
        currentUser.user_id,
        "and",
        chatPartner
      );
      const requests = await fetchCollaborationRequests();
      console.log("Fetched collaboration requests:", requests);

      const matchedRequest = requests.find((req) => {
        const sellerMatch =
          String(req.sellerId) === String(currentUser.user_id) &&
          (String(req.influencerId) === String(chatPartner) ||
            req.influencerName === chatPartner);

        const influencerMatch =
          String(req.influencerId) === String(currentUser.user_id) &&
          (String(req.sellerId) === String(chatPartner) ||
            req.sellerName === chatPartner);

        return sellerMatch || influencerMatch;
      });

      if (matchedRequest) {
        console.log("Found matching request:", matchedRequest);
        setRequestStatus(matchedRequest.status);
        return matchedRequest.status;
      }

      return null;
    } catch (error) {
      console.error("Failed to fetch collab request:", error);
      return null;
    }
  }, [chatPartner, currentUser.user_id]);

  // Improved key generation
  const getCollaborationStatusKey = useCallback(() => {
    // Always use string IDs
    let sellerId, influencerId;

    if (currentUser.account_type === "Seller") {
      sellerId = String(currentUser.user_id || "");
      // chatPartner could be either an ID or a name
      influencerId = String(chatPartner || "");
    } else {
      // currentUser is Influencer or other
      influencerId = String(currentUser.user_id || "");
      sellerId = String(chatPartner || "");
    }

    // Format: collab_status_SELLERID_INFLUENCERID
    const key = `collab_status_${sellerId}_${influencerId}`;
    console.log(
      `Generated status key: ${key} (Seller: ${sellerId}, Influencer: ${influencerId})`
    );
    return key;
  }, [currentUser.user_id, currentUser.account_type, chatPartner]);

  // Enhanced saveCollaborationStatus function with better error handling
  const saveCollaborationStatus = useCallback(
    async (status) => {
      try {
        const key = getCollaborationStatusKey();
        console.log(`Saving collaboration status: ${status} with key: ${key}`);

        // Also update the API
        try {
          console.log(`Updating status in API: ${status}`);
          await updateCollaborationStatus(
            currentUser.user_id,
            chatPartner,
            status
          );
        } catch (apiError) {
          console.error(
            `API update failed, continuing with local save: ${apiError.message}`
          );
        }

        // Save locally regardless of API result
        await AsyncStorage.setItem(key, status);
        console.log(`✅ Successfully saved status: ${status}`);

        // Return true to indicate success
        return true;
      } catch (error) {
        console.error(`❌ Error saving collaboration status: ${error.message}`);
        // Return false to indicate failure
        return false;
      }
    },
    [getCollaborationStatusKey, currentUser.user_id, chatPartner]
  );

  // Enhanced loadCollaborationStatus function with fallbacks
  const loadCollaborationStatus = useCallback(async () => {
    try {
      const key = getCollaborationStatusKey();
      console.log(`Loading collaboration status with key: ${key}`);

      // Try to load from AsyncStorage
      const status = await AsyncStorage.getItem(key);

      if (status) {
        console.log(`✅ Found saved status: ${status}`);
        return status;
      }

      // If not found in AsyncStorage, try the API
      console.log("No status in AsyncStorage, checking API...");
      try {
        const requests = await fetchCollaborationRequests();
        console.log(`Fetched ${requests.length} collaboration requests`);

        const matchedRequest = requests.find((req) => {
          const sellerMatch =
            String(req.sellerId) === String(currentUser.user_id) &&
            (String(req.influencerId) === String(chatPartner) ||
              req.influencerName === chatPartner);

          const influencerMatch =
            String(req.influencerId) === String(currentUser.user_id) &&
            (String(req.sellerId) === String(chatPartner) ||
              req.sellerName === chatPartner);

          return sellerMatch || influencerMatch;
        });

        if (matchedRequest) {
          console.log(
            `Found request in API with status: ${matchedRequest.status}`
          );
          // Also save it for future use
          await AsyncStorage.setItem(key, matchedRequest.status);
          return matchedRequest.status;
        }
      } catch (apiError) {
        console.error(`API check failed: ${apiError.message}`);
      }

      // If we reach here, nothing was found
      console.log("No collaboration status found");
      return null;
    } catch (error) {
      console.error(`❌ Error loading collaboration status: ${error.message}`);
      return null;
    }
  }, [getCollaborationStatusKey, currentUser.user_id, chatPartner]);

  // Modified initialization effect with priority to route params
  useEffect(() => {
    const initializeChat = async () => {
      console.log("=== INITIALIZING CHAT ===");
      console.log("Route params:", route.params);
      console.log("Current user:", currentUser);

      try {
        // STEP 1: Check the direct route parameters first - highest priority
        if (route.params?.initialRequestStatus === "Accepted") {
          console.log(`📌 Setting status from ROUTE PARAM ACCEPTED`);
          setRequestStatus("Accepted");
          setCanSendMessages(true);

          // Update backend to match the accepted status
          console.log("Updating backend to match ACCEPTED status");
          try {
            await updateCollaborationStatus(
              currentUser.user_id,
              chatPartner,
              "Accepted"
            );
          } catch (updateError) {
            console.error(
              "Error syncing ACCEPTED status to backend:",
              updateError
            );
          }
          await loadMessages();
          return;
        }

        // STEP 2: Check backend status - second highest priority
        console.log("Checking backend collaboration status...");
        try {
          const requests = await fetchCollaborationRequests();
          console.log(
            `Fetched ${requests.length} collaboration requests from backend`
          );

          // Find a matching request - check both directions
          let matchingRequest = null;

          // First check exact match with seller/influencer IDs
          matchingRequest = requests.find(
            (req) =>
              String(req.sellerId) === String(currentUser.user_id) &&
              (String(req.influencerId) === String(chatPartner) ||
                req.influencerName === chatPartner)
          );

          // If not found, try the reverse
          if (!matchingRequest) {
            matchingRequest = requests.find(
              (req) =>
                String(req.influencerId) === String(currentUser.user_id) &&
                (String(req.sellerId) === String(chatPartner) ||
                  req.sellerName === chatPartner)
            );
          }

          if (matchingRequest) {
            console.log(
              `📌 Found status in BACKEND: ${matchingRequest.status}`
            );

            // If the backend status is "Accepted", it takes priority over everything else
            if (matchingRequest && matchingRequest.status === "Accepted") {
              console.log(
                "📊 Backend status is ACCEPTED - using this as source of truth"
              );
              setHasHandledAccept(true);
              setRequestStatus("Accepted");
              setCanSendMessages(true);
              await loadMessages();
              return; // Exit early
            }

            // For other statuses, continue processing
            setRequestStatus(matchingRequest.status);

            if (matchingRequest.status === "Declined") {
              setCanSendMessages(false);
            } else if (matchingRequest.status === "Pending") {
              setCanSendMessages(currentUser.account_type !== "Seller");
            }
          } else {
            console.log("No matching request found in backend");
          }
        } catch (backendError) {
          console.error("Error fetching backend status:", backendError);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      }

      console.log("=== CHAT INITIALIZATION COMPLETE ===");
    };

    initializeChat();
  }, [
    currentUser,
    chatPartner,
    loadMessages,
    fromCollaborationModal,
    route.params,
  ]);

  // Debug log for button rendering conditions
  useEffect(() => {
    // Directly log the current condition for accept/decline buttons
    const showButtons =
      currentUser.account_type === "Seller" &&
      requestStatus === "Pending" &&
      !hasHandledAccept;

    console.log(
      `RENDER CHECK: Should show accept/decline buttons? ${showButtons}`
    );
    console.log(
      `- currentUser.account_type is "${currentUser.account_type}" (should be "Seller")`
    );
    console.log(`- requestStatus is "${requestStatus}" (should be "Pending")`);
    console.log(
      `- hasHandledAccept is ${hasHandledAccept} (should be false to show buttons)`
    );
    console.log(
      `- typeof requestStatus is ${typeof requestStatus} (should be "string")`
    );
    // Directly set local storage for troubleshooting if needed
    if (
      currentUser.account_type === "Seller" &&
      !showButtons &&
      requestStatus !== "Accepted"
    ) {
      console.log("TROUBLESHOOTING: Seller without pending status detected");
    }
  }, [currentUser.account_type, requestStatus, hasHandledAccept]);

  useEffect(() => {
    const processedList = processMessagesWithDateSeparators(messages);
    setProcessedMessages(processedList);
  }, [messages, processMessagesWithDateSeparators]);

  const loadMessages = useCallback(async () => {
    try {
      console.log(
        "ChatScreen - Loading messages between:",
        currentUser.name,
        "and",
        chatPartner
      );

      let allMessages = [];
      try {
        const backendMessages = await fetchMessages();
        console.log(`Fetched ${backendMessages.length} messages from backend`);
        allMessages = [...backendMessages];
      } catch (apiError) {
        console.warn(
          `Backend API error: ${apiError.message}. Will try local storage only.`
        );
      }

      try {
        const stored = await AsyncStorage.getItem("messages");
        const localMessages = stored ? JSON.parse(stored) : [];
        console.log(`Found ${localMessages.length} messages in local storage`);
        const messageIds = new Set(
          allMessages.map((msg) => msg.message_id || msg.id)
        );
        const uniqueLocalMessages = localMessages.filter(
          (msg) => !messageIds.has(msg.message_id || msg.id)
        );
        allMessages = [...allMessages, ...uniqueLocalMessages];
        console.log(`Combined total: ${allMessages.length} messages`);
      } catch (storageError) {
        console.error(
          "Error fetching messages from local storage:",
          storageError
        );
      }

      const currentUserId = String(currentUser.id || currentUser.user_id);
      const currentUserName = currentUser.name;
      let chatPartnerId = null;
      let chatPartnerName = chatPartner;

      const storedUsers = await AsyncStorage.getItem("users");
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const partnerByName = users.find((u) => u.name === chatPartner);
        if (partnerByName) {
          chatPartnerId = String(partnerByName.id || partnerByName.user_id);
          chatPartnerName = partnerByName.name;
        } else {
          const partnerById = users.find(
            (u) =>
              String(u.user_id) === String(chatPartner) ||
              String(u.id) === String(chatPartner)
          );
          if (partnerById) {
            chatPartnerId = String(partnerById.id || partnerById.user_id);
            chatPartnerName = partnerById.name;
          } else {
            chatPartnerId = chatPartner;
          }
        }
      }

      console.log("Current user:", {
        id: currentUserId,
        name: currentUserName,
      });
      console.log("Chat partner:", {
        id: chatPartnerId,
        name: chatPartnerName,
      });

      // *CRITICAL*: Ensure chatPartnerId is always populated!
      chatPartnerId = chatPartnerId || chatPartner; // Fallback to name if ID is null

      const relevantMessages = allMessages.filter((msg) => {
        const fromId = String(msg.user_from || msg.sender_id || "");
        const toId = String(msg.user_to || msg.receiver_id || "");
        const fromName = String(msg.from_name || "");
        const toName = String(msg.to_name || "");

        const currentUserIsSender =
          (fromId === currentUserId || fromName === currentUserName) &&
          (toId === chatPartnerId || toName === chatPartnerName);

        const currentUserIsRecipient =
          (toId === currentUserId || toName === currentUserName) &&
          (fromId === chatPartnerId || fromName === chatPartnerName);

        const nameMatch =
          (fromName === currentUserName && toName === chatPartnerName) ||
          (toName === currentUserName && fromName === chatPartnerName);

        return currentUserIsSender || currentUserIsRecipient || nameMatch;
      });

      console.log(
        `Found ${relevantMessages.length} messages between these users`
      );

      // STEP 1: Deduplicate messages by content and timestamp
      console.log("Starting message deduplication...");
      const messageMap = new Map();

      // Group messages by content and sender/receiver to detect duplicates
      relevantMessages.forEach((msg) => {
        if (!msg.message_content && !msg.content) return; // Skip messages without content

        const content = msg.message_content || msg.content;
        const timestamp = msg.date_timestamp_sent || msg.timestamp;
        const fromId = String(msg.user_from || msg.sender_id || "");
        const toId = String(msg.user_to || msg.receiver_id || "");

        // Create a key combining sender, receiver, and content
        const key = `${fromId}-${toId}-${content}`;

        if (!messageMap.has(key)) {
          // First message with this key
          messageMap.set(key, [msg]);
        } else {
          // We've seen this content before, add to group
          messageMap.get(key).push(msg);
        }
      });

      // Process groups to eliminate duplicates
      const dedupedMessages = [];
      let duplicatesRemoved = 0;

      messageMap.forEach((messageGroup, key) => {
        if (messageGroup.length === 1) {
          // No duplicates found, add the message
          dedupedMessages.push(messageGroup[0]);
        } else {
          // Sort by timestamp
          messageGroup.sort((a, b) => {
            const timeA = new Date(
              a.date_timestamp_sent || a.timestamp
            ).getTime();
            const timeB = new Date(
              b.date_timestamp_sent || b.timestamp
            ).getTime();
            return timeA - timeB;
          });

          // Always keep the first message
          const keptMessages = [messageGroup[0]];

          // For each additional message, check if it's a true duplicate
          for (let i = 1; i < messageGroup.length; i++) {
            const currentMsg = messageGroup[i];
            const prevMsg = messageGroup[i - 1];

            const currentTime = new Date(
              currentMsg.date_timestamp_sent || currentMsg.timestamp
            ).getTime();
            const prevTime = new Date(
              prevMsg.date_timestamp_sent || prevMsg.timestamp
            ).getTime();

            // If messages are more than 2 minutes apart, consider it a legitimate repeat
            // Otherwise, it's likely a duplicate that should be removed
            if (Math.abs(currentTime - prevTime) > 120000) {
              // 2 minutes
              keptMessages.push(currentMsg);
            } else {
              duplicatesRemoved++;
              console.log(
                `Removing duplicate: "${currentMsg.message_content?.substring(0, 20) || "unknown"}..."`
              );
            }
          }

          // Add kept messages to our deduped list
          dedupedMessages.push(...keptMessages);
        }
      });

      if (duplicatesRemoved > 0) {
        console.log(`Removed ${duplicatesRemoved} duplicate messages`);

        // Also clean up local storage to prevent future duplicates
        try {
          const stored = await AsyncStorage.getItem("messages");
          if (stored) {
            const localMessages = JSON.parse(stored);

            // Create a set of message IDs that we're keeping
            const keepIds = new Set(
              dedupedMessages.map((msg) => msg.message_id || msg.id)
            );

            // Filter local storage to keep only non-duplicates
            const updatedLocalMessages = localMessages.filter((msg) => {
              // Keep messages not related to this conversation
              const isRelevant = relevantMessages.some(
                (rMsg) =>
                  (rMsg.message_id && rMsg.message_id === msg.message_id) ||
                  (rMsg.id && rMsg.id === msg.id)
              );

              if (!isRelevant) return true;

              // For relevant messages, only keep those in our deduplicated set
              return keepIds.has(msg.message_id || msg.id);
            });

            if (updatedLocalMessages.length < localMessages.length) {
              await AsyncStorage.setItem(
                "messages",
                JSON.stringify(updatedLocalMessages)
              );
              console.log(
                `Updated local storage: removed ${localMessages.length - updatedLocalMessages.length} messages`
              );
            }
          }
        } catch (storageError) {
          console.error(
            "Failed to update local storage during deduplication:",
            storageError
          );
        }
      } else {
        console.log("No duplicate messages found");
      }

      // STEP 2: Format messages for display
      const formattedMessages = dedupedMessages
        .map((msg) => {
          const messageDate = new Date(
            msg.date_timestamp_sent || msg.timestamp || Date.now()
          );
          const isFromCurrentUser =
            String(msg.user_from || msg.sender_id) === currentUserId ||
            String(msg.from_name) === currentUserName;
          return {
            id: String(msg.message_id || msg.id || Date.now()),
            message_id: msg.message_id, // Preserve the original message_id
            text: msg.message_content || msg.content || "",
            type: isFromCurrentUser ? "sent" : "received",
            isFiltered: false,
            timestamp: formatMessageTime(messageDate),
            date: formatMessageDate(messageDate),
            fullDate: messageDate,
          };
        })
        .sort((a, b) => a.fullDate - b.fullDate);

      // STEP 3: Set the messages state
      setMessages(formattedMessages);

      // Return number of messages for logging
      return formattedMessages.length;
    } catch (error) {
      console.error("Error in loadMessages:", error);
      Alert.alert("Error", "Failed to load messages.");
      return 0;
    }
  }, [chatPartner, currentUser]);

  useEffect(() => {
    const checkCollaborationStatus = async () => {
      const foundStatus = await findCollaborationRequest();
      console.log("findCollaborationRequest returned:", foundStatus);
      if (requestStatus === null) {
        setRequestStatus(foundStatus);
      }

      // Set initial message sending permissions based on account type and collaboration status
      if (currentUser.account_type === "Buyer") {
        setCanSendMessages(true);
      } else if (currentUser.account_type === "Seller") {
        console.log("SELLER INITIAL CHECK - foundStatus:", foundStatus);
        // Correct logic: Seller can send only if accepted or no request (null)
        setCanSendMessages(foundStatus === "Accepted" || foundStatus === null);
      } else if (currentUser.account_type === "Influencer") {
        setCanSendMessages(true);
      }
    };

    checkCollaborationStatus();
  }, [findCollaborationRequest, currentUser.account_type]);

  useEffect(() => {
    // Load messages after checking collaboration status
    if (requestStatus !== null) {
      loadMessages();
    }
  }, [loadMessages, requestStatus]);

  useEffect(() => {
    if (currentUser.account_type === "Seller") {
      console.log("requestStatus changed:", requestStatus);
      setCanSendMessages(requestStatus === "Accepted");
    }
  }, [requestStatus, currentUser.account_type]);

  useEffect(() => {
    const loadPersistedStatus = async () => {
      try {
        console.log("Loading persisted collaboration status...");
        const savedStatus = await loadCollaborationStatus();

        if (savedStatus) {
          console.log(`Found saved status: ${savedStatus}`);
          setRequestStatus(savedStatus);

          // Enable/disable messages based on status
          if (savedStatus === "Accepted") {
            setHasHandledAccept(false);
            setCanSendMessages(true);
          } else if (savedStatus === "Declined") {
            setCanSendMessages(false);
          }
        } else {
          console.log("No saved status found");
        }
      } catch (error) {
        console.error("Error loading persisted status:", error);
      }
    };

    loadPersistedStatus();
  }, [loadCollaborationStatus]);

  const handleSend = async () => {
    if (inputText.trim() && canSendMessages) {
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
      let recipientId = chatPartner;
      let recipientName = chatPartner;

      const storedUsers = await AsyncStorage.getItem("users");
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const partner = users.find(
          (u) =>
            u.name === chatPartner || String(u.user_id) === String(chatPartner)
        );
        if (partner) {
          recipientId = String(partner.id || partner.user_id);
          recipientName = partner.name;
        }
      }

      const newMessage = {
        message_id: `msg-${Date.now()}`,
        user_from: String(currentUser.id || currentUser.user_id),
        user_to: recipientId,
        sender_id: String(currentUser.id || currentUser.user_id),
        receiver_id: recipientId,
        from_name: currentUser.name,
        to_name: recipientName,
        type_message: "text",
        message_content: text, // ✅ Keep this only
        date_timestamp_sent: timestamp.toISOString(),
        timestamp: timestamp.toISOString(),
        is_read: false,
      };

      console.log("📤 Sending message:", newMessage);

      try {
        const sentMessage = await sendMessage(newMessage);
        console.log("✅ Message sent successfully:", sentMessage);
        const stored = await AsyncStorage.getItem("messages");
        const messages = stored ? JSON.parse(stored) : [];
        const isDuplicate = messages.some(
          (msg) =>
            msg.message_id === newMessage.message_id ||
            (msg.message_content === newMessage.message_content &&
              msg.date_timestamp_sent === newMessage.date_timestamp_sent)
        );
        if (!isDuplicate) {
          messages.push(newMessage);
          await AsyncStorage.setItem("messages", JSON.stringify(messages));
          console.log("✅ Message saved to local storage");
        }
      } catch (apiError) {
        console.error("API Error, saving to local storage only:", apiError);
        const stored = await AsyncStorage.getItem("messages");
        const messages = stored ? JSON.parse(stored) : [];
        messages.push(newMessage);
        await AsyncStorage.setItem("messages", JSON.stringify(messages));
      }
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
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
      const stored = await AsyncStorage.getItem("messages");
      const all = stored ? JSON.parse(stored) : [];
      const filteredMessages = all.filter(
        (msg) => msg.message_id?.toString() !== messageId
      );
      await AsyncStorage.setItem("messages", JSON.stringify(filteredMessages));
    } catch (error) {
      console.error("Failed to delete message:", error);
      loadMessages();
    }
  };

  const handleAccept = async () => {
    try {
      console.log("Accepting collaboration request...");

      // Update UI immediately for better user experience
      setRequestStatus("Accepted");
      setCanSendMessages(true);
      setHasHandledAccept(true);

      // Save permanent acceptance status to AsyncStorage as fallback
      try {
        const key = `collab_permanent_${currentUser.user_id}_${chatPartner}`;
        await AsyncStorage.setItem(key, "Accepted");
        console.log("Saved permanent acceptance status to AsyncStorage");
      } catch (storageError) {
        console.warn("Failed to save permanent status:", storageError);
      }

      // Try to update backend, but continue even if it fails
      try {
        console.log("Updating backend status to ACCEPTED");
        const result = await updateCollaborationStatus(
          currentUser.user_id,
          chatPartner,
          "Accepted"
        );
        console.log("✅ Backend update successful:", result);
      } catch (apiError) {
        console.error("⚠️ Backend update failed:", apiError);

        // Save to AsyncStorage as fallback
        try {
          const key = getCollaborationStatusKey();
          await AsyncStorage.setItem(key, "Accepted");
          console.log("Saved status to AsyncStorage as fallback");
        } catch (storageError) {
          console.error("Failed to save to AsyncStorage:", storageError);
        }

        // Don't rethrow - we'll continue with local acceptance
        console.log("Continuing with local acceptance state only");
      }

      // Send confirmation message
      const timestamp = new Date();
      const message =
        "I've accepted your collaboration request. Let's work together!";
      const newMessage = {
        id: timestamp.getTime().toString(),
        text: message,
        type: "sent",
        isFiltered: false,
        timestamp: formatMessageTime(timestamp),
        date: formatMessageDate(timestamp),
        fullDate: timestamp,
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      await saveMessage(message, timestamp);

      // Scroll to bottom of chat
      setTimeout(() => {
        if (flatListRef.current && flatListRef.current.scrollToEnd) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error("❌ Failed to accept request:", error);

      // Show error to user
      Alert.alert(
        "Sync Error",
        "There was an error updating the collaboration status. Please try again or check your connection.",
        [{ text: "OK" }]
      );

      // Revert UI state to reflect the error
      setRequestStatus("Pending");
      setCanSendMessages(false);
      setHasHandledAccept(false);
    }
  };

  const handleDecline = async () => {
    try {
      // Update UI immediately
      setRequestStatus("Declined");
      setCanSendMessages(false);

      // Update backend - it's the source of truth
      const result = await updateCollaborationStatus(
        currentUser.user_id,
        chatPartner,
        "Declined"
      );

      console.log("✅ Backend update result:", result);

      // Save to AsyncStorage as a backup
      const key = getCollaborationStatusKey();
      await AsyncStorage.setItem(key, "Declined");

      // Send confirmation message
      const timestamp = new Date();
      const message =
        "I've declined your collaboration request. Thank you for your interest.";
      const newMessage = {
        id: timestamp.getTime().toString(),
        text: message,
        type: "sent",
        isFiltered: false,
        timestamp: formatMessageTime(timestamp),
        date: formatMessageDate(timestamp),
        fullDate: timestamp,
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      await saveMessage(message, timestamp);

      // Scroll to bottom of chat
      setTimeout(() => {
        if (flatListRef.current && flatListRef.current.scrollToEnd) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error("Failed to decline request:", error);

      // Show error to user
      Alert.alert(
        "Sync Error",
        "There was an error updating the collaboration status. Please try again or check your connection.",
        [{ text: "OK" }]
      );

      // Revert UI state to reflect the error
      setRequestStatus("Pending");
      setCanSendMessages(false);
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
              // Get selected messages with their backend IDs
              const messagesToDelete = messages.filter((msg) =>
                selectedIds.includes(msg.id)
              );

              // Remove from UI immediately
              setMessages(
                messages.filter((msg) => !selectedIds.includes(msg.id))
              );

              // Process each message for deletion
              for (const message of messagesToDelete) {
                // Check if message_id exists and is a valid backend ID
                if (message.message_id) {
                  // Log the type and value for debugging
                  console.log(
                    `Message ID type: ${typeof message.message_id}, value: ${message.message_id}`
                  );

                  // Check if it's a local ID (string that starts with 'msg-')
                  const isLocalId =
                    typeof message.message_id === "string" &&
                    message.message_id.startsWith("msg-");

                  if (!isLocalId) {
                    // This looks like a backend ID - try to delete from backend
                    try {
                      await deleteMessageById(message.message_id);
                      console.log(
                        `Deleted message ${message.message_id} from backend`
                      );
                    } catch (deleteError) {
                      console.error(
                        `Failed to delete message from backend:`,
                        deleteError
                      );
                    }
                  } else {
                    console.log(
                      `Skipping backend deletion for local ID: ${message.message_id}`
                    );
                  }
                } else {
                  console.log(
                    `No message_id found for message with UI id: ${message.id}`
                  );
                }
              }

              // Update local storage
              const stored = await AsyncStorage.getItem("messages");
              const storageMessages = stored ? JSON.parse(stored) : [];

              // Filter out deleted messages
              const updatedStorage = storageMessages.filter((storageMsg) => {
                return !messagesToDelete.some((uiMsg) => {
                  // Match by ID if possible
                  if (uiMsg.message_id && storageMsg.message_id) {
                    return (
                      String(uiMsg.message_id) === String(storageMsg.message_id)
                    );
                  }

                  // Fallback to content matching
                  return (
                    (storageMsg.message_content === uiMsg.text ||
                      storageMsg.content === uiMsg.text) &&
                    storageMsg.date_timestamp_sent ===
                      uiMsg.fullDate?.toISOString()
                  );
                });
              });

              await AsyncStorage.setItem(
                "messages",
                JSON.stringify(updatedStorage)
              );
              console.log(
                `Updated local storage: ${storageMessages.length} -> ${updatedStorage.length} messages`
              );

              // Reset selection
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
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteMessage(item.id)}
      >
        <Animated.View
          style={[
            styles.deleteActionContent,
            { transform: [{ translateX: trans }] },
          ]}
        >
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
                {selectedMessages[item.id] && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
            </View>
          )}
          <Text style={styles.messageText}>{item.text}</Text>
          <View style={styles.messageFooter}>
            <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
            {item.isFiltered && (
              <Text style={styles.filteredWarning}>Filtered</Text>
            )}
          </View>
        </Pressable>
      </View>
    );
    if (canSwipe && !isSelecting) {
      return (
        <Swipeable
          ref={(ref) => (swipeableRefs.current[item.id] = ref)}
          renderRightActions={(progress, dragX) =>
            renderRightActions(progress, dragX, item)
          }
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
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                  >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.profilePreview}>
                    {/* We'll use a state to track image loading status */}
                    {imageLoadFailed ? (
                      <View
                        style={[styles.profileImage, styles.fallbackAvatar]}
                      >
                        <Text style={styles.fallbackAvatarText}>
                          {chatPartner && typeof chatPartner === "string"
                            ? chatPartner.charAt(0).toUpperCase()
                            : "?"}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{
                          uri:
                            chatPartnerImageUri ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(chatPartner || "User")}&background=random&color=fff`,
                        }}
                        style={styles.profileImage}
                        onError={() => {
                          console.log(
                            `Failed to load profile image for: ${chatPartner}`
                          );
                          setImageLoadFailed(true);
                        }}
                      />
                    )}
                    <View style={styles.nameContainer}>
                      <Text style={styles.profileName} numberOfLines={1}>
                        {chatPartner}
                      </Text>
                    </View>
                  </View>
                  {isSelecting ? (
                    <View style={styles.selectionActions}>
                      <TouchableOpacity
                        style={styles.selectionActionButton}
                        onPress={handleCancelSelection}
                      >
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
                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={() => {}}
                    >
                      {/* <MaterialIcons name="more-vert" size={24} color="#fff" /> */}
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
                if (
                  processedMessages.length > 0 &&
                  flatListRef.current &&
                  flatListRef.current.scrollToEnd
                ) {
                  flatListRef.current.scrollToEnd({ animated: false });
                }
              }}
            />
            {/* The key fix: Removed isAccepted from the condition */}
            {currentUser.account_type === "Seller" &&
              requestStatus === "Pending" &&
              !hasHandledAccept && (
                <View style={styles.pendingActions}>
                  <Text style={styles.pendingText}>
                    Accept this collaboration request?
                  </Text>
                  <View style={styles.pendingButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={handleAccept}
                    >
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.declineButton]}
                      onPress={handleDecline}
                    >
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
                    canSendMessages
                      ? "Type a message..."
                      : "Collab request not accepted yet..."
                  }
                  value={inputText}
                  onChangeText={setInputText}
                  editable={canSendMessages}
                  placeholderTextColor={colors.subtitle}
                  multiline
                />
              </View>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={!canSendMessages || inputText.trim() === ""}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color="#fff"
                  style={{
                    opacity:
                      !canSendMessages || inputText.trim() === "" ? 0.5 : 1,
                  }}
                />
              </TouchableOpacity>
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
    fallbackAvatar: {
      backgroundColor: colors.primary + '20', // Light version of primary color
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    
    fallbackAvatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
    },
  });
}
