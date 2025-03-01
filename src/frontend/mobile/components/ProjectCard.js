import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {useLikeContext} from "../theme/LikeContext";
import { useTheme } from '../theme/ThemeContext.js';
import { useCart } from "../context/CartContext"; // Import useCart
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4

export default function ProjectCard({ item, onPress }) {
  const { toggleLike, getLikes } = useLikeContext();
  const [likes, setLikes] = useState(item.project.likes);
  const [liked, setLiked] = useState(false);
  const { colors } = useTheme(); // Access the colors object from the theme
  const { addToCart } = useCart(); // Access the addToCart function from the CartContext
  
  useEffect(() => {
    setLiked(getLikes(item.project.id));
  }, [item.project.id, getLikes]);

  const handleToggleLike = () => {
    toggleLike(item.project.id);
    setLiked((prev) => !prev);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleAddToCart = () => { // Implement handleAddToCart
    const cartItem = { ...item.project, cartItemId: uuidv4() }; // Add a unique cartItemId
    addToCart(cartItem); // Add the project to the cart
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.baseContainerBody }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.creator.image }} style={styles.profileImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.creatorName, { color: colors.text }]}>{item.creator.name}</Text>
          <Text style={[styles.category, { color: colors.subtitle }]}>{item.category}</Text>
        </View>
        <TouchableOpacity onPress={handleAddToCart} style={[styles.button, { backgroundColor: colors.buttonBackground }]}>
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>

      <Image source={{ uri: item.project.image }} style={styles.projectImage} />

      <View style={styles.cardFooter}>
        <Text style={[styles.projectName, { color: colors.text }]}>{item.project.name}</Text>
        <Text numberOfLines={1} style={[styles.projectDescription, { color: colors.subtitle }]}>
          {item.project.description}
        </Text>
        <Text style={[styles.projectPrice, { color: colors.text }]}>{item.project.price}</Text>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleToggleLike}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? colors.error : colors.text}
            />
            <Text style={[styles.actionText, { color: colors.text }]}>{likes}</Text>
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
    width: Platform.OS === "web" ? 300 : "",
  },
  cardHeader: {
    flexDirection: "row",
    padding: 10,
  },
  button: {
    height: Platform.OS === "web" ? 35 : "",
    paddingVertical: Platform.OS === "web" ? 12 : "11",
    paddingHorizontal: 10,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: Platform.OS === "web" ? 10 : "13",
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
