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
  Alert
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

// Mock function to get user profile data - replace with your API call
const getUserProfile = async (userId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Sample data
  return {
    id: userId,
    name: "Jessica Miller",
    username: "jess_designs",
    bio: "Product designer and digital creator. Sharing design tips and creative content.",
    accountType: "Seller",
    city: "Portland",
    country: "USA",
    languages: ["English", "Spanish"],
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    coverImage: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
    isFollowing: true,
    stats: {
      followers: 856,
      following: 234,
      products: 32,
      reviews: 128,
    },
    products: [
      {
        id: "p1",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        title: "Digital Design Template",
        price: 49.99
      },
      {
        id: "p2",
        image: "https://images.unsplash.com/photo-1554306274-f23873d9a26c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        title: "UX Workshop Materials",
        price: 29.99
      },
      {
        id: "p3",
        image: "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        title: "Creative Branding Package",
        price: 99.99
      }
    ]
  };
};

export default function UserProfileScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = route.params;

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const data = await getUserProfile(userId);
          setProfile(data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          Alert.alert("Error", "Failed to load user profile");
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }, [userId])
  );

  const toggleFollow = () => {
    if (!profile) return;
    
    setProfile({
      ...profile,
      isFollowing: !profile.isFollowing,
      stats: {
        ...profile.stats,
        followers: profile.isFollowing 
          ? profile.stats.followers - 1 
          : profile.stats.followers + 1,
      }
    });
    
    // In a real app, make API call to follow/unfollow
    // followUser(profile.id, !profile.isFollowing);
  };

  const navigateToFollowers = () => {
    navigation.navigate("Followers", { 
      userId: profile.id,
      name: profile.name,
      isOtherUser: true
    });
  };

  const navigateToProducts = () => {
    navigation.navigate("UserProducts", { 
      userId: profile.id,
      name: profile.name
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.error || "red"} />
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
            
            {/* Back button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Header Actions */}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-social-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>
            
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
                <Text style={styles.accountTypeText}>{profile.accountType}</Text>
              </View>
            </View>
            
            <Text style={styles.usernameText}>@{profile.username}</Text>
            
            {profile.bio ? (
              <Text style={styles.bioText}>{profile.bio}</Text>
            ) : null}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  profile.isFollowing ? styles.outlineButton : {}
                ]}
                onPress={toggleFollow}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    profile.isFollowing ? styles.outlineButtonText : {}
                  ]}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.messageButton}>
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
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

          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={navigateToFollowers}
            >
              <Text style={styles.statValue}>{profile.stats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statValue}>{profile.stats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={navigateToProducts}
            >
              <Text style={styles.statValue}>{profile.stats.products}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.stats.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* Products Section */}
          {profile.accountType === "Seller" && profile.products.length > 0 && (
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
                {profile.products.map((product) => (
                  <TouchableOpacity 
                    key={product.id}
                    style={styles.productCard}
                    onPress={() => navigation.navigate("ProductDetails", { productId: product.id })}
                  >
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle} numberOfLines={1}>
                        {product.title}
                      </Text>
                      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
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
      top: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight + 10,
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
      top: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight + 10,
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
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    messageButtonText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 15,
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
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
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
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
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
  });
}