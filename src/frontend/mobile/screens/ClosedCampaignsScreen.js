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

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      
      // For influencer users, load their campaign requests
      const campaignRequests = await fetchInfluencerCampaignRequests(user.id);
      
      // Filter for campaigns that have ended
      const closedCampaigns = campaignRequests.filter(campaign => {
        // Only consider accepted campaigns
        if (campaign.status !== "Accepted") {
          return false;
        }
        
        // Check if campaign has ended based on duration
        if (!campaign.statusUpdatedAt) {
          return false;
        }
        
        const startDate = new Date(campaign.statusUpdatedAt);
        const endDate = new Date(startDate.getTime() + (campaign.campaignDuration * 24 * 60 * 60 * 1000));
        const currentDate = new Date();
        
        return currentDate > endDate;
      });
      
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
    // Navigate to campaign details when implemented
    // For now, just show an alert with campaign details
    Alert.alert(
      "Campaign Details",
      `Product: ${campaign.productName}\nSeller: ${campaign.sellerName}\nDuration: ${campaign.campaignDuration} days\nCommission: ${campaign.commission}%\nStatus: Completed`,
      [{ text: "OK" }]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const renderCampaignItem = ({ item }) => {
    // Calculate campaign end date
    const startDate = new Date(item.statusUpdatedAt);
    const endDate = new Date(startDate.getTime() + (item.campaignDuration * 24 * 60 * 60 * 1000));
    
    return (
      <TouchableOpacity 
        style={styles.campaignCard} 
        onPress={() => handleViewCampaign(item)}
      >
        <View style={styles.campaignHeader}>
          <View style={styles.campaignStatusContainer}>
            <View style={[styles.statusDot, { backgroundColor: "#6b7280" }]} />
            <Text style={styles.campaignStatus}>Completed</Text>
          </View>
          <Text style={styles.endDate}>Ended: {formatDate(endDate)}</Text>
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
        name="checkmark-done-outline"
        size={64}
        color={colors.subtitle + "80"}
      />
      <Text style={styles.emptyText}>
        You don't have any completed campaigns yet. Campaigns will appear here after their duration ends.
      </Text>
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
    color: '#6b7280',
  },
  endDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtitle,
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

export default ClosedCampaignsScreen;