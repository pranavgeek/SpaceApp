// FileService.js
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from './db/API';


const FILE_UPLOAD_URL = BASE_URL.endsWith('/api') 
? BASE_URL.substring(0, BASE_URL.length - 4) // Remove trailing /api
: BASE_URL;

console.log("API root for uploads:", FILE_UPLOAD_URL);

// ==========================Product images preview==============================================

export const uploadPreviewImage = async (uri, productId, previewIndex = 0) => {
  try {
    console.log(`Uploading preview image ${previewIndex} for product: ${productId}`);
    
    // Create form data for the upload
    const formData = new FormData();
    
    // Get file name and type from URI
    const uriParts = uri.split('.');
    const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
    const fileType = `image/${fileExtension}`;
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `preview_${timestamp}.${fileExtension}`;
    
    // Append the file to form data
    formData.append('file', {
      uri,
      name: fileName,
      type: fileType
    });
    
    // Use the preview upload endpoint with correct productId
    const uploadUrl = `${FILE_UPLOAD_URL}/api/products/upload-preview?productId=${productId}&previewIndex=${previewIndex}`;
    console.log(`Uploading preview to ${uploadUrl}`);
    
    // Upload the image to the server
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Log entire response for debugging
    const responseText = await response.text();
    console.log("Preview upload response text:", responseText);
    
    // Parse the response again
    const result = JSON.parse(responseText);
    
    console.log('Preview image uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('Error uploading preview image:', error);
    throw error;
  }
};

/**
 * Upload multiple preview images for a product at once
 * @param {Array<Object>} images - Array of image objects with uri property
 * @param {string} productId - ID of the product
 * @returns {Promise<Array<Object>>} - Upload results with URLs
 */
export const uploadMultiplePreviewImages = async (images, productId) => {
  if (!images || images.length === 0) {
    console.log("No preview images to upload");
    return [];
  }
  
  if (!productId) {
    console.error("No product ID provided for preview images");
    return [];
  }
  
  console.log(`Starting upload of ${images.length} preview images for product ${productId}`);
  
  try {
    // Step 1: Ensure preview directories exist
    console.log("Setting up preview directories...");
    try {
      // Use the BASE_URL from API.js instead of relative path
      const dirResponse = await fetch(`${BASE_URL}/products/${productId}/setup-previews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!dirResponse.ok) {
        const errorText = await dirResponse.text();
        throw new Error(`Failed to set up preview directories: ${errorText}`);
      }
      
      const dirResult = await dirResponse.json();
      console.log("Preview directories set up successfully:", dirResult);
    } catch (dirError) {
      console.error("Error setting up preview directories:", dirError);
      console.log("Continuing with upload attempt despite directory setup error");
      // Don't throw the error, try to continue with upload
    }
    
    // Step 2: Upload each preview image
    console.log(`Uploading ${images.length} preview images...`);
    
    const results = await Promise.all(images.map(async (image, index) => {
      try {
        console.log(`Processing preview image ${index + 1}/${images.length}`);
        
        // Create form data
        const formData = new FormData();
        
        // Get file details
        const uriParts = image.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
        const fileType = `image/${fileExtension}`;
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `preview_${timestamp}_${index}.${fileExtension}`;
        
        // Append file to form data
        formData.append('file', {
          uri: image.uri,
          name: fileName,
          type: fileType
        });
        
        console.log(`Uploading preview image ${index + 1} - Type: ${fileType}, Name: ${fileName}`);
        
        // Make the upload request with full BASE_URL instead of relative path
        const uploadUrl = `${BASE_URL}/products/upload-preview?productId=${productId}&previewIndex=${index}`;
        console.log(`POST request to: ${uploadUrl}`);
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log(`Upload response status for preview ${index + 1}: ${uploadResponse.status}`);
        
        // Get full response for debugging
        const responseText = await uploadResponse.text();
        
        // Try to parse the response
        try {
          const result = JSON.parse(responseText);
          
          if (!result.success) {
            console.error(`Preview image ${index + 1} upload failed:`, result.error);
            return null;
          }
          
          console.log(`Preview image ${index + 1} uploaded successfully:`, result);
          return result.fullUrl || result.url;
        } catch (parseError) {
          console.error(`Error parsing preview image ${index + 1} upload response:`, parseError);
          console.error(`Raw response: ${responseText}`);
          return null;
        }
      } catch (uploadError) {
        console.error(`Error uploading preview image ${index + 1}:`, uploadError);
        return null;
      }
    }));
    
    // Filter out any failed uploads
    const validUrls = results.filter(url => url !== null);
    
    console.log(`Successfully uploaded ${validUrls.length}/${images.length} preview images:`, validUrls);
    return validUrls;
  } catch (error) {
    console.error("Error in uploadMultiplePreviewImages:", error);
    return []; // Return empty array on error
  }
};
// ==========================Image upload==============================================
/**
 * Upload an image to the server
 * @param {string} uri - Local URI of the image
 * @param {string} folder - Optional folder name (default: 'images')
 * @returns {Promise<Object>} - Upload result with URL
 */
export const uploadImage = async (uri, folder = 'images') => {
  try {
    console.log(`Attempting to upload image from: ${uri} to folder: ${folder}`);
    
    // Create form data for the upload
    const formData = new FormData();
    
    // Get file name and type from URI
    const uriParts = uri.split('.');
    const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
    const fileType = `image/${fileExtension}`;
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `image_${timestamp}.${fileExtension}`;
    
    // Append the file to form data
    formData.append('file', {
      uri,
      name: fileName,
      type: fileType
    });
    
    // Use the correct upload endpoint with the API_ROOT (without /api)
    const uploadUrl = `${FILE_UPLOAD_URL}/api/upload?folder=${folder}`;
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
      const errorText = await response.text();
      console.error("Upload failed with status:", response.status);
      console.error("Error response:", errorText);
      throw new Error(`Failed to upload image: HTTP ${response.status}`);
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