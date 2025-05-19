import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../backend/db/API";

// Safely process image URLs to ensure they're valid
const processImageUrl = (url, baseUrl = BASE_URL) => {
  // Return a placeholder if URL is invalid
  if (!url || typeof url !== "string" || url.trim() === "") {
    return "https://via.placeholder.com/400x280?text=Product+Image";
  }

  // Convert relative URLs to absolute
  if (!url.startsWith("http")) {
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  return url;
};

// Enhanced image component with proper error handling
const EnhancedImage = ({ uri, style, resizeMode = "contain", colors }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    // Process the URL to ensure it's valid
    const processedUrl = processImageUrl(uri);
    setImageUrl(processedUrl);
  }, [uri]);

  const processedUrl = processImageUrl(uri);

  // Function to retry loading the image
  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Add cache busting parameter
    setImageUrl(`${imageUrl}?cache=${Date.now()}`);
  };

  if (hasError) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' }]}>
        <Ionicons name="image-outline" size={40} color="#999" />
        <Text style={{ marginTop: 8, color: '#666', textAlign: 'center' }}>Image not available</Text>
        <TouchableOpacity
          style={{
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors?.primary || '#4A80F0',
            borderRadius: 8
          }}
          onPress={handleRetry}
        >
          <Text style={{ color: 'white', fontWeight: '500' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[style, { position: "relative" }]}>
      <Image
        source={{ uri: processedUrl }}
        style={[style, { opacity: isLoading ? 0 : 1 }]}
        resizeMode={resizeMode}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {isLoading && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' }]}>
          <ActivityIndicator size="large" color={colors?.primary || '#4A80F0'} />
          <Text style={{ marginTop: 10, color: '#666' }}>Loading image...</Text>
        </View>
      )}
    </View>
  );
};

// Main gallery container component
const ImprovedGalleryContainer = ({ 
  galleryImages = [], 
  previewImagesLoading = false, 
  creator = {}, 
  colors = {}, 
  handleScroll,
  currentImageIndex = 0,
  setCurrentImageIndex 
}) => {
  const { width } = Dimensions.get("window");
  const scrollViewRef = useRef(null);
  const isMobile = Platform.OS !== "web" || width < 768;
  
  // Ensure we always have some image to display
  const displayImages = galleryImages.length > 0 
    ? galleryImages 
    : ["https://via.placeholder.com/400x280?text=Product+Image"];
  
  const imageCount = displayImages.length;

  // Handle scroll internally if not provided
//   const handleImageScroll = (direction) => {
//     if (handleScroll) {
//       handleScroll(direction);
//       return;
//     }
    
//     setCurrentImageIndex((prevIndex) => {
//       const newIndex = direction === "left"
//         ? Math.max(prevIndex - 1, 0)
//         : Math.min(prevIndex + 1, imageCount - 1);
      
//       scrollViewRef.current?.scrollTo({
//         x: newIndex * width,
//         y: 0,
//         animated: true,
//       });
      
//       return newIndex;
//     });
//   };

  return (
    <View style={styles.container}>
      {/* Main Gallery View */}
      <View style={styles.galleryContainer}>
        {previewImagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary || '#4A80F0'} />
            <Text style={{ marginTop: 10, color: '#666' }}>Loading product images...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(newIndex);
            }}
          >
            {displayImages.map((imageUrl, index) => (
              <View key={`gallery-image-${index}`} style={[styles.imageCard, { width }]}>
                <EnhancedImage
                  uri={imageUrl}
                  style={styles.galleryImage}
                  resizeMode="contain"
                  colors={colors}
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Navigation Arrows - only show if multiple images and not loading */}
        {/* {!previewImagesLoading && imageCount > 1 && (
          <>
            {currentImageIndex > 0 && (
              <TouchableOpacity
                style={[styles.galleryArrow, styles.galleryArrowLeft]}
                onPress={() => handleImageScroll("left")}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back-circle" size={40} color="white" />
              </TouchableOpacity>
            )}

            {currentImageIndex < imageCount - 1 && (
              <TouchableOpacity
                style={[styles.galleryArrow, styles.galleryArrowRight]}
                onPress={() => handleImageScroll("right")}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward-circle" size={40} color="white" />
              </TouchableOpacity>
            )}
          </>
        )} */}

        {/* Pagination Dots */}
        {/* {!previewImagesLoading && imageCount > 1 && (
          <View style={styles.paginationContainer}>
            {displayImages.map((_, index) => (
              <View
                key={`pagination-dot-${index}`}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: index === currentImageIndex ? (colors.primary || '#4A80F0') : '#E0E0E0',
                    width: index === currentImageIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        )} */}

        {/* Creator Badge */}
        {creator?.image && creator?.name && (
          <View style={styles.creatorBadge}>
            <Image
              source={{ uri: processImageUrl(creator.image) }}
              style={styles.creatorBadgeImage}
                resizeMode="cover"
            />
            <View style={styles.creatorBadgeInfo}>
              <Text style={styles.creatorLabel}>Creator</Text>
              <Text style={styles.creatorName}>{creator.name}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Thumbnail Strip */}
      {!previewImagesLoading && displayImages.length > 1 && isMobile && (
        <View style={styles.thumbnailStrip}>
          {displayImages.map((imageUrl, index) => (
            <TouchableOpacity
              key={`thumbnail-${index}`}
              onPress={() => {
                setCurrentImageIndex(index);
                scrollViewRef.current?.scrollTo({
                  x: index * width,
                  y: 0,
                  animated: true,
                });
              }}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: processImageUrl(imageUrl) }}
                style={[
                  styles.thumbnail,
                  { borderColor: currentImageIndex === index ? (colors.primary || '#4A80F0') : 'transparent' }
                ]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  galleryContainer: {
    position: "relative",
    backgroundColor: "#ffffff",
    borderRadius: 0,
    overflow: "hidden",
    height: 280,
    width: "100%",
  },
  loadingContainer: {
    height: 280,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  scrollViewContent: {
    alignItems: "center",
  },
  imageCard: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  galleryImage: {
    width: "90%",
    height: "90%",
  },
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
    backgroundColor: "#ccc",
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
  thumbnailStrip: {
    flexDirection: "row",
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    margin: 5,
    borderWidth: 2,
  }
});

export default ImprovedGalleryContainer;