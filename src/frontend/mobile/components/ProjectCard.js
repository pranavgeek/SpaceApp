// ProjectCard.js
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLikeContext } from "../theme/LikeContext";
import { useTheme } from "../theme/ThemeContext";
import { useCart } from "../context/CartContext";
import { getProjectId } from "../context/projectIdHelper";
import { useAuth } from "../context/AuthContext";

export default function ProjectCard({ item, onPress }) {
  const { toggleLike, getLikes } = useLikeContext();
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Get a stable project id
  const projectId = getProjectId(item.project);

  // Read the global like state
  const isLiked = getLikes(projectId);
  // Display like count: base count plus one if liked
  const displayedLikes = item.project.likes + (isLiked ? 1 : 0);

  const handleToggleLike = () => {
    toggleLike(projectId);
  };

  const handleAddToCart = () => {
    const buyerId = parseInt(user?.user_id); // logged-in buyer
    const sellerId = parseInt(item.project.user_seller); // seller ID from the product
    const productId = item.project.product_id || item.project.id || item.id;
  
    const cartItem = {
      ...item.project,
      cartItemId: projectId,
      seller_id: sellerId,
      buyer_id: buyerId,
      product_id: productId,
    };
  
    console.log("🛒 Final cart item:", JSON.stringify(cartItem));
    addToCart(cartItem);
  };

  const styles = getStyles(colors);
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Card Image Section */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.project.image }} 
          style={styles.projectImage} 
          resizeMode="cover"
        />
        
        {/* Price Tag */}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>
            ${parseFloat(item.project.price).toFixed(2)}
          </Text>
        </View>
        
        {/* Like Button */}
        <TouchableOpacity 
          onPress={handleToggleLike} 
          style={styles.likeButton}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? colors.error : colors.background}
          />
        </TouchableOpacity>
      </View>
      
      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Category Tag */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        
        {/* Project Name */}
        <Text 
          style={styles.projectName}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.project.name}
        </Text>
        
        {/* Project Description */}
        <Text
          numberOfLines={2}
          style={styles.projectDescription}
          ellipsizeMode="tail"
        >
          {item.project.description}
        </Text>
        
        {/* Creator Info Row */}
        <View style={styles.creatorRow}>
          <Image source={{ uri: item.creator.image }} style={styles.creatorImage} />
          <Text style={styles.creatorName}>{item.creator.name}</Text>
          
          {/* Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            style={styles.cartButton}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
        
        {/* Action Bar */}
        <View style={styles.actionBar}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color={colors.primary} />
            <Text style={styles.statText}>{displayedLikes}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={16} color={colors.subtitle} />
            <Text style={styles.statText}>
              {item.project.city ? `${item.project.city}, ${item.project.country}` : item.project.country || "Global"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors) => StyleSheet.create({
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
    width: Platform.OS === "web" ? "100%" : undefined,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  projectImage: {
    width: "100%",
    height: "100%",
  },
  priceTag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  },
  cardContent: {
    padding: 16,
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
  projectName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 16,
    lineHeight: 20,
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
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.baseContainerBody,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.subtitle,
  }
});