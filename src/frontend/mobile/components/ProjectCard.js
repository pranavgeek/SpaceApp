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

  // Get a stable project id.
  const projectId = getProjectId(item.project);

  // Read the global like state.
  const isLiked = getLikes(projectId);
  // Display like count: base count plus one if liked.
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
  
  

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.baseContainerBody }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.creator.image }} style={styles.profileImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.creatorName, { color: colors.text }]}>
            {item.creator.name}
          </Text>
          <Text style={[styles.category, { color: colors.subtitle }]}>
            {item.category}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={[styles.button, { backgroundColor: colors.buttonBackground }]}
        >
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>

      <Image source={{ uri: item.project.image }} style={styles.projectImage} />

      <View style={styles.cardFooter}>
        <Text style={[styles.projectName, { color: colors.text }]}>
          {item.project.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.projectDescription, { color: colors.subtitle }]}
        >
          {item.project.description}
        </Text>
        <Text style={[styles.projectPrice, { color: colors.text }]}>
          {item.project.price}
        </Text>

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={handleToggleLike} style={styles.actionButton}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? colors.error : colors.text}
            />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {displayedLikes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 10,
    borderRadius: 10,
    overflow: "hidden",
    width: Platform.OS === "web" ? 300 : undefined,
  },
  cardHeader: {
    flexDirection: "row",
    padding: 10,
  },
  button: {
    height: Platform.OS === "web" ? 35 : undefined,
    paddingVertical: Platform.OS === "web" ? 12 : 11,
    paddingHorizontal: 10,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: Platform.OS === "web" ? 10 : 13,
    fontWeight: "bold",
  },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  creatorName: { fontSize: 16, fontWeight: "bold" },
  category: { fontSize: 12 },
  projectImage: { width: "100%", height: 200 },
  cardFooter: { padding: 10 },
  projectName: { fontSize: 18, fontWeight: "bold" },
  projectDescription: { fontSize: 14 },
  projectPrice: { fontSize: 16, marginVertical: 5 },
  cardActions: { flexDirection: "row", justifyContent: "space-between" },
  actionButton: { flexDirection: "row", alignItems: "center" },
  actionText: { marginLeft: 5, fontSize: 14 },
});
