// fileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileStorage = require('./fileStorage');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(fileStorage.UPLOADS_DIR, 'temp');
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter to only allow certain types of files
const fileFilter = (req, file, cb) => {
  // Accept images, videos, and documents
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('spreadsheet') ||
    file.mimetype.includes('document')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize the file storage
fileStorage.initializeStorage();

// Upload a file
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    // Get folder from query params or default to 'images'
    const folder = req.query.folder || 'images';
    
    // Save the file
    const result = fileStorage.saveFile(req.file, folder);
    
    // If saving failed, return error
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // Add the full URL to the response
    const host = req.get('host');
    const protocol = req.protocol;
    result.fullUrl = `${protocol}://${host}${result.url}`;
    
    res.json(result);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload a base64 image
router.post('/upload-base64', (req, res) => {
  try {
    const { image, folder } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }
    
    // Save the image
    const result = fileStorage.saveBase64Image(image, folder || 'images');
    
    // If saving failed, return error
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // Add the full URL to the response
    const host = req.get('host');
    const protocol = req.protocol;
    result.fullUrl = `${protocol}://${host}${result.url}`;
    
    res.json(result);
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a file
router.delete('/delete', (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ success: false, error: 'No file URL provided' });
    }
    
    // Delete the file
    const result = fileStorage.deleteFile(fileUrl);
    
    res.json(result);
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;