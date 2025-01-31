import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Image } from 'react-native';
import ButtonMain from '../components/ButtonMain';

const ChatScreen = () => {
  // Dummy data for messages
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hi there!', type: 'received' },
    { id: '2', text: 'Hello! How are you?', type: 'sent' },
    { id: '3', text: 'I’m good, thanks! How about you?', type: 'received' },
    { id: '4', text: 'I’m doing well, working on a project.', type: 'sent' },
  ]);

  // Input state for new messages
  const [inputText, setInputText] = useState('');

  // Function to send a new message
  const handleSend = () => {
    if (inputText.trim() !== '') {
      const newMessage = {
        id: (messages.length + 1).toString(),
        text: inputText,
        type: 'sent',
      };
      setMessages([newMessage, ...messages]);
      setInputText('');
    }
  };

  // Render individual messages
  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === 'sent' ? styles.sentMessage : styles.receivedMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.type === 'sent' ? styles.sentMessageText : styles.receivedMessageText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>

        <View style={styles.profileSection}>
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80' }}
                style={styles.profileImage}
            />
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileSubtitle}>Software Engineer</Text>
        </View>
      {/* Messages List */}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        inverted // Invert the list to show the latest messages at the bottom
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
        />
        <ButtonMain onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
        </ButtonMain>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353535',
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#141414',
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
    fontWeight: 'bold',
    color: '#fff',
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
    maxWidth: '70%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#aaa',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#242424',
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  sentMessageText: {
    color: '#000', 
  },
  receivedMessageText: {
    color: '#fff',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    backgroundColor: '#141414',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#0084ff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#141414',
    fontSize: 16,
  },
});

export default ChatScreen;