import React, { useState, useEffect } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../theme/ThemeContext";
import { AntDesign, Feather } from "@expo/vector-icons"; // Added Feather icon

/**
 * Single entry point: decides which layout to show based on the platform.
 */
export default function FormScreen() {
  if (Platform.OS === "web") {
    // Show the original web layout
    return <WebForm />;
  } else {
    // Show the single-step wizard for native mobile
    return <MobileWizard />;
  }
}

/* ------------------------------------------------------------------
   1) WEB LAYOUT: EXACT COPY OF YOUR ORIGINAL FORM (with success message)
   ------------------------------------------------------------------ */

function WebForm() {
  // Theme + Styles
  const { colors } = useTheme();
  const styles = getWebStyles(colors);

  // State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [user, setUser] = useState(""); // Automatic value for User
  const [summary, setSummary] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [images, setImages] = useState([]);
  const [link, setLink] = useState("");
  const [country, setCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
          name: asset.fileName,
        })),
      ]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title || !price || !summary || !detailedDescription || !country) {
      Alert.alert("Please fill in all required fields");
    } else {
      console.log({
        title,
        category,
        price,
        user,
        summary,
        detailedDescription,
        images,
        link,
        country,
      });
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <View
        style={[
          styles.scrollContainer,
          { justifyContent: "center", alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
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
          You have successfully submitted product
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
        />

        {/* Category */}
        <FormField
          label="CATEGORY"
          value={category}
          onChangeText={setCategory}
          placeholder="Enter category"
          colors={colors}
        />

        {/* Price */}
        <FormField
          label="PRICE"
          value={price}
          onChangeText={setPrice}
          placeholder="Enter price"
          colors={colors}
          keyboardType="numeric"
        />

        {/* User (automatic) */}
        <FormField
          label="USER"
          value={user}
          onChangeText={() => {}}
          placeholder="User"
          editable={false}
          colors={colors}
        />

        {/* Summary */}
        <FormField
          label="SUMMARY"
          value={summary}
          onChangeText={setSummary}
          placeholder="Short summary"
          colors={colors}
        />

        {/* Detailed Description */}
        <FormField
          label="DETAILED DESCRIPTION"
          value={detailedDescription}
          onChangeText={setDetailedDescription}
          placeholder="Describe your product"
          multiline
          colors={colors}
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
            <View key={index} style={styles.selectedImageItem}>
              <Text style={styles.selectedImageName}>{image.name}</Text>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(index)}
              >
                <AntDesign name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Link (optional) */}
        <FormField
          label="LINK (OPTIONAL)"
          value={link}
          onChangeText={setLink}
          placeholder="Any related link"
          colors={colors}
        />

        {/* Country */}
        <FormField
          label="COUNTRY"
          value={country}
          onChangeText={setCountry}
          placeholder="e.g. USA"
          colors={colors}
        />

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
}) {
  const styles = getWebStyles(colors);
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
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
 * Original styles for Web
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
  });
}

/* ------------------------------------------------------------------
   2) MOBILE LAYOUT: SINGLE-STEP WIZARD (one field at a time with pinned button)
   ------------------------------------------------------------------ */

