// services/imageService.js
import { saveImageToLocal, getLocalImages, deleteLocalImage } from './fileSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API URL
const API_BASE_URL = Platform.OS === "web"
    ? "http://localhost:5001/api"
    : "http://10.0.0.25:5001/api";

// Keep track of pending uploads when offline
const PENDING_UPLOADS_KEY = 'pendingImageUploads';

// Upload image to the backend
export const uploadImageToBackend = async (localUri, metadata = {}) => {
  try {
    // Create form data for the image
    const formData = new FormData();
    const filename = localUri.split('/').pop();
    
    // Add image file
    formData.append('image', {
      uri: localUri,
      name: filename,
      type: 'image/jpeg',
    });
    
    // Add metadata
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    
    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Image uploaded to backend successfully');
      return { success: true, data };
    } else {
      throw new Error(data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Error uploading to backend:', error);
    
    // Store as pending upload for later retry
    await storePendingUpload(localUri, metadata);
    
    return { 
      success: false, 
      error: error.message,
      isPending: true 
    };
  }
};

// Store pending uploads for later
const storePendingUpload = async (localUri, metadata) => {
  try {
    const pendingUploadsStr = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
    const pendingUploads = pendingUploadsStr ? JSON.parse(pendingUploadsStr) : [];
    
    pendingUploads.push({
      uri: localUri,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    await AsyncStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(pendingUploads));
    console.log('Stored pending upload for later');
  } catch (error) {
    console.error('Error storing pending upload:', error);
  }
};

// Retry uploading pending images
export const retryPendingUploads = async () => {
  try {
    const pendingUploadsStr = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
    if (!pendingUploadsStr) return { success: true, count: 0 };
    
    const pendingUploads = JSON.parse(pendingUploadsStr);
    if (pendingUploads.length === 0) return { success: true, count: 0 };
    
    console.log(`Retrying ${pendingUploads.length} pending uploads`);
    
    const successfulUploads = [];
    const failedUploads = [];
    
    for (const upload of pendingUploads) {
      try {
        const result = await uploadImageToBackend(upload.uri, upload.metadata);
        if (result.success) {
          successfulUploads.push(upload);
        } else {
          failedUploads.push(upload);
        }
      } catch (error) {
        failedUploads.push(upload);
      }
    }
    
    // Update pending uploads, removing successful ones
    await AsyncStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(failedUploads));
    
    return {
      success: true,
      uploaded: successfulUploads.length,
      failed: failedUploads.length
    };
  } catch (error) {
    console.error('Error retrying pending uploads:', error);
    return { success: false, error: error.message };
  }
};

// Capture and upload image in one step
export const captureAndUploadImage = async (imageUri, metadata = {}) => {
  try {
    // First save locally
    const savedImage = await saveImageToLocal(imageUri);
    
    if (!savedImage.success) {
      throw new Error('Failed to save image locally');
    }
    
    // Add local URI to metadata
    metadata.localUri = savedImage.uri;
    metadata.fileName = savedImage.fileName;
    
    // Then upload to backend
    const uploadResult = await uploadImageToBackend(savedImage.uri, metadata);
    
    return {
      ...uploadResult,
      localUri: savedImage.uri,
      fileName: savedImage.fileName
    };
  } catch (error) {
    console.error('Error in capture and upload:', error);
    return { success: false, error: error.message };
  }
};