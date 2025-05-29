import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import InputMain from "../components/InputMain";
import ButtonMain from "../components/ButtonMain";
import BaseContainer from "../components/BaseContainer";
import { useTheme } from "../theme/ThemeContext.js";
import InputSetting from "../components/InputSetting.js";
import { useAuth } from "../context/AuthContext.js";
import { updateUser } from "../backend/db/API.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FileService from "../backend/FileService.js";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileEditScreen({ navigation }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  // Store both local and server URLs
  const [imageUris, setImageUris] = useState({
    localUri: null, // For display in the app
    serverUri: null, // For saving to the backend
  });

  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now()); // Used to force image refresh

  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { user, updateUserSilently } = useAuth();

  // Check if user is an influencer
  const isInfluencer = user?.account_type === "Influencer" || user?.role === "influencer";

  // Function to load user data - called both on initial load and when screen comes into focus
  const loadUserData = () => {
    console.log("Loading user data:", JSON.stringify(user, null, 2));

    if (user) {
      setName(user.name || "");
      setDescription(user.about_us || "");
      setCity(user.city || "");
      setCountry(user.country || "");
      
      // Make sure to set social media values
      setTwitter(user.social_media_x || "");
      setFacebook(user.social_media_facebook || "");
      setInstagram(user.social_media_instagram || "");
      
      setGender(user.gender || "");
      setAge(user.age !== undefined ? String(user.age) : "");

      // Set the profile image from user data
      if (user.profile_image) {
        // Add timestamp to force refresh
        const imageUrl = user.profile_image.includes('?') 
          ? `${user.profile_image}&t=${Date.now()}`
          : `${user.profile_image}?t=${Date.now()}`;
          
        console.log("Setting profile image with cache-busting:", imageUrl);
        
        // Just save it as the server URI, we'll display it locally
        setImageUris({
          localUri: null,
          serverUri: imageUrl,
        });
        
        // Refresh the key to force re-render
        setRefreshKey(Date.now());
      }
    }
  };

  // Initial load effect
  useEffect(() => {
    loadUserData();
  }, [user]);

  // Use focus effect to reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("Profile Edit Screen came into focus, reloading data");
      loadUserData();
      return () => {
        // Cleanup function when screen loses focus
      };
    }, [user])
  );

  const handleImageUpload = async () => {
    Alert.alert("Update Profile Picture", "Choose your image source", [
      {
        text: "Take Photo",
        onPress: handleTakePhoto,
      },
      {
        text: "Choose from Gallery",
        onPress: handlePickImage,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleTakePhoto = async () => {
    try {
      setUploading(true);

      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera permission is required to take a photo"
        );
        setUploading(false);
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      // Get the local URI
      const localUri = result.assets[0].uri;

      try {
        // Upload to server
        const uploadResult = await FileService.uploadImage(localUri, "profile");

        if (uploadResult.success) {
          console.log(
            "Profile image uploaded successfully:",
            uploadResult.fullUrl
          );

          // Add cache-busting timestamp
          const imageUrlWithTimestamp = `${uploadResult.fullUrl}?t=${Date.now()}`;

          // Save both URIs
          setImageUris({
            localUri: localUri, // For display in the app
            serverUri: imageUrlWithTimestamp, // For saving to backend with cache busting
          });
          
          // Refresh the key to force re-render
          setRefreshKey(Date.now());
        } else {
          // Just use local URI if upload fails
          setImageUris({
            localUri: localUri,
            serverUri: null,
          });
        }
      } catch (uploadError) {
        console.error("Error uploading photo:", uploadError);
        // Just use local URI if upload fails
        setImageUris({
          localUri: localUri,
          serverUri: null,
        });
      }

      setUploading(false);
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
      setUploading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);

      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Gallery permission is required to pick an image"
        );
        setUploading(false);
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      // Get the local URI
      const localUri = result.assets[0].uri;
      console.log("Selected image URI:", localUri);

      try {
        // Upload to server
        const uploadResult = await FileService.uploadImage(localUri, "profile");

        if (uploadResult.success) {
          console.log(
            "Profile image uploaded successfully:",
            uploadResult.fullUrl
          );

          // Add cache-busting timestamp
          const imageUrlWithTimestamp = `${uploadResult.fullUrl}?t=${Date.now()}`;

          // Save both URIs
          setImageUris({
            localUri: localUri, // For display in the app
            serverUri: imageUrlWithTimestamp, // For saving to backend with cache busting
          });
          
          console.log("Updated imageUris:", { 
            localUri, 
            serverUri: imageUrlWithTimestamp 
          });
          
          // Refresh the key to force re-render
          setRefreshKey(Date.now());
        } else {
          // Just use local URI if upload fails
          setImageUris({
            localUri: localUri,
            serverUri: null,
          });
        }
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        // Just use local URI if upload fails
        setImageUris({
          localUri: localUri,
          serverUri: null,
        });
      }

      setUploading(false);
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Extract the base URL without the cache-busting parameter
      let profileImageUrl = imageUris.serverUri || imageUris.localUri || user.profile_image;
      if (profileImageUrl && profileImageUrl.includes('?')) {
        profileImageUrl = profileImageUrl.split('?')[0];
      }
      
      const updatedUser = {
        ...user,
        name,
        about_us: description,
        city,
        country,
        gender,
        age: parseInt(age, 10),
        profile_image: profileImageUrl,
      };

      // Add social media fields only for influencers
      if (isInfluencer) {
        updatedUser.social_media_x = twitter;
        updatedUser.social_media_facebook = facebook;
        updatedUser.social_media_instagram = instagram;
      }
  
      console.log("Saving profile image URL:", updatedUser.profile_image);
      console.log("Is influencer:", isInfluencer);
      console.log("Social media data:", {
        twitter: updatedUser.social_media_x,
        facebook: updatedUser.social_media_facebook,
        instagram: updatedUser.social_media_instagram
      });
  
      // Update the user in the backend
      const response = await updateUser(user.user_id, updatedUser);
      
      // Update the user in AsyncStorage silently
      await updateUserSilently(response);
      
      // Update the local state with the latest response data
      // This ensures that our local state is in sync with what's saved in AsyncStorage
      if (response) {
        setTwitter(response.social_media_x || "");
        setFacebook(response.social_media_facebook || "");
        setInstagram(response.social_media_instagram || "");
        
        // Update profile image with cache busting
        if (response.profile_image) {
          const imageUrl = `${response.profile_image}?t=${Date.now()}`;
          setImageUris({
            localUri: null,
            serverUri: imageUrl,
          });
          setRefreshKey(Date.now());
        }
      }
      
      // Alert success
      alert("✅ Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // Get the image source for display
  const getImageSource = () => {
    let source;
    if (uploading) {
      source = require("../assets/Animation - 1747363939710.gif");
      console.log("Using loading animation");
    } else if (imageUris.localUri) {
      source = { uri: imageUris.localUri };
      console.log("Using local URI:", imageUris.localUri);
    } else if (imageUris.serverUri) {
      source = { uri: imageUris.serverUri };
      console.log("Using server URI with key:", imageUris.serverUri, refreshKey);
    } else if (user?.profile_image) {
      // Add cache-busting timestamp
      const imageUrl = user.profile_image.includes('?') 
        ? user.profile_image 
        : `${user.profile_image}?t=${refreshKey}`;
      source = { uri: imageUrl };
      console.log("Using existing profile image with key:", imageUrl, refreshKey);
    } else {
      source = {
        uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      };
      console.log("Using default image");
    }
    return source;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Picture Section */}
      <View style={styles.profilePictureContainer}>
        <TouchableOpacity onPress={handleImageUpload} disabled={uploading}>
          <Image
            source={getImageSource()}
            style={styles.profilePicture}
            resizeMode="cover"
            key={refreshKey} // Add key to force re-render when image changes
            onError={(e) =>
              console.error("Error loading image:", e.nativeEvent.error)
            }
          />
          <View style={styles.cameraButton}>
            <Ionicons name="camera" size={20} color={colors.text} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Personal Profile Section */}
      <BaseContainer title={"Personal Profile"}>
        <InputSetting
          placeholder="Name"
          label="Name"
          value={name}
          onChangeText={setName}
        />
        <InputSetting
          placeholder="Description"
          label="Description"
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />
        <InputSetting
          placeholder="City"
          label="City"
          value={city}
          onChangeText={setCity}
        />
        <InputSetting
          placeholder="Country"
          label="Country"
          value={country}
          onChangeText={setCountry}
        />
        {/* New Fields for Gender and Age */}
        <InputSetting
          placeholder="Gender"
          label="Gender"
          value={gender}
          onChangeText={setGender}
        />
        <InputSetting
          placeholder="Age"
          label="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      </BaseContainer>

      {/* Social Media Section - Only for Influencers */}
      {isInfluencer && (
        <BaseContainer title={"Social Media"}>
          <View style={styles.socialMediaHeader}>
            <Ionicons name="share-social" size={20} color={colors.primary} />
            <Text style={styles.socialMediaSubtitle}>
              Connect your social media accounts to boost your influence
            </Text>
          </View>
          
          <InputSetting
            placeholder="@username"
            label="Twitter"
            value={twitter}
            onChangeText={setTwitter}
            leftIcon={
              <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
            }
          />
          <InputSetting
            placeholder="facebook.com/username"
            label="Facebook"
            value={facebook}
            onChangeText={setFacebook}
            leftIcon={
              <Ionicons name="logo-facebook" size={20} color="#4267B2" />
            }
          />
          <InputSetting
            placeholder="@username"
            label="Instagram"
            value={instagram}
            onChangeText={setInstagram}
            leftIcon={
              <Ionicons name="logo-instagram" size={20} color="#C13584" />
            }
          />
        </BaseContainer>
      )}

      {/* Save Button */}
      <View style={styles.inputContainer}>
        <ButtonMain onPress={handleSave}>
          <Text style={styles.sectionTitle}>Save</Text>
        </ButtonMain>
      </View>
    </ScrollView>
  );
}

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 10,
      color: colors.text,
    },
    profilePictureContainer: {
      alignItems: "center",
      marginVertical: 20,
      position: "relative",
    },
    profilePicture: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.background,
    },
    cameraButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.baseContainerFooter,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.background,
      borderRadius: 8,
      padding: 10,
      marginBottom: 15,
      fontSize: 16,
      backgroundColor: colors.text,
    },
    description: {
      height: 80,
      textAlignVertical: "top",
    },
    socialMediaContainer: {
      marginBottom: 20,
    },
    socialMediaHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
      paddingHorizontal: 5,
    },
    socialMediaSubtitle: {
      marginLeft: 10,
      fontSize: 14,
      color: colors.subtitle,
      fontStyle: "italic",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.subtitle,
      marginBottom: 10,
    },
    saveButton: {
      backgroundColor: colors.background,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 20,
    },
    saveButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "bold",
    },
  });