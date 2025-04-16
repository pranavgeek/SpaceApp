import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
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

export default function ProfileEditScreen({ navigation }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [website, setWebsite] = useState("");
  // New state variables for gender and age
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { user, setUser } = useAuth();

  useEffect(() => {
    console.log("Current user data:", JSON.stringify(user, null, 2));
    
    if (user) {
      // Set the form values from user data
      setName(user.name || "");
      setDescription(user.about_us || "");
      setCity(user.city || "");
      setCountry(user.country || "");
      setTwitter(user.social_media_x || "");
      setLinkedIn(user.social_media_linkedin || "");
      setWebsite(user.social_media_website || "");
      
      // Check if gender and age exist and log their values
      console.log("Gender property exists:", user.hasOwnProperty('gender'));
      console.log("Age property exists:", user.hasOwnProperty('age'));
      
      setGender(user.gender || "");
      setAge(user.age !== undefined ? String(user.age) : "");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const updatedUser = {
        ...user,
        name,
        about_us: description,
        city,
        country,
        social_media_x: twitter,
        social_media_linkedin: linkedIn,
        social_media_website: website,
        gender,
        age: parseInt(age, 10),
      };

      const response = await updateUser(user.user_id, updatedUser);
      setUser(response); // Update the user context
      await AsyncStorage.setItem("user", JSON.stringify(response));
      alert("✅ Profile updated successfully!");
      // navigation.navigate("Profile");
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Picture Section */}
      <View style={styles.profilePictureContainer}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
          }}
          style={styles.profilePicture}
        />
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera" size={20} color={colors.text} />
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

      {/* Social Media Section */}
      {/* <BaseContainer title={"Social Media"}>
        <InputSetting
          placeholder="account@"
          label="X"
          value={twitter}
          onChangeText={setTwitter}
        />
        <InputSetting
          placeholder="www.LinkedIn.com/In/name"
          label="LinkedIn"
          value={linkedIn}
          onChangeText={setLinkedIn}
        />
        <InputSetting
          placeholder="www.website.com"
          label="Website"
          value={website}
          onChangeText={setWebsite}
        />
      </BaseContainer> */}

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
      right: 110,
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
