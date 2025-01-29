import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; 

export default ProjectCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.creator.image }} style={styles.profileImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.creatorName}>{item.creator.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color="gray" />
        </TouchableOpacity>
      </View>
      <Image source={{ uri: item.project.image }} style={styles.projectImage} />
      <View style={styles.cardFooter}>
        <Text style={styles.projectName}>{item.project.name}</Text>
        <Text style={styles.projectDescription}>{item.project.description}</Text>
        <Text style={styles.projectPrice}>{item.project.price}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={20} color="white" />
            <Text style={styles.actionText}>{item.project.likes}</Text>
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

const styles = StyleSheet.create({
  closeModalButton: {
    marginTop: 20,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,  
    borderRadius: 10,
    backgroundColor: "#141414",
  },
  closeModalText: {
    color: "blue",
    fontWeight: "bold",
    color: '#fff',
  },
  card: { 
    margin: 10,
    backgroundColor: "#343434", 
    borderRadius: 10, 
    overflow: "hidden" 
  },
  cardHeader: { 
    flexDirection: "row", 
    padding: 10 
  },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  creatorName: { fontSize: 16, fontWeight: "bold", color: '#fff' },
  category: { fontSize: 12, color: "white" },
  projectImage: { width: "100%", height: 200 },
  cardFooter: { padding: 10 },
  projectName: { fontSize: 18, fontWeight: "bold", color: '#fff' },
  projectDescription: { fontSize: 14, color: "#ccc" },
  projectPrice: { fontSize: 16, color: "#fff", marginVertical: 5 },
  cardActions: { flexDirection: "row", justifyContent: "space-between" },
  actionButton: { flexDirection: "row", alignItems: "center", color: '#fff' },
  actionText: { marginLeft: 5, fontSize: 14, color: '#fff' },
});