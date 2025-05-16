import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CampaignFormModal from "../components/CampaignFormModal";
import { getSubscriptionLimits } from "../config/subscriptionTiers";

import {
  fetchCollaborationRequests,
  syncCollaborationRequests,
  updateCollaborationRequestStatus,
  fetchCampaignRequests,
  sendMessage,
} from "../backend/db/API";

const CollaborationRequestScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [campaignRequests, setCampaignRequests] = useState([]);
  const isMounted = useRef(true);

  // Ensure we don't set state after unmounting
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load all campaign requests to check against collaboration requests
  const loadCampaignRequests = useCallback(async () => {
    try {
      const campaigns = await fetchCampaignRequests();
      if (isMounted.current) {
        setCampaignRequests(campaigns);
      }
      return campaigns;
    } catch (error) {
      console.error("Error loading campaign requests", error);
      return [];
    }
  }, []);

  const loadCollaborationRequests = useCallback(async () => {
    // Only load if we're a seller
    if (!user || !user.id || user.account_type !== "Seller") return;

    try {
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      // First sync collaboration requests between local storage and backend
      // await syncCollaborationRequests();

      // Get all campaign requests to check against
      const allCampaignRequests = await loadCampaignRequests();

      // Then fetch all requests for this seller
      const sellerIdToUse = user.id || user.user_id;
      const collaborationRequests =
        await fetchCollaborationRequests(sellerIdToUse);

      console.log(
        `Loaded ${collaborationRequests.length} collaboration requests for seller ${sellerIdToUse}`
      );

      if (isMounted.current) {
        // Update collaboration request status based on existing campaign requests
        const updatedRequests = collaborationRequests.map((request) => {
          // Check if there's an accepted campaign request for this influencer
          const existingCampaign = allCampaignRequests.find(
            (campaign) =>
              campaign.influencerId === request.influencerId &&
              campaign.sellerId === sellerIdToUse &&
              campaign.status === "Accepted"
          );

          // If we found a campaign, update the collaboration request status
          if (existingCampaign && request.status === "Pending") {
            return {
              ...request,
              status: "Accepted",
              campaignRequestId: existingCampaign.requestId,
              productName: existingCampaign.productName,
            };
          }

          return request;
        });

        // Enhanced deduplication by influencer ID and status
        const uniqueByInfluencer = [];
        const seenInfluencers = new Set();

        // Sort by timestamp (newest first) to ensure we keep the most recent
        const sortedRequests = [...updatedRequests].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        sortedRequests.forEach((request) => {
          // Create a unique key combining influencer ID and status
          const key = `${request.influencerId}-${request.status}`;

          if (!seenInfluencers.has(key)) {
            seenInfluencers.add(key);
            uniqueByInfluencer.push(request);
          }
          // We don't need the else case here since we've sorted by timestamp
          // and will process the newest requests first
        });

        setRequests(uniqueByInfluencer);
      }
    } catch (error) {
      console.error("Error loading collaboration requests", error);
      if (isMounted.current) {
        setError("Failed to load collaboration requests. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user, loadCampaignRequests]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCollaborationRequests();
    }, [loadCollaborationRequests])
  );

  const handleAcceptRequest = async (item) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        "Accept Collaboration",
        `Are you sure you want to accept collaboration with ${item.influencerName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Accept",
            onPress: async () => {
              setLoading(true);

              // First check subscription limits
              if (user) {
                // Get subscription tier information
                const userTier = user.tier || "basic";
                const { collaborationLimit } = getSubscriptionLimits(userTier);
                console.log(
                  `User ${user.id} is on ${userTier} tier with collaboration limit: ${collaborationLimit}`
                );
                // Count existing collaborations
                const currentCollaborations = requests.filter(
                  (req) => req.status === "Accepted" || req.status === "Pending"
                ).length;

                console.log(
                  `Collaboration check: ${currentCollaborations}/${collaborationLimit}`
                );

                // If accepting would exceed the limit, show upgrade message and stop
                if (currentCollaborations >= collaborationLimit) {
                  setLoading(false);
                  Alert.alert(
                    "Subscription Limit Reached",
                    `Your current plan (${userTier}) allows a maximum of ${collaborationLimit} collaborations. Please upgrade your subscription to continue.`,
                    [
                      {
                        text: "Ok",
                        // onPress: () =>
                        //   navigation.navigate("Subscriptions"),
                      },
                    ]
                  );
                  return; // Exit early without accepting
                }
              }

              // Proceed with accepting the collaboration
              const success = await updateRequestStatus(
                item.requestId,
                "Accepted"
              );

              if (success) {
                // Send a confirmation message to the influencer
                try {
                  const timestamp = new Date();
                  const message =
                    "I've accepted your collaboration request. Let's work together!";

                  // Create message object
                  const newMessage = {
                    message_id: `msg-${Date.now()}`,
                    user_from: String(user.id || user.user_id),
                    user_to: String(item.influencerId),
                    sender_id: String(user.id || user.user_id),
                    receiver_id: String(item.influencerId),
                    from_name: user.name,
                    to_name: item.influencerName,
                    type_message: "text",
                    message_content: message,
                    date_timestamp_sent: timestamp.toISOString(),
                    timestamp: timestamp.toISOString(),
                    is_read: false,
                  };

                  console.log("Sending acceptance message:", newMessage);

                  // Send through API
                  await sendMessage(newMessage);
                  console.log("✅ Acceptance message sent successfully");
                } catch (msgError) {
                  console.error("Error sending acceptance message:", msgError);
                  // Continue even if message fails - collaboration was accepted
                }

                // Navigate to the chat screen with this influencer
                navigation.getParent()?.navigate("TabMessages", {
                  screen: "Chat",
                  params: {
                    chatPartner: item.influencerName,
                    initialRequestStatus: "Accepted",
                    fromCollaborationScreen: true,
                  },
                });
              }
              setLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error accepting collaboration request:", error);
      Alert.alert("Error", "Failed to accept collaboration request.");
      setLoading(false);
    }
  };

  // Handle declining a collaboration request
  const handleDeclineRequest = async (item) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        "Decline Collaboration",
        `Are you sure you want to decline collaboration with ${item.influencerName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Decline",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              const success = await updateRequestStatus(
                item.requestId,
                "Declined"
              );
              setLoading(false);

              if (success) {
                // Refresh the request list to show updated status
                loadCollaborationRequests();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error declining collaboration request:", error);
      Alert.alert("Error", "Failed to decline collaboration request.");
      setLoading(false);
    }
  };

  // Modify handleSelectInfluencer to only create campaigns for Accepted requests
  const handleSelectInfluencer = (item) => {
    // If request is pending, handle acceptance first
    if (item.status === "Pending") {
      handleAcceptRequest(item);
      return;
    }

    // For Accepted requests, proceed with campaign creation
    // Check if any campaigns have already been created for this influencer
    const existingCampaign = requests.find(
      (req) =>
        req.influencerId === item.influencerId &&
        req.status === "Accepted" &&
        req.campaignRequestId
    );

    if (existingCampaign) {
      Alert.alert(
        "Campaign Exists",
        "You've already created a campaign with this influencer that's waiting for admin approval.",
        [{ text: "OK" }]
      );
      return;
    }

    // Check in the campaignRequests state for existing campaigns
    const existingCampaignRequest = campaignRequests.find(
      (campaign) =>
        campaign.influencerId === item.influencerId &&
        campaign.sellerId === (user.id || user.user_id)
    );

    if (existingCampaignRequest) {
      Alert.alert(
        "Campaign Exists",
        `You already have a ${existingCampaignRequest.status} campaign with this influencer for "${existingCampaignRequest.productName}".`,
        [{ text: "OK" }]
      );
      return;
    }

    // Handle selection for campaign creation
    setSelectedInfluencer({
      id: item.influencerId,
      name: item.influencerName,
    });
    setSelectedRequestId(item.requestId);
    setFormModalVisible(true);
  };

  // Updates for CollaborationRequestScreen.js - updateRequestStatus method
  const updateRequestStatus = async (
    requestId,
    statusValue,
    campaignRequestId = null,
    productName = null
  ) => {
    try {
      // IMPORTANT: Make sure we're sending a string value for status, not an object
      const status =
        typeof statusValue === "object" ? statusValue.status : statusValue;

      console.log(`Updating request ${requestId} to status: ${status}`);

      // Make sure we have the user information
      if (!user) {
        Alert.alert("Error", "User information not available.");
        return false;
      }

      // Only check limits when accepting a collaboration - not when declining
      if (status === "Accepted") {
        // First check subscription limits before proceeding
        try {
          // Calculate current collaborations count (include both pending and accepted)
          const currentCollaborations = requests.filter(
            (req) => req.status === "Accepted" || req.status === "Pending"
          ).length;

          // Get subscription tier information
          let tier = user.tier || "basic";
          let collaborationLimit = 1; // Default limit for basic tier

          // Set limits based on tier
          switch (tier.toLowerCase()) {
            case "pro":
              collaborationLimit = 50;
              break;
            case "enterprise":
              collaborationLimit = Infinity; // Unlimited
              break;
            default:
              // Basic tier - use default (1)
              break;
          }

          console.log(
            `Collaboration check: ${currentCollaborations}/${collaborationLimit}`
          );

          // If accepting would exceed the limit, show upgrade message and stop
          if (currentCollaborations >= collaborationLimit) {
            Alert.alert(
              "Subscription Limit Reached",
              `Your current plan (${tier}) allows a maximum of ${collaborationLimit} collaborations. Please upgrade your subscription to continue.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Upgrade",
                  onPress: () => navigation.navigate("SubscriptionScreen"),
                },
              ]
            );
            return false;
          }
        } catch (limitError) {
          console.error("Error checking collaboration limits:", limitError);
          // Continue anyway if limit check fails to prevent blocking user
        }
      }

      const sellerId = user.id || user.user_id;
      const updatedRequest = {
        status, // Send just the status string, not an object
        sellerId,
      };

      // If we have a campaign request ID, associate it with the collaboration request
      if (campaignRequestId) {
        updatedRequest.campaignRequestId = campaignRequestId;
      }

      // If we have a product name, associate it with the collaboration request
      if (productName) {
        updatedRequest.productName = productName;
      }

      // Call the API with the proper format
      try {
        const response = await updateCollaborationRequestStatus(
          requestId,
          status,
          sellerId
        );

        // Handle response data
        if (response.error === "Collaboration limit reached") {
          Alert.alert(
            "Subscription Limit Reached",
            response.message ||
              "You have reached your collaboration limit. Please upgrade your subscription to continue.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Upgrade",
                onPress: () => navigation.navigate("SubscriptionScreen"),
              },
            ]
          );
          return false;
        }

        // Refresh the list
        loadCollaborationRequests();
        return true;
      } catch (error) {
        console.error("API error:", error);

        // Try to update locally
        try {
          const stored = await AsyncStorage.getItem("collaborationRequests");
          const localRequests = stored ? JSON.parse(stored) : [];

          // Find the index of the request
          const requestIndex = localRequests.findIndex(
            (req) => String(req.requestId) === String(requestId)
          );

          if (requestIndex !== -1) {
            // Update the request
            localRequests[requestIndex] = {
              ...localRequests[requestIndex],
              status,
              statusUpdatedAt: new Date().toISOString(),
            };

            // Save back to storage
            await AsyncStorage.setItem(
              "collaborationRequests",
              JSON.stringify(localRequests)
            );
            console.log(
              `Updated request in local storage: ${requestId} -> ${status}`
            );

            // Refresh the list
            loadCollaborationRequests();
            return true;
          } else {
            // Create a new request if it doesn't exist - we need to get influencer info from somewhere
            // Try to find the request in the current requests state
            const existingRequest = requests.find(
              (req) => String(req.requestId) === String(requestId)
            );

            if (!existingRequest) {
              console.error(
                "Cannot create new request, missing influencer information"
              );
              Alert.alert("Error", "Failed to update request status.");
              return false;
            }

            const newRequest = {
              requestId,
              status,
              sellerId: user.id || user.user_id,
              sellerName: user.name,
              influencerId: existingRequest.influencerId,
              influencerName: existingRequest.influencerName,
              timestamp: new Date().toISOString(),
              statusUpdatedAt: new Date().toISOString(),
            };

            localRequests.push(newRequest);
            await AsyncStorage.setItem(
              "collaborationRequests",
              JSON.stringify(localRequests)
            );
            console.log(
              `Created new request in local storage: ${requestId} -> ${status}`
            );

            // Refresh the list
            loadCollaborationRequests();
            return true;
          }
        } catch (localError) {
          console.error("Local storage error:", localError);
        }

        Alert.alert("Error", "Failed to update request status.");
        return false;
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      Alert.alert("Error", "Failed to update request status.");
      return false;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() =>
        item.status === "Accepted" ? null : handleSelectInfluencer(item)
      }
      activeOpacity={item.status === "Pending" ? 0.7 : 1}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.influencerName}>{item.influencerName}</Text>
        <View
          style={[
            styles.statusBadge,
            item.status === "Pending"
              ? styles.pendingBadge
              : item.status === "Accepted"
                ? styles.acceptedBadge
                : styles.declinedBadge,
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.requestText}>
        {item.status === "Accepted" && item.productName
          ? `Campaign created for "${item.productName}"`
          : `Requested to collaborate on ${item.product || "your products"}`}
      </Text>
      <Text style={styles.timestampText}>
        {new Date(item.timestamp).toLocaleDateString()}
      </Text>

      {/* Accept/Decline buttons for Pending requests */}
      {item.status === "Pending" && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item)}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineRequest(item)}
          >
            <Text style={styles.actionButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Only show Create Campaign button for Accepted requests without a campaign */}
      {item.status === "Accepted" && !item.campaignRequestId && (
        <View style={styles.createCampaignContainer}>
          <TouchableOpacity
            style={styles.createCampaignButton}
            onPress={() => handleSelectInfluencer(item)}
          >
            <Ionicons
              name="add-circle-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.createCampaignText}>Create Campaign</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* For Accepted requests with campaign details */}
      {item.status === "Accepted" && item.campaignRequestId && (
        <View style={styles.campaignInfoContainer}>
          <Text style={styles.campaignInfoText}>
            Campaign created successfully
          </Text>
          <View style={styles.adminStatusContainer}>
            <Ionicons name="time-outline" size={14} color="#FF9800" />
            <Text style={styles.adminStatusText}>Awaiting admin approval</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Handle refresh action
  const handleRefresh = () => {
    setRefreshing(true);
    loadCollaborationRequests();
  };

  // Handle form submission from the modal
  const handleFormSubmission = (campaignRequestId, productName) => {
    if (selectedRequestId) {
      // Update the collaboration request with the campaign ID, status, and product name
      updateRequestStatus(
        selectedRequestId,
        "Accepted",
        campaignRequestId,
        productName
      );
    }

    setFormModalVisible(false);
    setSelectedInfluencer(null);
    setSelectedRequestId(null);

    // Show success message
    Alert.alert(
      "Success",
      "Campaign has been created and sent to admin for approval.",
      [{ text: "OK" }]
    );
  };

  // This screen is only for sellers
  if (user.account_type !== "Seller") {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={styles.notSellerContainer}>
          <Text style={styles.notSellerText}>
            This screen is only available for seller accounts.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Campaign Form Modal */}
      {selectedInfluencer && (
        <CampaignFormModal
          visible={formModalVisible}
          onClose={() => {
            setFormModalVisible(false);
            setSelectedInfluencer(null);
            setSelectedRequestId(null);
            // Wait a bit before refreshing to make sure form is fully closed
            setTimeout(() => {
              loadCollaborationRequests();
            }, 500);
          }}
          onSubmitSuccess={handleFormSubmission}
          influencerId={selectedInfluencer.id}
          influencerName={selectedInfluencer.name}
          collaborationRequestId={selectedRequestId}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Text style={styles.headerSubtitle}>
            Tap on an influencer to create a campaign
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading indicator */}
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List of collaboration requests */}
      <FlatList
        data={requests}
        keyExtractor={(item) =>
          item.requestId?.toString() || Math.random().toString()
        }
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={60}
                color={colors.subtitle}
              />
              <Text style={styles.emptyText}>
                No collaboration requests yet.
              </Text>
              <Text style={styles.emptySubtext}>
                Influencers can discover and request to collaborate with you
                through the Collaboration Modal.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={
          !loading && !error && requests.length === 0
            ? styles.emptyList
            : styles.listContainer
        }
      />
    </View>
  );
};

const getDynamicStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    headerActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.subtitle,
      flex: 1,
    },
    refreshButton: {
      padding: 4,
    },
    listContainer: {
      padding: 8,
    },
    requestItem: {
      margin: 8,
      padding: 16,
      backgroundColor: isDarkMode ? colors.card : "white",
      borderRadius: 12,
      shadowColor: colors.shadowColor || "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    requestHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    influencerName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    pendingBadge: {
      backgroundColor: "#FFC107", // Amber
    },
    acceptedBadge: {
      backgroundColor: "#4CAF50", // Green
    },
    declinedBadge: {
      backgroundColor: "#F44336", // Red
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    requestText: {
      fontSize: 15,
      color: colors.text,
      marginBottom: 8,
    },
    timestampText: {
      fontSize: 12,
      color: colors.subtitle,
      marginBottom: 8,
    },
    createCampaignContainer: {
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? "#333333" : "#EEEEEE",
      marginTop: 8,
      paddingTop: 12,
    },
    campaignInfoContainer: {
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? "#333333" : "#EEEEEE",
      marginTop: 8,
      paddingTop: 12,
      alignItems: "center",
    },
    campaignInfoText: {
      color: "#4CAF50",
      fontWeight: "500",
      fontSize: 14,
    },
    adminStatusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      backgroundColor: "#FFF8E1",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    adminStatusText: {
      fontSize: 12,
      color: "#FF9800",
      marginLeft: 4,
    },
    createCampaignButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    createCampaignText: {
      color: colors.primary,
      fontWeight: "600",
      marginLeft: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    emptyList: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    notSellerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    notSellerText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.2)",
      zIndex: 100,
    },
    errorContainer: {
      padding: 20,
      alignItems: "center",
    },
    errorText: {
      fontSize: 16,
      color: colors.error || "#F44336",
      textAlign: "center",
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
  });

export default CollaborationRequestScreen;
