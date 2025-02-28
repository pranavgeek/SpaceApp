// CreatePostScreen.js (Example Screen)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CreatePostScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create a New Post</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default CreatePostScreen;
