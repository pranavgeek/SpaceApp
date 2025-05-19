const { checkSubscriptionLimits } = require("./db/subscription-middleware.js");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const path = require("path");
const db = require("./db/database");
const fs = require("fs");
const multer = require("multer");
const nodeMailer = require("nodemailer");

// const fileRoutes = require("./s3 local/fileRoutes.js");
// const fileStorage = require("./s3 local/fileStorage");

// fileStorage.initializeStorage();

dotenv.config();
const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use("/api/files", fileRoutes);

app.use(express.static(path.join(__dirname, "public")));

const BASE_DIR = __dirname;
const S3_LOCAL_DIR = path.join(BASE_DIR, "s3Local", "public");
const PUBLIC_DIR = path.join(BASE_DIR, "public");

// Define all upload paths
const paths = {
  // s3Local paths
  s3LocalUploads: path.join(S3_LOCAL_DIR, "uploads"),
  s3LocalProducts: path.join(S3_LOCAL_DIR, "uploads", "products"),
  s3LocalPreviews: path.join(S3_LOCAL_DIR, "uploads", "previews"),
  
  // public paths - these seem to be used by default
  publicUploads: path.join(PUBLIC_DIR, "uploads"),
  publicProducts: path.join(PUBLIC_DIR, "uploads", "products"),
  publicPreviews: path.join(PUBLIC_DIR, "uploads", "previews"),
};

// Log all paths for debugging
console.log("=== DIRECTORY PATHS ===");
Object.entries(paths).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// Ensure all directories exist
Object.values(paths).forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Define a helper function to know which base directory to use
const useS3Local = true; // Set this to true to use s3Local, false to use public

// Helper function to get the correct base path
const getBasePath = (type) => {
  if (useS3Local) {
    switch(type) {
      case 'products': return paths.s3LocalProducts;
      case 'previews': return paths.s3LocalPreviews;
      default: return paths.s3LocalUploads;
    }
  } else {
    switch(type) {
      case 'products': return paths.publicProducts;
      case 'previews': return paths.publicPreviews;
      default: return paths.publicUploads;
    }
  }
};

// Now let's redefine our storage configurations
// Product image storage
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productDir = getBasePath('products');
    console.log(`Storing product image in: ${productDir}`);
    cb(null, productDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${random}${ext}`;
    console.log(`Generated product filename: ${filename}`);
    cb(null, filename);
  }
});

// Preview image storage
const previewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productId = req.query.productId || 'unknown';
    const previewBaseDir = getBasePath('previews');
    const productPreviewDir = path.join(previewBaseDir, productId);
    
    console.log(`Storing preview image for product ${productId} in: ${productPreviewDir}`);
    
    if (!fs.existsSync(productPreviewDir)) {
      console.log(`Creating preview directory: ${productPreviewDir}`);
      fs.mkdirSync(productPreviewDir, { recursive: true });
    }
    
    cb(null, productPreviewDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `preview-${timestamp}-${random}${ext}`;
    console.log(`Generated preview filename: ${filename}`);
    cb(null, filename);
  }
});

// General upload storage
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.query.folder || "images";
    const baseDir = getBasePath('general');
    const uploadDir = path.join(baseDir, folder);
    
    console.log(`Storing general file in: ${uploadDir}`);
    
    if (!fs.existsSync(uploadDir)) {
      console.log(`Creating upload directory: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${random}${ext}`;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// Configure Multer instances with the new storage
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

const previewUpload = multer({
  storage: previewStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

const upload = multer({
  storage: generalStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Set up static file serving
// Serve from s3Local
app.use('/uploads', express.static(paths.s3LocalUploads));
app.use('/uploads/products', express.static(paths.s3LocalProducts));
app.use('/uploads/previews', express.static(paths.s3LocalPreviews));

// Also serve from public as a fallback
app.use('/uploads', express.static(paths.publicUploads));
app.use('/uploads/products', express.static(paths.publicProducts));
app.use('/uploads/previews', express.static(paths.publicPreviews));

app.use(cors());
app.options("*", cors()); // Allow all CORS preflights

// Helper: Load and Save data
const loadData = () => {
  const rawData = fs.readFileSync(
    path.join(__dirname, "db", "data.json"),
    "utf-8"
  );
  return JSON.parse(rawData);
};

const saveData = (data) => {
  fs.writeFileSync(
    path.join(__dirname, "db", "data.json"),
    JSON.stringify(data, null, 2)
  );
};

// Helper: Load and Save data for collaboration requests ====================================

function readData() {
  try {
    const dataFilePath = path.join(__dirname, "db", "data.json");
    const rawData = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error reading data file:", error);
    return { collaboration_requests: [] };
  }
}

// Function to write data back to file
function writeData(data) {
  try {
    const dataFilePath = path.join(__dirname, "db", "data.json");
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing data file:", error);
    return false;
  }
}
// ================================================================

app.get('/api/products/:productId/previews', (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(`Getting preview images for product ${productId}`);
    
    // Use the correct path variable from your defined paths
    // This uses your existing helper function to get the right preview path
    const previewBasePath = getBasePath('previews');
    const productPreviewPath = path.join(previewBasePath, productId);
    
    console.log(`Looking for preview images in: ${productPreviewPath}`);
    
    // Check if directory exists
    if (!fs.existsSync(productPreviewPath)) {
      console.log(`No preview directory found for product ${productId}`);
      return res.json([]);
    }
    
    // Read directory contents
    const files = fs.readdirSync(productPreviewPath)
      .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/));
    
    if (files.length === 0) {
      console.log(`No preview images found for product ${productId}`);
      return res.json([]);
    }
    
    // Construct URLs for each preview image
    const host = req.get('host');
    const protocol = req.protocol;
    
    const previewUrls = files.map(file => {
      return `${protocol}://${host}/uploads/previews/${productId}/${file}`;
    });
    
    console.log(`Found ${previewUrls.length} preview images for product ${productId}`);
    res.json(previewUrls);
  } catch (error) {
    console.error(`Error getting preview images:`, error);
    res.status(500).json({ error: 'Failed to retrieve preview images' });
  }
});

// Upload preview image endpoint
app.post('/api/products/upload-preview', (req, res) => {
  console.log('Received preview image upload request');
  
  // Use the previewUpload middleware
  previewUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Get the product ID and preview index
    const productId = req.query.productId || 'unknown';
    const previewIndex = req.query.previewIndex || '0';
    
    // Log the successful upload
    console.log(`Preview image uploaded successfully:`);
    console.log(`- File path: ${req.file.path}`);
    console.log(`- File size: ${req.file.size} bytes`);
    console.log(`- File type: ${req.file.mimetype}`);
    console.log(`- Product ID: ${productId}`);
    console.log(`- Preview index: ${previewIndex}`);
    
    // Construct the URL
    const basePath = useS3Local ? '/uploads/previews' : '/uploads/previews';
    const fileUrl = `${basePath}/${productId}/${req.file.filename}`;
    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}${fileUrl}`;
    
    console.log(`Preview image URL: ${fullUrl}`);
    
    // Return the response
    res.json({
      success: true,
      fileName: req.file.filename,
      filePath: req.file.path,
      url: fileUrl,
      fullUrl: fullUrl,
      productId: productId,
      previewIndex: previewIndex
    });
  });
});

app.put('/api/products/:productId/previews', (req, res) => {
  try {
    const productId = req.params.productId;
    const { preview_images } = req.body;
    
    console.log(`Updating product ${productId} with preview images:`, preview_images);
    
    if (!Array.isArray(preview_images)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid preview_images data. Expected an array.' 
      });
    }
    
    // Load current data
    const data = loadData();
    
    // Find the product
    const productIndex = data.products.findIndex(p => p.product_id.toString() === productId.toString());
    
    if (productIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: `Product with ID ${productId} not found` 
      });
    }
    
    // Update the product with preview images
    data.products[productIndex].preview_images = preview_images;
    
    // Save the changes
    saveData(data);
    
    console.log(`✅ Product ${productId} successfully updated with ${preview_images.length} preview images`);
    
    // Return success
    res.json({
      success: true,
      product_id: productId,
      preview_images: preview_images
    });
  } catch (error) {
    console.error(`Error updating product preview images:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update preview images' 
    });
  }
});

app.get('/api/debug/product-preview-status/:productId', (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Load current data
    const data = loadData();
    
    // Find the product
    const product = data.products.find(p => p.product_id.toString() === productId.toString());
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: `Product with ID ${productId} not found` 
      });
    }
    
    // Check directory structure
    const previewBasePath = getBasePath('previews');
    const productPreviewPath = path.join(previewBasePath, productId.toString());
    
    const directoryExists = fs.existsSync(productPreviewPath);
    let previewFiles = [];
    
    if (directoryExists) {
      try {
        previewFiles = fs.readdirSync(productPreviewPath)
          .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/))
          .map(file => {
            return {
              name: file,
              path: path.join(productPreviewPath, file)
            };
          });
      } catch (readError) {
        console.error(`Error reading preview directory for product ${productId}:`, readError);
      }
    }
    
    // Return the status
    res.json({
      success: true,
      product_id: productId,
      product_name: product.product_name,
      preview_images: product.preview_images || [],
      directory_status: {
        path: productPreviewPath,
        exists: directoryExists,
        files: previewFiles
      }
    });
  } catch (error) {
    console.error(`Error checking product preview status:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check preview status' 
    });
  }
});

// Debug endpoint to check the file system
app.get('/debug/file-system-check', (req, res) => {
  try {
    const result = {
      timestamp: new Date().toISOString(),
      basePaths: {
        BASE_DIR,
        S3_LOCAL_DIR,
        PUBLIC_DIR
      },
      paths,
      directories: {}
    };
    
    // Check if all directories exist
    Object.entries(paths).forEach(([key, dir]) => {
      const exists = fs.existsSync(dir);
      result.directories[key] = {
        path: dir,
        exists,
      };
      
      if (exists) {
        try {
          const items = fs.readdirSync(dir);
          result.directories[key].items = items.map(item => {
            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);
            return {
              name: item,
              isDirectory: stats.isDirectory(),
              size: stats.isFile() ? stats.size : null,
              path: itemPath
            };
          });
        } catch (error) {
          result.directories[key].error = error.message;
        }
      }
    });
    
    // If a product ID was specified, check for its preview directories
    const productId = req.query.productId;
    if (productId) {
      result.product = {
        id: productId,
        directories: {}
      };
      
      const s3LocalProductPreviewDir = path.join(paths.s3LocalPreviews, productId);
      const publicProductPreviewDir = path.join(paths.publicPreviews, productId);
      
      result.product.directories.s3Local = {
        path: s3LocalProductPreviewDir,
        exists: fs.existsSync(s3LocalProductPreviewDir)
      };
      
      result.product.directories.public = {
        path: publicProductPreviewDir,
        exists: fs.existsSync(publicProductPreviewDir)
      };
      
      // List files in the directories if they exist
      if (result.product.directories.s3Local.exists) {
        try {
          const files = fs.readdirSync(s3LocalProductPreviewDir);
          result.product.directories.s3Local.files = files.map(file => {
            const filePath = path.join(s3LocalProductPreviewDir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              path: filePath,
              url: `/uploads/previews/${productId}/${file}`,
              fullUrl: `${req.protocol}://${req.get('host')}/uploads/previews/${productId}/${file}`
            };
          });
        } catch (error) {
          result.product.directories.s3Local.error = error.message;
        }
      }
      
      if (result.product.directories.public.exists) {
        try {
          const files = fs.readdirSync(publicProductPreviewDir);
          result.product.directories.public.files = files.map(file => {
            const filePath = path.join(publicProductPreviewDir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              path: filePath,
              url: `/uploads/previews/${productId}/${file}`,
              fullUrl: `${req.protocol}://${req.get('host')}/uploads/previews/${productId}/${file}`
            };
          });
        } catch (error) {
          result.product.directories.public.error = error.message;
        }
      }
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

