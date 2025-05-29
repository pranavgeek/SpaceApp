import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { fetchInfluencerCampaignRequests } from "../backend/db/API";

const ActiveCampaignsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect non-influencer users
  if (user.account_type !== "Influencer") {
    return (
      <View style={styles.container}>
        <View style={styles.notInfluencerContainer}>
          <Text style={styles.notInfluencerText}>
            This screen is only available for influencer accounts.
          </Text>
        </View>
      </View>
    );
  }

  // Helper function to extract status from campaign object
  const getCampaignStatus = (campaign) => {
    if (!campaign.status) return "Unknown";
    
    // Handle both string and object status formats
    if (typeof campaign.status === 'string') {
      return campaign.status;
    } else if (typeof campaign.status === 'object' && campaign.status.status) {
      return campaign.status.status;
    }
    
    return "Unknown";
  };

  // Helper function to get campaign dates
  const getCampaignDates = (campaign) => {
    let startDate, endDate;
    
    // Check if status is an object with campaign dates
    if (typeof campaign.status === 'object' && campaign.status.campaignStartDate) {
      startDate = new Date(campaign.status.campaignStartDate);
      endDate = new Date(campaign.status.campaignEndDate);
    } else {
      // Fallback to timestamp-based calculation
      startDate = new Date(campaign.statusUpdatedAt || campaign.timestamp);
      endDate = new Date(startDate.getTime() + (campaign.campaignDuration * 24 * 60 * 60 * 1000));
    }
    
    return { startDate, endDate };
  };

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`Loading campaigns for influencer: ${user.user_id}`);
      
      // For influencer users, load their campaign requests
      const campaignRequests = await fetchInfluencerCampaignRequests(user.user_id);
      console.log(`Fetched ${campaignRequests.length} campaign requests:`, campaignRequests);
      
      // Filter for accepted campaigns (approved by admin) with better status handling
      const activeCampaigns = campaignRequests.filter(campaign => {
        const status = getCampaignStatus(campaign);
        const isAccepted = status === "Accepted";
        
        if (isAccepted) {
          console.log(`✅ Active campaign found: ${campaign.productName} (${campaign.requestId})`);
        }
        
        return isAccepted;
      });
      
      console.log(`Found ${activeCampaigns.length} active campaigns for influencer`);
      setCampaigns(activeCampaigns);
    } catch (error) {
      console.error("Error loading active campaigns:", error);
      Alert.alert("Error", "Could not load active campaigns");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user.account_type === "Influencer") {
        loadCampaigns();
      }
    }, [loadCampaigns, user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const handleViewCampaign = (campaign) => {
    const status = getCampaignStatus(campaign);
    const { startDate, endDate } = getCampaignDates(campaign);
    
    // Enhanced campaign details display
    let campaignDetails = `Product: ${campaign.productName}\nSeller: ${campaign.sellerName}\nDuration: ${campaign.campaignDuration} days\nCommission: ${campaign.commission}%\nStatus: ${status}`;
    
    // Add dates if available
    if (startDate && endDate) {
      campaignDetails += `\nStart Date: ${startDate.toLocaleDateString()}\nEnd Date: ${endDate.toLocaleDateString()}`;
    }
    
    // Add seller email if available
    if (typeof campaign.status === 'object' && campaign.status.sellerEmail) {
      campaignDetails += `\nSeller Email: ${campaign.status.sellerEmail}`;
    }
    
    Alert.alert("Campaign Details", campaignDetails, [{ text: "OK" }]);
  };

  const renderCampaignItem = ({ item }) => {
    const { startDate, endDate } = getCampaignDates(item);
    const status = getCampaignStatus(item);
    
    // Calculate days left more accurately
    const today = new Date();
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Determine if campaign is expired
    const isExpired = daysLeft <= 0;
    const isExpiringSoon = daysLeft <= 3 && daysLeft > 0;
    
    return (
      <TouchableOpacity 
        style={styles.campaignCard} 
        onPress={() => handleViewCampaign(item)}
      >
        <View style={styles.campaignHeader}>
          <View style={styles.campaignStatusContainer}>
            <View style={[
              styles.statusDot, 
              { 
                backgroundColor: isExpired ? "#ef4444" : 
                                isExpiringSoon ? "#f59e0b" : "#10b981" 
              }
            ]} />
            <Text style={[
              styles.campaignStatus,
              { 
                color: isExpired ? "#ef4444" : 
                       isExpiringSoon ? "#f59e0b" : "#10b981" 
              }
            ]}>
              {isExpired ? "Expired" : "Active"}
            </Text>
          </View>
          <Text style={[
            styles.daysLeft,
            { color: isExpired ? "#ef4444" : 
                     isExpiringSoon ? "#f59e0b" : colors.subtitle }
          ]}>
            {isExpired ? "Expired" : `${daysLeft} days left`}
          </Text>
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
            <Text style={styles.seller}>Seller: {item.sellerName}</Text>
            <Text style={styles.commission}>Commission: {item.commission}%</Text>
            <Text style={styles.campaignDuration}>
              Duration: {item.campaignDuration} days
            </Text>
            {/* Show campaign period */}
            <Text style={styles.campaignPeriod}>
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.campaignFooter}>
          <TouchableOpacity style={styles.viewDetailsButton} onPress={() => handleViewCampaign(item)}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="globe-outline"
        size={64}
        color={colors.subtitle + "80"}
      />
      <Text style={styles.emptyText}>
        You don't have any active campaigns yet. Campaigns that have been approved by admin will appear here.
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

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
          keyExtractor={item => item.requestId}
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
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#333' : '#f0f0f0',
  },
  campaignStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  campaignStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysLeft: {
    fontSize: 14,
    fontWeight: '600',
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
  commission: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  campaignDuration: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 4,
  },
  campaignPeriod: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  campaignFooter: {
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#333' : '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
});

export default ActiveCampaignsScreen;