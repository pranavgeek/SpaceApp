import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

  // Image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const imageCount = 3; // adjust if needed

  // Get stable project ID
  const projectId = getProjectId(project);

  // Like state
  const isLiked = getLikes(projectId);
  const displayedLikes = project.likes + (isLiked ? 1 : 0);

  const handleToggleLike = () => {
    toggleLike(projectId);
  };

  // Cart
  const handleAddToCart = () => {
    const cartItem = { ...project, cartItemId: projectId };
    addToCart(cartItem);
  };

  // Dimensions for image gallery
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

  // ★★★ REVIEW FEATURE ★★★

  // Example: one existing review
  const [reviews, setReviews] = useState([
    {
      name: "Amy Schmidt",
      date: "2025-03-16",
      rating: 4,
      text: "Alex provided exceptional service with a warm smile and attentive care. Highly recommend his friendly demeanor and menu knowledge!",
    },
  ]);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const handleAddReview = () => {
    if (!reviewText.trim()) {
      alert("Please enter your review text.");
      return;
    }
    // For demonstration, let's assume the reviewer is "CurrentUser" and date is "today"
    const newReview = {
      name: "CurrentUser",
      date: new Date().toLocaleDateString(),
      rating: reviewRating,
      text: reviewText.trim(),
    };
    setReviews([...reviews, newReview]);
    setShowReviewForm(false);
    setReviewRating(0);
    setReviewText("");
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
        <View style={Platform.OS === "web" && !isMobileWeb ? styles.webImageContainer : null}>
          {Platform.OS === "web" ? (
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
                {[project.image, project.image, project.image].map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img }}
                    style={[styles.galleryImage, { width: imageWidth, height: imageHeight }]}
                  />
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => handleScroll("right")}>
                <Ionicons name="chevron-forward" size={30} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
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
                {[project.image, project.image, project.image].map((img, index) => (
                  <Image key={index} source={{ uri: img }} style={styles.galleryImage} />
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => handleScroll("right")}>
                <Ionicons name="chevron-forward" size={30} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Project Info */}
        <View
          style={
            Platform.OS === "web" && !isMobileWeb ? styles.webInfoContainer : styles.infoContainer
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
          <Text style={[styles.projectDescription, { color: colors.subtitle }]}>
            {project.description}
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.subtitle }]}>Detailed Description</Text>
          <Text style={[styles.longDescription, { color: colors.subtitle }]}>
            This is a longer description of the project. You can include any relevant details here.
          </Text>

          {/* Add to Cart */}
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Messages")}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* ★★★ REVIEWS SECTION ★★★ */}
      <View style={styles.reviewSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
        {/* Existing Reviews */}
        {reviews.map((review, index) => (
          <View key={index} style={[styles.reviewItem, { backgroundColor: colors.baseContainerBody }]}>
            <Text style={[styles.reviewerName, { color: colors.text }]}>{review.name}</Text>
            <Text style={[styles.reviewDate, { color: colors.subtitle }]}>{review.date}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= review.rating ? "star" : "star-outline"}
                  size={16}
                  color="gold"
                />
              ))}
            </View>
            <Text style={[styles.reviewText, { color: colors.text }]}>{review.text}</Text>
          </View>
        ))}

        {/* "Write a Review" button or form */}
        {!showReviewForm && (
          <TouchableOpacity onPress={() => setShowReviewForm(true)}>
            <Text style={[styles.writeReviewLink, { color: colors.primary }]}>Write a Review</Text>
          </TouchableOpacity>
        )}

        {showReviewForm && (
          <View style={[styles.reviewForm, { borderColor: colors.subtitle }]}>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                  <Ionicons
                    name={star <= reviewRating ? "star" : "star-outline"}
                    size={24}
                    color="gold"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.reviewInput, { color: colors.text, borderColor: colors.subtitle }]}
              placeholder="Write your review..."
              placeholderTextColor={colors.subtitle}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
            />
            <TouchableOpacity
              style={[styles.submitReviewButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (!reviewText.trim()) {
                  alert("Please enter your review text.");
                  return;
                }
                const newReview = {
                  name: "CurrentUser",
                  date: new Date().toLocaleDateString(),
                  rating: reviewRating,
                  text: reviewText.trim(),
                };
                setReviews([...reviews, newReview]);
                setShowReviewForm(false);
                setReviewRating(0);
                setReviewText("");
              }}
            >
              <Text style={[styles.submitReviewButtonText, { color: "#fff" }]}>
                Submit Review
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1 },
    imageGallery: { height: 200, marginVertical: 10 },
    galleryImage: { width: 310, height: 200, marginHorizontal: 10, borderRadius: 10 },
    infoContainer: { padding: 15 },
    contentContainer: { padding: 15 },
    webContentContainer: { flexDirection: "row", padding: 15 },
    webImageContainer: { marginRight: 20, width: 625, height: 550 },
    webInfoContainer: { flex: 1 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    projectName: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
    projectPrice: { fontSize: 18, marginBottom: 10 },
    creatorInfo: { alignItems: "center" },
    creatorImage: { width: 40, height: 40, borderRadius: 20, marginBottom: 5 },
    creatorName: { fontSize: 14, fontWeight: "bold" },
    projectDescription: { fontSize: 16, marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
    longDescription: { fontSize: 16, lineHeight: 22 },
    actionsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle,
    },
    actionButton: { flexDirection: "row", alignItems: "center" },
    actionText: { marginLeft: 5, fontSize: 16 },
    addToCartButton: { padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
    addToCartButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },

    // ★★ Review Styles ★★
    reviewSection: {
      paddingHorizontal: 15,
      paddingBottom: 30,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle,
    },
    reviewItem: {
      marginTop: 10,
      borderRadius: 8,
      padding: 10,
    },
    reviewerName: {
      fontWeight: "bold",
      fontSize: 14,
    },
    reviewDate: {
      fontSize: 12,
      marginBottom: 4,
    },
    starRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    reviewText: {
      fontSize: 14,
    },
    writeReviewLink: {
      marginTop: 10,
      fontWeight: "600",
      fontSize: 16,
    },
    reviewForm: {
      marginTop: 10,
      padding: 10,
      borderWidth: 1,
      borderRadius: 8,
    },
    starContainer: {
      flexDirection: "row",
      marginBottom: 10,
    },
    reviewInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 8,
      marginBottom: 10,
      height: 80,
      textAlignVertical: "top",
    },
    submitReviewButton: {
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    submitReviewButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default ProjectScreen;
