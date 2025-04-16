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
import { createProduct } from "../backend/db/API";

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

  // Form states for text fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
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
    mockCities.map(city => ({ label: city, value: city }))
  );

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

    console.log("📤 Submitting product with values:", {
      title,
      category,
      price,
      detailedDescription,
      country,
      images,
    });
  
    try {
      const productPayload = {
        product_name: title,
        category,
        cost: parseFloat(price),
        description: detailedDescription,
        country,
        user_seller: user?.user_id,
        product_image: images.length ? images[0].uri : "", // basic support for first image
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
        <FormField
          label="PRICE"
          value={price}
          onChangeText={setPrice}
          placeholder="Enter price"
          colors={colors}
          keyboardType="numeric"
          required
        />

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
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
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
        {label} {required && <Text style={{ color: 'red' }}>*</Text>}
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
      marginBottom: 30,
      textAlign: "left",
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
    }
  });
}

/* ------------------------------------------------------------------
   2) MOBILE LAYOUT: ENHANCED ANIMATED WIZARD WITH SMOOTH TRANSITIONS
   ------------------------------------------------------------------ */

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

  // States for wizard fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
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
    mockCities.map(city => ({ label: city, value: city }))
  );

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

  // Define steps for the wizard
  const steps = [
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
      placeholder: "Enter price",
      value: price,
      setValue: setPrice,
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
      toValue: (currentStep) / (steps.length - 1),
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
      })
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
        })
      ]).start(() => {
        setAnimating(false);
      });
    });
  };

  const handleNext = () => {
    const step = steps[currentStep];
    if (!step.isImageStep && step.required && !step.value) {
      Alert.alert("Required Field", "Please fill in this field before continuing.");
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

    console.log("📤 Submitting product with values:", {
      title,
      category,
      price,
      detailedDescription,
      country,
      images,
    });
  
    try {
      const productPayload = {
        product_name: title,
        category,
        cost: parseFloat(price),
        description: detailedDescription,
        country,
        user_seller: user?.user_id,
        product_image: images.length ? images[0].uri : "",
        verified: false,
        created_at: new Date().toISOString(),
      };
      console.log("🧾 Final product payload:", productPayload);
  
      const res = await createProduct(productPayload);
      console.log("✅ Product created:", res);
  
      // Trigger success animation
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
        console.log("🎉 Success animation completed. Form marked as submitted.");
        setSubmitted(true);
      });
    } catch (err) {
      console.error("❌ Product submission failed:", err);
      Alert.alert("Submission Failed", "Could not create product.");
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
        })
      ]).start();
    }
  }, [submitted]);

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Animated.View 
          style={[
            styles.successContent,
            {
              opacity: successAnim,
              transform: [
                { scale: successAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 1.1, 1]
                })}
              ]
            }
          ]}
        >
          <View style={styles.successIconContainer}>
            <Feather name="check-circle" size={60} color="white" />
          </View>
          <Text style={styles.successTitle}>
            Success!
          </Text>
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
    outputRange: ['0%', '100%']
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
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ],
            opacity: opacityAnim
          }
        ]}
      >
        <Text style={styles.questionText}>{current.question}</Text>
        
        {current.isImageStep ? (
          <View style={styles.imageStepWrapper}>
            <TouchableOpacity 
              style={styles.uploadButton} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add-photo-alternate" size={20} color="white" />
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
                  <MaterialIcons name="image" size={40} color={colors.secondary} />
                  <Text style={styles.noImagesText}>No images selected yet</Text>
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
              open={current.dropdownType === "category" ? categoryOpen : countryOpen}
              value={current.dropdownType === "category" ? category : country}
              items={current.dropdownType === "category" ? categoryItems : countryItems}
              setOpen={current.dropdownType === "category" ? setCategoryOpen : setCountryOpen}
              setValue={current.setValue}
              setItems={current.dropdownType === "category" ? setCategoryItems : setCountryItems}
              style={styles.dropdownStyle}
              dropDownContainerStyle={styles.dropdownListStyle}
              listItemContainerStyle={styles.dropdownItemStyle}
              searchContainerStyle={styles.dropdownSearchContainer}
              searchTextInputStyle={styles.dropdownSearchInput}
              containerStyle={{ marginBottom: (categoryOpen || countryOpen) ? 200 : 20 }}
              zIndex={3000}
            />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                current.multiline && styles.multilineInput,
              ]}
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
            <MaterialIcons name="arrow-back" size={20} color={colors.backButtonText || "#555"} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.nextButton, 
            currentStep > 0 ? { flex: 1, marginLeft: 10 } : { width: "100%" },
            // Subtle disabled state
            (!current.isImageStep && current.required && !current.value) && styles.buttonDisabled
          ]} 
          onPress={handleNext}
          disabled={animating}
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
  };
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: enhancedColors.background || "#f9f9f9",
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
    }
  });
}