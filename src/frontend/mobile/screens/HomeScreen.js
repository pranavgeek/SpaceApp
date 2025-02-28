import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import ProjectCard from "../components/ProjectCard";
import { useTheme } from '../theme/ThemeContext.js';

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

   const { colors } = useTheme();
   const styles = getDynamicStyles(colors);

  const filters = [
    "Software",
    "Hardware",
    "AI Tools",
    "Cloud",
    "Feature",
    "Startups",
    "Creators",
  ];

  // const featuredProjects = [
  //   {
  //     id: "1",
  //     title: "Project One",
  //     image:
  //       "https://res.cloudinary.com/onio/image/upload/v1693212924/medium_onio_the_internetofthings_fc2234d89a.jpg",
  //   },
  //   {
  //     id: "2",
  //     title: "Project Two",
  //     image:
  //       "https://timesproweb-static-backend-prod.s3.ap-south-1.amazonaws.com/Cloud_Computing_Project_Ideas_and_Topics_86a7d85325.webp",
  //   },
  //   {
  //     id: "3",
  //     title: "Project Three",
  //     image:
  //       "https://cdn.shopify.com/s/files/1/0560/4789/4710/t/20/assets/hardware_projects_for_computer_engineering_students-engdXX.True?v=1707824725",
  //   },
  //   {
  //     id: "4",
  //     title: "Project Four",
  //     image:
  //       "https://hillmancurtis.com/wp-content/uploads/2022/09/iot-devices.jpg",
  //   },
  // ];

  const projects = [
    {
      id: "1",
      creator: {
        name: "John Doe",
        image:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      },
      category: "Software",
      project: {
        name: "My App",
        description: "This is a sample project description.",
        image:
          "https://viso.ai/wp-content/smush-webp/2024/02/Computer-vision-for-robotics-1536x864.jpg.webp",
        price: "$299",
        likes: 120,
        views: 400,
      },
    },
    {
      id: "2",
      creator: {
        name: "Jane Smith",
        image:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      },
      category: "Hardware",
      project: {
        name: "Cool Gadget",
        description:
          "This is another sample project using some new technologies.",
        image:
          "https://cdn.prod.website-files.com/63f471ed5975db4280f5573f/65c9dcbacfce6029a3d241b2_what-is-deep-learning.jpg.webp",
        price: "$499",
        likes: 340,
        views: 900,
      },
    },
  ];

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setShowFilters(true);
    } else {
      setSearchText("");
      setSelectedFilter(null);
      setShowFilters(false);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const performSearch = () => {
    console.log("Searching for:", searchText, "with filter:", selectedFilter);
  };

  const clearSearch = () => {
    setSearchText("");
  };

  // Filter the projects based on both selectedFilter and searchText
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.project.name
      .toLowerCase()
      .includes(searchText.toLowerCase());

    // Apply selected filter (if any)
    const matchesCategory =
      selectedFilter === null || project.category === selectedFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* Fixed Header with Search */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <View style={[styles.searchBar, styles.searchBarExpanded]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />

            <TouchableOpacity onPress={toggleSearch} style={styles.filterIcon}>
              <Ionicons name="filter" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Expandable Filter Area */}
        {isSearchExpanded && (
          <View style={styles.searchControlsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersContainer}
              contentContainerStyle={styles.filtersContent}
            >
              {filters.map((filter, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterPill,
                    selectedFilter === filter && styles.selectedFilterPill,
                  ]}
                  onPress={() => {
                    setSelectedFilter(
                      filter === selectedFilter ? null : filter
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      selectedFilter === filter &&
                        styles.selectedFilterPillText,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Main Content */}
      <ScrollView
        style={[
          styles.content,
          isSearchExpanded && showFilters && styles.contentWithFilters,
        ]}
      >
        {/* <ScrollView horizontal style={styles.carousel}>
          {featuredProjects.map((project) => (
            <Image
              key={project.id}
              source={{ uri: project.image }}
              style={styles.carouselImage}
            />
          ))}
        </ScrollView> */}

        {/* Filtered Projects Display */}
        {/* Projects List */}
        {Platform.OS === "web" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {filteredProjects.map((item) => (
              <View key={item.id} style={styles.projectContainer}>
                <ProjectCard
                  item={item}
                  onPress={() =>
                    navigation.navigate("Project", {
                      project: item.project,
                      creator: item.creator,
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredProjects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProjectCard
                item={item}
                onPress={() =>
                  navigation.navigate("Project", {
                    project: item.project,
                    creator: item.creator,
                  })
                }
              />
            )}
          />
        )}
      </ScrollView>
    </View>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.baseContainerHeader,
      paddingTop: 20, // For status bar
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.subtitle,
      zIndex: 10,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      height: 40,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 15,
      justifyContent: "flex-end",
      borderWidth: 2,
      borderColor: colors.primary,
    },
    // searchButton: {
    //   backgroundColor: colors.primary,
    //   paddingVertical: 8,
    //   paddingHorizontal: 15,
    //   borderRadius: 50,
    // },
    // searchButtonText: {
    //   color: colors.text,
    //   fontWeight: "500",
    // },
    searchBarExpanded: {
      backgroundColor: colors.baseContainerBody,
      borderRadius: 20,
      paddingHorizontal: 15,
      marginLeft: 15,
      justifyContent: "space-between",
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: colors.text,
      backgroundColor: colors.baseContainerFooter,
      backgroundColor: "transparent",
      fontSize: 16,
    },
    searchControlsContainer: {
      paddingHorizontal: 15,
      paddingTop: 10,
    },
    filtersContainer: {
      marginTop: 10,
      maxHeight: 50,
    },
    filtersContent: {
      paddingBottom: 10,
    },
    filterPill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.baseContainerBody,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.subtitle,
    },
    selectedFilterPill: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterPillText: {
      color: colors.text,
      fontWeight: "500",
    },
    selectedFilterPillText: {
      color: colors.background,
      fontWeight: "bold",
    },
    content: {
      flex: 1,
      paddingTop: 10,
    },
    contentWithFilters: {
      paddingTop: 0,
    },
  // carousel: {
  //   height: 200,
  //   marginBottom: 20,
  // },
  // carouselImage: {
  //   width: 300,
  //   height: 200,
  //   marginHorizontal: 10,
  //   borderRadius: 10,
  // },
});

export default HomeScreen;
