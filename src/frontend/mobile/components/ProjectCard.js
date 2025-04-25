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

  const projectId = getProjectId(item.project);
  const isFavorite = isInWishlist(projectId);

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

  const styles = getStyles(colors);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.project.image }} style={styles.projectImage} resizeMode="cover" />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>${parseFloat(item.project.price).toFixed(2)}</Text>
        </View>
        
        {/* Best Seller Badge */}
        {item.project.best_seller && (
          <View style={styles.bestSellerBadge}>
            <Text style={styles.bestSellerText}>Best Seller</Text>
          </View>
        )}
        
        <TouchableOpacity onPress={handleToggleFavorite} style={styles.likeButton}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FF3B30" : "#FFFFFF"} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>

        <Text style={styles.projectName} numberOfLines={1}>{item.project.name}</Text>
        <Text style={styles.projectDescription} numberOfLines={2}>{item.project.description}</Text>

        <View style={styles.creatorRow}>
          <Image source={{ uri: item.creator.image }} style={styles.creatorImage} />
          <Text style={styles.creatorName}>{item.creator.name}</Text>
          <TouchableOpacity onPress={handleAddToCart} style={styles.cartButton} activeOpacity={0.7}>
            <Ionicons name="cart-outline" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionBar}>
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={16} color={colors.subtitle} />
            <Text style={styles.statText}>
              {item.project.city
                ? `${item.project.city}, ${item.project.country}`
                : item.project.country || "Global"}
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
  bestSellerBadge: {
    position: "absolute",
    top: 56,
    right: 12,
    backgroundColor: "#FFD700", // Gold color
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 10,
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
  },
});