function MobileWizard() {
  // Initialize theme and styles at the top so they're available everywhere
  const { colors } = useTheme();
  const styles = getMobileStyles(colors);

  // State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [user, setUser] = useState("");
  const [summary, setSummary] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [images, setImages] = useState([]);
  const [link, setLink] = useState("");
  const [country, setCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
          name: asset.fileName,
        })),
      ]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // We have 8 "steps" total: 7 text fields + 1 for images
  const steps = [
    {
      key: "title",
      label: "Title",
      question: "What's your title?",
      placeholder: "Enter product title",
      value: title,
      setValue: setTitle,
      keyboardType: "default",
      multiline: false,
      required: true,
    },
    {
      key: "category",
      label: "Category",
      question: "What's your category?",
      placeholder: "Enter category",
      value: category,
      setValue: setCategory,
      keyboardType: "default",
      multiline: false,
      required: false,
    },
    {
      key: "price",
      label: "Price",
      question: "What's your price?",
      placeholder: "Enter price",
      value: price,
      setValue: setPrice,
      keyboardType: "numeric",
      multiline: false,
      required: true,
    },
    {
      key: "user",
      label: "User",
      question: "Which user?",
      placeholder: "User name",
      value: user,
      setValue: setUser,
      keyboardType: "default",
      multiline: false,
      required: false,
    },
    {
      key: "summary",
      label: "Summary",
      question: "Short summary?",
      placeholder: "Short summary",
      value: summary,
      setValue: setSummary,
      keyboardType: "default",
      multiline: false,
      required: true,
    },
    {
      key: "detailedDescription",
      label: "Description",
      question: "Describe your product",
      placeholder: "Detailed description",
      value: detailedDescription,
      setValue: setDetailedDescription,
      keyboardType: "default",
      multiline: true,
      required: true,
    },
    {
      key: "link",
      label: "Link",
      question: "Any related link?",
      placeholder: "Optional link",
      value: link,
      setValue: setLink,
      keyboardType: "default",
      multiline: false,
      required: false,
    },
    {
      key: "country",
      label: "Country",
      question: "Which country?",
      placeholder: "e.g. USA",
      value: country,
      setValue: setCountry,
      keyboardType: "default",
      multiline: false,
      required: true,
    },
    {
      key: "images",
      label: "Images",
      question: "Upload Images",
      isImageStep: true, // no text input, just image picking
    },
  ];

  // Current step (0..7)
  const [currentStep, setCurrentStep] = useState(0);

  // If submitted, render success message with check icon
  if (submitted) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 }]}>
        <Feather name="check-circle" size={48} color={colors.success} />
        <Text style={{ marginTop: 10, fontSize: 24, fontWeight: "bold", color: colors.subtitle, textAlign: "center" }}>
          You have successfully submitted product
        </Text>
      </View>
    );
  }

  // Step forward or final submit
  const handleNext = () => {
    const step = steps[currentStep];
    if (!step.isImageStep && step.required && !step.value) {
      Alert.alert("Please fill in this field before continuing.");
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!title || !price || !summary || !detailedDescription || !country) {
      Alert.alert("Please fill in all required fields");
    } else {
      console.log({
        title,
        category,
        price,
        user,
        summary,
        detailedDescription,
        images,
        link,
        country,
      });
      setSubmitted(true);
    }
  };

  const current = steps[currentStep];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step indicator in top-right: "Title — 1 of 8" */}
        <View style={styles.stepIndicatorContainer}>
          <Text style={styles.stepIndicatorText}>
            <Text style={{ fontWeight: "bold" }}>{current.label}</Text> — {currentStep + 1} of {steps.length}
          </Text>
        </View>

        {/* Big question text */}
        <Text style={styles.questionText}>{current.question}</Text>

        {/* If it's the image step, show image picker. Otherwise show a TextInput */}
        {current.isImageStep ? (
          <View style={styles.imageStepWrapper}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>Pick Images</Text>
            </TouchableOpacity>
            {/* Display selected images */}
            <View style={styles.selectedImagesContainer}>
              {images.map((img, index) => (
                <View key={index} style={styles.selectedImageItem}>
                  <Text style={styles.selectedImageName}>{img.name}</Text>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <AntDesign name="close" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <TextInput
            style={[
              styles.input,
              current.multiline && { height: 80, textAlignVertical: "top" },
            ]}
            placeholder={current.placeholder}
            placeholderTextColor="#999"
            value={current.value}
            onChangeText={current.setValue}
            keyboardType={current.keyboardType}
            multiline={current.multiline}
          />
        )}
      </ScrollView>
      {/* Next / Submit button pinned to bottom */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentStep < steps.length - 1 ? "Next" : "Submit"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Minimal styles for the single-step mobile wizard layout
 */
function getMobileStyles(colors) {
  const { width } = Dimensions.get("window");
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 120, // Extra padding so content isn't hidden behind the button
    },
    stepIndicatorContainer: {
      alignItems: "flex-end",
      marginBottom: 10,
    },
    stepIndicatorText: {
      fontSize: 14,
      color: colors.subtitle,
    },
    questionText: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 30,
      maxWidth: width - 40,
    },
    input: {
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary,
      fontSize: 16,
      paddingVertical: 6,
      marginBottom: 40,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 4,
      paddingVertical: 12,
      alignItems: "center",
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    bottomButtonContainer: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
    },
    // Image step
    imageStepWrapper: {
      marginBottom: 40,
    },
    uploadButton: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 4,
      alignItems: "center",
      marginBottom: 20,
    },
    uploadButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    selectedImagesContainer: {
      marginTop: 10,
    },
    selectedImageItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 5,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
    },
    selectedImageName: {
      flex: 1,
      marginRight: 10,
      color: colors.text,
    },
    removeImageButton: {
      padding: 5,
    },
  });
}
