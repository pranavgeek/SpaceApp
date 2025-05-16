// FileService.js
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from './db/API';

// Determine correct base URL based on platform and device
const getBaseUrl = `${BASE_URL}/files`

console.log("Using FileService upload URL:", getBaseUrl);

const FILE_UPLOAD_URL = getBaseUrl;

/**
 * Upload an image to the server
 * @param {string} uri - Local URI of the image
 * @param {string} folder - Optional folder name (default: 'images')
 * @returns {Promise<Object>} - Upload result with URL
 */
export const uploadImage = async (uri, folder = 'images') => {
  try {
    // Create form data for the upload
    const formData = new FormData();
    
    // Get file name and type from URI
    const uriParts = uri.split('.');
    const fileExtension = uriParts[uriParts.length - 1];
    const fileType = `image/${fileExtension}`;
    
    // Append the file to form data
    formData.append('file', {
      uri,
      name: `photo.${fileExtension}`,
      type: fileType
    });
    
    const uploadUrl = `${FILE_UPLOAD_URL}/upload?folder=${folder}`;
    console.log(`Uploading image to ${uploadUrl}`);
    
    // Upload the image to the server
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Check if the response is successful
    if (!response.ok) {
      // Try to get the error message from the response
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.error || `HTTP Error: ${response.status}`;
      } catch (e) {
        errorText = await response.text();
      }
      throw new Error(`Failed to upload image: ${errorText}`);
    }
    
    // Parse the successful response
    const result = await response.json();
    
    console.log('Image uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Pick an image from the device's library
 * @param {Object} options - Additional options for the image picker
 * @returns {Promise<Object>} - Selected image information
 */
export const pickImage = async (options = {}) => {
  try {
    // Request permission to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permission to access media library was denied');
    }
    
    // Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      ...options
    });
    
    // Return null if the user cancelled the selection
    if (result.canceled) {
      return null;
    }
    
    return result.assets[0];
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Take a photo using the device's camera
 * @param {Object} options - Additional options for the camera
 * @returns {Promise<Object>} - Captured photo information
 */
export const takePhoto = async (options = {}) => {
  try {
    // Request permission to access the camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permission to access camera was denied');
    }
    
    // Launch the camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      ...options
    });
    
    // Return null if the user cancelled
    if (result.canceled) {
      return null;
    }
    
    return result.assets[0];
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

export default {
  uploadImage,
  pickImage,
  takePhoto
};