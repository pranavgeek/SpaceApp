import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; 
import { Modalize } from "react-native-modalize";
import ProjectCard from "../components/ProjectCard";

const HomeScreen = ({ navigation }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(null);

  const filters = [
    "Software",
    "Hardware",
    "AI Tools",
    "Cloud",
    "Feature",
    "Startups",
    "Creators",
  ];

  const featuredProjects = [
    // Sample featured projects for the carousel
    { id: "1", title: "Project One", image: "https://res.cloudinary.com/onio/image/upload/v1693212924/medium_onio_the_internetofthings_fc2234d89a.jpg" },
    { id: "2", title: "Project Two", image: "https://timesproweb-static-backend-prod.s3.ap-south-1.amazonaws.com/Cloud_Computing_Project_Ideas_and_Topics_86a7d85325.webp" },
    { id: "3", title: "Project Three", image: "https://cdn.shopify.com/s/files/1/0560/4789/4710/t/20/assets/hardware_projects_for_computer_engineering_students-engdXX.True?v=1707824725" },
    { id: "4", title: "Project Four", image: "https://hillmancurtis.com/wp-content/uploads/2022/09/iot-devices.jpg" },
  ];

  const projects = [
    // Sample project cards
    {
      id: "1",
      creator: { name: "John Doe", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80" },
      category: "Software",
      project: {
        name: "My App",
        description: "This is a sample project description.",
        image: "https://viso.ai/wp-content/smush-webp/2024/02/Computer-vision-for-robotics-1536x864.jpg.webp",
        price: "$299",
        likes: 120,
        views: 400,
      },
    },
    {
      id: "2",
      creator: { name: "Jane Smith", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80" },
      category: "Hardware",
      project: {
        name: "Cool Gadget",
        description: "This is another sample project using some new technologies.",
        image: "https://cdn.prod.website-files.com/63f471ed5975db4280f5573f/65c9dcbacfce6029a3d241b2_what-is-deep-learning.jpg.webp",
        price: "$499",
        likes: 340,
        views: 900,
      },
    },
  ];

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.searchButton} onPress={toggleModal}>
        <Ionicons name="search-outline" size={24} color="black" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={toggleModal}
      >
        <View style={styles.modalContainer}>
          {/* Swipe Gesture */}
          <View style={styles.swipeIndicator} />

          {/* Search Input */}
          <View style={styles.searchFieldContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={setSearchText}
            />
            <Ionicons name="search-outline" size={24} color="gray" style={styles.searchIcon} />
          </View>

          {/* Filters Grid */}
          <View style={styles.filtersGrid}>
            {filters.map((filter, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.selectedFilter,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={styles.filterText}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={toggleModal}
          >
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>


      <ScrollView>
        <ScrollView horizontal style={styles.carousel}>
          {featuredProjects.map((project) => (
            <Image
              key={project.id}
              source={{ uri: project.image }}
              style={styles.carouselImage}
            />
          ))}
        </ScrollView>

        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard 
              item={item} 
              onPress={() =>
                navigation.navigate("Project", { project: item.project, creator: item.creator })
              }
            />
          )}
        />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  searchButton: { position: "absolute", top: 40, right: 20, zIndex: 1 },
  modalContainer: {
    flex: 1,
    backgroundColor: "#343434",
    padding: 20,
    marginTop: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  swipeIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 10,
    borderRadius: 2.5,
  },
  searchFieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 40,
    color: '#ccc',
  },
  searchIcon: {
    marginLeft: 10,
  },
  filtersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  filterButton: {
    width: "30%", // Adjust for 3 columns
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    alignItems: "center",
  },
  selectedFilter: {
    backgroundColor: "#aaa",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
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
  carousel: { height: 200, marginBottom: 20, marginTop: 20 },
  carouselImage: { width: 300, height: 200, marginHorizontal: 10 },
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

export default HomeScreen;
