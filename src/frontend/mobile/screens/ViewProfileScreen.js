import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  FlatList,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { fetchUsers } from "../backend/db/API";
import { useAuth } from "../context/AuthContext";
import FollowingService from "../backend/db/FollowingService";

export default function ViewProfileScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { userId, accountType: routeAccountType } = route.params;

  // Fetch user profile data
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          setLoading(true);

          // Get all users
          const users = await fetchUsers();

          // Find the specific user
          const userData = users.find(
            (u) => String(u.user_id) === String(userId)
          );

          if (!userData) {
            throw new Error("User not found");
          }

          // Determine account type - use route param if available, otherwise use user data
          const accountType =
            routeAccountType || userData.account_type || "Seller";

          // Check if current user is following this profile
          let followStatus = false;
          if (user && user.account_type?.toLowerCase() === "buyer") {
            try {
              const following = await FollowingService.getFollowing(
                user.user_id
              );
              followStatus = following.some(
                (f) => String(f.user_id) === String(userId)
              );
            } catch (error) {
              console.error("Error checking follow status:", error);
            }
          }

          setIsFollowing(followStatus);

          // Format the profile data
          setProfile({
            id: userData.user_id,
            name: userData.name || "Unknown User",
            username:
              userData.username ||
              userData.name?.toLowerCase().replace(/\s+/g, "_") ||
              "user",
            bio: userData.about_us || "",
            accountType: accountType,
            city: userData.city || "Not specified",
            country: userData.country || "Not specified",
            languages: userData.languages || ["English"],
            profileImage: userData.profile_image?.startsWith("http")
              ? userData.profile_image
              : "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
            coverImage: userData.cover_image?.startsWith("http")
              ? userData.cover_image
              : "https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
            // Update the social media structure to match what's saved in the profile
            socialMedia: {
              instagram: userData.social_media_instagram || "",
              twitter: userData.social_media_x || "",
              facebook: userData.social_media_facebook || "",
            },
            stats: {
              followers: userData.followers_count || 0,
              following: userData.following_count || 0,
              campaigns: Array.isArray(userData.campaigns)
                ? userData.campaigns.length
                : 0,
              products: Array.isArray(userData.products)
                ? userData.products.length
                : 0,
              reviews: userData.reviews_count || 0,
              earnings: userData.earnings || 0,
            },
            products: Array.isArray(userData.products) ? userData.products : [],
            campaigns: Array.isArray(userData.campaigns)
              ? userData.campaigns
              : [],
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          Alert.alert("Error", "Failed to load user profile");
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }, [userId, user])
  );

  // Handle follow/unfollow
  const toggleFollow = async () => {
    if (!profile) return;

    try {
      // Only buyers can follow
      if (!user) {
        Alert.alert("Authentication Required", "Please log in to follow users");
        return;
      }

      if (user.account_type?.toLowerCase() !== "buyer") {
        Alert.alert(
          "Action Not Allowed",
          "Only buyers can follow other accounts"
        );
        return;
      }

      setLoading(true);

      if (isFollowing) {
        // Unfollow
        await FollowingService.unfollowUser(user.user_id, profile.id);
        setProfile({
          ...profile,
          stats: {
            ...profile.stats,
            followers: Math.max(0, profile.stats.followers - 1),
          },
        });
      } else {
        // Follow
        await FollowingService.followUser(user.user_id, profile.id);
        setProfile({
          ...profile,
          stats: {
            ...profile.stats,
            followers: profile.stats.followers + 1,
          },
        });
      }

      setIsFollowing(!isFollowing);
      setLoading(false);
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Error", "Failed to update follow status");
      setLoading(false);
    }
  };

  // Open social media links
  const openSocialMediaLink = async (type) => {
    if (!profile) return;
  
    let url;
    
    switch (type) {
      case 'instagram':
        if (profile.socialMedia.instagram) {
          // Handle Instagram link
          if (profile.socialMedia.instagram.startsWith('http')) {
            url = profile.socialMedia.instagram;
          } else {
            // Remove @ if present
            const username = profile.socialMedia.instagram.replace('@', '');
            url = `https://instagram.com/${username}`;
          }
        }
        break;
        
      case 'twitter':
        if (profile.socialMedia.twitter) {
          // Handle Twitter/X link
          if (profile.socialMedia.twitter.startsWith('http')) {
            url = profile.socialMedia.twitter;
          } else {
            // Remove @ if present
            const username = profile.socialMedia.twitter.replace('@', '');
            url = `https://twitter.com/${username}`;
          }
        }
        break;
        
      case 'facebook':
        if (profile.socialMedia.facebook) {
          // Handle Facebook link
          if (profile.socialMedia.facebook.startsWith('http')) {
            url = profile.socialMedia.facebook;
          } else {
            url = `https://facebook.com/${profile.socialMedia.facebook}`;
          }
        }
        break;
    }
    
    if (url) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Error", `Cannot open URL: ${url}`);
        }
      } catch (error) {
        console.error("Error opening URL:", error);
        Alert.alert("Error", "Unable to open the link");
      }
    } else {
      Alert.alert("No Link", `No ${type} link provided`);
    }
  };

  // Navigation helpers
  const navigateToFollowers = () => {
    navigation.navigate("Followers", {
      userId: profile.id,
      name: profile.name,
      isOtherUser: true,
    });
  };

  const navigateToFollowing = () => {
    navigation.navigate("Following", {
      userId: profile.id,
      name: profile.name,
      isOtherUser: true,
    });
  };

  const navigateToProducts = () => {
    navigation.navigate("UserProducts", {
      userId: profile.id,
      name: profile.name,
    });
  };

  const navigateToCampaigns = () => {
    navigation.navigate("UserCampaigns", {
      userId: profile.id,
      name: profile.name,
    });
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Error state
  if (!profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={colors.error || "red"}
        />
        <Text style={styles.errorText}>User profile not found</Text>
        <TouchableOpacity
          style={styles.backButtonAlt}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Determine stats items based on account type
  const renderStats = () => {
    const accountType = profile.accountType?.toLowerCase();

    // Stats for Sellers
    if (accountType === "seller") {
      return (
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={navigateToCampaigns}
          >
            <Text style={styles.statValue}>{profile.stats.campaigns}</Text>
            <Text style={styles.statLabel}>Campaigns</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statItem}
            onPress={navigateToFollowers}
          >
            <Text style={styles.statValue}>{profile.stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Stats for Influencers
    if (accountType === "influencer") {
      return (
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={navigateToFollowers}
          >
            <Text style={styles.statValue}>{profile.stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statItem}
            onPress={navigateToCampaigns}
          >
            <Text style={styles.statValue}>{profile.stats.campaigns}</Text>
            <Text style={styles.statLabel}>Campaigns</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Default stats (fallback)
    return (
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statItem} onPress={navigateToFollowers}>
          <Text style={styles.statValue}>{profile.stats.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity style={styles.statItem} onPress={navigateToFollowing}>
          <Text style={styles.statValue}>{profile.stats.following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render products section for Sellers
  const renderProductsSection = () => {
    if (
      profile.accountType?.toLowerCase() !== "seller" ||
      !profile.products ||
      profile.products.length === 0
    ) {
      return null;
    }

    return (
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={navigateToProducts}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsScrollContent}
        >
          {profile.products.slice(0, 5).map((product) => (
            <TouchableOpacity
              key={product.id || product.product_id}
              style={styles.productCard}
              onPress={() =>
                navigation.navigate("ProductDetails", {
                  productId: product.id || product.product_id,
                })
              }
            >
              <Image
                source={{
                  uri:
                    product.image ||
                    product.product_image ||
                    "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.title || product.name || "Product"}
                </Text>
                <Text style={styles.productPrice}>
                  ${product.price?.toFixed(2) || "0.00"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render campaigns section for Influencers
  const renderCampaignsSection = () => {
    if (
      profile.accountType?.toLowerCase() !== "influencer" ||
      !profile.campaigns ||
      profile.campaigns.length === 0
    ) {
      return null;
    }

    return (
      <View style={styles.campaignsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Campaigns</Text>
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={navigateToCampaigns}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {profile.campaigns.slice(0, 3).map((campaign) => (
          <TouchableOpacity
            key={campaign.id || campaign.campaign_id}
            style={styles.campaignCard}
            onPress={() =>
              navigation.navigate("CampaignDetails", {
                campaignId: campaign.id || campaign.campaign_id,
              })
            }
          >
            <Image
              source={{
                uri:
                  campaign.image ||
                  campaign.campaign_image ||
                  "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
              }}
              style={styles.campaignImage}
            />
            <View style={styles.campaignInfo}>
              <Text style={styles.campaignTitle} numberOfLines={1}>
                {campaign.title || campaign.name || "Campaign"}
              </Text>
              <Text style={styles.campaignDescription} numberOfLines={2}>
                {campaign.description || "No description available"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render social media links if available
  const renderSocialLinks = () => {
    // Only show social media for influencers
    if (profile.accountType?.toLowerCase() !== "influencer") {
      return null;
    }
  
    const hasSocialLinks =
      profile.socialMedia?.instagram ||
      profile.socialMedia?.twitter ||
      profile.socialMedia?.facebook;
  
    if (!hasSocialLinks) return null;
  
    return (
      <View style={styles.socialLinksContainer}>
        {profile.socialMedia.instagram && (
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openSocialMediaLink('instagram')}
          >
            <Ionicons name="logo-instagram" size={20} color="#C13584" />
          </TouchableOpacity>
        )}
  
        {profile.socialMedia.twitter && (
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openSocialMediaLink('twitter')}
          >
            <FontAwesome5 name="times" size={16} color="#000000" />
          </TouchableOpacity>
        )}
  
        {profile.socialMedia.facebook && (
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openSocialMediaLink('facebook')}
          >
            <Ionicons name="logo-facebook" size={20} color="#4267B2" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <ImageBackground
            source={{ uri: profile.coverImage }}
            style={styles.headerBackground}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
              style={styles.gradient}
            />

            <View style={styles.headerContent}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: profile.profileImage }}
                  style={styles.profileImage}
                />
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.profileContent}>
          <View style={styles.profileInfoSection}>
            <View style={styles.nameSection}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <View style={styles.accountTypeBadge}>
                <Text style={styles.accountTypeText}>
                  {profile.accountType}
                </Text>
              </View>
            </View>

            <Text style={styles.usernameText}>@{profile.username}</Text>

            {profile.bio ? (
              <Text style={styles.bioText}>{profile.bio}</Text>
            ) : null}

            <View style={styles.actionButtonsRow}>
              {/* Follow button (only show for Buyers) */}
              {user &&
                user.account_type?.toLowerCase() === "buyer" &&
                String(user.user_id) !== String(profile.id) && (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isFollowing ? styles.outlineButton : {},
                    ]}
                    onPress={toggleFollow}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        isFollowing ? styles.outlineButtonText : {},
                      ]}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                )}

              {/* Message button */}
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => {
                  // Navigate to the Messages tab first
                  navigation.navigate("TabMessages", {
                    // Then navigate to the Chat screen with params
                    screen: "Chat",
                    params: {
                      chatPartner: profile.name,
                      recipientId: profile.id,
                    },
                  });
                }}
              >
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>

              {/* Render social media links */}
              {renderSocialLinks()}
            </View>

            <View style={styles.locationContainer}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.subtitle}
                />
                <Text style={styles.infoText}>
                  {profile.city}, {profile.country}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="language-outline"
                  size={18}
                  color={colors.subtitle}
                />
                <Text style={styles.infoText}>
                  {profile.languages.join(", ")}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats section - customized by account type */}
          {renderStats()}

          {/* Products section - only for Sellers */}
          {renderProductsSection()}

          {/* Campaigns section - only for Influencers */}
          {renderCampaignsSection()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getDynamicStyles(colors, isDarkMode) {
  const { width, height } = Dimensions.get("window");
  const isWeb = Platform.OS === "web";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 18,
      color: colors.text,
      marginTop: 12,
      marginBottom: 20,
      textAlign: "center",
    },
    backButtonAlt: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    backButtonText: {
      color: "white",
      fontWeight: "600",
    },
    profileHeader: {
      width: "100%",
      height: height * 0.25,
    },
    headerBackground: {
      width: "100%",
      height: "100%",
      justifyContent: "flex-end",
    },
    gradient: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    headerContent: {
      paddingBottom: 70,
      alignItems: "center",
    },
    backButton: {
      position: "absolute",
      top: Platform.OS === "ios" ? 40 : StatusBar.currentHeight + 10,
      left: 16,
      zIndex: 100,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerActions: {
      position: "absolute",
      top: Platform.OS === "ios" ? 40 : StatusBar.currentHeight + 10,
      right: 16,
      zIndex: 100,
      flexDirection: "row",
    },
    shareButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    profileImageContainer: {
      borderWidth: 4,
      borderColor: colors.background,
      borderRadius: 70,
      height: 140,
      width: 140,
      overflow: "hidden",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    profileImage: {
      height: "100%",
      width: "100%",
    },
    profileContent: {
      marginTop: -70,
      paddingTop: 80,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    profileInfoSection: {
      marginBottom: 20,
    },
    nameSection: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginRight: 10,
    },
    usernameText: {
      fontSize: 16,
      color: colors.subtitle,
      marginBottom: 10,
    },
    bioText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      marginBottom: 16,
    },
    accountTypeBadge: {
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
    },
    accountTypeText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 12,
    },
    actionButtonsRow: {
      flexDirection: "row",
      marginVertical: 16,
      flexWrap: "wrap",
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginBottom: 10,
    },
    primaryButtonText: {
      color: "white",
      fontWeight: "600",
      fontSize: 15,
    },
    outlineButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    outlineButtonText: {
      color: colors.primary,
    },
    messageButton: {
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginBottom: 10,
    },
    messageButtonText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 15,
    },
    socialLinksContainer: {
      flexDirection: "row",
    },
    socialButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      marginBottom: 10,
    },
    locationContainer: {
      marginTop: 8,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    infoText: {
      marginLeft: 8,
      color: colors.subtitle,
      fontSize: 14,
    },
    statsContainer: {
      flexDirection: "row",
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.03)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.subtitle,
    },
    statDivider: {
      width: 1,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    },
    productsSection: {
      marginBottom: 24,
    },
    campaignsSection: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    seeAllButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    seeAllText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    productsScrollContent: {
      paddingBottom: 8,
      paddingRight: 16,
    },
    productCard: {
      width: 160,
      marginRight: 14,
      borderRadius: 12,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.03)",
      overflow: "hidden",
    },
    productImage: {
      width: "100%",
      height: 120,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    productInfo: {
      padding: 10,
    },
    productTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 4,
    },
    productPrice: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
    campaignCard: {
      flexDirection: "row",
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.03)",
      overflow: "hidden",
    },
    campaignImage: {
      width: 100,
      height: 100,
    },
    campaignInfo: {
      flex: 1,
      padding: 12,
    },
    campaignTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    campaignDescription: {
      fontSize: 14,
      color: colors.subtitle,
      lineHeight: 20,
    },
  });
}