app.get('/debug/preview-check/:productId', (req, res) => {
  try {
    const productId = req.params.productId;
    const s3LocalPreviewPath = path.join(paths.s3LocalPreviews, productId);
    const publicPreviewPath = path.join(paths.publicPreviews, productId);
    
    const result = {
      productId,
      s3Local: {
        path: s3LocalPreviewPath,
        exists: fs.existsSync(s3LocalPreviewPath),
        files: []
      },
      public: {
        path: publicPreviewPath,
        exists: fs.existsSync(publicPreviewPath),
        files: []
      },
      previewBasePath: getBasePath('previews'),
      useS3Local
    };
    
    // Check S3 local files
    if (result.s3Local.exists) {
      const files = fs.readdirSync(s3LocalPreviewPath)
        .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/));
      
      result.s3Local.files = files.map(file => {
        return {
          name: file,
          url: `/uploads/previews/${productId}/${file}`,
          fullUrl: `${req.protocol}://${req.get('host')}/uploads/previews/${productId}/${file}`
        };
      });
    }
    
    // Check public files
    if (result.public.exists) {
      const files = fs.readdirSync(publicPreviewPath)
        .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/));
      
      result.public.files = files.map(file => {
        return {
          name: file,
          url: `/uploads/previews/${productId}/${file}`,
          fullUrl: `${req.protocol}://${req.get('host')}/uploads/previews/${productId}/${file}`
        };
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple preview images at once 
app.post('/api/products/upload-previews', (req, res) => {
  // Make sure we're using the correct upload middleware
  const upload = previewUpload.array('files', 3); // Max 3 files

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error during preview upload:', err);
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      console.error('Unknown error during preview upload:', err);
      return res.status(500).json({
        success: false,
        error: `Unknown error: ${err.message}`
      });
    }
    
    // Successfully uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    const productId = req.query.productId || 'unknown';
    const host = req.get('host');
    const protocol = req.protocol;
    
    // Log all uploaded files
    console.log(`Successfully uploaded ${req.files.length} preview images for product ${productId}:`);
    req.files.forEach((file, index) => {
      console.log(`  ${index+1}. ${file.path}`);
    });
    
    // Process all uploaded files and create response
    const uploadedFiles = req.files.map((file, index) => {
      const fileUrl = `/uploads/previews/${productId}/${file.filename}`;
      const fullUrl = `${protocol}://${host}${fileUrl}`;
      
      return {
        fileName: file.filename,
        filePath: file.path,
        url: fileUrl,
        fullUrl: fullUrl,
        previewIndex: index
      };
    });
    
    console.log(`Uploaded ${uploadedFiles.length} preview images for product ${productId}`);
    
    res.json({
      success: true,
      files: uploadedFiles,
      productId: productId
    });
  });
});

// Product image upload endpoint
app.post('/api/products/upload-image', (req, res) => {
  console.log('Received product image upload request');
  
  productUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Get the product ID
    const productId = req.query.productId || 'unknown';
    
    // Log the successful upload
    console.log(`Product image uploaded successfully:`);
    console.log(`- File path: ${req.file.path}`);
    console.log(`- File size: ${req.file.size} bytes`);
    console.log(`- File type: ${req.file.mimetype}`);
    
    // Construct the URL
    const basePath = useS3Local ? '/uploads/products' : '/uploads/products';
    const fileUrl = `${basePath}/${req.file.filename}`;
    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}${fileUrl}`;
    
    console.log(`Product image URL: ${fullUrl}`);
    
    // Return the response
    res.json({
      success: true,
      fileName: req.file.filename,
      filePath: req.file.path,
      url: fileUrl,
      fullUrl: fullUrl,
      productId: productId
    });
  });
});

// Add a test endpoint for debugging image access
app.get('/debug/image-test', (req, res) => {
  const imagePath = req.query.path || '/products/test.jpg';
  let fullPath;
  
  if (imagePath.startsWith('/products/')) {
    fullPath = path.join(__dirname, 's3Local', 'public', imagePath.replace(/^\/products\//, ''));
  } else if (imagePath.startsWith('/uploads/')) {
    fullPath = path.join(__dirname, 's3Local', 'public', imagePath.replace(/^\/uploads\//, ''));
  } else {
    fullPath = path.join(__dirname, 's3Local', 'public', imagePath);
  }
  
  console.log('Checking image path:', fullPath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    res.json({
      exists: true,
      path: fullPath,
      url: imagePath,
      fullUrl: `http://${req.get('host')}${imagePath}`,
      isFile: stats.isFile(),
      size: stats.size,
      htmlTest: `<img src="http://${req.get('host')}${imagePath}" width="200" />`
    });
  } else {
    res.json({
      exists: false,
      path: fullPath,
      error: 'File not found'
    });
  }
});

app.get('/debug/preview-images/:productId', (req, res) => {
  const productId = req.params.productId;
  const productPreviewPath = path.join(previewImagesPath, productId);
  
  const info = {
    requestedProductId: productId,
    previewDirectoryPath: productPreviewPath,
    previewDirectoryExists: false,
    files: [],
    uploadPreviewEndpoint: `/api/products/upload-preview?productId=${productId}`,
    getPreviewEndpoint: `/api/products/${productId}/previews`,
    previewBasePath: previewImagesPath,
    previewBasePathExists: fs.existsSync(previewImagesPath)
  };
  
  if (fs.existsSync(productPreviewPath)) {
    info.previewDirectoryExists = true;
    try {
      const files = fs.readdirSync(productPreviewPath);
      info.files = files.map(file => {
        const filePath = path.join(productPreviewPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          isImage: file.match(/\.(jpg|jpeg|png|gif)$/) !== null,
          url: `/uploads/previews/${productId}/${file}`,
          fullUrl: `${req.protocol}://${req.get('host')}/uploads/previews/${productId}/${file}`
        };
      });
    } catch (error) {
      info.readError = error.message;
    }
  }
  
  res.json(info);
});

// File upload endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    // Get the folder from query params
    const folder = req.query.folder || "images";

    // Construct the file URL relative to your server
    const fileUrl = `/uploads/${folder}/${path.basename(req.file.path)}`;

    // Construct full URL including server address
    const host = req.get("host");
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}${fileUrl}`;

    console.log(`File uploaded successfully to ${req.file.path}`);
    console.log(`File accessible at ${fullUrl}`);

    // Return success response with file details
    res.json({
      success: true,
      fileName: path.basename(req.file.path),
      filePath: req.file.path,
      url: fileUrl,
      fullUrl: fullUrl,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Helper function to set up preview directory
// Add this to your server.js file

// Helper function to ensure product preview directory exists
const ensureProductPreviewDir = (productId) => {
  try {
    // Get the base paths
    const s3PreviewPath = path.join(paths.s3LocalPreviews, productId.toString());
    const publicPreviewPath = path.join(paths.publicPreviews, productId.toString());
    
    // Create the directories if they don't exist
    if (!fs.existsSync(s3PreviewPath)) {
      console.log(`Creating S3 preview directory for product ${productId}: ${s3PreviewPath}`);
      fs.mkdirSync(s3PreviewPath, { recursive: true });
    }
    
    if (!fs.existsSync(publicPreviewPath)) {
      console.log(`Creating public preview directory for product ${productId}: ${publicPreviewPath}`);
      fs.mkdirSync(publicPreviewPath, { recursive: true });
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring preview directory for product ${productId}:`, error);
    return false;
  }
};

app.get('/api/products/:productId', (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Load data
    const data = loadData();
    
    // Find the product
    const product = data.products.find(p => p.product_id.toString() === productId.toString());
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Ensure preview_images exists
    if (!product.preview_images) {
      product.preview_images = [];
      
      // Since we're fixing the data structure, save it
      saveData(data);
      console.log(`Added missing preview_images field to product ${productId}`);
    }
    
    res.json(product);
  } catch (error) {
    console.error(`Error getting product:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product'
    });
  }
});

// Add this endpoint to create preview directories and handle preview image uploads
app.post('/api/products/:productId/setup-previews', (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(`Setting up preview directories for product ID: ${productId}`);
    
    // Get the base paths
    const s3PreviewPath = path.join(paths.s3LocalPreviews, productId.toString());
    const publicPreviewPath = path.join(paths.publicPreviews, productId.toString());
    
    // Create the directories if they don't exist
    if (!fs.existsSync(s3PreviewPath)) {
      console.log(`Creating S3 preview directory: ${s3PreviewPath}`);
      fs.mkdirSync(s3PreviewPath, { recursive: true });
    }
    
    if (!fs.existsSync(publicPreviewPath)) {
      console.log(`Creating public preview directory: ${publicPreviewPath}`);
      fs.mkdirSync(publicPreviewPath, { recursive: true });
    }
    
    // Determine which directory to use based on your storage strategy
    const previewBasePath = useS3Local ? s3PreviewPath : publicPreviewPath;
    
    // Return the result
    res.json({
      success: true,
      productId,
      directories: {
        s3: {
          path: s3PreviewPath,
          created: fs.existsSync(s3PreviewPath)
        },
        public: {
          path: publicPreviewPath,
          created: fs.existsSync(publicPreviewPath)
        }
      },
      basePath: previewBasePath
    });
  } catch (error) {
    console.error(`Error setting up preview directories:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to set up preview directories',
      message: error.message
    });
  }
});

