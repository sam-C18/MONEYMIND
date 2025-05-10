const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const faceapi = require('@vladmandic/face-api');

const app = express();
const PORT = 3000;

// Enable CORS with specific configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Accept']
}));

// Enable JSON parsing for non-file routes
app.use(express.json());

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only .jpeg, .jpg, .png files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Initialize FaceAPI
async function initializeFaceAPI() {
  const modelPath = path.join(__dirname, 'models');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  
  // Warm up the model
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext('2d');
  ctx.fillRect(0, 0, 100, 100);
  await faceapi.detectAllFaces(canvas);
}

// Initialize FaceAPI when server starts
initializeFaceAPI().catch(console.error);

// Face Comparison Route
app.post('/api/compare-faces', async (req, res) => {
  try {
    const { selfieDataUrl, referenceImagePath } = req.body;

    if (!selfieDataUrl || !referenceImagePath) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both images are required' 
      });
    }

    // Load reference image
    const referenceImage = await loadImage(path.join(uploadDir, referenceImagePath));
    
    // Process selfie
    const selfieBuffer = Buffer.from(selfieDataUrl.split(',')[1], 'base64');
    const selfieImage = await loadImage(selfieBuffer);

    // Create canvases for face-api
    const canvas1 = createCanvas(referenceImage.width, referenceImage.height);
    const ctx1 = canvas1.getContext('2d');
    ctx1.drawImage(referenceImage, 0, 0);

    const canvas2 = createCanvas(selfieImage.width, selfieImage.height);
    const ctx2 = canvas2.getContext('2d');
    ctx2.drawImage(selfieImage, 0, 0);

    // Detect faces
    const referenceDetection = await faceapi.detectSingleFace(canvas1)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const selfieDetection = await faceapi.detectSingleFace(canvas2)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!referenceDetection || !selfieDetection) {
      return res.status(400).json({ 
        success: false, 
        message: 'No face detected in one or both images' 
      });
    }

    // Compare faces
    const distance = faceapi.euclideanDistance(
      referenceDetection.descriptor,
      selfieDetection.descriptor
    );

    const match = distance < 0.6; // Threshold for match

    res.json({
      success: true,
      match,
      similarity: (1 - distance).toFixed(2),
      confidence: (1 - distance).toFixed(4),
      message: match ? 'Face match successful' : 'Face mismatch'
    });

  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Face comparison failed',
      error: error.message 
    });
  }
});

// Upload Reference Image Route
app.post('/api/upload-reference', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    res.json({
      success: true,
      message: 'Reference image uploaded successfully',
      imagePath: req.file.filename
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
});

// Chatbot endpoint with error handling
app.post('/chat', (req, res) => {
  try {
    const userMessage = req.body.message?.toLowerCase();
    
    if (!userMessage) {
      return res.status(400).json({ 
        error: 'Message is required',
        reply: 'Please provide a message to continue.'
      });
    }

    let botResponse = "I'm not sure how to help with that. Can you rephrase?";

    if (userMessage.includes('open account') || userMessage.includes('create account')) {
      botResponse = "Great! Please select your preferred bank and branch. Then upload your KYC documents to continue.";
    } else if (userMessage.includes('documents') && userMessage.includes('account')) {
      botResponse = "To open a bank account, you need to upload an Aadhaar card or PAN card, address proof, and a recent passport-size photo.";
    } else if (userMessage.includes('status') || userMessage.includes('application status')) {
      botResponse = "You can check your application status from your dashboard. Just go to 'View Status' under the relevant service.";
    } else if (userMessage.includes('update document') || userMessage.includes('reupload')) {
      botResponse = "Yes, you can update your documents in the 'My Documents' section as long as your application hasn't been submitted yet.";
    } else if (userMessage.includes('secure') || userMessage.includes('data safe')) {
      botResponse = "Absolutely. We use end-to-end encryption and secure cloud storage to protect your information.";
    } else if (userMessage.includes('help') || userMessage.includes('support')) {
      botResponse = "I can connect you to our live support team. Just give me a moment...";
    }

    res.json({ reply: botResponse });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      reply: 'I apologize, but I encountered an error. Please try again.'
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- POST /api/compare-faces');
  console.log('- POST /api/upload-reference');
  console.log('- POST /chat');
}); 