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
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useCart } from "../context/CartContext";
import { useLikeContext } from "../theme/LikeContext";
import { getProjectId } from "../context/projectIdHelper";
import {
  fetchProductById,
  fetchProducts,
  fetchReviews,
  createReview,
  findProductIdByName,
} from "../backend/db/API.js";

const ProjectScreen = ({ route, navigation }) => {
  const { project, creator } = route.params;
  const { toggleLike, getLikes } = useLikeContext();
  const { colors } = useTheme();
  const { addToCart } = useCart();
  
  // Get window dimensions for responsive layout
  const { width } = Dimensions.get("window");
  
  // Define breakpoints for responsive design
  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= 1024;
  const isTablet = isWeb && width >= 768 && width < 1024;
  const isMobile = !isWeb || width < 768;
  
  // Apply appropriate styles based on device/screen size
  const styles = getDynamicStyles(colors, { isWeb, isDesktop, isTablet, isMobile });

  // For image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const imageCount = 3; // adjust if needed
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  // State for product details, loading, and errors
  const [productDetail, setProductDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Use a stable project ID
  const projectId = getProjectId(project);
  const isLiked = getLikes(projectId);

  // Helper function to dynamically get product ID
  const getProductId = async () => {
    // Try direct ID sources first
    if (project?.product_id) return Number(project.product_id);
    if (productDetail?.product_id && productDetail.product_id !== null) return Number(productDetail.product_id);
    if (project?.id) return Number(project.id);
    if (project?.productId) return Number(project.productId);
    
    // Try to get ID by product name
    const productName = project?.name || productDetail?.product_name;
    if (productName) {
      console.log(`Looking up product ID for name: ${productName}`);
      const foundId = await findProductIdByName(productName);
      if (foundId) {
        console.log(`Found product ID ${foundId} for product "${productName}"`);
        
        // Save this ID to productDetail to avoid looking it up again
        if (productDetail) {
          setProductDetail({
            ...productDetail,
            product_id: foundId
          });
        }
        
        return foundId;
      }
    }
    
    return null;
  };

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
        // Don't fetch while initial product loading
        if (loading) return;
        
        setReviewsLoading(true);
        console.log("Project data:", project);
        console.log("Product detail:", productDetail);
        
        // Get product ID using our enhanced async function
        const prodId = await getProductId();
        
        if (prodId) {
          console.log(`Fetching reviews for product ID: ${prodId}`);
          const fetchedReviews = await fetchReviews(prodId);
          console.log("Fetched reviews by ID:", fetchedReviews);
          
          if (Array.isArray(fetchedReviews)) {
            // Filter reviews to make sure they belong to this specific product
            const filteredReviews = fetchedReviews.filter(review => {
              // Convert both IDs to numbers to ensure reliable comparison
              return Number(review.product_id) === Number(prodId);
            });
            
            console.log(`After filtering: ${filteredReviews.length} reviews match product ${prodId}`);
            
            // Map reviews to the format used in the UI
            const mappedReviews = filteredReviews.map((r) => ({
              id: r.review_id,
              name: `User ${r.user_id}`, 
              date: new Date(r.date_timestamp || Date.now()).toLocaleDateString(),
              rating: r.number_stars,
              text: r.review,
            }));
            
            setReviews(mappedReviews);
          } else {
            console.log("No reviews found for this product");
            setReviews([]);
          }
        } else {
          console.log("No product ID found, can't fetch reviews");
          setReviews([]);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    // Only fetch reviews if we have a project and loading is complete
    if (project && !loading) {
      fetchProductReviews();
    }
  }, [project, productDetail, loading]);

  // Handle image gallery scrolling
  const handleScroll = (direction) => {
    setCurrentImageIndex((prevIndex) => {
      const newIndex =
        direction === "left"
          ? Math.max(prevIndex - 1, 0)
          : Math.min(prevIndex + 1, imageCount - 1);
  
      scrollViewRef.current?.scrollTo({
        x: newIndex * (isDesktop ? styles.galleryImage.width : width - 32),
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
    setAddedToCart(true);
    
    // Reset after animation
    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  };

  // Handle like toggle with animation
  const handleToggleLike = () => {
    toggleLike(projectId);
    
    // Animate heart when liked
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle adding a review
  const handleAddReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert("Missing Information", "Please enter your review text.");
      return;
    }

    if (reviewRating === 0) {
      Alert.alert("Missing Rating", "Please select a rating (1-5 stars).");
      return;
    }

    try {
      setReviewsLoading(true);
      
      // Get product ID using our enhanced function
      const prodId = await getProductId();
      
      if (!prodId) {
        Alert.alert(
          "Error", 
          "Cannot add review: Unable to determine product ID for this product."
        );
        return;
      }
      
      console.log(`Adding review for product ID: ${prodId}`);
      
      // Prepare review data
      const reviewData = {
        product_id: prodId,
        user_id: 1, // In production, use the real user ID from authentication
        number_stars: reviewRating,
        review: reviewText.trim(),
        date_timestamp: new Date().toISOString(),
      };

      console.log("Submitting review data:", reviewData);

      // Send review to API
      const createdReview = await createReview(reviewData);
      console.log("Created review:", createdReview);

      if (createdReview) {
        // Update local state with the new review
        const newReview = {
          id: createdReview.review_id,
          name: `User ${createdReview.user_id}`,
          date: new Date(createdReview.date_timestamp).toLocaleDateString(),
          rating: createdReview.number_stars,
          text: createdReview.review,
        };

        // Add the new review to the top of the list
        setReviews([newReview, ...reviews]);
        
        // Reset form
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewText("");
        
        // Show success message
        Alert.alert("Success", "Your review has been submitted successfully!");
      } else {
        Alert.alert("Error", "Failed to submit review. Please try again.");
      }
    } catch (error) {
      console.error("Error adding review:", error);
      Alert.alert("Error", "Failed to submit review: " + error.message);
    } finally {
      setReviewsLoading(false);
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
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading product details...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Ionicons name="alert-circle" size={60} color={colors.error} />
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
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Render the mobile layout
  if (isMobile) {
    return (
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Image Gallery with indicator dots and navigation arrows */}
        <View style={styles.galleryContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / (width - 32)
              );
              setCurrentImageIndex(newIndex);
            }}
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
                  { width: width - 32, height: 350 },
                ]}
              >
                <Image 
                  source={{ uri: img }} 
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>

          {/* Left Arrow - only show if not at first image */}
          {currentImageIndex > 0 && (
            <TouchableOpacity
              style={[styles.galleryArrow, styles.galleryArrowLeft]}
              onPress={() => handleScroll("left")}
            >
              <Ionicons name="chevron-back-circle" size={40} color="white" />
            </TouchableOpacity>
          )}

          {/* Right Arrow - only show if not at last image */}
          {currentImageIndex < imageCount - 1 && (
            <TouchableOpacity
              style={[styles.galleryArrow, styles.galleryArrowRight]}
              onPress={() => handleScroll("right")}
            >
              <Ionicons name="chevron-forward-circle" size={40} color="white" />
            </TouchableOpacity>
          )}

          {/* Pagination dots */}
          <View style={styles.paginationContainer}>
            {[0, 1, 2].map((dot) => (
              <View
                key={dot}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      dot === currentImageIndex ? colors.primary : colors.border,
                    width: dot === currentImageIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Creator badge - floating over the image */}
          <View style={styles.creatorBadge}>
            <Image
              source={{ uri: creator.image }}
              style={styles.creatorBadgeImage}
            />
            <View style={styles.creatorBadgeInfo}>
              <Text style={styles.creatorLabel}>Creator</Text>
              <Text style={styles.creatorName}>{creator.name}</Text>
            </View>
          </View>
        </View>

        {/* Product Info Card */}
        <View style={[styles.productCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <View style={styles.productTitleSection}>
              <Text style={[styles.projectName, { color: colors.text }]}>
                {displayProduct.name}
              </Text>
              <Text style={[styles.projectPrice, { color: colors.primary }]}>
                {displayProduct.currency} {displayProduct.price}
              </Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={16}
                    color={star <= (reviews.length ? 
                      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 4) 
                      ? "#FFD700" : "#E0E0E0"}
                  />
                ))}
              </View>
              <Text style={[styles.reviewCount, { color: colors.subtitle }]}>
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </Text>
            </View>
          </View>

          <Text style={[styles.projectDescription, { color: colors.text }]}>
            {displayProduct.description}
          </Text>

          {/* Action Buttons - now with better UI */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.actionButtonActive]}
              onPress={handleToggleLike}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={isLiked ? colors.error : colors.subtitle}
                />
              </Animated.View>
              <Text 
                style={[
                  styles.actionText, 
                  { color: isLiked ? colors.error : colors.subtitle }
                ]}
              >
                {displayedLikes}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Messages")}
            >
              <Ionicons name="chatbubble-outline" size={24} color={colors.subtitle} />
              <Text style={[styles.actionText, { color: colors.subtitle }]}>
                Message
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-social-outline" size={24} color={colors.subtitle} />
              <Text style={[styles.actionText, { color: colors.subtitle }]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            style={[
              styles.addToCartButton,
              { backgroundColor: addedToCart ? colors.success : colors.primary },
            ]}
          >
            <Ionicons 
              name={addedToCart ? "checkmark-circle" : "cart"} 
              size={24} 
              color="white" 
              style={styles.cartIcon}
            />
            <Text style={styles.addToCartButtonText}>
              {addedToCart ? "Added to Cart" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Section */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Summary
          </Text>
          <Text style={[styles.summaryText, { color: colors.subtitle }]}>
            {displayProduct.summary}
          </Text>
        </View>

        {/* Reviews Section */}
        <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
          <View style={styles.reviewHeaderContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Reviews
            </Text>
            
            {!showReviewForm && (
              <TouchableOpacity 
                onPress={() => setShowReviewForm(true)}
                style={[styles.writeReviewButton, { borderColor: colors.primary }]}
              >
                <Text style={[styles.writeReviewButtonText, { color: colors.primary }]}>
                  Write a Review
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {reviewsLoading ? (
            <View style={styles.loadingReviewsContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingReviewsText, { color: colors.subtitle }]}>
                Loading reviews...
              </Text>
            </View>
          ) : reviews.length > 0 ? (
            reviews.map((review, index) => (
              <View
                key={index}
                style={[
                  styles.reviewItem,
                  { 
                    backgroundColor: colors.cardSecondary,
                    borderLeftColor: colors.primary,
                  },
                ]}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>
                        {review.name.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>
                        {review.name}
                      </Text>
                      <Text style={[styles.reviewDate, { color: colors.subtitle }]}>
                        {review.date}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? "star" : "star-outline"}
                        size={16}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: colors.text }]}>
                  {review.text}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="chatbox-outline" size={40} color={colors.subtitle} />
              <Text style={[styles.noReviewsText, { color: colors.subtitle }]}>
                No reviews yet. Be the first to write a review!
              </Text>
            </View>
          )}
        </View>
        
        {/* Review Form */}
        {showReviewForm && (
          <View style={[styles.reviewFormCard, { backgroundColor: colors.card }]}>
            <View style={styles.reviewFormHeader}>
              <Text style={[styles.reviewFormTitle, { color: colors.text }]}>
                Write a Review
              </Text>
              <TouchableOpacity onPress={() => setShowReviewForm(false)}>
                <Ionicons name="close-circle" size={24} color={colors.subtitle} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.ratingLabel, { color: colors.subtitle }]}>
              Rate this product:
            </Text>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= reviewRating ? "star" : "star-outline"}
                    size={30}
                    color={star <= reviewRating ? "#FFD700" : "#E0E0E0"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={[
                styles.reviewInput,
                { 
                  color: colors.text, 
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Share your experience with this product..."
              placeholderTextColor={colors.subtitle}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
            />
            
            <TouchableOpacity
              style={[
                styles.submitReviewButton,
                { backgroundColor: colors.primary },
                (!reviewText.trim() || reviewRating === 0) && styles.disabledButton
              ]}
              onPress={handleAddReview}
              disabled={reviewsLoading || !reviewText.trim() || reviewRating === 0}
            >
              {reviewsLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" style={styles.sendIcon} />
                  <Text style={styles.submitReviewButtonText}>
                    Submit Review
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    );
  }

  // Render the desktop/tablet layout (with image on left, details on right)
  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <View style={styles.desktopLayout}>
        {/* Left Column - Image Gallery */}
        <View style={styles.desktopLeftColumn}>
          <View style={styles.galleryContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              scrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(
                  event.nativeEvent.contentOffset.x / styles.galleryImage.width
                );
                setCurrentImageIndex(newIndex);
              }}
            >
              {[
                displayProduct.image,
                displayProduct.image,
                displayProduct.image,
              ].map((img, index) => (
                <View
                  key={index}
                  style={styles.imageCard}
                >
                  <Image 
                    source={{ uri: img }} 
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>

            {/* Left Arrow - only show if not at first image */}
            {currentImageIndex > 0 && (
              <TouchableOpacity
                style={[styles.galleryArrow, styles.galleryArrowLeft]}
                onPress={() => handleScroll("left")}
              >
                <Ionicons name="chevron-back-circle" size={40} color="white" />
              </TouchableOpacity>
            )}

            {/* Right Arrow - only show if not at last image */}
            {currentImageIndex < imageCount - 1 && (
              <TouchableOpacity
                style={[styles.galleryArrow, styles.galleryArrowRight]}
                onPress={() => handleScroll("right")}
              >
                <Ionicons name="chevron-forward-circle" size={40} color="white" />
              </TouchableOpacity>
            )}

            {/* Pagination dots */}
            <View style={styles.paginationContainer}>
              {[0, 1, 2].map((dot) => (
                <View
                  key={dot}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor:
                        dot === currentImageIndex ? colors.primary : colors.border,
                      width: dot === currentImageIndex ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Creator badge - floating over the image */}
            <View style={styles.creatorBadge}>
              <Image
                source={{ uri: creator.image }}
                style={styles.creatorBadgeImage}
              />
              <View style={styles.creatorBadgeInfo}>
                <Text style={styles.creatorLabel}>Creator</Text>
                <Text style={styles.creatorName}>{creator.name}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column - Product Details */}
        <View style={styles.desktopRightColumn}>
          {/* Product Info Card */}
          <View style={[styles.productCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <View style={styles.productTitleSection}>
                <Text style={[styles.projectName, { color: colors.text }]}>
                  {displayProduct.name}
                </Text>
                <Text style={[styles.projectPrice, { color: colors.primary }]}>
                  {displayProduct.currency} {displayProduct.price}
                </Text>
              </View>
              
              <View style={styles.ratingContainer}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={16}
                      color={star <= (reviews.length ? 
                        reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 4) 
                        ? "#FFD700" : "#E0E0E0"}
                    />
                  ))}
                </View>
                <Text style={[styles.reviewCount, { color: colors.subtitle }]}>
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </Text>
              </View>
            </View>

            <Text style={[styles.projectDescription, { color: colors.text }]}>
              {displayProduct.description}
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, isLiked && styles.actionButtonActive]}
                onPress={handleToggleLike}
              >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={24}
                    color={isLiked ? colors.error : colors.subtitle}
                  />
                </Animated.View>
                <Text 
                  style={[
                    styles.actionText, 
                    { color: isLiked ? colors.error : colors.subtitle }
                  ]}
                >
                  {displayedLikes}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("Messages")}
              >
                <Ionicons name="chatbubble-outline" size={24} color={colors.subtitle} />
                <Text style={[styles.actionText, { color: colors.subtitle }]}>
                  Message
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-social-outline" size={24} color={colors.subtitle} />
                <Text style={[styles.actionText, { color: colors.subtitle }]}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add to Cart Button */}
            <TouchableOpacity
              onPress={handleAddToCart}
              style={[
                styles.addToCartButton,
                { backgroundColor: addedToCart ? colors.success : colors.primary },
              ]}
            >
              <Ionicons 
                name={addedToCart ? "checkmark-circle" : "cart"} 
                size={24} 
                color="white" 
                style={styles.cartIcon}
              />
              <Text style={styles.addToCartButtonText}>
                {addedToCart ? "Added to Cart" : "Add to Cart"}
              </Text>
            </TouchableOpacity>
            
            {/* Summary Section - on desktop, this is part of the main product card */}
            <View style={styles.desktopSummarySection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Summary
              </Text>
              <Text style={[styles.summaryText, { color: colors.subtitle }]}>
                {displayProduct.summary}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Reviews Section - Full width on desktop */}
      <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
        <View style={styles.reviewHeaderContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reviews
          </Text>
          
          {!showReviewForm && (
            <TouchableOpacity 
              onPress={() => setShowReviewForm(true)}
              style={[styles.writeReviewButton, { borderColor: colors.primary }]}
            >
              <Text style={[styles.writeReviewButtonText, { color: colors.primary }]}>
                Write a Review
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {reviewsLoading ? (
          <View style={styles.loadingReviewsContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingReviewsText, { color: colors.subtitle }]}>
              Loading reviews...
            </Text>
          </View>
        ) : reviews.length > 0 ? (
          <View style={styles.reviewsGrid}>
            {reviews.map((review, index) => (
              <View
                key={index}
                style={[
                  styles.reviewItem,
                  { 
                    backgroundColor: colors.cardSecondary,
                    borderLeftColor: colors.primary,
                  },
                ]}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>
                        {review.name.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>
                        {review.name}
                      </Text>
                      <Text style={[styles.reviewDate, { color: colors.subtitle }]}>
                        {review.date}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? "star" : "star-outline"}
                        size={16}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: colors.text }]}>
                  {review.text}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noReviewsContainer}>
            <Ionicons name="chatbox-outline" size={40} color={colors.subtitle} />
            <Text style={[styles.noReviewsText, { color: colors.subtitle }]}>
              No reviews yet. Be the first to write a review!
            </Text>
          </View>
        )}
      </View>
      
      {/* Review Form */}
      {showReviewForm && (
        <View style={[styles.reviewFormCard, { backgroundColor: colors.card }]}>
          <View style={styles.reviewFormHeader}>
            <Text style={[styles.reviewFormTitle, { color: colors.text }]}>
              Write a Review
            </Text>
            <TouchableOpacity onPress={() => setShowReviewForm(false)}>
              <Ionicons name="close-circle" size={24} color={colors.subtitle} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.ratingLabel, { color: colors.subtitle }]}>
            Rate this product:
          </Text>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setReviewRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= reviewRating ? "star" : "star-outline"}
                  size={30}
                  color={star <= reviewRating ? "#FFD700" : "#E0E0E0"}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <TextInput
            style={[
              styles.reviewInput,
              { 
                color: colors.text, 
                backgroundColor: colors.cardSecondary,
                borderColor: colors.border,
              },
            ]}
            placeholder="Share your experience with this product..."
            placeholderTextColor={colors.subtitle}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
          />
          
          <TouchableOpacity
            style={[
              styles.submitReviewButton,
              { backgroundColor: colors.primary },
              (!reviewText.trim() || reviewRating === 0) && styles.disabledButton
            ]}
            onPress={handleAddReview}
            disabled={reviewsLoading || !reviewText.trim() || reviewRating === 0}
          >
            {reviewsLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" style={styles.sendIcon} />
                <Text style={styles.submitReviewButtonText}>
                  Submit Review
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </Animated.ScrollView>
  );
};

const getDynamicStyles = (colors, { isWeb, isDesktop, isTablet, isMobile }) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 30,
      paddingTop: isWeb ? 20 : 0,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      marginTop: 15,
      marginBottom: 20,
      textAlign: "center",
    },
    retryButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: "white",
      fontWeight: "600",
      fontSize: 16,
    },
    // Desktop Layout 
    desktopLayout: {
      flexDirection: isDesktop || isTablet ? "row" : "column",
      paddingHorizontal: isDesktop ? 40 : isTablet ? 20 : 16,
      maxWidth: 1400,
      alignSelf: "center",
      width: "100%",
    },
    desktopLeftColumn: {
      flex: isDesktop ? 0.45 : isTablet ? 0.4 : 1,
      marginRight: isDesktop || isTablet ? 20 : 0,
    },
    desktopRightColumn: {
      flex: isDesktop ? 0.55 : isTablet ? 0.6 : 1,
    },
    desktopSummarySection: {
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: "rgba(0,0,0,0.05)",
    },
    // Floating header
    floatingHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      zIndex: 10,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "left",
      marginHorizontal: 10,
    },
    cartButton: {
      padding: 8,
    },
    // Gallery
    galleryContainer: {
      position: "relative",
      marginBottom: isMobile ? 20 : 0,
      backgroundColor: "#f0f0f0", // Light gray background
      borderRadius: isDesktop || isTablet ? 12 : 0,
      overflow: "hidden",
    },
    imageCard: {
      overflow: "hidden",
      backgroundColor: "#f8f8f8", // Slightly lighter background for each image card
      width: isDesktop ? 500 : isTablet ? 350 : "100%",
      height: isDesktop ? 500 : isTablet ? 350 : 350,
    },
    galleryImage: {
      width: isDesktop ? 500 : isTablet ? 350 : "100%",
      height: isDesktop ? 500 : isTablet ? 350 : "100%",
    },
    // Gallery Navigation Arrows
    galleryArrow: {
      position: "absolute",
      top: "50%",
      transform: [{ translateY: -20 }],
      zIndex: 2,
      backgroundColor: "rgba(0,0,0,0.4)",
      borderRadius: 25,
      padding: 5,
    },
    galleryArrowLeft: {
      left: 10,
    },
    galleryArrowRight: {
      right: 10,
    },
    paginationContainer: {
      position: "absolute",
      bottom: 20,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    paginationDot: {
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    // Creator badge
    creatorBadge: {
      position: "absolute",
      bottom: 20,
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
      borderRadius: 20,
      padding: 8,
    },
    creatorBadgeImage: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    creatorBadgeInfo: {
      marginLeft: 8,
    },
    creatorLabel: {
      fontSize: 10,
      color: "#ccc",
    },
    creatorName: {
      fontSize: 12,
      color: "white",
      fontWeight: "bold",
    },
    // Product card
    productCard: {
      marginHorizontal: isMobile ? 16 : 0,
      borderRadius: 16,
      padding: isDesktop ? 24 : 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    productTitleSection: {
      flex: 1,
      marginRight: 10,
    },
    projectName: {
      fontSize: isDesktop ? 28 : 24,
      fontWeight: "bold",
      marginBottom: 4,
    },
    projectPrice: {
      fontSize: isDesktop ? 24 : 20,
      fontWeight: "600",
    },
    ratingContainer: {
      alignItems: "flex-end",
    },
    reviewCount: {
      fontSize: 12,
      marginTop: 3,
    },
    projectDescription: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 16,
    },
    // Action buttons
    actionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: "rgba(0,0,0,0.05)",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.05)",
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: "rgba(0,0,0,0.03)",
    },
    actionButtonActive: {
      backgroundColor: "rgba(255,0,0,0.08)",
    },
    actionText: {
      marginLeft: 8,
      fontWeight: "500",
      fontSize: 14,
    },
    // Add to cart button
    addToCartButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 16,
      borderRadius: 12,
    },
    cartIcon: {
      marginRight: 8,
    },
    addToCartButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    // Summary card
    summaryCard: {
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      display: isDesktop || isTablet ? "none" : "flex", // Hide on desktop/tablet as it's included in product card
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 12,
    },
    summaryText: {
      fontSize: 16,
      lineHeight: 24,
    },
    // Reviews section
    reviewCard: {
      marginHorizontal: isDesktop || isTablet ? 40 : 16,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      maxWidth: 1320,
      alignSelf: "center",
      width: isDesktop || isTablet ? "100%" : undefined,
    },
    reviewHeaderContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    writeReviewButton: {
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    writeReviewButtonText: {
      fontWeight: "600",
      fontSize: 14,
    },
    loadingReviewsContainer: {
      alignItems: "center",
      paddingVertical: 20,
    },
    loadingReviewsText: {
      marginTop: 8,
      fontSize: 14,
    },
    reviewsGrid: {
      flexDirection: isDesktop || isTablet ? 'row' : 'column',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    reviewItem: {
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      width: isDesktop ? '48.5%' : isTablet ? '100%' : '100%',
      marginRight: isDesktop ? '1.5%' : 0,
    },
    reviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    reviewerInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    reviewerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    reviewerInitial: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
    reviewerName: {
      fontWeight: "600",
      fontSize: 14,
    },
    reviewDate: {
      fontSize: 12,
    },
    starRow: {
      flexDirection: "row",
    },
    reviewText: {
      fontSize: 15,
      lineHeight: 22,
    },
    noReviewsContainer: {
      alignItems: "center",
      paddingVertical: 30,
    },
    noReviewsText: {
      marginTop: 10,
      fontSize: 16,
      textAlign: "center",
    },
    // Review form
    reviewFormCard: {
      marginHorizontal: isDesktop || isTablet ? 40 : 16,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      maxWidth: 800,
      alignSelf: "center",
      width: isDesktop || isTablet ? "100%" : undefined,
    },
    reviewFormHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    reviewFormTitle: {
      fontSize: 18,
      fontWeight: "bold",
    },
    ratingLabel: {
      fontSize: 16,
      marginBottom: 8,
    },
    starContainer: {
      flexDirection: "row",
      marginBottom: 16,
      justifyContent: "center",
    },
    starButton: {
      paddingHorizontal: 4,
    },
    reviewInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      height: 120,
      textAlignVertical: "top",
    },
    submitReviewButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 12,
      paddingVertical: 14,
    },
    disabledButton: {
      opacity: 0.6,
    },
    sendIcon: {
      marginRight: 8,
    },
    submitReviewButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    bottomSpacing: {
      height: 40,
    },
  });

export default ProjectScreen;