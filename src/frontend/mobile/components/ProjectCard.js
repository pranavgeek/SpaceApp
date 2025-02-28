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
import { useLikeContext } from "../screens/LikeContext"; // Importing the context

export default function ProjectCard({ item, onPress }) {
  const { toggleLike, getLikes } = useLikeContext(); // Access the context
  const [likes, setLikes] = useState(item.project.likes);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // Set the initial liked state based on the context
    setLiked(getLikes(item.project.id)); // Assume 'id' exists on your item object
  }, [item.project.id, getLikes]);

  const handleToggleLike = () => {
    toggleLike(item.project.id); // Toggle like in the context
    setLiked((prev) => !prev); // Toggle the local liked state
    setLikes((prev) => (liked ? prev - 1 : prev + 1)); // Adjust the like count locally
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.creator.image }} style={styles.profileImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.creatorName}>{item.creator.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>

      <Image source={{ uri: item.project.image }} style={styles.projectImage} />

      <View style={styles.cardFooter}>
        <Text style={styles.projectName}>{item.project.name}</Text>
        <Text numberOfLines={1} style={styles.projectDescription}>{item.project.description}</Text>
        <Text style={styles.projectPrice}>{item.project.price}</Text>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleToggleLike}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? "red" : "white"}
            />
            <Text style={styles.actionText}>{likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: "#343434",
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
    backgroundColor: "#4CAF50",
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
  creatorName: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  category: { fontSize: 12, color: "white" },
  projectImage: { width: "100%", height: 200 },
  cardFooter: { padding: 10 },
  projectName: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  projectDescription: { fontSize: 14, color: "#ccc" },
  projectPrice: { fontSize: 16, color: "#fff", marginVertical: 5 },
  cardActions: { flexDirection: "row", justifyContent: "space-between" },
  actionButton: { flexDirection: "row", alignItems: "center" },
  actionText: { marginLeft: 5, fontSize: 14, color: "#fff" },
});
