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
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const FormScreen = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [user, setUser] = useState("John Doe"); // Automatic value for User
  const [summary, setSummary] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [images, setImages] = useState([]);
  const [link, setLink] = useState("");
  const [country, setCountry] = useState("");

  // Handle image selection
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages(result.assets); // Set images to the state
    }
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
      <Text style={styles.title}>Create a New Project</Text>

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

      {/* Display selected images */}
      {images.length > 0 && (
        <View style={styles.imagePreview}>
          {images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image.uri }}
              style={styles.image}
            />
          ))}
        </View>
      )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#141414",
  },
  title: {
    fontSize: 24,
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#242424",
    color: "white",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  imageButton: {
    backgroundColor: "#2e64e5",
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 15,
    borderRadius: 5,
  },
  imageButtonText: {
    color: "white",
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
    backgroundColor: "#2e64e5",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});

export default FormScreen;
