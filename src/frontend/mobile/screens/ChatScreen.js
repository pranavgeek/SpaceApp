import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import ButtonMain from "../components/ButtonMain";
import AntDesign from '@expo/vector-icons/AntDesign';
import * as ImagePicker from "expo-image-picker";
import Entypo from "@expo/vector-icons/Entypo";
import { useTheme } from "../theme/ThemeContext";

export default function ChatScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  const [images, setImages] = useState([]);
  const [messages, setMessages] = useState([
    { id: "1", text: "Hi there!", type: "received" },
    { id: "2", text: "Hello! How are you?", type: "sent" },
    { id: "3", text: "I'm good, thanks! How about you?", type: "received" },
    { id: "4", text: "I'm doing well, working on a project.", type: "sent" },
  ]);
  const [inputText, setInputText] = useState("");
  const sendButtonPosition = useRef(new Animated.Value(100)).current;
  const textInputWidth = useRef(new Animated.Value(1)).current; // Initial width
  const iconScale = useRef(new Animated.Value(1)).current; // Initial scale

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }
    })();
  }, []);

  useEffect(() => {
    // Use optional chaining to safely access images.length
    if (inputText.trim() !== "" || (images && images.length > 0)) {
      Animated.timing(sendButtonPosition, {
        toValue: 0, // Slide in
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sendButtonPosition, {
        toValue: 100, // Slide out
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [inputText, images]);

  const handleSend = () => {
    if (inputText.trim() !== "") {
      const newMessage = {
        id: (messages.length + 1).toString(),
        text: inputText,
        type: "sent",
      };
      setMessages([newMessage, ...messages]);
      setInputText("");
    }
  };

  const handleSendImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newMessage = {
        id: (messages.length + 1).toString(),
        images: result.assets.map((asset) => asset.uri),
        type: "sent",
      };
      setMessages([newMessage, ...messages]);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === "sent" ? styles.sentMessage : styles.receivedMessage,
      ]}
    >
      {item.images && item.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {item.images.map((img, index) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={styles.messageImage}
            />
          ))}
        </View>
      )}
      {item.text && <Text style={styles.messageText}>{item.text}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Custom header / profile section */}
        <View style={styles.profileSection}>
          {/* Back Arrow in the top-left (absolute) */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backArrow}
          >
            <AntDesign name="left" size={27} color={colors.primary} />
          </TouchableOpacity>

          {/* Centered Profile Image and Text */}
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>John Doe</Text>
          {/* <Text style={styles.profileSubtitle}>Software Engineer</Text> */}
        </View>

        {/* Messages List (inverted) */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          inverted
        />

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={colors.subtitle}
          />
          <TouchableOpacity style={styles.uploadButton} onPress={handleSendImages}>
            <Entypo name="images" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Animated.View
            style={{ transform: [{ translateX: sendButtonPosition }] }}
          >
            {(inputText.trim() !== "" || images.length > 0) && (
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={handleSend}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Dynamic style generator
function getDynamicStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Custom header section
    profileSection: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.baseContainerHeader,
      height: 150,
    },
    // Position the back arrow in the top-left corner
    backArrow: {
      position: "absolute",
      top: 80,   // Adjust if needed for safe area
      left: 30,
      zIndex: 10,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginBottom: 5,
      marginTop: 50,
    },
    profileName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    profileSubtitle: {
      fontSize: 14,
      color: colors.subtitle,
    },

    // Messages
    messageList: {
      flex: 1,
      paddingHorizontal: 10,
      marginVertical: 10,
    },
    messageContainer: {
      marginVertical: 10,
      padding: 10,
      borderRadius: 10,
      maxWidth: "70%",
    },
    sentMessage: {
      alignSelf: "flex-end",
      backgroundColor: colors.baseContainerFooter,
    },
    receivedMessage: {
      alignSelf: "flex-start",
      backgroundColor: colors.baseContainerBody,
    },
    messageText: {
      fontSize: 16,
      color: colors.text,
    },
    imagesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 5,
    },
    messageImage: {
      width: 100,
      height: 100,
      margin: 5,
      borderRadius: 10,
    },

    // Input
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: colors.subtitle,
      backgroundColor: colors.baseContainerHeader,
    },
    input: {
      flex: 1,
      height: 40,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.subtitle,
      borderRadius: 20,
      backgroundColor: colors.baseContainerBody,
      color: colors.text,
    },
    uploadButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
      marginRight: 10,
    },
    sendButton: {
      marginLeft: 10,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
    },
    sendButtonText: {
      color: colors.text,
      fontSize: 16,
    },
  });
}