// Add this as a new migration function to transfer existing product images to preview images
app.post('/api/admin/migrate-product-images-to-previews', async (req, res) => {
  try {
    // This endpoint requires admin authentication
    // This is a simplified version - you should add proper auth checks
    
    console.log("Starting migration of product images to preview images");
    
    // Load products data
    const data = loadData();
    const products = data.products || [];
    const results = [];
    
    // Process each product
    for (const product of products) {
      try {
        const productId = product.product_id;
        const productImage = product.product_image;
        
        // Skip products with no image or already having preview images
        if (!productId || !productImage || (product.preview_images && product.preview_images.length > 0)) {
          continue;
        }
        
        console.log(`Processing product ID ${productId} with image: ${productImage}`);
        
        // Ensure preview directory exists
        ensureProductPreviewDir(productId);
        
        // Only process if the product has a valid image URL
        if (productImage && (productImage.startsWith('http') || productImage.startsWith('/uploads/'))) {
          // Create a preview image based on the main product image
          const previewUrl = productImage;
          
          // Update the product with the preview image
          product.preview_images = [previewUrl];
          
          results.push({
            productId,
            success: true,
            message: `Added preview image for product ${productId}`
          });
        }
      } catch (productError) {
        console.error(`Error processing product ID ${product.product_id}:`, productError);
        results.push({
          productId: product.product_id,
          success: false,
          error: productError.message
        });
      }
    }
    
    // Save updated data
    saveData(data);
    
    res.json({
      success: true,
      message: `Processed ${results.length} products`,
      results
    });
  } catch (error) {
    console.error('Error in migration process:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  }
});

// ================================================================

// Handle sub-login (switch between roles while preserving original role)
app.post("/api/users/:userId/switch-role", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role, activate } = req.body;

    console.log(
      `Processing role switch for user ${userId} to ${role} (activate: ${activate})`
    );

    // Load the current data
    const data = loadData();

    // Find the user
    const userIndex = data.users.findIndex((u) => u.user_id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = data.users[userIndex];

    // When activating a secondary role (e.g., buyer becoming a seller)
    if (activate === true) {
      // Only buyers can activate seller mode
      if (user.role !== "buyer") {
        return res.status(400).json({
          success: false,
          message: "Only buyers can activate seller mode",
        });
      }

      // Store original role before switching
      const originalRole = user.role;
      const originalAccountType = user.account_type;

      // Update user with the new role while preserving original role
      const updatedUser = {
        ...user,
        original_role: originalRole,
        original_account_type: originalAccountType,
        role: role.toLowerCase(),
        account_type: role.charAt(0).toUpperCase() + role.slice(1),
        tier: role.toLowerCase() === "seller" ? "basic" : user.tier, // Default tier for sellers
      };

      // Update the user
      data.users[userIndex] = updatedUser;
    }
    // When deactivating alternate role (returning to original role)
    else {
      // Check if user has an original role stored
      if (!user.original_role) {
        return res.status(400).json({
          success: false,
          message: "This account doesn't have an original role to revert to",
        });
      }

      // Restore the original role
      const updatedUser = {
        ...user,
        role: user.original_role,
        account_type: user.original_account_type,
      };

      // Remove the original role fields
      delete updatedUser.original_role;
      delete updatedUser.original_account_type;

      // Update the user
      data.users[userIndex] = updatedUser;
    }

    // Save the data
    saveData(data);

    // Return the updated user
    res.json({
      success: true,
      message: activate
        ? "Successfully switched to alternate role"
        : "Successfully reverted to original role",
      user: data.users[userIndex],
    });
  } catch (error) {
    console.error("Error in role switching:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process role switch",
      error: error.message,
    });
  }
});

// Check if a user can switch back to their original role
app.get("/api/users/:userId/can-switch-back", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const data = loadData();
    const user = data.users.find((u) => u.user_id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user has an original role
    const canSwitchBack = !!user.original_role;
    const originalRole = user.original_role || null;

    res.json({
      success: true,
      canSwitchBack,
      originalRole,
      currentRole: user.role,
    });
  } catch (error) {
    console.error("Error checking switch back capability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check switch back capability",
      error: error.message,
    });
  }
});

// ================================================================

