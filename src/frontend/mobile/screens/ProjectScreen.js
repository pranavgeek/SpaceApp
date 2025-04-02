import React, { useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useCart } from "../context/CartContext";
import { useLikeContext } from "../theme/LikeContext";
import { getProjectId } from "../context/projectIdHelper";
import {
  fetchProductById,
  fetchReviews,
  createReview,
} from "../backend/db/API.js";

const ProjectScreen = ({ route, navigation }) => {
  const { project, creator } = route.params;
  const { toggleLike, getLikes } = useLikeContext();
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const styles = getDynamicStyles(colors);

  // For image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const imageCount = 3; // adjust if needed

  // State for product details, loading, and errors
  const [productDetail, setProductDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Use a stable project ID
  const projectId = getProjectId(project);
  const isLiked = getLikes(projectId);

  // Dimensions for image gallery
  const { width } = Dimensions.get("window");
  const isMobileWeb = Platform.OS === "web" && width < 768;
  const imageWidth = Platform.OS === "web" && !isMobileWeb ? 550 : 320;
  const imageHeight = Platform.OS === "web" && !isMobileWeb ? 550 : 300;

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // If product details are already in the project object, use those
        if (project.name && project.price) {
          setProductDetail({
            product_name: project.name,
            description: project.description,
            summary: project.summary,
            product_image: project.image,
            cost: project.price,
            currency: "USD", // Add a default currency if not provided
            likes: project.likes || 0,
          });
          setLoading(false);
          return;
        }

        // If we need to fetch from backend, but no ID is available
        console.warn(
          "Unable to fetch product details: No unique identifier found"
        );

        // Fallback to using project data
        setProductDetail({
          product_name: project.name || "Unnamed Product",
          description: project.description || "No description available",
          summary: project.summary || "No summary available",
          product_image: project.image || "",
          cost: project.price || 0,
          currency: "USD",
          likes: project.likes || 0,
        });
      } catch (error) {
        console.error("Error processing product details:", error);

        setError({
          message: "Unable to load product details",
          code: 404,
        });
      } finally {
        setLoading(false);
      }
    };

    // Only attempt to process if we have a project
    if (project) {
      fetchProductDetails();
    }
  }, [project]);

  // Fetch reviews
  useEffect(() => {
    const fetchProductReviews = async () => {
      try {
        // Use the product ID from either productDetail or project
        const prodId = Number(
          productDetail ? productDetail.product_id : project.product_id
        );

        // Fetch reviews for this specific product
        const fetchedReviews = await fetchReviews(prodId);

        // Map reviews to the format you're using in the UI
        const mappedReviews = fetchedReviews.map((r) => ({
          name: `User ${r.user_id}`,
          date: new Date(r.date_timestamp || Date.now()).toLocaleDateString(),
          rating: r.number_stars,
          text: r.review,
        }));

        setReviews(mappedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        // Optionally set an error state or show a user-friendly message
      }
    };

    // Only fetch reviews if we have a product ID
    if (productDetail || project.product_id) {
      fetchProductReviews();
    }
  }, [productDetail, project]);

  // Handle image gallery scrolling
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
  

  // Handle adding to cart
  const handleAddToCart = () => {
    const cartItem = { ...displayProduct, cartItemId: projectId };
    addToCart(cartItem);
  };

  // Handle like toggle
  const handleToggleLike = () => {
    toggleLike(projectId);
  };

  // Handle adding a review
  const handleAddReview = async () => {
    if (!reviewText.trim()) {
      alert("Please enter your review text.");
      return;
    }

    try {
      // Prepare review data
      const reviewData = {
        product_id: Number(
          productDetail ? productDetail.product_id : project.product_id
        ),
        user_id: 1, // TODO: Replace with actual current user ID
        number_stars: reviewRating,
        review: reviewText.trim(),
        date_timestamp: new Date().toISOString(),
      };

      // Send review to API
      const createdReview = await createReview(reviewData);

      // Update local state
      const newReview = {
        name: `User ${createdReview.user_id}`,
        date: new Date(createdReview.date_timestamp).toLocaleDateString(),
        rating: createdReview.number_stars,
        text: createdReview.review,
      };

      setReviews([...reviews, newReview]);
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewText("");
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  // Determine the product to display
  const displayProduct = productDetail
    ? {
        name: productDetail.product_name,
        description: productDetail.description,
        summary: productDetail.summary,
        image: productDetail.product_image.startsWith("http")
          ? productDetail.product_image
          : `http://10.0.0.25:5001/${productDetail.product_image}`,
        price: productDetail.cost,
        currency: productDetail.currency,
        likes: productDetail.likes || project.likes || 0,
        reviews: productDetail.reviews || [],
      }
    : project;

  // Displayed likes (accounting for current user's like)
  const displayedLikes = displayProduct.likes + (isLiked ? 1 : 0);

  // Loading state
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error.message}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setLoading(true);
          }}
          style={styles.retryButton}
        >
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={
          Platform.OS === "web" && !isMobileWeb
            ? styles.webContentContainer
            : styles.contentContainer
        }
      >
        {/* Image Gallery */}
        <View
          style={
            Platform.OS === "web" && !isMobileWeb
              ? styles.webImageContainer
              : null
          }
        >
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
                {[
                  displayProduct.image,
                  displayProduct.image,
                  displayProduct.image,
                ].map((img, index) => (
                  <View
                    key={index}
                    style={[
                      styles.imageCard,
                      { width: imageWidth, height: imageHeight },
                    ]}
                  >
                    <Image
                      source={{ uri: img }}
                      style={styles.galleryImage}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => handleScroll("right")}>
                <Ionicons
                  name="chevron-forward"
                  size={30}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.galleryWrapper,
                {
                  height: imageHeight,
                  width: imageWidth,
                  position: "relative",
                  alignSelf: "center",
                },
              ]}
            >
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: "center" }}
              >
                {[
                  displayProduct.image,
                  displayProduct.image,
                  displayProduct.image,
                ].map((img, index) => (
                  <View
                    key={index}
                    style={[
                      styles.imageCard,
                      { width: imageWidth, height: imageHeight },
                    ]}
                  >
                    <Image source={{ uri: img }} style={styles.galleryImage} />
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => handleScroll("left")}
                style={styles.arrowButtonLeft}
              >
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleScroll("right")}
                style={styles.arrowButtonRight}
              >
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View>
              <Text style={[styles.projectName, { color: colors.text }]}>
                {displayProduct.name}
              </Text>
              <Text style={[styles.projectPrice, { color: colors.success }]}>
                {displayProduct.currency} {displayProduct.price}
              </Text>
            </View>
            <View style={styles.creatorInfo}>
              <Image
                source={{ uri: creator.image }}
                style={styles.creatorImage}
              />
              <Text style={[styles.creatorName, { color: colors.text }]}>
                {"By " + creator.name}
              </Text>
            </View>
          </View>
          <Text style={[styles.projectDescription, { color: colors.subtitle }]}>
            {displayProduct.description}
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.subtitle }]}>
            Summary
          </Text>
          <Text style={[styles.longDescription, { color: colors.subtitle }]}>
            {displayProduct.summary}
          </Text>

          {/* Add to Cart */}
          <TouchableOpacity
            onPress={handleAddToCart}
            style={[
              styles.addToCartButton,
              { backgroundColor: colors.buttonBackground },
            ]}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleLike}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? colors.error : colors.text}
          />
          <Text style={[styles.actionText, { color: colors.text }]}>
            {displayedLikes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Messages")}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            Message
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews Section */}
      <View style={styles.reviewSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Reviews
        </Text>
        {reviews.map((review, index) => (
          <View
            key={index}
            style={[
              styles.reviewItem,
              { backgroundColor: colors.baseContainerBody },
            ]}
          >
            <Text style={[styles.reviewerName, { color: colors.text }]}>
              {review.name}
            </Text>
            <Text style={[styles.reviewDate, { color: colors.subtitle }]}>
              {review.date}
            </Text>
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
            <Text style={[styles.reviewText, { color: colors.text }]}>
              {review.text}
            </Text>
          </View>
        ))}
        {!showReviewForm && (
          <TouchableOpacity onPress={() => setShowReviewForm(true)}>
            <Text style={[styles.writeReviewLink, { color: colors.primary }]}>
              Write a Review
            </Text>
          </TouchableOpacity>
        )}
        {showReviewForm && (
          <View style={[styles.reviewForm, { borderColor: colors.subtitle }]}>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                >
                  <Ionicons
                    name={star <= reviewRating ? "star" : "star-outline"}
                    size={24}
                    color="gold"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[
                styles.reviewInput,
                { color: colors.text, borderColor: colors.subtitle },
              ]}
              placeholder="Write your review..."
              placeholderTextColor={colors.subtitle}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.submitReviewButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleAddReview}
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
    galleryImage: {
      width: 310,
      height: 200,
      marginHorizontal: 10,
      borderRadius: 10,
    },
    infoContainer: { padding: 15 },
    contentContainer: { padding: 15 },
    webContentContainer: { flexDirection: "row", padding: 15 },
    webImageContainer: { marginRight: 20, width: 625, height: 550 },
    webInfoContainer: { flex: 1 },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    projectName: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
    projectPrice: { fontSize: 18, marginBottom: 10 },
    creatorInfo: { alignItems: "center" },
    creatorImage: { width: 40, height: 40, borderRadius: 20, marginBottom: 5 },
    creatorName: { fontSize: 14, fontWeight: "bold" },
    projectDescription: { fontSize: 16, marginBottom: 10 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 20,
      marginBottom: 10,
    },
    longDescription: { fontSize: 16, lineHeight: 22 },
    addToCartButton: {
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
    },
    addToCartButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
    actionsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle,
    },
    actionButton: { flexDirection: "row", alignItems: "center" },
    actionText: { marginLeft: 5, fontSize: 16 },
    reviewSection: {
      paddingHorizontal: 15,
      paddingBottom: 30,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle,
    },
    reviewItem: { marginTop: 10, borderRadius: 8, padding: 10 },
    reviewerName: { fontWeight: "bold", fontSize: 14 },
    reviewDate: { fontSize: 12, marginBottom: 4 },
    starRow: { flexDirection: "row", marginBottom: 4 },
    reviewText: { fontSize: 14 },
    writeReviewLink: { marginTop: 10, fontWeight: "600", fontSize: 16 },
    reviewForm: { marginTop: 10, padding: 10, borderWidth: 1, borderRadius: 8 },
    starContainer: { flexDirection: "row", marginBottom: 10 },
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
    submitReviewButtonText: { fontSize: 16, fontWeight: "bold" },
    // Web styles if needed
    webContentContainer: { flexDirection: "row", padding: 15 },
    webImageContainer: { marginRight: 20, width: 625, height: 550 },
    webInfoContainer: { flex: 1 },
    arrowButtonLeft: {
      position: "absolute",
      left: 16,
      top: "50%",
      transform: [{ translateY: -24 }],
      backgroundColor: "#00000088",
      borderRadius: 100,
      padding: 10,
      zIndex: 10,
    },

    arrowButtonRight: {
      position: "absolute",
      right: 16,
      top: "50%",
      transform: [{ translateY: -24 }],
      backgroundColor: "#00000088",
      borderRadius: 100,
      padding: 10,
      zIndex: 10,
    },

    galleryWrapper: {
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },

    imageCard: {
      backgroundColor: "#f2f2f2",
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      // marginHorizontal: 10,
      overflow: "hidden",
      paddingHorizontal: 0,
    },

    galleryImage: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
      borderRadius: 20,
    },
  });

export default ProjectScreen;
