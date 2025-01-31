import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InputMain from '../components/InputMain';
import ButtonMain from '../components/ButtonMain';

export default function ProfileEditScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [website, setWebsite] = useState('');

  const handleSave = () => {
    // Handle save logic here
    console.log('Profile saved:', {
      name,
      description,
      city,
      country,
      twitter,
      linkedIn,
      website,
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Picture Section */}
      <View style={styles.profilePictureContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
          }}
          style={styles.profilePicture}
        />
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <InputMain placeholder='Name' label='Name'/>
        <InputMain placeholder='Description' label='Description' numberOfLines={3}/>
        <InputMain placeholder='City' label='City'/>
        <InputMain placeholder='Country' label='Country'/>
      </View>

      {/* Social Media Links */}
      <View style={styles.inputContainer}>
        <Text style={styles.sectionTitle}>Social Media Links</Text>
        <InputMain placeholder='account@' label='X'/>
        <InputMain placeholder='www.LinkedIn.com/In/name' label='LinkedIn'/>
        <InputMain placeholder='www.website.com' label='Website'/>
      </View>

      {/* Save Button */}
      <View style={styles.inputContainer}>
        <ButtonMain>Save Changes</ButtonMain>
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    padding: 10,
    color: '#ffffff',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 110,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  description: {
    height: 80,
    textAlignVertical: 'top',
  },
  socialMediaContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
