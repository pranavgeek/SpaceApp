import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import FollowingService from "../backend/db/FollowingService";

export default function SuggestedAccountsScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState({});

  // Load suggested accounts when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchSuggestedAccounts = async () => {
        try {
          if (!user) return;
          
          // Only show this screen for buyers
          if (user.account_type.toLowerCase() !== 'buyer') {
            navigation.replace('Home');
            return;
          }
          
          setLoading(true);
          
          // Fetch all accounts that are sellers or influencers
          // We'll use the regular users endpoint with a filter
          const response = await fetch(`${FollowingService.BASE_URL}/users`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch accounts: ${response.status}`);
          }
          
          const allUsers = await response.json();
          
          // Filter to only sellers and influencers
          const suggestedAccounts = allUsers.filter(account => 
            (account.account_type.toLowerCase() === 'seller' || 
             account.account_type.toLowerCase() === 'influencer') &&
            String(account.user_id) !== String(user.user_id)
          );
          
          console.log(`Found ${suggestedAccounts.length} suggested accounts`);
          
          // Get list of accounts the user is already following
          const following = await FollowingService.getFollowing(user.user_id);
          const followingIds = following.map(f => String(f.user_id));
          
          // Mark accounts as already followed if appropriate
          const accountsWithFollowStatus = suggestedAccounts.map(account => ({
            ...account,
            isFollowing: followingIds.includes(String(account.user_id))
          }));
          
          // Sort by popularity (followers count)
          accountsWithFollowStatus.sort((a, b) => 
            (b.followers_count || 0) - (a.followers_count || 0)
          );
          
          setAccounts(accountsWithFollowStatus);
        } catch (error) {
          console.error("Error fetching suggested accounts:", error);
          Alert.alert(
            "Error",
            "Unable to load suggested accounts. Please try again later."
          );
        } finally {
          setLoading(false);
        }
      };

      fetchSuggestedAccounts();
    }, [user, navigation])
  );

  // Handle follow/unfollow
  const handleFollow = async (account) => {
    try {
      // Set loading state for this specific account
      setFollowingInProgress(prev => ({
        ...prev,
        [account.user_id]: true
      }));
      
      if (account.isFollowing) {
        // Unfollow
        await FollowingService.unfollowUser(user.user_id, account.user_id);
      } else {
        // Follow
        await FollowingService.followUser(user.user_id, account.user_id);
      }
      
      // Update state
      setAccounts(accounts.map(a => 
        a.user_id === account.user_id 
          ? { ...a, isFollowing: !a.isFollowing } 
          : a
      ));
    } catch (error) {
      console.error("Error following/unfollowing account:", error);
      Alert.alert(
        "Error",
        `Failed to ${account.isFollowing ? 'unfollow' : 'follow'} this account. Please try again.`
      );
    } finally {
      // Clear loading state for this account
      setFollowingInProgress(prev => ({
        ...prev,
        [account.user_id]: false
      }));
    }
  };

  // Refresh accounts
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Fetch all accounts that are sellers or influencers
      const response = await fetch(`${FollowingService.BASE_URL}/users`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.status}`);
      }
      
      const allUsers = await response.json();
      
      // Filter to only sellers and influencers
      const suggestedAccounts = allUsers.filter(account => 
        (account.account_type.toLowerCase() === 'seller' || 
         account.account_type.toLowerCase() === 'influencer') &&
        String(account.user_id) !== String(user.user_id)
      );
      
      // Get list of accounts the user is already following
      const following = await FollowingService.getFollowing(user.user_id);
      const followingIds = following.map(f => String(f.user_id));
      
      // Mark accounts as already followed if appropriate
      const accountsWithFollowStatus = suggestedAccounts.map(account => ({
        ...account,
        isFollowing: followingIds.includes(String(account.user_id))
      }));
      
      // Sort by popularity (followers count)
      accountsWithFollowStatus.sort((a, b) => 
        (b.followers_count || 0) - (a.followers_count || 0)
      );
      
      setAccounts(accountsWithFollowStatus);
    } catch (error) {
      console.error("Error refreshing accounts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Navigate to Home
  const handleContinue = async () => {
    try {
      // Mark as seen in AuthContext
      await markSuggestionsAsSeen();
      
      // Navigate to the main app
      navigation.replace('MainApp');
    } catch (error) {
      console.error("Error marking suggestions as seen:", error);
      // Continue to MainApp anyway
      navigation.replace('MainApp');
    }
  };

  // Go to user profile
  const navigateToProfile = (account) => {
    navigation.navigate('ViewProfile', { 
      screen: 'ViewProfile', 
      params: { userId: account.user_id }
    });
  };

  // Render a single account card
  const renderAccountCard = ({ item: account }) => {
    const isLoading = followingInProgress[account.user_id];
    
    return (
      <View style={styles.accountCard}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigateToProfile(account)}
          activeOpacity={0.7}
        >
          <Image 
            source={{ 
              uri: account.profile_image?.startsWith('http') 
                ? account.profile_image 
                : 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
            }} 
            style={styles.profileImage} 
          />
          
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountUsername}>
              @{account.username || account.name.toLowerCase().replace(/\s+/g, '_')}
            </Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.accountTypeBadge}>
                <Text style={styles.accountTypeText}>{account.account_type}</Text>
              </View>
              
              {(account.followers_count > 0) && (
                <Text style={styles.followerCount}>
                  <Text style={styles.followerCountNumber}>
                    {account.followers_count}
                  </Text> {account.followers_count === 1 ? 'follower' : 'followers'}
                </Text>
              )}
            </View>
            
            {account.about_us && (
              <Text style={styles.accountBio} numberOfLines={2}>
                {account.about_us}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.followButton,
            account.isFollowing ? styles.followingButton : {}
          ]}
          onPress={() => handleFollow(account)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator 
              size="small" 
              color={account.isFollowing ? colors.primary : "#FFF"} 
            />
          ) : (
            <Text style={[
              styles.followButtonText,
              account.isFollowing ? styles.followingButtonText : {}
            ]}>
              {account.isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suggested Accounts</Text>
      </View>
      
      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome to KSpace!</Text>
        <Text style={styles.welcomeText}>
          Follow sellers and influencers to see their products and updates in your feed.
        </Text>
      </View>
      
      {/* Accounts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : accounts.length > 0 ? (
        <FlatList
          data={accounts}
          renderItem={renderAccountCard}
          keyExtractor={item => item.user_id.toString()}
          contentContainerStyle={styles.accountsList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={60} color={`${colors.primary}50`} />
          <Text style={styles.emptyText}>No suggested accounts found</Text>
          <Text style={styles.emptySubText}>
            Check back later for new accounts to follow
          </Text>
        </View>
      )}
      
      {/* Continue Button */}
      <View style={styles.continueContainer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            Continue to Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getDynamicStyles(colors, isDarkMode) {
  const { width } = Dimensions.get("window");
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: Platform.OS === 'ios' ? 10 : StatusBar.currentHeight + 10,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    welcomeContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDarkMode 
        ? 'rgba(255,255,255,0.05)' 
        : 'rgba(0,0,0,0.02)',
    },
    welcomeTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    welcomeText: {
      fontSize: 14,
      color: colors.subtitle,
      lineHeight: 20,
    },
    accountsList: {
      padding: 16,
      paddingBottom: 80, // Extra padding at bottom for the Continue button
    },
    accountCard: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      borderRadius: 12,
      marginBottom: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    profileSection: {
      flexDirection: "row",
      marginBottom: 12,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 12,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    accountUsername: {
      fontSize: 14,
      color: colors.subtitle,
      marginBottom: 4,
    },
    detailsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    accountTypeBadge: {
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginRight: 8,
    },
    accountTypeText: {
      color: colors.primary,
      fontWeight: "500",
      fontSize: 12,
    },
    followerCount: {
      fontSize: 13,
      color: colors.subtitle,
    },
    followerCountNumber: {
      fontWeight: "600",
      color: colors.text,
    },
    accountBio: {
      fontSize: 13,
      color: colors.text,
      marginTop: 4,
    },
    followButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    followingButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    followButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 14,
    },
    followingButtonText: {
      color: colors.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
    },
    emptySubText: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: "center",
      marginTop: 8,
    },
    continueContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    continueButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
    },
    continueButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 16,
    },
  });
}