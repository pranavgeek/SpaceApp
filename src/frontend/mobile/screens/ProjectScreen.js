import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import { useLikeContext } from "../screens/LikeContext";
import { Ionicons } from "@expo/vector-icons";

const ProjectScreen = ({ route, navigation }) => {
  const { project, creator } = route.params;
  const { toggleLike, getLikes } = useLikeContext();
  const [likes, setLikes] = useState(project.likes);
  const [liked, setLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    setLiked(getLikes(project.id));
  }, [project.id, getLikes]);

  const toggleLikeStatus = () => {
    toggleLike(project.id);
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const handleOpenLink = () => {
    const projectUrl = "https://example.com";
    Linking.openURL(projectUrl);
  };

  const imageWidth = Platform.OS === "web" ? 550 : 320;
  const imageHeight = Platform.OS === "web" ? 550 : 200;
  const imageCount = 3;

  const handleScroll = (direction) => {
    setCurrentImageIndex((prevIndex) => {
      const newIndex = direction === "left"
        ? Math.max(prevIndex - 1, 0)
        : Math.min(prevIndex + 1, imageCount - 1);
      scrollViewRef.current?.scrollTo({
        x: newIndex * imageWidth,
        y: 0,
        animated: true,
      });
      return newIndex;
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View
        style={
          Platform.OS === "web"
            ? styles.webContentContainer
            : styles.contentContainer
        }
      >
        {/* Image Gallery (Left Side on Web) */}
        <View style={Platform.OS === "web" ? styles.webImageContainer : null}>
          {Platform.OS === "web" && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => handleScroll("left")}>
                <Ionicons name="chevron-back" size={30} color="white" />
              </TouchableOpacity>

              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false} // This disables manual scrolling
              >
                {[project.image, project.image, project.image].map(
                  (img, index) => (
                    <Image
                      key={index}
                      source={{ uri: img }}
                      style={[
                        styles.galleryImage,
                        { width: imageWidth, height: imageHeight },
                      ]}
                    />
                  )
                )}
              </ScrollView>

              <TouchableOpacity onPress={() => handleScroll("right")}>
                <Ionicons name="chevron-forward" size={30} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Image Gallery (For Mobile - No Changes) */}
          {Platform.OS !== "web" && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => handleScroll("left")}>
                <Ionicons name="chevron-back" size={30} color="white" />
              </TouchableOpacity>

              <ScrollView
                ref={scrollViewRef}
                horizontal
                style={styles.imageGallery}
                showsHorizontalScrollIndicator={false}
              >
                {[project.image, project.image, project.image].map(
                  (img, index) => (
                    <Image
                      key={index}
                      source={{ uri: img }}
                      style={styles.galleryImage}
                    />
                  )
                )}
              </ScrollView>

              <TouchableOpacity onPress={() => handleScroll("right")}>
                <Ionicons name="chevron-forward" size={30} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Project Info (Right Side on Web) */}
        <View
          style={
            Platform.OS === "web"
              ? styles.webInfoContainer
              : styles.infoContainer
          }
        >
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectPrice}>{project.price}</Text>
            </View>
            <View style={styles.creatorInfo}>
              <Image
                source={{ uri: creator.image }}
                style={styles.creatorImage}
              />
              <Text style={styles.creatorName}>{"By " + creator.name}</Text>
            </View>
          </View>
          <Text style={styles.projectDescription}>{project.description}</Text>

          <Text style={styles.sectionTitle}>Detailed Description</Text>
          <Text style={styles.longDescription}>
            This is a longer description of the project. You can include any
            relevant details about the project here. For instance, you can talk
            about its features, functionality, and anything else that might be
            of interest to potential users.
          </Text>

          <TouchableOpacity
            onPress={handleOpenLink}
            style={styles.linkContainer}
          >
            <Text style={styles.projectLink}>Visit Project Website</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addToCartButton}>
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleLikeStatus}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={20}
            color={liked ? "red" : "white"}
          />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Messages")}
        >
          <Ionicons name="chatbubble-outline" size={20} color="white" />
          <Text style={styles.actionText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={20} color="white" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  imageGallery: {
    height: 200,
    marginVertical: 10,
  },
  galleryImage: {
    width: 310,
    height: 200,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  infoContainer: {
    padding: 15,
  },
  webContentContainer: {
    flexDirection: "row",
    padding: 15,
  },
  webImageContainer: {
    marginRight: 20,
    width: 625,
    height: 550
  },
  webInfoContainer: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  projectName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#fff",
  },
  projectPrice: {
    fontSize: 18,
    color: "green",
    marginBottom: 10,
    color: "#ccc",
  },
  creatorInfo: {
    alignItems: "center",
  },
  creatorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 5,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  projectDescription: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#ccc",
  },
  longDescription: {
    fontSize: 16,
    color: "#aaa",
    lineHeight: 22,
  },
  linkContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  projectLink: {
    fontSize: 16,
    color: "#fff",
    textDecorationLine: "underline",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#aaa",
  },
  addToCartButton: {
    backgroundColor: "#2e64e5",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  addToCartButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProjectScreen;