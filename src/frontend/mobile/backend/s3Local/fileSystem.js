// utils/fileSystem.js
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Base directory for app storage
const LOCAL_IMAGE_DIR = `${FileSystem.documentDirectory}localImages/`;

// Create necessary directories
export const initializeFileSystem = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(LOCAL_IMAGE_DIR);
    if (!dirInfo.exists) {
      console.log("Creating local images directory...");
      await FileSystem.makeDirectoryAsync(LOCAL_IMAGE_DIR, { intermediates: true });
    }
    return true;
  } catch (error) {
    console.error("Error initializing file system:", error);
    return false;
  }
};

// Save an image to local storage
export const saveImageToLocal = async (uri, imageName = null) => {
  try {
    await initializeFileSystem();
    
    // Generate a unique filename if none provided
    const fileName = imageName || `img_${new Date().getTime()}.jpg`;
    const newUri = `${LOCAL_IMAGE_DIR}${fileName}`;
    
    // Copy the image from temp location to permanent storage
    await FileSystem.copyAsync({
      from: uri,
      to: newUri
    });
    
    console.log(`Image saved locally: ${newUri}`);
    return { success: true, uri: newUri, fileName };
  } catch (error) {
    console.error("Error saving image locally:", error);
    return { success: false, error };
  }
};

// Get a list of all locally stored images
export const getLocalImages = async () => {
  try {
    await initializeFileSystem();
    
    const images = await FileSystem.readDirectoryAsync(LOCAL_IMAGE_DIR);
    return images.map(fileName => ({
      uri: `${LOCAL_IMAGE_DIR}${fileName}`,
      fileName
    }));
  } catch (error) {
    console.error("Error getting local images:", error);
    return [];
  }
};

// Delete an image from local storage
export const deleteLocalImage = async (fileName) => {
  try {
    const filePath = `${LOCAL_IMAGE_DIR}${fileName}`;
    await FileSystem.deleteAsync(filePath);
    console.log(`Deleted local image: ${fileName}`);
    return true;
  } catch (error) {
    console.error("Error deleting local image:", error);
    return false;
  }
};