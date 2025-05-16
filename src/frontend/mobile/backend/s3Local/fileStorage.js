// fileStorage.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Base directory for file storage
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure uploads directory exists
const initializeStorage = () => {
  const directories = [
    UPLOADS_DIR,
    path.join(UPLOADS_DIR, 'profile'),
    path.join(UPLOADS_DIR, 'products'),
    path.join(UPLOADS_DIR, 'temp')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Save an uploaded file to disk
const saveFile = (file, folder = 'images') => {
  try {
    // Make sure the storage is initialized
    initializeStorage();
    
    // Generate a unique file name
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const folderPath = path.join(UPLOADS_DIR, folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // File path where the file will be saved
    const filePath = path.join(folderPath, fileName);
    
    // Move file from temporary location to final location
    fs.copyFileSync(file.path, filePath);
    
    // Remove temporary file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    // Return file details
    return {
      success: true,
      fileName,
      filePath,
      // URL that the client will use to access the file
      url: `/uploads/${folder}/${fileName}`
    };
  } catch (error) {
    console.error('Error saving file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete a file
const deleteFile = (fileUrl) => {
  try {
    // Extract the file path from the URL
    // For example, /uploads/products/123.jpg -> public/uploads/products/123.jpg
    const relativePath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    const filePath = path.join(__dirname, 'public', relativePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: 'File not found'
      };
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create a base64 data URL from a file
const getBase64DataUrl = (filePath, mimeType) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64String = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('Error creating data URL:', error);
    return null;
  }
};

// Save a base64 image
const saveBase64Image = (base64String, folder = 'images') => {
  try {
    // Make sure the storage is initialized
    initializeStorage();
    
    // Extract MIME type and data
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string format');
    }
    
    const mimeType = matches[1];
    const data = matches[2];
    
    // Determine file extension from MIME type
    const fileExtension = mimeType.split('/')[1] === 'jpeg' ? '.jpg' : `.${mimeType.split('/')[1]}`;
    
    // Generate a unique file name
    const fileName = `${uuidv4()}${fileExtension}`;
    const folderPath = path.join(UPLOADS_DIR, folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // File path where the file will be saved
    const filePath = path.join(folderPath, fileName);
    
    // Convert base64 to buffer and save the file
    const fileBuffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, fileBuffer);
    
    // Return file details
    return {
      success: true,
      fileName,
      filePath,
      url: `/uploads/${folder}/${fileName}`
    };
  } catch (error) {
    console.error('Error saving base64 image:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initializeStorage,
  saveFile,
  deleteFile,
  getBase64DataUrl,
  saveBase64Image,
  UPLOADS_DIR
};