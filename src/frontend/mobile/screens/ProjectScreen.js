import React, { useState, useRef } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useCart } from "../context/CartContext";
import { useLikeContext } from "../theme/LikeContext";
import { getProjectId } from "../context/projectIdHelper";

const ProjectScreen = ({ route, navigation }) => {
  const { project, creator } = route.params;
  const { toggleLike, getLikes } = useLikeContext();
  const { colors } = useTheme();
  const { addToCart } = useCart();

  const styles = getDynamicStyles(colors);

  // Image gallery state and ref
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const imageCount = 3; // adjust if you have more images

  // Use stable project ID
  const projectId = getProjectId(project);

  // Global like state
  const isLiked = getLikes(projectId);
  const displayedLikes = project.likes + (isLiked ? 1 : 0);

  const handleToggleLike = () => {
    toggleLike(projectId);
  };

  const handleOpenLink = () => {
    const projectUrl = "https://example.com"; // Replace with actual URL
    Linking.openURL(projectUrl);
  };

  const handleAddToCart = () => {
    const cartItem = { ...project, cartItemId: projectId };
    addToCart(cartItem);
  };

  const { width } = Dimensions.get("window");
  const isMobileWeb = Platform.OS === "web" && width < 768;
  const imageWidth = Platform.OS === "web" && !isMobileWeb ? 550 : 320;
  const imageHeight = Platform.OS === "web" && !isMobileWeb ? 550 : 200;

  const handleScroll = (direction) => {
    setCurrentImageIndex((prevIndex) => {
      const newIndex =
        direction === "left"
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={
          Platform.OS === "web" && !isMobileWeb
            ? styles.webContentContainer
            : styles.contentContainer
        }
      >
         {/* Image Gallery */}
         <View style={(Platform.OS === "web" && !isMobileWeb) ? styles.webImageContainer : null}>
          {Platform.OS === "web" && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => handleScroll("left")}>
                <Ionicons name="chevron-back" size={30} color={colors.text} />
              </TouchableOpacity>

              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
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
                <Ionicons
                  name="chevron-forward"
                  size={30}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Image Gallery (For Mobile - No Changes) */}
          {Platform.OS !== "web" && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => handleScroll("left")}>
                <Ionicons name="chevron-back" size={30} color={colors.text} />
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
                <Ionicons
                  name="chevron-forward"
                  size={30}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Project Info */}
        <View
          style={
            Platform.OS === "web" && !isMobileWeb
              ? styles.webInfoContainer
              : styles.infoContainer
          }
        >
          <View style={styles.infoRow}>
            <View>
              <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
              <Text style={[styles.projectPrice, { color: colors.success }]}>{project.price}</Text>
            </View>
            <View style={styles.creatorInfo}>
              <Image source={{ uri: creator.image }} style={styles.creatorImage} />
              <Text style={[styles.creatorName, { color: colors.text }]}>
                {"By " + creator.name}
              </Text>
            </View>
          </View>
          <Text style={[styles.projectDescription, { color: colors.subtitle }]}>{project.description}</Text>
          <Text style={[styles.sectionTitle, { color: colors.subtitle }]}>Detailed Description</Text>
          <Text style={[styles.longDescription, { color: colors.subtitle }]}>
            This is a longer description of the project. You can include any relevant details here.
          </Text>
          <TouchableOpacity onPress={handleOpenLink} style={styles.linkContainer}>
            <Text style={[styles.projectLink, { color: colors.text }]}>Visit Project Website</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddToCart}
            style={[styles.addToCartButton, { backgroundColor: colors.buttonBackground }]}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleToggleLike}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? colors.error : colors.text}
          />
          <Text style={[styles.actionText, { color: colors.text }]}>{displayedLikes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Messages")}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1 },
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
    contentContainer: {
      // Styles for mobile and mobile web
      padding: 15,
    },
    webContentContainer: {
      flexDirection: "row",
      padding: 15,
    },
    webImageContainer: {
      marginRight: 20,
      width: 625,
      height: 550,
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
    },
    projectPrice: {
      fontSize: 18,
      marginBottom: 10,
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
    },
    projectDescription: {
      fontSize: 16,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 20,
      marginBottom: 10,
    },
    longDescription: {
      fontSize: 16,
      lineHeight: 22,
    },
    linkContainer: {
      marginTop: 20,
      marginBottom: 30,
    },
    projectLink: {
      fontSize: 16,
      textDecorationLine: "underline",
    },
    actionsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle, // Use subtitle color for border
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionText: {
      marginLeft: 5,
      fontSize: 16,
    },
    addToCartButton: {
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
