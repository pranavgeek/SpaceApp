import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function SearchResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { projects = [] } = route.params || {};
  const [localSearch, setLocalSearch] = useState("");

  const filteredProjects = projects.filter((item) => {
    const projectName = (item.project?.name || "").toLowerCase();
    const creatorName = (item.creator?.name || "").toLowerCase();
    const text = localSearch.toLowerCase();

    if (!text) return true;
    return projectName.includes(text) || creatorName.includes(text);
  });

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() =>
        navigation.navigate("Project", {
          project: item.project,
          creator: item.creator,
        })
      }
    >
      <Image
        source={{ uri: item.project?.image }}
        style={styles.projectImage}
      />
      <View style={styles.textContainer}>
        <Text style={styles.projectName}>{item.project?.name}</Text>
        <Text style={styles.creatorName}>By {item.creator?.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search projects or creators..."
        onChangeText={setLocalSearch}
        value={localSearch}
      />

      {localSearch.trim() === "" ? (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderSuggestion}
        />
      ) : filteredProjects.length === 0 ? (
        <Text style={styles.noResultsText}>No results found.</Text>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={renderSuggestion}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  noResultsText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#555",
  },
  suggestionItem: {
    flexDirection: "row", // Align image and text horizontally
    alignItems: "center", // Center items vertically
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  projectImage: {
    width: 50,
    height: 50,
    borderRadius: 25, // Make it a circle
    marginRight: 10,
  },
  textContainer: {
    flex: 1, // Allow text to take remaining space
  },
  projectName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  creatorName: {
    fontSize: 14,
    color: "#888",
  },
});