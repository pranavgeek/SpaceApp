// FormScreen.js (Form for project creation)

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Button,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../theme/ThemeContext";
import { AntDesign } from "@expo/vector-icons";

const FormScreen = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [user, setUser] = useState(""); // Automatic value for User
  const [summary, setSummary] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [images, setImages] = useState([]);
  const [link, setLink] = useState("");
  const [country, setCountry] = useState("");

  const { colors } = useTheme(); // Access theme colors
  const styles = getDynamicStyles(colors); // Generate dynamic styles

  // Handle image selection
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

  // Handle image removal
  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };


  // Handle form submission
  const handleSubmit = () => {
    if (!title || !price || !summary || !detailedDescription || !country) {
      Alert.alert("Please fill in all required fields");
    } else {
      // Handle form submission logic here
      Alert.alert("Project Created", "Your project has been created!");
      console.log({
        title,
        price,
        user,
        summary,
        detailedDescription,
        images,
        link,
        country,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your Product</Text>

      {/* Title */}
      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#8A8A8A" 
        value={title}
        onChangeText={setTitle}
      />

      {/* Price */}
      <TextInput
        style={styles.input}
        placeholder="Price"
        placeholderTextColor="#8A8A8A"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      {/* User (automatic) */}
      <TextInput
        style={styles.input}
        placeholder="User"
        placeholderTextColor="#8A8A8A"
        editable={false}
        value={user}
      />

      {/* Summary */}
      <TextInput
        style={styles.input}
        placeholder="Summary"
        placeholderTextColor="#8A8A8A"
        value={summary}
        onChangeText={setSummary}
      />

      {/* Detailed Description */}
      <TextInput
        style={styles.input}
        placeholder="Detailed Description"
        placeholderTextColor="#8A8A8A"
        value={detailedDescription}
        onChangeText={setDetailedDescription}
        multiline
      />

      {/* Images (Upload) */}
      <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
        <Text style={styles.imageButtonText}>Upload Image</Text>
      </TouchableOpacity>

      {/* Display selected image names with removal buttons */}
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
      <TextInput
        style={styles.input}
        placeholder="Link (optional)"
        placeholderTextColor="#8A8A8A"
        value={link}
        onChangeText={setLink}
      />

      {/* Country */}
      <TextInput
        style={styles.input}
        placeholder="Country"
        placeholderTextColor="#8A8A8A"
        value={country}
        onChangeText={setCountry}
      />

      {/* Submit Button */}
      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const getDynamicStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    color: colors.text,
    marginBottom: 20,
    textAlign: "left",
  },
  input: {
    backgroundColor: colors.baseContainerFooter,
    color: colors.text,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  imageButton: {
    backgroundColor: colors.buttonBackground,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 15,
    borderRadius: 5,
  },
  imageButtonText: {
    color: colors.text,
    fontSize: 16,
  },
  imagePreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: colors.buttonBackground,
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: {
    color: colors.text,
    fontSize: 18,
  },
  selectedImagesContainer: {
    marginTop: 10,
  },
  selectedImageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.subtitle,
    borderRadius: 10,
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

export default FormScreen;
