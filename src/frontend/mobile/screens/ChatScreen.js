import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity
} from "react-native";
import ButtonMain from "../components/ButtonMain";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "../theme/ThemeContext"; // Import useTheme hook

const ChatScreen = () => {
  const { colors } = useTheme(); // Access theme colors
  const styles = getDynamicStyles(colors); // Generate dynamic styles

  const [image, setImage] = useState(null);
  const [messages, setMessages] = useState([
    { id: "1", text: "Hi there!", type: "received" },
    { id: "2", text: "Hello! How are you?", type: "sent" },
    { id: "3", text: "I'm good, thanks! How about you?", type: "received" },
    { id: "4", text: "I'm doing well, working on a project.", type: "sent" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleImageUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets.map(asset => asset.uri)]); // Add new image to the array
    }
  };

  const handleSend = () => {
    if (inputText.trim() !== "" || images.length > 0) {
      const newMessage = {
        id: (messages.length + 1).toString(),
        text: inputText,
        images: [...images], // Include images in the message
        type: "sent",
      };
      setMessages([newMessage, ...messages]);
      setInputText("");
      setImages(); // Clear images after sending
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === "sent" ? styles.sentMessage : styles.receivedMessage,
      ]}
    >
      {item.images && item.images.length > 0 && ( // Render images if available
        <View style={styles.imagesContainer}>
          {item.images.map((img, index) => (
            <Image key={index} source={{ uri: img }} style={styles.messageImage} />
          ))}
        </View>
      )}
      {item.text && <Text style={styles.messageText}>{item.text}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>John Doe</Text>
        <Text style={styles.profileSubtitle}>Software Engineer</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        inverted
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.uploadButton} onPress={handleImageUpload}>
          <Feather name="upload-cloud" size={24} color="black" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          placeholderTextColor={colors.subtitle} // Use theme color for placeholder
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }]} // Use theme color for button
          onPress={handleSend}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getDynamicStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Use theme color for background
  },
  profileSection: {
    alignItems: "center",
    backgroundColor: colors.baseContainerHeader, // Use theme color for header
    paddingVertical: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text, // Use theme color for text
  },
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
    backgroundColor: colors.baseContainerFooter, // Use theme color for sent message background
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.baseContainerBody, // Use theme color for received message background
  },
  profileSubtitle: {
    fontSize: 14,
    color: colors.subtitle, // Use theme color for subtitle
  },
  // sentMessageText: {
  //   color: colors.text, // Use theme color for sent message text
  // },
  // receivedMessageText: {
  //   color: colors.text, // Use theme color for received message text
  // },
  messageText: {
    fontSize: 16,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.subtitle, // Use theme color for border
    backgroundColor: colors.baseContainerHeader, // Use theme color for header
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.subtitle, // Use theme color for border
    borderRadius: 20,
    backgroundColor: colors.baseContainerBody, // Use theme color for input background
    color: colors.text, // Use theme color for input text
  },
  sendButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: colors.secondary, // Use theme color for upload button
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 10,
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
  sendButtonText: {
    color: colors.text, // Use theme color for send button text
    fontSize: 16,
  },
});

export default ChatScreen;