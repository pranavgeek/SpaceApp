import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { 
  fetchInfluencerCampaignRequests,
  fetchAdminActions
} from "../backend/db/API";

const PendingCampaignsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = useCallback(async () => {
    if (user.account_type !== "Influencer") return;
    
    try {
      setLoading(true);
      
      // Fetch both campaign requests and admin actions
      const [campaignRequests, adminActions] = await Promise.all([
        fetchInfluencerCampaignRequests(user.id),
        fetchAdminActions() // New function to get admin actions
      ]);
      
      // Filter for pending admin actions related to campaigns
      const pendingCampaignActions = adminActions.filter(
        action => 
          action.action === "Campaign Approval Request" && 
          (action.status === "pending" || action.status === "Pending")
      );
      
      // Parse the admin action details to find campaigns for this influencer
      const pendingActionCampaigns = [];
      pendingCampaignActions.forEach(action => {
        try {
          const details = JSON.parse(action.details);
          if (details.influencerName === user.name || 
              details.influencerId === user.id || 
              details.influencerId === user.user_id) {
            
            // Add the matching campaign with admin action reference
            pendingActionCampaigns.push({
              requestId: details.campaignRequestId || `admin-${action.admin_id}`,
              productName: details.productName,
              sellerName: details.sellerName,
              sellerId: action.user_id,
              commission: details.commission || 10,
              campaignDuration: details.campaignDuration || 14,
              status: "Pending",
              timestamp: action.date_timestamp,
              adminId: action.admin_id,
              influencerId: user.id,
              influencerName: user.name,
            });
          }
        } catch (error) {
          console.error("Error parsing admin action details:", error);
        }
      });
      
      // Filter for pending campaigns from campaign requests
      const pendingCampaignsFromRequests = campaignRequests.filter(
        campaign => campaign.status === "Pending"
      );
      
      // Merge the two sources, avoiding duplicates
      const allPendingCampaigns = [
        ...pendingCampaignsFromRequests,
        ...pendingActionCampaigns.filter(actionCampaign => 
          !pendingCampaignsFromRequests.some(reqCampaign => 
            reqCampaign.requestId === actionCampaign.requestId
          )
        )
      ];
      
      console.log(`Found ${allPendingCampaigns.length} pending campaigns for influencer ${user.name}`);
      setCampaigns(allPendingCampaigns);
    } catch (error) {
      console.error("Error loading pending campaigns:", error);
      Alert.alert("Error", "Could not load pending campaigns");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
    }, [loadCampaigns])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const handleViewDetails = (campaign) => {
    // Show campaign details in alert since no separate screen exists yet
    Alert.alert(
      "Campaign Details",
      `Product: ${campaign.productName}\nSeller: ${campaign.sellerName}\nDuration: ${campaign.campaignDuration} days\nCommission: ${campaign.commission}%${campaign.adminId ? "\n\nThis campaign is waiting for admin approval." : ""}`,
      [{ text: "OK" }]
    );
  };

  const handleContactSeller = (campaign) => {
    // Navigate to messages with the seller
    navigation.navigate("MessageScreen", {
      receiverId: campaign.sellerId,
      receiverName: campaign.sellerName
    });
  };
  
  const renderCampaignItem = ({ item }) => (
    <View style={styles.campaignCard}>
      <View style={styles.waitingBadge}>
        <Ionicons name="hourglass-outline" size={16} color="#fff" />
        <Text style={styles.waitingText}>Waiting for Admin</Text>
      </View>
      
      <View style={styles.campaignContent}>
        <View style={styles.productImageContainer}>
          {item.productImage && !item.productImage.startsWith("file:///") ? (
            <Image source={{ uri: item.productImage }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="cube-outline" size={32} color={colors.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.campaignDetails}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.seller}>From: {item.sellerName}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={14} color={colors.subtitle} />
            <Text style={styles.infoText}>{item.commission}% commission</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.subtitle} />
            <Text style={styles.infoText}>{item.campaignDuration} days</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={colors.subtitle} />
            <Text style={styles.infoText}>Requested: {new Date(item.timestamp).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewDetails(item)}
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleContactSeller(item)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="time-outline"
        size={64}
        color={colors.subtitle + "80"}
      />
      <Text style={styles.emptyText}>
        No pending campaign requests yet. When sellers request your influence to promote their products, they will appear here waiting for admin approval.
      </Text>
    </View>
  );
  
  // This screen is for influencers only
  if (user.account_type !== "Influencer") {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={styles.notInfluencerContainer}>
          <Text style={styles.notInfluencerText}>
            This screen is only available for influencer accounts.
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
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading campaigns...</Text>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          renderItem={renderCampaignItem}
          keyExtractor={item => item.requestId || `campaign-${Math.random()}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const getDynamicStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#2d2d2d" : "#f0f0f0",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  notInfluencerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notInfluencerText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.subtitle,
  },
  list: {
    padding: 16,
    paddingBottom: 80, // Extra padding at bottom
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.subtitle,
    textAlign: 'center',
    lineHeight: 22,
  },
  campaignCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  waitingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  campaignContent: {
    flexDirection: 'row',
    padding: 16,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#333' : '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  seller: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.subtitle,
    marginLeft: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#333' : '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#333' : '#f0f0f0',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
});

export default PendingCampaignsScreen;