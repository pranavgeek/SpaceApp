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

const ClosedCampaignsScreen = ({ navigation }) => {
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

  // Helper function to extract status from campaign object (same as ActiveCampaignsScreen)
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

  // Helper function to get campaign dates (same as ActiveCampaignsScreen)
  const getCampaignDates = (campaign) => {
    let startDate, endDate;
    
    // Check if status is an object with campaign dates
    if (typeof campaign.status === 'object' && campaign.status.campaignStartDate) {
      startDate = new Date(campaign.status.campaignStartDate);
      endDate = new Date(campaign.status.campaignEndDate);
    } else if (campaign.approvalData && campaign.approvalData.campaignStartDate) {
      // Check approvalData field
      startDate = new Date(campaign.approvalData.campaignStartDate);
      endDate = new Date(campaign.approvalData.campaignEndDate);
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
      console.log(`Loading closed campaigns for influencer: ${user.user_id}`);
      
      // Use consistent user ID (user.user_id instead of user.id)
      const campaignRequests = await fetchInfluencerCampaignRequests(user.user_id);
      console.log(`Fetched ${campaignRequests.length} campaign requests for closed campaigns`);
      
      // Filter for campaigns that have ended
      const closedCampaigns = campaignRequests.filter(campaign => {
        const status = getCampaignStatus(campaign);
        
        // Only consider accepted campaigns
        if (status !== "Accepted") {
          console.log(`Skipping campaign ${campaign.requestId} - status: ${status}`);
          return false;
        }
        
        // Get campaign dates
        const { startDate, endDate } = getCampaignDates(campaign);
        const currentDate = new Date();
        
        // Check if campaign has ended
        const isExpired = currentDate > endDate;
        
        if (isExpired) {
          console.log(`✅ Found expired campaign: ${campaign.productName} (${campaign.requestId}) - ended ${endDate.toLocaleDateString()}`);
        }
        
        return isExpired;
      });
      
      // Sort by end date (most recent first)
      closedCampaigns.sort((a, b) => {
        const { endDate: endDateA } = getCampaignDates(a);
        const { endDate: endDateB } = getCampaignDates(b);
        return endDateB.getTime() - endDateA.getTime();
      });
      
      console.log(`Found ${closedCampaigns.length} closed campaigns`);
      setCampaigns(closedCampaigns);
    } catch (error) {
      console.error("Error loading closed campaigns:", error);
      Alert.alert("Error", "Could not load closed campaigns");
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
    const daysCompleted = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Enhanced campaign details for closed campaigns
    let campaignDetails = `Product: ${campaign.productName}\nSeller: ${campaign.sellerName}\nDuration: ${campaign.campaignDuration} days\nCommission: ${campaign.commission}%\nStatus: Completed`;
    
    // Add campaign period
    campaignDetails += `\nStart Date: ${startDate.toLocaleDateString()}\nEnd Date: ${endDate.toLocaleDateString()}`;
    campaignDetails += `\nDays Completed: ${daysCompleted}`;
    
    // Add seller email if available
    if (typeof campaign.status === 'object' && campaign.status.sellerEmail) {
      campaignDetails += `\nSeller Email: ${campaign.status.sellerEmail}`;
    } else if (campaign.approvalData && campaign.approvalData.sellerEmail) {
      campaignDetails += `\nSeller Email: ${campaign.approvalData.sellerEmail}`;
    }
    
    Alert.alert("Completed Campaign Details", campaignDetails, [{ text: "OK" }]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const renderCampaignItem = ({ item }) => {
    const { startDate, endDate } = getCampaignDates(item);
    const campaignDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate how long ago it ended
    const currentDate = new Date();
    const daysAgoEnded = Math.ceil((currentDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <TouchableOpacity 
        style={styles.campaignCard} 
        onPress={() => handleViewCampaign(item)}
      >
        <View style={styles.campaignHeader}>
          <View style={styles.campaignStatusContainer}>
            <View style={[styles.statusDot, { backgroundColor: "#10b981" }]} />
            <Text style={[styles.campaignStatus, { color: "#10b981" }]}>Completed</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.endDate}>Ended: {formatDate(endDate)}</Text>
            <Text style={styles.daysAgo}>
              {daysAgoEnded === 1 ? '1 day ago' : `${daysAgoEnded} days ago`}
            </Text>
          </View>
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
              Completed: {campaignDuration} days
            </Text>
            <Text style={styles.campaignPeriod}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.campaignFooter}>
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.completionText}>Campaign Completed</Text>
          </View>
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
        name="checkmark-done-outline"
        size={64}
        color={colors.subtitle + "80"}
      />
      <Text style={styles.emptyText}>
        You don't have any completed campaigns yet. Campaigns will appear here after their duration ends.
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
          <Text style={styles.loadingText}>Loading completed campaigns...</Text>
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
    borderLeftWidth: 4,
    borderLeftColor: "#10b981", // Green border for completed campaigns
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
  dateContainer: {
    alignItems: 'flex-end',
  },
  endDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  daysAgo: {
    fontSize: 12,
    color: colors.subtitle,
    marginTop: 2,
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
    color: "#10b981",
    fontWeight: '500',
  },
  campaignFooter: {
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#333' : '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
});

export default ClosedCampaignsScreen;