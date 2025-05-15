import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../theme/ThemeContext";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { useAuth } from "../context/AuthContext";
import { mockCities } from "../data/MockData";
import { createProduct, getSellerProducts } from "../backend/db/API";
import PriceCalculator from "../components/PriceCalculator";

/**
 * Single entry point: decides which layout to show based on the platform.
 */
export default function FormScreen() {
  if (Platform.OS === "web") {
    return <WebForm />;
  } else {
    return <AnimatedMobileWizard />;
  }
}

/* ------------------------------------------------------------------
   1) WEB LAYOUT: Form with searchable dropdowns for CATEGORY and COUNTRY
   ------------------------------------------------------------------ */

function WebForm() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getWebStyles(colors);

  // Product limit states
  const [sellerProducts, setSellerProducts] = useState([]);
  const [productLimit, setProductLimit] = useState(3); // Default to Basic tier limit
  const [isLoading, setIsLoading] = useState(true);

  // Form states for text fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState(0);
  const [detailedDescription, setDetailedDescription] = useState("");
  const [images, setImages] = useState([]);
  const [country, setCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // CATEGORY: use DropDownPicker
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState([
    { label: "All Categories", value: "" },
    { label: "Software", value: "Software" },
    { label: "Hardware", value: "Hardware" },
    { label: "AI Tools", value: "AI Tools" },
    { label: "Cloud", value: "Cloud" },
    { label: "Feature", value: "Feature" },
    { label: "Startups", value: "Startups" },
    { label: "Creators", value: "Creators" },
  ]);

  // COUNTRY: use DropDownPicker with the list from mockData.js
  const [countryOpen, setCountryOpen] = useState(false);
  // Convert mockCities array of strings to array of objects with label and value
  const [countryItems, setCountryItems] = useState(
    mockCities.map((city) => ({ label: city, value: city }))
  );

  // Get product limits based on user tier
  useEffect(() => {
    // Set product limit based on subscription tier
    const tier = user?.tier?.toLowerCase() || "basic";

    switch (tier) {
      case "pro":
        setProductLimit(25);
        break;
      case "enterprise":
        setProductLimit(Infinity); // Unlimited
        break;
      case "basic":
      default:
        setProductLimit(3);
        break;
    }

    // Fetch seller's existing products
    const fetchSellerProducts = async () => {
      try {
        if (user && user.user_id) {
          setIsLoading(true);
          const products = await getSellerProducts(user.user_id);
          setSellerProducts(products || []);
        }
      } catch (error) {
        console.error("Error fetching seller products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerProducts();
  }, [user]);

  // Handlers
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImages([
        ...images,
        ...result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image-${Date.now()}`,
        })),
      ]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !price || !detailedDescription || !country) {
      Alert.alert("Required Fields", "Please fill in all required fields");
      return;
    }

    // Check if user has reached product limit
    if (sellerProducts.length >= productLimit) {
      Alert.alert(
        "Product Limit Reached",
        `Your current plan (${user?.tier || "Basic"}) allows a maximum of ${productLimit} products. Please upgrade your subscription to add more products.`,
        [
          { text: "OK" },
          {
            text: "Upgrade Plan",
            onPress: () => {
              // Navigate to subscription screen
              // This is just a placeholder - you'd need to set up the actual navigation
              console.log("Navigate to subscription screen");
            },
          },
        ]
      );
      return;
    }

    console.log("📤 Submitting product with values:", {
      title,
      category,
      price,
      sellingPrice, // Log the selling price
      detailedDescription,
      country,
      images,
    });

    try {
      const productPayload = {
        product_name: title,
        category,
        cost: parseFloat(price),
        selling_price: sellingPrice, // Include in the payload
        description: detailedDescription,
        country,
        user_seller: user?.user_id,
        product_image: images.length ? images[0].uri : "",
        verified: false,
        created_at: new Date().toISOString(),
      };

      const res = await createProduct(productPayload);
      console.log("✅ Product submitted:", res);
      setSubmitted(true);
    } catch (err) {
      console.error("❌ Submission error:", err);
      Alert.alert("Submission Error", "Failed to create product.");
    }
  };

  // Helper function to get fee percentage
  const getFeePercentage = () => {
    const tier = user?.tier?.toLowerCase() || "basic";

    switch (tier) {
      case "pro":
        return 3;
      case "enterprise":
        return 2;
      case "basic":
      default:
        return 5;
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.scrollContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  if (submitted) {
    return (
      <View
        style={[
          styles.scrollContainer,
          {
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 40,
            paddingHorizontal: 20,
          },
        ]}
      >
        <Feather name="check-circle" size={48} color="green" />
        <Text
          style={{
            marginTop: 10,
            fontSize: 24,
            fontWeight: "bold",
            color: colors.primary,
            textAlign: "center",
          }}
        >
          You have successfully submitted your product
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formWrapper}>
        <Text style={styles.formHeading}>Tell us about your Product</Text>

        {/* Subscription tier info */}
        <View style={styles.subscriptionInfoContainer}>
          <View style={styles.subscriptionInfoHeader}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={styles.subscriptionInfoTitle}>
              Your Subscription Plan: {user?.tier || "Basic"}
            </Text>
          </View>

          <View style={styles.subscriptionInfoDetails}>
            <View style={styles.subscriptionInfoRow}>
              <Text style={styles.subscriptionInfoLabel}>Processing Fee:</Text>
              <Text style={styles.subscriptionInfoValue}>
                {getFeePercentage()}%
              </Text>
            </View>

            <View style={styles.subscriptionInfoRow}>
              <Text style={styles.subscriptionInfoLabel}>Product Limit:</Text>
              <Text style={styles.subscriptionInfoValue}>
                {productLimit === Infinity ? "Unlimited" : productLimit}
              </Text>
            </View>

            <View style={styles.subscriptionInfoRow}>
              <Text style={styles.subscriptionInfoLabel}>Products Used:</Text>
              <Text style={styles.subscriptionInfoValue}>
                {sellerProducts.length}/
                {productLimit === Infinity ? "∞" : productLimit}
              </Text>
            </View>
          </View>

          {sellerProducts.length >= productLimit && (
            <View style={styles.limitWarning}>
              <MaterialIcons name="warning" size={18} color="#ff9800" />
              <Text style={styles.limitWarningText}>
                You've reached your product limit. Please upgrade your plan to
                add more products.
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <FormField
          label="TITLE"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter product title"
          colors={colors}
          required
        />

        {/* CATEGORY using searchable dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>CATEGORY</Text>
          <DropDownPicker
            searchable={true}
            searchablePlaceholder="Search for a category..."
            searchablePlaceholderTextColor="#888"
            placeholder="Select a category"
            open={categoryOpen}
            value={category}
            items={categoryItems}
            setOpen={setCategoryOpen}
            setValue={setCategory}
            setItems={setCategoryItems}
            style={styles.dropdownStyle}
            containerStyle={{ marginBottom: categoryOpen ? 120 : 20 }}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

        {/* Price */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>PRICING DETAILS</Text>
          <PriceCalculator
            initialPrice={price}
            onPriceChange={setPrice}
            onSellingPriceChange={setSellingPrice}
            colors={colors}
          />
        </View>

        {/* Detailed Description */}
        <FormField
          label="DETAILED DESCRIPTION"
          value={detailedDescription}
          onChangeText={setDetailedDescription}
          placeholder="Describe your product"
          multiline
          colors={colors}
          required
        />

        {/* Image Upload */}
        <View style={styles.uploadWrapper}>
          <Text style={styles.label}>IMAGES</Text>
          <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Image</Text>
          </TouchableOpacity>
        </View>

        {/* Display selected images */}
        <View style={styles.selectedImagesContainer}>
          {images.map((image, index) => (
            <View key={`image-${index}`} style={styles.selectedImageItem}>
              <Text style={styles.selectedImageName} numberOfLines={1}>
                {image.name}
              </Text>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(index)}
              >
                <AntDesign name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* COUNTRY using searchable dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>COUNTRY</Text>
          <DropDownPicker
            searchable={true}
            searchablePlaceholder="Search for a country..."
            searchablePlaceholderTextColor="#888"
            placeholder="Select a country"
            open={countryOpen}
            value={country}
            items={countryItems}
            setOpen={setCountryOpen}
            setValue={setCountry}
            setItems={setCountryItems}
            style={styles.dropdownStyle}
            containerStyle={{ marginBottom: countryOpen ? 200 : 20 }}
            zIndex={2000}
            zIndexInverse={2000}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            sellerProducts.length >= productLimit &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={sellerProducts.length >= productLimit}
        >
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>

        {sellerProducts.length >= productLimit && (
          <TouchableOpacity
            style={styles.upgradePlanButton}
            onPress={() => {
              // Navigate to subscription screen
              console.log("Navigate to subscription screen");
            }}
          >
            <Text style={styles.upgradePlanButtonText}>UPGRADE PLAN</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

/**
 * A reusable form field (for the Web layout).
 */
function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  multiline = false,
  keyboardType = "default",
  colors,
  required = false,
}) {
  const styles = getWebStyles(colors);
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={{ color: "red" }}>*</Text>}
      </Text>
      <TextInput
        style={[styles.lineInput, multiline && styles.multiline]}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

/**
 * Styles for Web
 */
function getWebStyles(colors) {
  const { width, height } = Dimensions.get("window");

  return StyleSheet.create({
    scrollContainer: {
      minHeight: height,
      padding: 20,
      backgroundColor: colors.background,
    },
    formWrapper: {
      backgroundColor: "transparent",
      width: "100%",
      maxWidth: 600,
      alignSelf: "center",
    },
    formHeading: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
      textAlign: "left",
    },
    subscriptionInfoContainer: {
      backgroundColor: "#f8f9fa",
      borderRadius: 8,
      padding: 15,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: "#e9ecef",
    },
    subscriptionInfoHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    subscriptionInfoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
      marginLeft: 8,
    },
    subscriptionInfoDetails: {
      marginBottom: 10,
    },
    subscriptionInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
    },
    subscriptionInfoLabel: {
      fontSize: 14,
      color: "#555",
    },
    subscriptionInfoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: "#333",
    },
    limitWarning: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff3e0",
      padding: 10,
      borderRadius: 6,
      marginTop: 5,
    },
    limitWarningText: {
      fontSize: 14,
      color: "#e65100",
      marginLeft: 8,
      flex: 1,
    },
    fieldContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      color: colors.subtitle,
      marginBottom: 5,
      letterSpacing: 1,
    },
    lineInput: {
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary,
      paddingVertical: 6,
      fontSize: 15,
      color: colors.text,
    },
    multiline: {
      minHeight: 60,
      textAlignVertical: "top",
    },
    uploadWrapper: {
      marginBottom: 10,
    },
    uploadButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: 4,
    },
    uploadButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    selectedImagesContainer: {
      marginTop: 10,
      marginBottom: 20,
    },
    selectedImageItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 5,
      padding: 8,
      borderWidth: 1,
      borderColor: "#aaa",
      borderRadius: 8,
    },
    selectedImageName: {
      flex: 1,
      marginRight: 10,
      color: "#333",
    },
    removeImageButton: {
      padding: 5,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 4,
      marginTop: 10,
    },
    submitButtonDisabled: {
      backgroundColor: "#cccccc",
      opacity: 0.7,
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 1,
    },
    dropdownStyle: {
      borderWidth: 0,
      borderBottomWidth: 1,
      borderColor: colors.secondary,
      borderRadius: 0,
    },
    upgradePlanButton: {
      backgroundColor: "#ff9800",
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 4,
      marginTop: 15,
    },
    upgradePlanButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 1,
    },
  });
}

/* ------------------------------------------------------------------ */
/* Mobile layout implementation would need similar changes, skipped for brevity */
/* ------------------------------------------------------------------ */
function AnimatedMobileWizard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = getEnhancedMobileStyles(colors);
  const { width } = Dimensions.get("window");

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Product limit states
  const [sellerProducts, setSellerProducts] = useState([]);
  const [productLimit, setProductLimit] = useState(3); // Default to Basic tier limit
  const [isLoading, setIsLoading] = useState(true);

  // States for wizard fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState(0);
  const [detailedDescription, setDetailedDescription] = useState("");
  const [images, setImages] = useState([]);
  const [country, setCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState("next"); // "next" or "back"

  // Additional states for DropDownPicker in wizard for CATEGORY and COUNTRY
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState([
    { label: "All Categories", value: "" },
    { label: "Software", value: "Software" },
    { label: "Hardware", value: "Hardware" },
    { label: "AI Tools", value: "AI Tools" },
    { label: "Cloud", value: "Cloud" },
    { label: "Feature", value: "Feature" },
    { label: "Startups", value: "Startups" },
    { label: "Creators", value: "Creators" },
  ]);

  const [countryOpen, setCountryOpen] = useState(false);
  // Convert mockCities array of strings to array of objects with label and value
  const [countryItems, setCountryItems] = useState(
    mockCities.map((city) => ({ label: city, value: city }))
  );

  // Get product limits based on user tier
  useEffect(() => {
    // Set product limit based on subscription tier
    const tier = user?.tier?.toLowerCase() || "basic";

    switch (tier) {
      case "pro":
        setProductLimit(25);
        break;
      case "enterprise":
        setProductLimit(Infinity); // Unlimited
        break;
      case "basic":
      default:
        setProductLimit(3);
        break;
    }

    // Fetch seller's existing products
    const fetchSellerProducts = async () => {
      try {
        if (user && user.user_id) {
          setIsLoading(true);
          const products = await getSellerProducts(user.user_id);
          setSellerProducts(products || []);
        }
      } catch (error) {
        console.error("Error fetching seller products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerProducts();
  }, [user]);

  // For picking images
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImages([
        ...images,
        ...result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image-${Date.now()}`,
        })),
      ]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Helper function to get fee percentage based on user tier
  const getFeePercentage = () => {
    const tier = user?.tier?.toLowerCase() || "basic";

    switch (tier) {
      case "pro":
        return 3;
      case "enterprise":
        return 2;
      case "basic":
      default:
        return 5;
    }
  };

  // Define steps for the wizard
  const steps = [
    // Add subscription info as a dedicated step at the beginning
    {
      key: "subscription",
      label: "Plan Info",
      question: "Your Subscription Plan",
      icon: "card-membership",
      isSubscriptionStep: true,
    },
    {
      key: "title",
      label: "Title",
      question: "What's your product called?",
      icon: "edit",
      placeholder: "Enter product name",
      value: title,
      setValue: setTitle,
      keyboardType: "default",
      multiline: false,
      required: true,
    },
    {
      key: "price",
      label: "Price",
      question: "What's your price?",
      icon: "attach-money",
      isPriceCalculator: true,
      placeholder: "Enter price",
      value: price,
      setValue: setPrice,
      sellingPrice: sellingPrice,
      setSellingPrice: setSellingPrice,
      keyboardType: "numeric",
      multiline: false,
      required: true,
    },
    {
      key: "detailedDescription",
      label: "Description",
      question: "Tell us about your product",
      icon: "description",
      placeholder: "Detailed description",
      value: detailedDescription,
      setValue: setDetailedDescription,
      keyboardType: "default",
      multiline: true,
      required: true,
    },
    {
      key: "country",
      label: "Country",
      question: "Where are you based?",
      icon: "public",
      placeholder: "Select a country",
      value: country,
      setValue: setCountry,
      keyboardType: "default",
      multiline: false,
      required: true,
      isDropdown: true,
      dropdownType: "country",
    },
    {
      key: "images",
      label: "Images",
      question: "Add some product images",
      icon: "photo-library",
      isImageStep: true,
    },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  // Update progress bar when step changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / (steps.length - 1),
      duration: 300,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }, [currentStep]);

  // Animation for step transition
  const animateToNextStep = (nextStep) => {
    if (animating) return;

    setAnimating(true);
    const moveDirection = direction === "next" ? -width : width;

    // Animate current step out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: moveDirection,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update step and reset animations
      setCurrentStep(nextStep);
      slideAnim.setValue(moveDirection * -1);

      // Animate new step in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimating(false);
      });
    });
  };

  const handleNext = () => {
    // Check if user has reached product limit and this is the first step (subscription info)
    if (currentStep === 0 && sellerProducts.length >= productLimit) {
      Alert.alert(
        "Product Limit Reached",
        `Your current plan (${user?.tier || "Basic"}) allows a maximum of ${productLimit} products. Please upgrade your subscription to add more products.`,
        [
          { text: "OK" },
          {
            text: "Upgrade Plan",
            onPress: () => {
              // Navigate to subscription screen
              console.log("Navigate to subscription screen");
            },
          },
        ]
      );
      return;
    }

    const step = steps[currentStep];
    if (
      !step.isSubscriptionStep &&
      !step.isImageStep &&
      step.required &&
      !step.value
    ) {
      Alert.alert(
        "Required Field",
        "Please fill in this field before continuing."
      );
      return;
    }

    if (currentStep < steps.length - 1) {
      setDirection("next");
      animateToNextStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection("back");
      animateToNextStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!title || !price || !detailedDescription || !country) {
      Alert.alert("Required Fields", "Please fill in all required fields");
      return;
    }
  
    // Check if user has reached product limit
    if (sellerProducts.length >= productLimit) {
      Alert.alert(
        "Product Limit Reached",
        `Your current plan (${user?.tier || "Basic"}) allows a maximum of ${productLimit} products. Please upgrade your subscription to add more products.`,
        [
          { text: "OK" },
          {
            text: "Upgrade Plan",
            onPress: () => {
              // Navigate to subscription screen
              console.log("Navigate to subscription screen");
            },
          },
        ]
      );
      return;
    }
  
    console.log("📤 Submitting product with values:", {
      title,
      category,
      price,
      sellingPrice,
      detailedDescription,
      country,
      images,
    });
  
    try {
      const productPayload = {
        product_name: title,
        category,
        cost: parseFloat(price),
        selling_price: sellingPrice,
        description: detailedDescription,
        country,
        user_seller: user?.user_id,
        product_image: images.length ? images[0].uri : "",
        verified: false,
        created_at: new Date().toISOString(),
      };
      console.log("🧾 Final product payload:", productPayload);
  
      // Add explicit logging before and after API call
      console.log("🔄 Calling createProduct API...");
      const res = await createProduct(productPayload);
      console.log("✅ Product created response:", res);
  
      // Add a direct state change here to ensure the submitted state is updated
      setSubmitted(true);
      
      // Then trigger the animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log("🎉 Success animation completed");
        // Double-check that submitted state is true
        setSubmitted(true);
      });
  
      // Also update the sellerProducts list with the new product
      setSellerProducts([...sellerProducts, res]);
      
      // Show a success alert to provide feedback even if the animation fails
      Alert.alert(
        "Success",
        "Your product has been submitted successfully!",
        [{ text: "OK" }]
      );
    } catch (err) {
      console.error("❌ Product submission failed:", err);
      // Log more detailed error information
      if (err.response) {
        console.error("❌ Server response:", err.response);
      }
      Alert.alert("Submission Failed", "Could not create product. " + (err.message || ""));
    }
  };

  // Success screen animation
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (submitted) {
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
      ]).start();
    }
  }, [submitted]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Animated.View
          style={[
            styles.successContent,
            {
              opacity: successAnim,
              transform: [
                {
                  scale: successAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.1, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.successIconContainer}>
            <Feather name="check-circle" size={60} color="white" />
          </View>
          <Text style={styles.successTitle}>Success!</Text>
          <Text style={styles.successMessage}>
            Your product has been submitted
          </Text>
        </Animated.View>
      </View>
    );
  }

  const current = steps[currentStep];
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicatorContainer}>
        <View style={styles.stepIcon}>
          <MaterialIcons name={current.icon} size={22} color={colors.primary} />
        </View>
        <Text style={styles.stepLabel}>{current.label}</Text>
        <Text style={styles.stepIndicatorText}>
          {currentStep + 1} / {steps.length}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text style={styles.questionText}>{current.question}</Text>

        {current.isSubscriptionStep ? (
          <View style={styles.subscriptionInfoContainer}>
            <View style={styles.subscriptionPlanCard}>
              <Text style={styles.subscriptionPlanTitle}>
                {user?.tier || "Basic"} Plan
              </Text>

              <View style={styles.subscriptionDetailRow}>
                <Text style={styles.subscriptionDetailLabel}>
                  Processing Fee:
                </Text>
                <Text style={styles.subscriptionDetailValue}>
                  {getFeePercentage()}%
                </Text>
              </View>

              <View style={styles.subscriptionDetailRow}>
                <Text style={styles.subscriptionDetailLabel}>
                  Product Limit:
                </Text>
                <Text style={styles.subscriptionDetailValue}>
                  {productLimit === Infinity ? "Unlimited" : productLimit}
                </Text>
              </View>

              <View style={styles.subscriptionDetailRow}>
                <Text style={styles.subscriptionDetailLabel}>
                  Products Used:
                </Text>
                <Text
                  style={[
                    styles.subscriptionDetailValue,
                    sellerProducts.length >= productLimit &&
                      styles.subscriptionLimitReached,
                  ]}
                >
                  {sellerProducts.length}/
                  {productLimit === Infinity ? "∞" : productLimit}
                </Text>
              </View>

              {sellerProducts.length >= productLimit && (
                <View style={styles.limitWarningMobile}>
                  <MaterialIcons name="warning" size={18} color="#fff" />
                  <Text style={styles.limitWarningText}>
                    You've reached your product limit
                  </Text>
                </View>
              )}

              {sellerProducts.length >= productLimit && (
                <TouchableOpacity style={styles.upgradePlanButton}>
                  <Text style={styles.upgradePlanButtonText}>UPGRADE PLAN</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : current.isPriceCalculator ? (
          <PriceCalculator
            initialPrice={current.value}
            onPriceChange={current.setValue}
            onSellingPriceChange={current.setSellingPrice}
            colors={colors}
          />
        ) : current.isImageStep ? (
          <View style={styles.imageStepWrapper}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={20}
                color="white"
              />
              <Text style={styles.uploadButtonText}>Select Images</Text>
            </TouchableOpacity>

            <View style={styles.selectedImagesContainer}>
              {images.map((img, index) => (
                <Animated.View
                  key={`mobile-img-${index}`}
                  style={[styles.selectedImageItem]}
                  entering={Animated.spring({
                    duration: 300,
                    dampingRatio: 0.7,
                  })}
                >
                  <Text style={styles.selectedImageName} numberOfLines={1}>
                    {img.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <AntDesign name="close" size={16} color={colors.text} />
                  </TouchableOpacity>
                </Animated.View>
              ))}

              {images.length === 0 && (
                <View style={styles.emptyImagesContainer}>
                  <MaterialIcons
                    name="image"
                    size={40}
                    color={colors.secondary}
                  />
                  <Text style={styles.noImagesText}>
                    No images selected yet
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : current.isDropdown ? (
          <View style={styles.dropdownContainer}>
            <DropDownPicker
              searchable={true}
              searchablePlaceholder={`Search for a ${current.dropdownType}...`}
              searchablePlaceholderTextColor="#888"
              placeholder={current.placeholder}
              open={
                current.dropdownType === "category" ? categoryOpen : countryOpen
              }
              value={current.dropdownType === "category" ? category : country}
              items={
                current.dropdownType === "category"
                  ? categoryItems
                  : countryItems
              }
              setOpen={
                current.dropdownType === "category"
                  ? setCategoryOpen
                  : setCountryOpen
              }
              setValue={current.setValue}
              setItems={
                current.dropdownType === "category"
                  ? setCategoryItems
                  : setCountryItems
              }
              style={styles.dropdownStyle}
              dropDownContainerStyle={styles.dropdownListStyle}
              listItemContainerStyle={styles.dropdownItemStyle}
              searchContainerStyle={styles.dropdownSearchContainer}
              searchTextInputStyle={styles.dropdownSearchInput}
              containerStyle={{
                marginBottom: categoryOpen || countryOpen ? 200 : 20,
              }}
              zIndex={3000}
            />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, current.multiline && styles.multilineInput]}
              placeholder={current.placeholder}
              placeholderTextColor={colors.placeholderText || "#999"}
              value={current.value}
              onChangeText={current.setValue}
              keyboardType={current.keyboardType}
              multiline={current.multiline}
              editable={current.editable !== false}
            />
            {current.required && (
              <Text style={styles.requiredIndicator}>* Required</Text>
            )}
          </View>
        )}
      </Animated.View>

      <View style={styles.bottomButtonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={animating}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={colors.backButtonText || "#555"}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            currentStep > 0 ? { flex: 1, marginLeft: 10 } : { width: "100%" },
            // Disable button if at first step with product limit reached
            currentStep === 0 &&
              sellerProducts.length >= productLimit &&
              styles.nextButtonDisabled,
            // Subtle disabled state for required fields
            !current.isSubscriptionStep &&
              !current.isImageStep &&
              current.required &&
              !current.value &&
              styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={
            animating ||
            (currentStep === 0 && sellerProducts.length >= productLimit)
          }
          activeOpacity={0.7}
        >
          {currentStep < steps.length - 1 ? (
            <>
              <Text style={styles.nextButtonText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </>
          ) : (
            <>
              <Text style={styles.nextButtonText}>Submit</Text>
              <MaterialIcons name="check" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Enhanced styles for the animated mobile wizard layout
 */
function getEnhancedMobileStyles(colors) {
  const { width, height } = Dimensions.get("window");

  // Enhance colors with defaults if not provided
  const enhancedColors = {
    ...colors,
    progressBackground: colors.progressBackground || "#f0f0f0",
    progressFill: colors.progressFill || colors.primary || "#3498db",
    stepIconBackground: colors.stepIconBackground || "#f5f8ff",
    cardBackground: colors.cardBackground || "#ffffff",
    inputBorder: colors.inputBorder || "#e0e0e0",
    placeholderText: colors.placeholderText || "#aaaaaa",
    buttonDisabled: colors.buttonDisabled || "rgba(0,0,0,0.2)",
    successBackground: colors.successBackground || colors.primary || "#3498db",
    warningBackground: "#ff9800",
    warningText: "#fff",
    dangerBackground: "#f44336",
    dangerText: "#fff",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: enhancedColors.background || "#f9f9f9",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    progressContainer: {
      height: 4,
      backgroundColor: enhancedColors.progressBackground,
      width: "100%",
    },
    progressBar: {
      height: 4,
      backgroundColor: enhancedColors.progressFill,
    },
    stepIndicatorContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      marginTop: 15,
      marginBottom: 5,
    },
    stepIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: enhancedColors.stepIconBackground,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    stepLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: enhancedColors.text || "#333",
      flex: 1,
    },
    stepIndicatorText: {
      fontSize: 14,
      color: enhancedColors.subtitle || "#888",
      fontWeight: "500",
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    questionText: {
      fontSize: 24,
      fontWeight: "bold",
      color: enhancedColors.text || "#333",
      marginBottom: 30,
      maxWidth: width - 40,
    },
    subscriptionInfoContainer: {
      marginBottom: 20,
    },
    subscriptionPlanCard: {
      backgroundColor: enhancedColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: 10,
    },
    subscriptionPlanTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: enhancedColors.primary,
      textAlign: "center",
      marginBottom: 16,
    },
    subscriptionDetailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: enhancedColors.inputBorder,
    },
    subscriptionDetailLabel: {
      fontSize: 16,
      color: enhancedColors.text,
    },
    subscriptionDetailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: enhancedColors.primary,
    },
    subscriptionLimitReached: {
      color: enhancedColors.dangerBackground,
    },
    limitWarningMobile: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: enhancedColors.warningBackground,
      borderRadius: 6,
      padding: 10,
      marginTop: 12,
    },
    limitWarningText: {
      color: enhancedColors.warningText,
      marginLeft: 8,
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
    },
    upgradePlanButton: {
      backgroundColor: enhancedColors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 16,
    },
    upgradePlanButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: enhancedColors.inputBorder,
      borderRadius: 10,
      backgroundColor: enhancedColors.cardBackground,
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: enhancedColors.text || "#333",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    multilineInput: {
      height: 120,
      textAlignVertical: "top",
      paddingTop: 14,
    },
    requiredIndicator: {
      color: "red",
      fontSize: 12,
      marginTop: 4,
      alignSelf: "flex-end",
    },
    bottomButtonContainer: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      flexDirection: "row",
    },
    backButton: {
      backgroundColor: enhancedColors.cardBackground || "#ffffff",
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      width: 100,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: 1,
      borderColor: enhancedColors.inputBorder || "#e0e0e0",
    },
    backButtonText: {
      color: enhancedColors.text || "#333",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 6,
    },
    nextButton: {
      backgroundColor: enhancedColors.primary || "#3498db",
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    nextButtonDisabled: {
      backgroundColor: "#cccccc",
      opacity: 0.7,
    },
    nextButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginRight: 6,
    },
    buttonDisabled: {
      opacity: 0.7,
      backgroundColor: enhancedColors.buttonDisabled,
    },
    imageStepWrapper: {
      flex: 1,
    },
    uploadButton: {
      backgroundColor: enhancedColors.primary || "#3498db",
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    uploadButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    selectedImagesContainer: {
      marginTop: 10,
    },
    selectedImageItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: enhancedColors.inputBorder || "#e0e0e0",
      borderRadius: 10,
      backgroundColor: enhancedColors.cardBackground || "#ffffff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    selectedImageName: {
      flex: 1,
      marginRight: 10,
      color: enhancedColors.text || "#333",
    },
    removeImageButton: {
      padding: 6,
      backgroundColor: "#f5f5f5",
      borderRadius: 20,
    },
    emptyImagesContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
      backgroundColor: enhancedColors.cardBackground || "#ffffff",
      borderWidth: 1,
      borderColor: enhancedColors.inputBorder || "#e0e0e0",
      borderStyle: "dashed",
      borderRadius: 10,
    },
    noImagesText: {
      color: enhancedColors.subtitle || "#888",
      fontStyle: "italic",
      marginTop: 10,
      textAlign: "center",
    },
    dropdownContainer: {
      marginBottom: 20,
    },
    dropdownStyle: {
      borderWidth: 1,
      borderColor: enhancedColors.inputBorder || "#e0e0e0",
      borderRadius: 10,
      backgroundColor: enhancedColors.cardBackground || "#ffffff",
      minHeight: 50,
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    dropdownListStyle: {
      borderWidth: 1,
      borderColor: enhancedColors.inputBorder || "#e0e0e0",
      borderRadius: 10,
      backgroundColor: enhancedColors.cardBackground || "#ffffff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 5,
    },
    dropdownItemStyle: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    dropdownSearchContainer: {
      borderBottomWidth: 1,
      borderBottomColor: enhancedColors.inputBorder || "#e0e0e0",
      paddingHorizontal: 6,
    },
    dropdownSearchInput: {
      borderWidth: 0,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    successContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: enhancedColors.successBackground,
      padding: 20,
    },
    successContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    successIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: "white",
      marginBottom: 10,
    },
    successMessage: {
      fontSize: 18,
      color: "white",
      textAlign: "center",
    },
  });
}
