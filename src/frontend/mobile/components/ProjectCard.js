import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useCart } from "../context/CartContext";
import { getProjectId } from "../context/projectIdHelper";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

export default function ProjectCard({ item, onPress }) {
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleWishlistItem, isInWishlist } = useWishlist();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageAspect, setImageAspect] = useState(1.5);
  
  // Get window dimensions for responsive layout
  const windowWidth = Dimensions.get("window").width;
  const isLargeScreen = windowWidth >= 768; // Tablet/desktop breakpoint

  const projectId = getProjectId(item.project);
  const isFavorite = isInWishlist(projectId);

  // Helper function to get full image URL
  const getFullImageUrl = (url) => {
    if (!url) return null;
    
    // Handle file:/// URLs (local device files)
    if (url.startsWith('file:///')) {
      // For local files on the device, just return as is
      return url;
    }
    
    // If URL is already absolute (starts with http or https), use it as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If URL is relative (starts with /), prepend the server base URL
    if (url.startsWith('/')) {
      // Remove any '/api/' prefix from the URL if it exists
      const cleanPath = url.replace(/^\/api\//, '');
      return `http://10.0.0.25:5001${cleanPath}`;
    }
    
    // If URL is just a filename, assume it's in the products directory
    return `http://10.0.0.25:5001/uploads/products/${url}`;
  };

  // Find the image URL based on different possible properties
  const getImageUrl = () => {
    // Try product_image first (from the data.json structure)
    if (item.project.product_image) {
      return getFullImageUrl(item.project.product_image);
    }
    
    // Fall back to image property if it exists
    if (item.project.image) {
      return getFullImageUrl(item.project.image);
    }
    
    // If all else fails, use a placeholder
    return 'https://via.placeholder.com/300x300?text=No+Image';
  };

  // Get image dimensions when it loads
  useEffect(() => {
    if (getImageUrl() && !imageError) {
      Image.getSize(getImageUrl(), 
        (width, height) => {
          setImageAspect(width / height);
        },
        (error) => {
          console.log("Failed to get image dimensions:", error);
        }
      );
    }
  }, []);

  const handleToggleFavorite = () => {
    toggleWishlistItem(item);
  };

  const handleAddToCart = () => {
    const buyerId = parseInt(user?.user_id);
    const sellerId = parseInt(item.project.user_seller);
    const productId = item.project.product_id || item.project.id || item.id;

    const cartItem = {
      ...item.project,
      cartItemId: projectId,
      seller_id: sellerId,
      buyer_id: buyerId,
      product_id: productId,
    };

    addToCart(cartItem);
  };

  const styles = getStyles(colors, isLargeScreen);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={styles.cardContainer}>
        {/* Image section - left on large screens, top on mobile */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          
          <Image 
            source={{ uri: getImageUrl() }}
            style={styles.productImage}
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={(e) => {
              console.log(`Failed to load image: ${getImageUrl()}`);
              console.log(`Error: ${e.nativeEvent.error}`);
              setImageLoading(false);
              setImageError(true);
            }}
          />
          
          {/* Price tag */}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              ${parseFloat(item.project.price || item.project.cost || 0).toFixed(2)}
            </Text>
          </View>
          
          {/* Best Seller Badge */}
          {item.project.best_seller && (
            <View style={styles.bestSellerBadge}>
              <Text style={styles.bestSellerText}>Best Seller</Text>
            </View>
          )}
          
          {/* Like button */}
          <TouchableOpacity 
            onPress={handleToggleFavorite} 
            style={styles.likeButton}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={22} 
              color={isFavorite ? "#FF3B30" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </View>

        {/* Content section - right on large screens, bottom on mobile */}
        <View style={styles.contentContainer}>
          {/* Category tag */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>
              {item.category || item.project.category || "Product"}
            </Text>
          </View>

          {/* Product name and description */}
          <Text style={styles.productName} numberOfLines={isLargeScreen ? 2 : 1}>
            {item.project.name || item.project.product_name}
          </Text>
          
          <Text style={styles.productDescription} numberOfLines={isLargeScreen ? 3 : 2}>
            {item.project.description}
          </Text>

          {/* Seller information and cart button */}
          <View style={styles.creatorRow}>
            {item.creator && item.creator.image ? (
              <Image 
                source={{ uri: getFullImageUrl(item.creator.image) }} 
                style={styles.creatorImage} 
              />
            ) : (
              <View style={[styles.creatorImage, { backgroundColor: colors.primary }]}>
                <Text style={styles.creatorInitial}>
                  {(item.creator?.name || 'S').charAt(0)}
                </Text>
              </View>
            )}
            
            <Text style={styles.creatorName}>
              {item.creator?.name || "Seller"}
            </Text>
            
            <TouchableOpacity 
              onPress={handleAddToCart} 
              style={styles.cartButton} 
              activeOpacity={0.7}
            >
              <Ionicons 
                name="cart-outline" 
                size={20} 
                color={colors.background} 
              />
            </TouchableOpacity>
          </View>

          {/* Location bar */}
          <View style={styles.locationBar}>
            <View style={styles.locationItem}>
              <Ionicons 
                name="location-outline" 
                size={16} 
                color={colors.subtitle} 
              />
              <Text style={styles.locationText}>
                {item.project.city
                  ? `${item.project.city}, ${item.project.country}`
                  : item.project.country || "Global"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors, isLargeScreen) => StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.background,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: "100%",
  },
  cardContainer: {
    flexDirection: isLargeScreen ? "row" : "column",
    width: "100%",
  },
  imageContainer: {
    position: "relative",
    width: isLargeScreen ? "40%" : "100%",
    height: isLargeScreen ? 200 : 180,
    backgroundColor: "#f8f8f8",
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240,240,240,0.5)',
    zIndex: 1,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    padding: 16,
    width: isLargeScreen ? "60%" : "100%",
    justifyContent: "space-between",
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: colors.baseContainerBody,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "500",
  },
  productName: {
    fontSize: isLargeScreen ? 20 : 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 16,
    lineHeight: 20,
    flex: 1,
  },
  priceTag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  priceText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 14,
  },
  likeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  bestSellerBadge: {
    position: "absolute",
    top: isLargeScreen ? 12 : 56,
    right: isLargeScreen ? 50 : 12,
    backgroundColor: "#FFD700", // Gold color
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bestSellerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  creatorImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  creatorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  cartButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  locationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.baseContainerBody,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.subtitle,
  },
});