app.put("/api/collaboration-requests/update-status", (req, res) => {
  try {
    // Get the parameters from the request body
    const { sellerId, influencerId, status } = req.body;

    console.log(
      `Updating collaboration status: Seller=${sellerId}, Influencer=${influencerId}, Status=${status}`
    );
    console.log("Request body:", req.body);

    // IMPORTANT: Make sure status is a string, not an object
    const statusValue = typeof status === "object" ? status.status : status;

    console.log(`Using status value: ${statusValue}`);

    // Read the current data
    const dataPath = path.join(__dirname, "db", "data.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    // Initialize if needed
    if (!data.collaboration_requests) {
      data.collaboration_requests = [];
    }

    // Find the matching request
    let foundIndex = data.collaboration_requests.findIndex(
      (req) =>
        String(req.sellerId) === String(sellerId) &&
        String(req.influencerId) === String(influencerId)
    );

    // If not found, try by name or with flexible matching
    if (foundIndex === -1) {
      // Try other matching techniques
      foundIndex = data.collaboration_requests.findIndex(
        (req) =>
          (req.sellerName === sellerId ||
            String(req.sellerId) === String(sellerId)) &&
          (req.influencerName === influencerId ||
            String(req.influencerId) === String(influencerId))
      );
    }

    // If found, update the request
    if (foundIndex !== -1) {
      // Update the status as a STRING, not an object
      data.collaboration_requests[foundIndex].status = statusValue;
      data.collaboration_requests[foundIndex].statusUpdatedAt =
        new Date().toISOString();

      // Save the data
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");

      // Return the updated request
      res.json({
        success: true,
        message: "Collaboration request status updated successfully",
        request: data.collaboration_requests[foundIndex],
      });
    } else {
      // Create a new request if not found
      const newRequest = {
        requestId: `req-${Date.now()}`,
        request_id: `req-${Date.now()}`,
        sellerId: String(sellerId),
        influencerId: String(influencerId),
        sellerName: req.body.sellerName || "Unknown Seller",
        influencerName: req.body.influencerName || influencerId,
        product: "Collaboration Request",
        status: statusValue, // Use the STRING value
        timestamp: new Date().toISOString(),
      };

      data.collaboration_requests.push(newRequest);
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");

      res.status(201).json({
        success: true,
        message: "Created new collaboration request",
        request: newRequest,
      });
    }
  } catch (error) {
    console.error(`Error in update-status endpoint: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ================================================================

const subscriptionMiddleware = checkSubscriptionLimits(loadData, saveData);

function initializeFollowingData() {
  try {
    const data = loadData();

    // Initialize following/followers arrays for all users
    data.users.forEach((user) => {
      // For buyers, initialize following
      if (user.account_type?.toLowerCase() === "buyer") {
        if (!user.following) user.following = [];
      }

      // For sellers and influencers, initialize followers
      if (["seller", "influencer"].includes(user.account_type?.toLowerCase())) {
        if (!user.followers) user.followers = [];

        // If they have a followers_count but no followers array or empty followers array,
        // populate it with actual buyers
        if (
          user.followers_count &&
          (!user.followers || user.followers.length === 0)
        ) {
          // Find all buyers to use as sample followers
          const buyers = data.users.filter(
            (u) =>
              u.account_type.toLowerCase() === "buyer" &&
              String(u.user_id) !== String(user.user_id)
          );

          // Calculate how many followers to create (min of followers_count or available buyers)
          const followerCount = Math.min(user.followers_count, buyers.length);

          // Assign random buyers as followers
          if (buyers.length > 0) {
            // Shuffle the buyers array to get random followers each time
            const shuffledBuyers = [...buyers].sort(() => 0.5 - Math.random());

            // Take the first 'followerCount' buyers
            user.followers = shuffledBuyers
              .slice(0, followerCount)
              .map((buyer) => String(buyer.user_id));

            console.log(
              `✅ Initialized ${user.followers.length} followers for ${user.name} (${user.user_id})`
            );
          }
        }

        // Set followers_count to match the actual followers array length
        user.followers_count = user.followers.length;
      }
    });

    saveData(data);
    console.log("✅ Following data structure initialized");
  } catch (error) {
    console.error("Error initializing following data:", error);
  }
}

// Call this function when your server starts
initializeFollowingData();

// // Configure nodemailer
// const transporter = nodeMailer.createTransport({
//   service: "gmail", // or another service
//   auth: {
//     user: process.env.EMAIL_USER || "your-email@gmail.com",
//     pass: process.env.EMAIL_PASS || "your-app-password",
//   },
// });

// // Function to send OTP email
// async function sendOTPEmail(email, otp) {
//   console.log("Attempting to send email to:", email);

//   try {
//     // Log transporter configuration (omit password)
//     console.log("Email configuration:", {
//       service: "gmail",
//       user: process.env.EMAIL_USER || "your-email@gmail.com",
//     });
//     const mailOptions = {
//       from: process.env.EMAIL_USER || "your-app@example.com",
//       to: email,
//       subject: "Your Password Reset Code",
//       text: `Your OTP for password reset is: ${otp}. This code will expire in 5 minutes.`,
//       html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//         <h2 style="color: #4267B2;">Password Reset Request</h2>
//         <p>You've requested to reset your password. Use the following code to continue:</p>
//         <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
//           ${otp}
//         </div>
//         <p>This code will expire in 5 minutes.</p>
//         <p>If you didn't request this password reset, please ignore this email.</p>
//       </div>
//     `,
//     };

//     console.log("Sending email with options:", {
//       to: mailOptions.to,
//       subject: mailOptions.subject,
//     });

//     const info = await transporter.sendMail(mailOptions);
//     console.log(`📧 Email sent to ${email}: ${info.messageId}`);
//     return true;
//   } catch (error) {
//     console.error("Email sending error:", error);
//     return false;
//   }
// }

app.patch(
  "/api/users/:userId/role",
  // allow bypassing subscription checks during the role switch…
  (req, res, next) => {
    req.body.force = true;
    next();
  },
  async (req, res) => {
    try {
      const { role, tier } = req.body;
      // updateUserRole should load your JSON or your database,
      // set user.role & user.tier, then save it back.
      const updated = await API.updateUserRole(
        Number(req.params.userId),
        role,
        tier,
        true
      );
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  }
);

// Generate OTP and store in user object
app.post("/api/auth/request-reset", async (req, res) => {
  const { email } = req.body;
  const data = loadData();
  const user = data.users.find((u) => u.email === email);

  if (!user) return res.status(404).json({ error: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.reset_otp = otp;
  user.otp_expires_at = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  saveData(data);

  // Log the OTP clearly in the terminal
  console.log("\n====================================");
  console.log(`📨 PASSWORD RESET OTP FOR ${email}:`);
  console.log(`📱 ${otp}`);
  console.log("====================================\n");

  // Return success with OTP for development
  res.json({
    message: "OTP generated successfully. Check console for the code.",
    dev_otp: otp, // Include OTP in response for development
  });
});

// Verify OTP
app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const data = loadData();
  const user = data.users.find((u) => u.email === email);

  if (!user || user.reset_otp !== otp)
    return res.status(400).json({ error: "Invalid OTP" });

  if (Date.now() > user.otp_expires_at)
    return res.status(400).json({ error: "OTP expired" });

  user.otp_verified = true;
  saveData(data);
  res.json({ message: "OTP verified" });
});

// Reset Password
app.post("/api/auth/reset-password", (req, res) => {
  const { email, new_password } = req.body;
  const data = loadData();
  const user = data.users.find((u) => u.email === email);

  if (!user || !user.otp_verified)
    return res.status(403).json({ error: "OTP not verified" });

  user.password = new_password;
  delete user.reset_otp;
  delete user.otp_verified;
  delete user.otp_expires_at;

  saveData(data);
  res.json({ message: "Password reset successful" });
});

// GET: Orders for a Buyer
app.get("/api/users/:userId/orders", (req, res) => {
  const userId = parseInt(req.params.userId);
  const data = loadData();

  const user = data.users.find((u) => u.user_id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const enrichedOrders = (user.orders || []).map((order) => {
    const product = data.products.find(
      (p) => p.product_id === order.product_id
    );
    return {
      ...order,
      product_name: product ? product.product_name : "Unknown Product",
      total_cost: product ? product.cost : "N/A",
    };
  });

  res.json(enrichedOrders);
});

// GET: Orders for a Buyer
app.get("/api/users/:userId/orders", (req, res) => {
  const userId = parseInt(req.params.userId);
  const data = loadData();

  const user = data.users.find((u) => u.user_id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const enrichedOrders = (user.orders || []).map((order) => {
    const product = data.products.find(
      (p) => p.product_id === order.product_id
    );
    return {
      ...order,
      product_name: product ? product.product_name : "Unknown Product",
      total_cost: product ? product.cost : "N/A",
    };
  });

  res.json(enrichedOrders);
});

// POST: Add new order to Buyer
app.post("/api/users/:buyerId/orders/create", async (req, res) => {
  try {
    const orderData = req.body;
    const buyerId = req.params.buyerId;

    console.log("🧾 buyerId param:", buyerId);
    console.log("🧾 Request body:", orderData);

    const fullOrder = {
      ...orderData,
      buyer_id: parseInt(buyerId), // Force to number
    };

    const result = await db.createOrder(fullOrder);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Server responded with:", error.message);
    res
      .status(400)
      .json({ error: "Failed to create order", details: error.message });
  }
});

app.get(
  "/api/sellers/:sellerId/subscription",
  subscriptionMiddleware,
  (req, res) => {
    try {
      // Return the limits and current usage from the middleware
      res.json({
        tier: req.sellerLimits.tier,
        limits: {
          products: req.sellerLimits.productLimit,
          collaborations: req.sellerLimits.collaborationLimit,
          fee_percentage: req.sellerLimits.feePercentage,
        },
        usage: {
          products: req.sellerStats.productCount,
          collaborations: req.sellerStats.collaborationCount,
          products_remaining: Math.max(
            0,
            req.sellerLimits.productLimit - req.sellerStats.productCount
          ),
          collaborations_remaining: Math.max(
            0,
            req.sellerLimits.collaborationLimit -
              req.sellerStats.collaborationCount
          ),
        },
        is_at_limit: {
          products:
            req.sellerStats.productCount >= req.sellerLimits.productLimit,
          collaborations:
            req.sellerStats.collaborationCount >=
            req.sellerLimits.collaborationLimit,
        },
      });
    } catch (error) {
      console.error("Error getting seller subscription details:", error);
      res
        .status(500)
        .json({ error: "Failed to get seller subscription details" });
    }
  }
);

async function checkExpiredSubscriptions() {
  try {
    console.log("🔄 Running scheduled check for expired subscriptions...");

    // Load the current data
    const data = loadData();

    // Get current date at midnight for comparison
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Count of downgrades performed
    let downgradeCount = 0;

    // Check each user for expired subscriptions
    for (let i = 0; i < data.users.length; i++) {
      const user = data.users[i];

      // Skip users without a subscription end date or who are already on basic plan
      if (!user.subscription_end_date || user.tier === "basic" || !user.tier) {
        continue;
      }

      // Parse the subscription end date
      const endDate = new Date(user.subscription_end_date);
      endDate.setHours(0, 0, 0, 0); // Normalize to midnight

      // Check if subscription has expired
      if (endDate <= currentDate) {
        console.log(
          `User ${user.user_id} subscription expired on ${endDate.toLocaleDateString()}, downgrading to basic plan`
        );

        // Track the previous tier for the log
        const previousTier = user.tier;

        // Downgrade user to basic plan
        user.tier = "basic";
        user.subscription_end_date = null;
        user.subscription_cancelled = false;
        user.subscription_cancelled_at = null;

        // Log this downgrade
        if (!data.subscription_downgrades) {
          data.subscription_downgrades = [];
        }

        data.subscription_downgrades.push({
          user_id: user.user_id,
          previous_tier: previousTier,
          downgrade_date: new Date().toISOString(),
          reason: "Subscription period ended",
        });

        // Increment counter
        downgradeCount++;
      }
    }

    // If any users were downgraded, save the updated data
    if (downgradeCount > 0) {
      saveData(data);
      console.log(
        `✅ Downgraded ${downgradeCount} users to basic plan due to expired subscriptions`
      );
    } else {
      console.log("✅ No expired subscriptions found");
    }

    return {
      success: true,
      downgradeCount,
    };
  } catch (error) {
    console.error("❌ Error checking expired subscriptions:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// You might also want an endpoint to manually trigger this check for testing/admin purposes
app.post("/api/admin/check-expired-subscriptions", async (req, res) => {
  try {
    // Check if request is from an admin (implement your auth check here)
    // if (!isAdmin(req.user)) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Unauthorized"
    //   });
    // }

    const result = await checkExpiredSubscriptions();
    res.json(result);
  } catch (error) {
    console.error("Error running subscription check:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check expired subscriptions",
      error: error.message,
    });
  }
});

app.post("/api/subscriptions/:userId/cancel", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { reason, cancelled_at } = req.body;

    console.log(
      `Processing subscription cancellation for user ${userId} with reason: ${reason}`
    );

    // Load the current data
    const data = loadData();

    // Find the user
    const userIndex = data.users.findIndex((u) => u.user_id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = data.users[userIndex];

    // Check if user has an active subscription
    if (!user.tier || user.tier === "basic") {
      return res.status(400).json({
        success: false,
        message: "No active subscription to cancel",
      });
    }

    // Record cancellation data but don't change the tier immediately
    // This allows users to continue using premium features until their subscription period ends

    // Create a cancellation record
    if (!data.subscription_cancellations) {
      data.subscription_cancellations = [];
    }

    const cancellationRecord = {
      user_id: userId,
      previous_tier: user.tier,
      reason: reason || "User requested cancellation",
      cancelled_at: cancelled_at || new Date().toISOString(),
      subscription_end_date: user.subscription_end_date || null,
      auto_downgrade: true,
    };

    data.subscription_cancellations.push(cancellationRecord);

    // Mark the subscription as cancelled in the user object
    // but preserve the tier and subscription_end_date
    user.subscription_cancelled = true;
    user.subscription_cancelled_at = cancelled_at || new Date().toISOString();

    // Save the updated data
    saveData(data);

    // If we have a scheduler or cron job, we would set up an automatic downgrade
    // when the subscription_end_date is reached

    // For demo purposes, let's log when this subscription should be downgraded
    if (user.subscription_end_date) {
      const endDate = new Date(user.subscription_end_date);
      console.log(
        `User ${userId} subscription will be downgraded to basic on ${endDate.toLocaleDateString()}`
      );

      // Here you might set up a scheduled job to downgrade the user automatically
      // when their subscription period ends
    }

    // Return success response
    res.json({
      success: true,
      message: "Subscription cancellation recorded successfully",
      keep_access_until: user.subscription_end_date || null,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process subscription cancellation",
      error: error.message,
    });
  }
});

// Helper function to get base URL for loading data
function getUtilsModule() {
  // Return an object with the loadData and saveData functions
  return {
    loadData: () => {
      const rawData = fs.readFileSync(
        path.join(__dirname, "db", "data.json"),
        "utf-8"
      );
      return JSON.parse(rawData);
    },

    saveData: (data) => {
      fs.writeFileSync(
        path.join(__dirname, "db", "data.json"),
        JSON.stringify(data, null, 2)
      );
    },
  };
}

// GET: Get seller's received orders
app.get("/api/users/:sellerId/received-orders", async (req, res) => {
  try {
    const sellerId = parseInt(req.params.sellerId);
    const data = loadData();

    console.log("🧾 buyerId param:", sellerId);

    const seller = data.users.find((u) => parseInt(u.user_id) === sellerId);

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const receivedOrders = seller.received_orders || [];
    res.status(200).json(receivedOrders);
  } catch (error) {
    console.error("❌ Error fetching received orders:", error.message);
    res.status(500).json({ error: "Failed to fetch received orders" });
  }
});

app.post("/api/orders/:orderId/submit-tracking", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { tracking_link } = req.body;

    const data = loadData();
    const order = data.orders.find((o) => o.order_id === orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.pending_tracking_link = tracking_link;
    order.tracking_approval_status = "pending"; // 'pending' | 'approved' | 'rejected'

    saveData(data);
    res.status(200).json({ message: "Tracking link submitted for review." });
  } catch (err) {
    console.error("❌ Error submitting tracking:", err);
    res.status(500).json({ error: "Server error submitting tracking." });
  }
});

// DELETE: Cancel an order
app.delete("/api/orders/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`🧾 Cancelling order: ${orderId}`);

    const success = await db.cancelOrder(orderId);

    if (success) {
      res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
  } catch (error) {
    console.error(`❌ Error cancelling order: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
});

//Admin Endpoint to Approve/Reject
app.post("/api/orders/:orderId/approve-tracking", async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = loadData();
    const order = data.orders.find((o) => o.order_id === orderId);

    if (!order || !order.pending_tracking_link) {
      return res
        .status(404)
        .json({ error: "No pending tracking found for this order" });
    }

    // Approve the tracking
    order.tracking_number = order.pending_tracking_link;
    order.tracking_approval_status = "approved";
    delete order.pending_tracking_link;

    // Send message to buyer
    const seller = data.users.find((u) => u.user_id === order.seller_id);
    const buyer = data.users.find((u) => u.user_id === order.buyer_id);

    const messageObj = {
      sender_id: seller.user_id,
      receiver_id: buyer.user_id,
      timestamp: new Date().toISOString(),
      content: `📦 Your order has shipped! Track it here: ${order.tracking_number}`,
    };

    data.messages.push(messageObj);

    saveData(data);
    res.status(200).json({ message: "Tracking approved and buyer notified." });
  } catch (err) {
    console.error("❌ Error approving tracking:", err);
    res.status(500).json({ error: "Server error approving tracking." });
  }
});

app.get("/api/admin/pending-trackings", (req, res) => {
  try {
    const data = loadData();
    const pending = data.orders.filter((o) => o.pending_tracking_link);
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch pending trackings." });
  }
});

// Get user security settings
app.get("/api/users/:userId/security-settings", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const data = loadData();
    const user = data.users.find((u) => u.user_id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return security settings
    res.json({
      twoFactorEnabled: user.is_two_factor_enabled || false,
      phoneNumber: user.phone_number || "",
      isPrivate: user.is_private_account || false,
      privacySettings: user.privacy_settings || {
        hideActivity: false,
        hideContacts: false,
        hideProducts: false,
        allowMessagesFrom: "everyone",
      },
    });
  } catch (error) {
    console.error("Error getting security settings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user password
app.put("/api/users/:userId/password", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { currentPassword, newPassword } = req.body;

    const data = loadData();
    const user = data.users.find((u) => u.user_id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    saveData(data);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send verification code for 2FA
app.post("/api/auth/2fa/request-code", (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;

    const data = loadData();
    const user = data.users.find((u) => u.user_id === parseInt(userId));

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate a verification code (6 digits)
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationId = Date.now().toString();

    // Store the verification info in the user object
    user.verification_code = verificationCode;
    user.verification_id = verificationId;
    user.verification_expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    user.temp_phone_number = phoneNumber;

    saveData(data);

    // For development - log the code to console
    console.log("\n===================================");
    console.log(`📱 2FA VERIFICATION CODE for user ${userId}:`);
    console.log(`📱 ${verificationCode}`);
    console.log("===================================\n");

    res.json({
      success: true,
      verificationId,
      message: "Verification code sent successfully",
      dev_code: verificationCode, // Include code in response for development
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Verify 2FA code and enable 2FA
app.post("/api/auth/2fa/verify", (req, res) => {
  try {
    const { userId, verificationId, code, phoneNumber } = req.body;

    const data = loadData();
    const user = data.users.find((u) => u.user_id === parseInt(userId));

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if verification ID matches
    if (user.verification_id !== verificationId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification session" });
    }

    // Check if code is correct
    if (user.verification_code !== code) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    // Check if code is expired
    if (Date.now() > user.verification_expiry) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code expired" });
    }

    // Enable 2FA and save phone number
    user.is_two_factor_enabled = true;
    user.phone_number = phoneNumber || user.temp_phone_number;

    // Clean up verification data
    delete user.verification_code;
    delete user.verification_id;
    delete user.verification_expiry;
    delete user.temp_phone_number;

    saveData(data);

    res.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    console.error("Error verifying 2FA code:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Disable 2FA
app.post("/api/auth/2fa/disable", (req, res) => {
  try {
    const { userId } = req.body;

    const data = loadData();
    const user = data.users.find((u) => u.user_id === parseInt(userId));

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Disable 2FA
    user.is_two_factor_enabled = false;

    saveData(data);

    res.json({
      success: true,
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update privacy settings
app.put("/api/users/:userId/privacy-settings", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const settings = req.body;

    const data = loadData();
    const user = data.users.find((u) => u.user_id === userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update privacy settings
    user.is_private_account = settings.isPrivate;
    user.privacy_settings = {
      hideActivity: settings.hideActivity || false,
      hideContacts: settings.hideContacts || false,
      hideProducts: settings.hideProducts || false,
      allowMessagesFrom: settings.allowMessagesFrom || "everyone",
    };

    saveData(data);

    res.json({
      success: true,
      message: "Privacy settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ------------------------------------------------------------------------------

//Payment Gateway
app.get("/api/payment", async (req, res) => {
  const txnTotal = parseFloat(req.query.total || "99.99").toFixed(2);
  console.log("💰 Amount to charge:", txnTotal);

  const preloadPayload = {
    store_id: "monca11434",
    api_token: "leYuEX1G18u8DrrxIhkj",
    checkout_id: "chktDAL6N11434",
    txn_total: txnTotal,
    currency_code: "CAD",
    environment: "qa",
    action: "preload",
  };

  try {
    const response = await fetch(
      "https://gatewayt.moneris.com/chktv2/request/request.php",
      {
        method: "POST",
        body: JSON.stringify(preloadPayload),
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();
    console.log("📦 Moneris Preload Response:", data);

    if (data?.response?.ticket) {
      res.json({ ticket: data.response.ticket });
    } else {
      console.error("❌ Invalid preload response", data);
      res
        .status(400)
        .json({ error: "Invalid Moneris credentials or configuration." });
    }
  } catch (err) {
    console.error("Payment preload error:", err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

// Process tokenization request (card validation without charging)
app.post("/api/tokenize-request", async (req, res) => {
  try {
    const { userId, requestType } = req.body;

    console.log(
      `💳 Tokenization request for user: ${userId}, type: ${requestType}`
    );

    // Configure Moneris Checkout for tokenization using the Tokenize Card transaction type
    const preloadPayload = {
      store_id: "monca11434", // Your Moneris Store ID
      api_token: "leYuEX1G18u8DrrxIhkj", // Your Moneris API Token
      checkout_id: "chktDAL6N11434", // Your Moneris Checkout ID
      environment: "qa", // 'qa' for testing, 'prod' for production
      action: "preload",
      txn_total: "1.00", // Minimum valid amount
      txn_type: "tokenize", // This specifies the Tokenize Card transaction type
      cust_id: userId || "customer",
      contact_details: {
        first_name: "", // Optional
        last_name: "", // Optional
        email: "", // Optional
      },
      cart: {
        items: [
          {
            name: "Card Registration",
            quantity: "1",
            unit_cost: "1.00",
          },
        ],
      },
      payment_methods: ["credit_card"], // Only allow credit card
    };

    try {
      // Make the request to Moneris Checkout API
      const response = await fetch(
        "https://gatewayt.moneris.com/chktv2/request/request.php",
        {
          method: "POST",
          body: JSON.stringify(preloadPayload),
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      console.log("📦 Moneris Tokenization Preload Response:", data);

      if (data?.response?.ticket) {
        res.json({ ticket: data.response.ticket });
      } else {
        console.error("❌ Invalid preload response", data);
        res.status(400).json({
          error: "Invalid Moneris credentials or configuration.",
        });
      }
    } catch (err) {
      console.error("Tokenization preload error:", err);
      res.status(500).json({ error: "Failed to initiate tokenization" });
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Process payment using a stored token/data key
app.post("/api/token-payment", async (req, res) => {
  try {
    const { dataKey, amount, orderId, productId, productName, quantity } =
      req.body;

    if (!dataKey) {
      return res
        .status(400)
        .json({ success: false, error: "Missing payment token" });
    }

    console.log(`💰 Processing token payment: ${dataKey} for $${amount}`);

    // Format amount to ensure it's a valid decimal
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Moneris token purchase configuration
    const purchasePayload = {
      store_id: "monca11434", // Your Moneris Store ID
      api_token: "leYuEX1G18u8DrrxIhkj", // Your Moneris API Token
      checkout_id: "chktDAL6N11434", // Your Moneris Checkout ID
      environment: "qa", // 'qa' for testing, 'prod' for production
      action: "purchase",
      order_id: orderId || `order-${Date.now()}`,
      txn_total: formattedAmount,
      cust_id: "customer", // Optional - could use buyer_id here
      data_key: dataKey, // Use the stored token
      payment: {
        use_data_key: true, // Use token for payment
      },
    };

    // Make the request to Moneris Purchase API
    const response = await fetch(
      "https://gatewayt.moneris.com/chktv2/request/request.php",
      {
        method: "POST",
        body: JSON.stringify(purchasePayload),
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();
    console.log("📦 Moneris Token Purchase Response:", data);

    if (
      data?.response?.success === "true" ||
      data?.response?.success === true
    ) {
      // Payment was successful
      res.json({
        success: true,
        txn_num: data.response.txn_num,
        order_id: data.response.order_id,
        message: "Payment processed successfully",
        receipt_id: data.response.receipt_id,
        card_type: data.response.card,
        reference_num: data.response.reference_num,
        iso_code: data.response.iso_code,
      });
    } else {
      // Payment failed
      const errorMessage = data?.response?.error || "Payment processing failed";
      console.error("❌ Token payment failed:", errorMessage);

      res.status(400).json({
        success: false,
        error: errorMessage,
        code: data?.response?.iso_code || "unknown",
      });
    }
  } catch (err) {
    console.error("Payment processing error:", err);
    res.status(500).json({ success: false, error: "Payment processing error" });
  }
});

// Add this to your server.js file
app.post("/api/retrieve-token", async (req, res) => {
  try {
    const { ticket, responseCode, userId } = req.body;

    if (!ticket) {
      return res.status(400).json({ success: false, error: "Missing ticket" });
    }

    console.log(`🔑 Retrieving token for ticket: ${ticket}`);

    // Configuration for the token retrieval
    const retrievePayload = {
      store_id: "monca11434", // Your Moneris Store ID
      api_token: "leYuEX1G18u8DrrxIhkj", // Your Moneris API Token
      checkout_id: "chktDAL6N11434", // Your Moneris Checkout ID
      environment: "qa", // 'qa' for testing, 'prod' for production
      action: "receipt",
      ticket: ticket,
    };

    // Make the request to Moneris API to retrieve the token
    const response = await fetch(
      "https://gatewayt.moneris.com/chktv2/request/request.php",
      {
        method: "POST",
        body: JSON.stringify(retrievePayload),
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();
    console.log("📦 Moneris Token Retrieval Response:", data);

    // Check if the response contains the token data
    if (data?.response?.success === "true" && data?.response?.receipt) {
      const receipt = data.response.receipt;

      // Check if there's a data_key in the receipt
      if (receipt.data_key) {
        res.json({
          success: true,
          data_key: receipt.data_key,
          card_type: receipt.card || "Credit Card",
          last_digits:
            receipt.last_digits || receipt.masked_pan?.substr(-4) || "****",
        });
      } else {
        console.error("❌ No data_key in receipt:", receipt);
        res.status(400).json({
          success: false,
          error: "No data key returned by Moneris",
        });
      }
    } else if (data?.response?.error) {
      console.error("❌ Error from Moneris:", data.response.error);
      res.status(400).json({
        success: false,
        error: data.response.error,
      });
    } else {
      console.error("❌ Invalid response format:", data);
      res.status(500).json({
        success: false,
        error: "Invalid response from Moneris",
      });
    }
  } catch (err) {
    console.error("Token retrieval error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve token: " + err.message,
    });
  }
});
// ------------------------------------------------------------------------------ //

app.get("/", async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json({
      message:
        "Node.js API for User, Ecommerce, Reviews, Messaging, Admin & Notifications.",
      users: users,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get Single User by ID
app.get("/api/users/:id", async (req, res) => {
  const user = await db.getUserById(parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// Create New User
app.post("/api/users", async (req, res) => {
  try {
    const user = req.body;
    const newUser = await db.createUser(user);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update User
app.put("/api/users/:id", async (req, res) => {
  const updatedUser = await db.updateUser(parseInt(req.params.id), req.body);
  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(updatedUser);
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Get the current data
    const data = loadData();
    const userIndex = data.users.findIndex((u) => u.user_id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove the user
    data.users.splice(userIndex, 1);

    // Save the updated data
    saveData(data);

    res.json({ message: "User deleted successfully", success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.get("/api/products", async (req, res) => {
  const products = await db.getProducts();
  res.json(products);
});

// Get Single Product by ID
app.get("/api/products/:id", async (req, res) => {
  const product = await db.getProductById(parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// app.post("/api/products", (req, res) => {
//   try {
//     const data = loadData();
//     const newProduct = {
//       ...req.body,
//       product_id: Date.now(), // Unique ID
//     };

//     data.products.push(newProduct);
//     saveData(data);

//     res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product: newProduct,
//     });
//   } catch (err) {
//     console.error("❌ Error creating product:", err);
//     res.status(500).json({ error: "Server error creating product" });
//   }
// });

// Create New Product
app.post("/api/products", subscriptionMiddleware, async (req, res) => {
  try {
    const product = req.body;
    const sellerId = parseInt(product.user_seller);

    // Check if seller has reached their product limit
    if (req.sellerStats && req.sellerLimits) {
      if (req.sellerStats.productCount >= req.sellerLimits.productLimit) {
        return res.status(403).json({
          error: "Product limit reached",
          message: `Your current plan (${req.sellerLimits.tier}) allows a maximum of ${req.sellerLimits.productLimit} products. Please upgrade your subscription to add more products.`,
          upgrade_required: true,
          current_tier: req.sellerLimits.tier,
          current_count: req.sellerStats.productCount,
          max_allowed: req.sellerLimits.productLimit,
        });
      }
    }

    // Apply fee percentage based on the subscription tier
    if (req.sellerLimits) {
      product.fee_percentage = req.sellerLimits.feePercentage;
    }

    // Continue with product creation
    const newProduct = await db.createProduct(product);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Failed to create product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update Product
app.put("/api/products/:id", async (req, res) => {
  const updatedProduct = await db.updateProduct(
    parseInt(req.params.id),
    req.body
  );
  if (!updatedProduct) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(updatedProduct);
});

// Delete Product
app.delete("/api/products/:id", async (req, res) => {
  const deleted = await db.deleteProduct(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ message: "Product deleted successfully" });
});

// Get products by seller ID
app.get("/api/seller/:id/products", async (req, res) => {
  try {
    const products = await db.getProductsBySellerId(parseInt(req.params.id));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch seller products" });
  }
});

// Get verified products count by seller ID
app.get("/api/seller/:id/verified-products-count", async (req, res) => {
  try {
    const count = await db.getVerifiedProductsCountBySellerId(
      parseInt(req.params.id)
    );
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch verified products count" });
  }
});

app.put("/api/verify-product/:id", (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const productName = req.body.productName; // Optional parameter to help with duplicates

    console.log(
      `🔍 Attempting to verify product: ID ${productId}, Name: ${productName || "Not specified"}`
    );

    const data = loadData();
    let productUpdated = false;

    // If productName is provided, use it to find the exact product
    if (productName) {
      // Find the product by ID AND name
      for (let i = 0; i < data.products.length; i++) {
        if (
          data.products[i].product_id === productId &&
          data.products[i].product_name === productName
        ) {
          data.products[i].verified = true;
          productUpdated = true;
          console.log(
            `✅ Product "${productName}" (ID: ${productId}) verified successfully`
          );
          break;
        }
      }
    } else {
      // Just use the ID (legacy behavior)
      for (let i = 0; i < data.products.length; i++) {
        if (data.products[i].product_id === productId) {
          data.products[i].verified = true;
          productUpdated = true;
          console.log(`✅ Product ID ${productId} verified successfully`);
          break;
        }
      }
    }

    if (!productUpdated) {
      console.log(
        `❌ Product not found for verification: ID ${productId}, Name: ${productName || "Not specified"}`
      );
      return res.status(404).json({
        success: false,
        message: "Product not found for verification",
      });
    }

    // Save the updated data
    saveData(data);

    res.json({
      success: true,
      message: "Product verified successfully",
    });
  } catch (error) {
    console.error("❌ Error verifying product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify product",
      error: error.message,
    });
  }
});

// Get All Reviews (with optional product_id filter)
app.get("/api/reviews", async (req, res) => {
  try {
    // If product_id is provided in query params, get reviews for that product
    if (req.query.product_id) {
      const productId = parseInt(req.query.product_id, 10);
      const reviews = await db.getReviewsByProductId(productId);
      return res.json(reviews);
    }

    return res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get Single Review by ID
app.get("/api/reviews/:id", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const review = await db.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Create New Review
app.post("/api/reviews", async (req, res) => {
  try {
    const reviewData = req.body;

    // Validate required fields
    if (
      !reviewData.product_id ||
      !reviewData.user_id ||
      reviewData.number_stars === undefined
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: product_id, user_id, and number_stars are required",
      });
    }

    // Add timestamp if not provided
    if (!reviewData.date_timestamp) {
      reviewData.date_timestamp = new Date().toISOString();
    }

    const newReview = await db.createReview(reviewData);
    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Update Review
app.put("/api/reviews/:id", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const updatedReview = await db.updateReview(reviewId, req.body);

    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Delete Review
app.delete("/api/reviews/:id", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const deleted = await db.deleteReview(reviewId);

    if (!deleted) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Get All Messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await db.getMessages();
    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get Single Message by ID
app.get("/api/messages/:id", async (req, res) => {
  const message = await db.getMessageById(parseInt(req.params.id));
  message
    ? res.json(message)
    : res.status(404).json({ error: "Message not found" });
});

// Create New Message
app.post("/api/messages", async (req, res) => {
  const message = req.body;
  const newMessage = await db.createMessage(message);
  res.status(201).json(newMessage);
});

// Get messages between two users
app.get("/api/messages/between/:user1Id/:user2Id", async (req, res) => {
  try {
    const user1Id = req.params.user1Id;
    const user2Id = req.params.user2Id;

    const messages = await db.getMessagesBetweenUsers(user1Id, user2Id);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages between users:", error);
    res.status(500).json({ error: "Failed to fetch messages between users" });
  }
});

// Get all conversations for a user
app.get("/api/messages/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = loadData();

    // Get the list of user IDs this user has conversations with
    const conversationUserIds = await db.getUserConversations(userId);

    // For each conversation, get the most recent message and user info
    const conversations = [];

    for (const otherUserId of conversationUserIds) {
      // Get user info
      const otherUser = data.users.find(
        (u) => String(u.user_id) === String(otherUserId)
      );

      if (otherUser) {
        // Get the most recent message between these users
        const messages = await db.getMessagesBetweenUsers(userId, otherUserId);
        const lastMessage =
          messages.length > 0 ? messages[messages.length - 1] : null;

        // Count unread messages from this user
        const unreadCount = messages.filter(
          (msg) =>
            String(msg.user_to) === String(userId) && msg.is_read === false
        ).length;

        conversations.push({
          user: {
            user_id: otherUser.user_id,
            name: otherUser.name,
            profile_image: otherUser.profile_image,
            account_type: otherUser.account_type,
          },
          last_message: lastMessage
            ? {
                content: lastMessage.message_content,
                timestamp: lastMessage.date_timestamp_sent,
                is_from_me: String(lastMessage.user_from) === String(userId),
              }
            : null,
          unread_count: unreadCount,
        });
      }
    }

    // Sort by most recent message
    conversations.sort((a, b) => {
      if (!a.last_message) return 1;
      if (!b.last_message) return -1;
      return (
        new Date(b.last_message.timestamp) - new Date(a.last_message.timestamp)
      );
    });

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    res.status(500).json({ error: "Failed to fetch user conversations" });
  }
});

// Mark message as read
app.put("/api/messages/:messageId/read", async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const updatedMessage = await db.markMessageAsRead(messageId);

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(updatedMessage);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

// Mark all messages from a specific user as read
app.put(
  "/api/messages/mark-all-read/:fromUserId/:toUserId",
  async (req, res) => {
    try {
      const { fromUserId, toUserId } = req.params;
      const data = loadData();
      let updatedCount = 0;

      // Find all unread messages from fromUserId to toUserId
      for (let i = 0; i < data.messages.length; i++) {
        const message = data.messages[i];

        if (
          String(message.user_from) === String(fromUserId) &&
          String(message.user_to) === String(toUserId) &&
          message.is_read === false
        ) {
          data.messages[i].is_read = true;
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        saveData(data);
      }

      res.json({
        success: true,
        message: `Marked ${updatedCount} messages as read`,
      });
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  }
);

// Get unread messages count for a user
app.get("/api/messages/unread-count/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const count = await db.getUnreadMessagesCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Error getting unread messages count:", error);
    res.status(500).json({ error: "Failed to get unread messages count" });
  }
});

// Delete Message
app.delete("/api/messages/:id", async (req, res) => {
  const deleted = await db.deleteMessage(parseInt(req.params.id));
  deleted
    ? res.json({ message: "Message deleted successfully" })
    : res.status(404).json({ error: "Message not found" });
});

app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await db.getNotifications();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.get("/api/notifications/:user_id", async (req, res) => {
  try {
    const notifications = await db.getNotifications(
      parseInt(req.params.user_id)
    );
    if (notifications.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for this user" });
    }
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post("/api/notifications", async (req, res) => {
  try {
    const newNotification = await db.createNotification(req.body);
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

app.delete("/api/notifications/:id", async (req, res) => {
  const deleted = await db.deleteNotification(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Notification not found" });
  }
  res.json({ message: "Notification deleted successfully" });
});

app.get("/api/admin", async (req, res) => {
  const adminData = await db.getAdminData();
  res.json(adminData);
});

app.get("/api/admin/:id", async (req, res) => {
  const adminAction = await db.getAdminById(parseInt(req.params.id));
  if (!adminAction) {
    return res.status(404).json({ error: "Admin action not found" });
  }
  res.json(adminAction);
});

app.put("/api/admin/:id", async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { status } = req.body;

    console.log(
      `Received request to update admin action ${adminId} to status: ${status}`
    );

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Get the current admin data
    const data = loadData();
    const adminIndex = data.admin_data.findIndex((a) => a.admin_id === adminId);

    if (adminIndex === -1) {
      return res.status(404).json({ error: "Admin action not found" });
    }

    // Update the status
    data.admin_data[adminIndex].status = status;
    data.admin_data[adminIndex].updated_at = new Date().toISOString();

    // Save the updated data
    saveData(data);

    res.json(data.admin_data[adminIndex]);
  } catch (error) {
    console.error("Failed to update admin status:", error);
    res.status(500).json({ error: "Failed to update admin status" });
  }
});

app.get("/api/users/role/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const users = await db.getUsersByRole(role);
    res.json(users);
  } catch (error) {
    console.error("Failed to get users by role:", error);
    res.status(500).json({ error: "Failed to get users by role" });
  }
});

// Update User Role with subscription end date handling
app.put("/api/users/:id/role", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role, tier, force, subscription_end_date } = req.body;

    console.log(
      `Updating user ${userId} role to: ${role}, tier: ${tier || "none"}, force: ${force}, expiration: ${subscription_end_date || "not set"}`
    );

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    // Get the current data
    const data = loadData();

    // Find the user
    const userIndex = data.users.findIndex((u) => u.user_id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // If force flag is set, clear any subscription data that might interfere
    if (force === true && tier === "basic") {
      console.log(
        `Force flag set - resetting subscription data for user ${userId}`
      );
      // Clear any active subscriptions
      if (data.subscriptions) {
        data.subscriptions = data.subscriptions.filter(
          (sub) => sub.user_id !== userId
        );
      }

      // Clear any subscription end date
      delete data.users[userIndex].subscription_end_date;
    }

    // Update both role and account_type for compatibility
    data.users[userIndex].role = role.toLowerCase();
    data.users[userIndex].account_type =
      role.charAt(0).toUpperCase() + role.slice(1);

    // Add tier information if provided
    if (tier) {
      data.users[userIndex].tier = tier;

      // For influencers, also update influencer_tier for compatibility
      if (role.toLowerCase() === "influencer") {
        data.users[userIndex].influencer_tier = tier;
      }
    }

    // Add subscription end date if provided
    if (subscription_end_date) {
      data.users[userIndex].subscription_end_date = subscription_end_date;
      console.log(
        `Added subscription end date: ${subscription_end_date} for user ${userId}`
      );

      // If we're in a production environment, you would want to set up a scheduled job
      // to automatically downgrade the user when their subscription expires
    }

    // Save the updated data
    saveData(data);

    // Return the updated user for confirmation
    const updatedUser = data.users[userIndex];

    console.log(
      `✅ Successfully updated user ${userId} to ${role} role with tier ${tier || "none"}`
    );
    res.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

app.post("/api/admin", async (req, res) => {
  try {
    const adminAction = req.body;
    const newAdminAction = await db.createAdminAction(adminAction);
    res.status(201).json(newAdminAction);
  } catch (error) {
    res.status(500).json({ error: "Failed to create admin action" });
  }
});

app.delete("/api/admin/:id", async (req, res) => {
  const deleted = await db.deleteAdminAction(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Admin action not found" });
  }
  res.json({ message: "Admin action deleted successfully" });
});

// Get all campaign requests
app.get("/api/campaign-requests", async (req, res) => {
  try {
    const campaignRequests = await db.getCampaignRequests();
    res.json(campaignRequests);
  } catch (error) {
    console.error("Error getting campaign requests:", error);
    res.status(500).json({ error: "Failed to fetch campaign requests" });
  }
});

// Get campaign requests for a specific influencer
app.get("/api/campaign-requests/influencer/:influencerId", async (req, res) => {
  try {
    const { influencerId } = req.params;
    const campaignRequests =
      await db.getInfluencerCampaignRequests(influencerId);
    res.json(campaignRequests);
  } catch (error) {
    console.error("Error getting influencer campaign requests:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch influencer campaign requests" });
  }
});

// Get campaign requests for a specific seller
app.get("/api/campaign-requests/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const campaignRequests = await db.getSellerCampaignRequests(sellerId);
    res.json(campaignRequests);
  } catch (error) {
    console.error("Error getting seller campaign requests:", error);
    res.status(500).json({ error: "Failed to fetch seller campaign requests" });
  }
});

// Get a specific campaign request by ID
app.get("/api/campaign-requests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const campaignRequest = await db.getCampaignRequestById(requestId);

    if (!campaignRequest) {
      return res.status(404).json({ error: "Campaign request not found" });
    }

    res.json(campaignRequest);
  } catch (error) {
    console.error("Error getting campaign request:", error);
    res.status(500).json({ error: "Failed to fetch campaign request" });
  }
});

// Create a new campaign request
app.post("/api/campaign-requests", async (req, res) => {
  try {
    const campaignRequest = req.body;

    // Validate required fields
    if (!campaignRequest.influencerId || !campaignRequest.sellerId) {
      return res.status(400).json({
        error:
          "Missing required fields: influencerId and sellerId are required",
      });
    }

    const newCampaignRequest = await db.createCampaignRequest(campaignRequest);
    res.status(201).json(newCampaignRequest);
  } catch (error) {
    console.error("Error creating campaign request:", error);
    res.status(500).json({ error: "Failed to create campaign request" });
  }
});

// Update a campaign request
app.put("/api/campaign-requests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const updates = req.body;

    const updatedCampaignRequest = await db.updateCampaignRequest(
      requestId,
      updates
    );
    res.json(updatedCampaignRequest);
  } catch (error) {
    console.error("Error updating campaign request:", error);

    if (error.message === "Campaign request not found") {
      return res.status(404).json({ error: "Campaign request not found" });
    }

    res.status(500).json({ error: "Failed to update campaign request" });
  }
});

// Update campaign request status
app.put("/api/campaign-requests/:requestId/status", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updatedCampaignRequest = await db.updateCampaignRequestStatus(
      requestId,
      status
    );
    res.json(updatedCampaignRequest);
  } catch (error) {
    console.error("Error updating campaign request status:", error);

    if (error.message === "Campaign request not found") {
      return res.status(404).json({ error: "Campaign request not found" });
    }

    res.status(500).json({ error: "Failed to update campaign request status" });
  }
});

// Delete a campaign request
app.delete("/api/campaign-requests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const deleted = await db.deleteCampaignRequest(requestId);

    if (!deleted) {
      return res.status(404).json({ error: "Campaign request not found" });
    }

    res.json({ message: "Campaign request deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign request:", error);
    res.status(500).json({ error: "Failed to delete campaign request" });
  }
});

// Get all collaboration requests
app.get("/api/collaboration-requests", (req, res) => {
  try {
    const data = loadData();

    // Make sure we return the existing data from the collaboration_requests array
    if (data.collaboration_requests) {
      // Sort by timestamp (newest first)
      const sortedRequests = [...data.collaboration_requests].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Remove duplicates (sometimes sample data has duplicates)
      const uniqueRequests = Array.from(
        new Map(
          sortedRequests.map((request) => [request.requestId, request])
        ).values()
      );

      res.json(uniqueRequests);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching collaboration requests:", error);
    res.status(500).json({ error: "Failed to fetch collaboration requests" });
  }
});

// Get collaboration requests for a specific seller
app.get("/api/collaboration-requests/seller/:sellerId", (req, res) => {
  try {
    const { sellerId } = req.params;
    const data = loadData();

    if (data.collaboration_requests) {
      // Filter by seller ID and sort by timestamp (newest first)
      const sellerRequests = data.collaboration_requests
        .filter((req) => String(req.sellerId) === String(sellerId))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Remove duplicates
      const uniqueRequests = Array.from(
        new Map(
          sellerRequests.map((request) => [request.requestId, request])
        ).values()
      );

      res.json(uniqueRequests);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching seller collaboration requests:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch seller collaboration requests" });
  }
});

// Get collaboration requests for a specific influencer
app.get("/api/collaboration-requests/influencer/:influencerId", (req, res) => {
  try {
    const { influencerId } = req.params;
    const data = loadData();

    if (data.collaboration_requests) {
      // Filter by influencer ID and sort by timestamp (newest first)
      const influencerRequests = data.collaboration_requests
        .filter((req) => String(req.influencerId) === String(influencerId))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Remove duplicates
      const uniqueRequests = Array.from(
        new Map(
          influencerRequests.map((request) => [request.requestId, request])
        ).values()
      );

      res.json(uniqueRequests);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching influencer collaboration requests:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch influencer collaboration requests" });
  }
});

app.post("/api/collaboration-requests", (req, res) => {
  const data = loadData();
  const request = { ...req.body, request_id: `req-${Date.now()}` };
  data.collaboration_requests = data.collaboration_requests || [];
  data.collaboration_requests.push(request);
  saveData(data);
  res.status(201).json(request);
});

// PUT /collaboration-requests/:id (update status)
app.put("/api/collaboration-requests/:id", (req, res) => {
  const data = loadData();
  const { id } = req.params;
  const { status } = req.body;

  const reqIndex = data.collaboration_requests.findIndex(
    (r) => r.request_id === id
  );

  if (reqIndex === -1) {
    return res.status(404).json({ error: "Request not found" });
  }

  data.collaboration_requests[reqIndex].status = status;
  saveData(data);
  res.json({ success: true });
});

app.get("/api/collaboration-requests", (req, res) => {
  const data = loadData();
  res.json(data.collaboration_requests || []);
});

app.put("/collaboration-requests/:requestId/status", (req, res) => {
  const data = loadData();
  const { requestId } = req.params;
  const { status } = req.body;

  const request = data.collaboration_requests.find(
    (r) => r.requestId === requestId || r.request_id === requestId
  );

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  request.status = status;
  saveData(data);
  res.json({ message: "Status updated", request });
});

// Create a new collaboration request
app.post("/api/collaboration-requests", (req, res) => {
  try {
    const requestData = req.body;

    // Validate required fields
    if (!requestData.influencerId || !requestData.sellerId) {
      return res.status(400).json({
        error:
          "Missing required fields: influencerId and sellerId are required",
      });
    }

    const data = loadData();

    // Ensure collaboration_requests exists in the data
    if (!data.collaboration_requests) {
      data.collaboration_requests = [];
    }

    // Generate a unique request ID if not provided
    const newRequest = {
      ...requestData,
      requestId: requestData.requestId || Date.now().toString(),
      timestamp: requestData.timestamp || new Date().toISOString(),
      status: requestData.status || "Pending",
    };

    // Add the new request
    data.collaboration_requests.push(newRequest);
    saveData(data);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error creating collaboration request:", error);
    res.status(500).json({ error: "Failed to create collaboration request" });
  }
});

// Update collaboration request status
app.put(
  "/api/collaboration-requests/:requestId/status",
  subscriptionMiddleware,
  (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      const sellerId = req.body.sellerId;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // If the status is being set to "Accepted", check subscription limits
      if (status === "Accepted" && sellerId) {
        // The subscriptionMiddleware already populated req.sellerLimits and req.sellerStats
        if (req.sellerStats && req.sellerLimits) {
          // Check if seller has reached their collaboration limit
          if (
            req.sellerStats.collaborationCount >=
            req.sellerLimits.collaborationLimit
          ) {
            return res.status(403).json({
              error: "Collaboration limit reached",
              message: `Your current plan (${req.sellerLimits.tier}) allows a maximum of ${req.sellerLimits.collaborationLimit} collaborations. Please upgrade your subscription to continue.`,
              upgrade_required: true,
              current_tier: req.sellerLimits.tier,
              current_count: req.sellerStats.collaborationCount,
              max_allowed: req.sellerLimits.collaborationLimit,
            });
          }
        }
      }

      const data = loadData();

      // Ensure collaboration_requests exists in the data
      if (!data.collaboration_requests) {
        data.collaboration_requests = [];
        saveData(data);
        return res
          .status(404)
          .json({ error: "Collaboration request not found" });
      }

      // Find and update the request
      const requestIndex = data.collaboration_requests.findIndex(
        (req) => String(req.requestId) === String(requestId)
      );

      if (requestIndex === -1) {
        return res
          .status(404)
          .json({ error: "Collaboration request not found" });
      }

      // Update the request
      data.collaboration_requests[requestIndex] = {
        ...data.collaboration_requests[requestIndex],
        status,
        statusUpdatedAt: new Date().toISOString(),
      };

      saveData(data);

      res.json(data.collaboration_requests[requestIndex]);
    } catch (error) {
      console.error("Error updating collaboration request status:", error);
      res
        .status(500)
        .json({ error: "Failed to update collaboration request status" });
    }
  }
);
// Delete a collaboration request
app.delete("/api/collaboration-requests/:requestId", (req, res) => {
  try {
    const { requestId } = req.params;
    const data = loadData();

    // Ensure collaboration_requests exists in the data
    if (!data.collaboration_requests) {
      data.collaboration_requests = [];
      saveData(data);
      return res.status(404).json({ error: "Collaboration request not found" });
    }

    // Find the request
    const initialLength = data.collaboration_requests.length;
    data.collaboration_requests = data.collaboration_requests.filter(
      (req) => String(req.requestId) !== String(requestId)
    );

    if (data.collaboration_requests.length === initialLength) {
      return res.status(404).json({ error: "Collaboration request not found" });
    }

    saveData(data);

    res.json({ message: "Collaboration request deleted successfully" });
  } catch (error) {
    console.error("Error deleting collaboration request:", error);
    res.status(500).json({ error: "Failed to delete collaboration request" });
  }
});

// Follow a user
app.post("/api/users/:followerId/follow", (req, res) => {
  try {
    const { followerId } = req.params;
    const { followee_id } = req.body;

    if (!followerId || !followee_id) {
      return res.status(400).json({
        success: false,
        message: "Both follower and followee IDs are required",
      });
    }

    const data = loadData();

    // Validate user IDs
    const follower = data.users.find(
      (u) => String(u.user_id) === String(followerId)
    );
    const followee = data.users.find(
      (u) => String(u.user_id) === String(followee_id)
    );

    if (!follower || !followee) {
      return res.status(404).json({
        success: false,
        message: "One or both users not found",
      });
    }

    // Validate account types - only buyers can follow others
    if (follower.account_type.toLowerCase() !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can follow other users",
      });
    }

    // Validate followee is seller or influencer
    if (
      !["seller", "influencer"].includes(followee.account_type.toLowerCase())
    ) {
      return res.status(403).json({
        success: false,
        message: "Can only follow sellers or influencers",
      });
    }

    // Initialize following/followers arrays if they don't exist
    if (!follower.following) follower.following = [];
    if (!followee.followers) followee.followers = [];

    // Check if already following
    if (follower.following.some((id) => String(id) === String(followee_id))) {
      return res.status(200).json({
        success: true,
        message: "Already following this user",
      });
    }

    // Update following/followers
    follower.following.push(followee_id);
    followee.followers.push(followerId);

    // Update follower count for display
    followee.followers_count = (followee.followers_count || 0) + 1;

    saveData(data);

    // Create notification for the followee
    const notification = {
      user_id: followee_id,
      message: `${follower.name} started following you`,
      date_timestamp: new Date().toISOString(),
      notification_id: Date.now(), // Simple way to generate unique ID
    };

    if (!data.notifications) data.notifications = [];
    data.notifications.push(notification);
    saveData(data);

    res.json({
      success: true,
      message: "Successfully followed user",
    });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({
      success: false,
      message: "Error following user",
    });
  }
});

// Unfollow a user
app.post("/api/users/:followerId/unfollow", (req, res) => {
  try {
    const { followerId } = req.params;
    const { followee_id } = req.body;

    if (!followerId || !followee_id) {
      return res.status(400).json({
        success: false,
        message: "Both follower and followee IDs are required",
      });
    }

    const data = loadData();

    // Validate user IDs
    const follower = data.users.find(
      (u) => String(u.user_id) === String(followerId)
    );
    const followee = data.users.find(
      (u) => String(u.user_id) === String(followee_id)
    );

    if (!follower || !followee) {
      return res.status(404).json({
        success: false,
        message: "One or both users not found",
      });
    }

    // Check if follower has following list
    if (!follower.following || !follower.following.length) {
      return res.status(200).json({
        success: true,
        message: "Not following this user",
      });
    }

    // Check if followee has followers list
    if (!followee.followers || !followee.followers.length) {
      return res.status(200).json({
        success: true,
        message: "Not following this user",
      });
    }

    // Check if actually following
    if (!follower.following.some((id) => String(id) === String(followee_id))) {
      return res.status(200).json({
        success: true,
        message: "Not following this user",
      });
    }

    // Update following/followers
    follower.following = follower.following.filter(
      (id) => String(id) !== String(followee_id)
    );
    followee.followers = followee.followers.filter(
      (id) => String(id) !== String(followerId)
    );

    // Update follower count for display (ensure it doesn't go below 0)
    followee.followers_count = Math.max((followee.followers_count || 0) - 1, 0);

    saveData(data);

    res.json({
      success: true,
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({
      success: false,
      message: "Error unfollowing user",
    });
  }
});

// Get users that a user is following
app.get("/api/users/:userId/following", (req, res) => {
  try {
    const { userId } = req.params;
    const data = loadData();

    // Find user
    const user = data.users.find((u) => String(u.user_id) === String(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has following list
    if (!user.following || !user.following.length) {
      return res.json([]);
    }

    // Get user objects for all followed users
    const followingUsers = user.following.map((followeeId) => {
      const followedUser = data.users.find(
        (u) => String(u.user_id) === String(followeeId)
      );

      if (followedUser) {
        // Return a subset of user data for privacy
        return {
          user_id: followedUser.user_id,
          name: followedUser.name,
          username:
            followedUser.username ||
            followedUser.name.toLowerCase().replace(/\s+/g, "_"),
          account_type: followedUser.account_type,
          profile_image: followedUser.profile_image || "default_profile.jpg",
          followers_count: followedUser.followers_count || 0,
          city: followedUser.city,
          country: followedUser.country,
        };
      }

      // Return minimal data if user not found
      return {
        user_id: followeeId,
        name: `User ${followeeId}`,
        account_type: "Unknown",
        profile_image: "default_profile.jpg",
        followers_count: 0,
      };
    });

    res.json(followingUsers);
  } catch (error) {
    console.error("Error getting following:", error);
    res.status(500).json({ error: "Error getting following" });
  }
});

// Get users who are following a user
app.get("/api/users/:userId/followers", (req, res) => {
  try {
    const { userId } = req.params;
    const data = loadData();

    // Find user
    const user = data.users.find((u) => String(u.user_id) === String(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If the user has a followers_count but no followers array, or if
    // the followers array doesn't match the count, we need to generate placeholder followers
    let followerUsers = [];

    if (
      (!user.followers || user.followers.length === 0) &&
      user.followers_count &&
      user.followers_count > 0
    ) {
      console.log(
        `User ${userId} has follower_count ${user.followers_count} but no followers array. Generating placeholder data.`
      );

      // Find all buyers to use as sample followers
      const buyers = data.users.filter(
        (u) =>
          u.account_type.toLowerCase() === "buyer" &&
          String(u.user_id) !== String(userId)
      );

      // Generate placeholder followers using real buyer accounts if possible
      const followerCount = Math.min(user.followers_count, buyers.length || 5);

      // Create placeholder followers from real buyers or generate fake ones
      if (buyers.length > 0) {
        // Use real buyers as followers (up to the follower_count)
        followerUsers = buyers.slice(0, followerCount).map((buyer) => ({
          user_id: buyer.user_id,
          name: buyer.name,
          username:
            buyer.username || buyer.name.toLowerCase().replace(/\s+/g, "_"),
          account_type: buyer.account_type,
          profile_image: buyer.profile_image || "default_profile.jpg",
          city: buyer.city,
          country: buyer.country,
        }));

        // Update the user's followers array
        user.followers = followerUsers.map((f) => f.user_id);
        saveData(data);
      } else {
        // Generate placeholder follower data if no buyers are available
        for (let i = 0; i < followerCount; i++) {
          followerUsers.push({
            user_id: `placeholder_${i}`,
            name: `Follower ${i + 1}`,
            username: `follower_${i + 1}`,
            account_type: "Buyer",
            profile_image: "default_profile.jpg",
            city: "Sample City",
            country: "Sample Country",
          });
        }
      }
    } else if (user.followers && user.followers.length > 0) {
      // Normal case: Get user objects for all followers
      followerUsers = user.followers.map((followerId) => {
        const follower = data.users.find(
          (u) => String(u.user_id) === String(followerId)
        );

        if (follower) {
          // Return a subset of user data for privacy
          return {
            user_id: follower.user_id,
            name: follower.name,
            username:
              follower.username ||
              follower.name.toLowerCase().replace(/\s+/g, "_"),
            account_type: follower.account_type,
            profile_image: follower.profile_image || "default_profile.jpg",
            city: follower.city,
            country: follower.country,
          };
        }

        // Return minimal data if user not found
        return {
          user_id: followerId,
          name: `User ${followerId}`,
          account_type: "Unknown",
          profile_image: "default_profile.jpg",
        };
      });
    }

    // Make sure followers_count matches the followers array length
    user.followers_count = followerUsers.length;
    saveData(data);

    res.json(followerUsers);
  } catch (error) {
    console.error("Error getting followers:", error);
    res.status(500).json({ error: "Error getting followers" });
  }
});

// Get follower count for a user
app.get("/api/users/:userId/followers/count", (req, res) => {
  try {
    const { userId } = req.params;
    const data = loadData();

    // Find user
    const user = data.users.find((u) => String(u.user_id) === String(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get follower count from array or stored count
    let count = 0;

    if (user.followers && Array.isArray(user.followers)) {
      count = user.followers.length;
    } else if (user.followers_count !== undefined) {
      count = user.followers_count;
    }

    res.json({ count });
  } catch (error) {
    console.error("Error getting follower count:", error);
    res.status(500).json({ error: "Error getting follower count" });
  }
});

// Get suggested users to follow for a buyer
app.get("/api/users/:userId/suggested-follows", (req, res) => {
  try {
    const { userId } = req.params;
    const data = loadData();

    // Find user
    const user = data.users.find((u) => String(u.user_id) === String(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate user is a buyer
    if (user.account_type.toLowerCase() !== "buyer") {
      return res
        .status(403)
        .json({ error: "Only buyers can get suggested follows" });
    }

    // Get user's current following list
    const following = user.following || [];

    // Find all sellers and influencers not already followed
    let suggestions = data.users.filter(
      (u) =>
        (u.account_type.toLowerCase() === "seller" ||
          u.account_type.toLowerCase() === "influencer") &&
        String(u.user_id) !== String(userId) &&
        !following.some((id) => String(id) === String(u.user_id))
    );

    // Sort by follower count (most followers first)
    suggestions.sort((a, b) => {
      const followersA = a.followers_count || 0;
      const followersB = b.followers_count || 0;
      return followersB - followersA;
    });

    // Limit to 10 suggestions and filter data for response
    suggestions = suggestions.slice(0, 10).map((u) => ({
      user_id: u.user_id,
      name: u.name,
      username: u.username || u.name.toLowerCase().replace(/\s+/g, "_"),
      account_type: u.account_type,
      profile_image: u.profile_image || "default_profile.jpg",
      followers_count: u.followers_count || 0,
      city: u.city,
      country: u.country,
    }));

    res.json(suggestions);
  } catch (error) {
    console.error("Error getting suggested follows:", error);
    res.status(500).json({ error: "Error getting suggested follows" });
  }
});

app.post("/api/create-follow-relationship", (req, res) => {
  try {
    const { buyerId, followeeId } = req.body;

    if (!buyerId || !followeeId) {
      return res.status(400).json({
        success: false,
        message: "Both buyer ID and followee ID are required",
      });
    }

    console.log(
      `Creating follow relationship: Buyer ${buyerId} -> User ${followeeId}`
    );

    const data = loadData();

    // Validate user IDs
    const buyer = data.users.find((u) => String(u.user_id) === String(buyerId));
    const followee = data.users.find(
      (u) => String(u.user_id) === String(followeeId)
    );

    if (!buyer || !followee) {
      return res.status(404).json({
        success: false,
        message: "One or both users not found",
      });
    }

    // Validate account types
    if (buyer.account_type.toLowerCase() !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "The follower must be a buyer",
      });
    }

    if (
      !["seller", "influencer"].includes(followee.account_type.toLowerCase())
    ) {
      return res.status(403).json({
        success: false,
        message: "The followee must be a seller or influencer",
      });
    }

    // Initialize arrays if needed
    if (!buyer.following) buyer.following = [];
    if (!followee.followers) followee.followers = [];

    // Check if already following
    if (buyer.following.some((id) => String(id) === String(followeeId))) {
      return res.status(200).json({
        success: true,
        message: "Already following this user",
      });
    }

    // Create follow relationship
    buyer.following.push(followeeId);
    followee.followers.push(buyerId);

    // Update follower count for display
    followee.followers_count = (followee.followers_count || 0) + 1;

    saveData(data);

    res.json({
      success: true,
      message: "Follow relationship created successfully",
    });
  } catch (error) {
    console.error("Error creating follow relationship:", error);
    res.status(500).json({
      success: false,
      message: "Error creating follow relationship",
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
