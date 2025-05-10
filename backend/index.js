const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

const app = express();
const PORT = config.PORT;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// Banking context for Gemini
const BANKING_CONTEXT = `You are a helpful banking assistant. You can help with:
1. Account opening and requirements
2. Document verification
3. Application status
4. Interest rates and banking products
5. Security and privacy
6. Customer support

Always provide accurate, helpful information and maintain a professional tone.
If you're unsure about specific bank policies, suggest contacting customer support.`;

// Initialize face-api
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Enable CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Create necessary directories
const uploadDir = path.join(__dirname, 'uploads');
const modelPath = path.join(__dirname, 'models');
[uploadDir, modelPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Load face-api models
async function loadModels() {
  try {
    console.log('Loading face detection models...');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    console.log('Models loaded successfully');
  } catch (error) {
    console.error('Error loading models:', error);
    throw error;
  }
}

// Extract face from image
async function extractFaceFromImage(imageBuffer) {
  try {
    console.log('Processing image for face extraction...');
    const img = await canvas.loadImage(imageBuffer);
    console.log('Image loaded, dimensions:', img.width, 'x', img.height);

    let detections = null;
    let confidenceThreshold = 0.2; // Even lower initial threshold
    
    while (!detections && confidenceThreshold > 0.05) { // Much lower minimum threshold
      console.log(`Attempting face detection with confidence threshold: ${confidenceThreshold}`);
      detections = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: confidenceThreshold }))
      .withFaceLandmarks()
      .withFaceDescriptor();

      if (!detections) {
        confidenceThreshold -= 0.02; // Smaller steps
      }
    }

    if (!detections) {
      throw new Error('No face detected in image after multiple attempts');
    }

    console.log('Face detected with confidence:', detections.detection.score);

    // More lenient face size and position checks
    const { box } = detections.detection;
    const faceSize = box.width * box.height;
    const imageSize = img.width * img.height;
    const faceRatio = faceSize / imageSize;

    if (faceRatio < 0.001) { // Much lower minimum face size ratio
      throw new Error('Face is too small in the image');
    }

    if (faceRatio > 0.8) { // Higher maximum face size ratio
      throw new Error('Face is too large in the image');
    }

    return {
      faceImage: imageBuffer,
      descriptor: detections.descriptor,
      detection: detections.detection
    };
  } catch (error) {
    console.error('Error extracting face:', error);
    throw error;
  }
}

// Compare faces
async function compareFaces(face1Descriptor, face2Descriptor) {
  try {
    console.log('Comparing face descriptors...');
    const distance = faceapi.euclideanDistance(face1Descriptor, face2Descriptor);
    const similarity = 1 - distance;
    
    // Convert to percentage for easier comparison
    const similarityPercentage = similarity * 100;
    
    // Lower thresholds for more lenient matching
    const thresholds = {
      high: 45,    // Lowered from 55
      medium: 35,  // Lowered from 45
      low: 25      // Lowered from 35
    };
    
    // Calculate match confidence level
    let confidenceLevel = 'none';
    if (similarityPercentage >= thresholds.high) {
      confidenceLevel = 'high';
    } else if (similarityPercentage >= thresholds.medium) {
      confidenceLevel = 'medium';
    } else if (similarityPercentage >= thresholds.low) {
      confidenceLevel = 'low';
    }
    
    console.log('Face comparison results:', {
      distance,
      similarity,
      similarityPercentage: similarityPercentage.toFixed(2) + '%',
      thresholds,
      confidenceLevel,
      match: similarityPercentage >= thresholds.medium
    });

    return {
      similarityPercentage,
      confidenceLevel,
      thresholds,
      match: similarityPercentage >= thresholds.medium
    };
  } catch (error) {
    console.error('Error comparing faces:', error);
    throw error;
  }
}

// Face verification endpoint
app.post('/api/compare-faces', upload.fields([
  { name: 'liveImage', maxCount: 1 },
  { name: 'referenceImage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Face verification request received');
    
    if (!req.files.liveImage || !req.files.referenceImage) {
      console.log('Missing required images');
      return res.status(400).json({ 
        success: false, 
        message: 'Both live image and reference image are required'
      });
    }

    console.log('Processing images...');
    const liveImageBuffer = fs.readFileSync(req.files.liveImage[0].path);
    const referenceImageBuffer = fs.readFileSync(req.files.referenceImage[0].path);

    console.log('Extracting faces...');
    let liveFace, referenceFace;
    let extractionDetails = {
      live: { success: false, error: null },
      reference: { success: false, error: null }
    };

    try {
      liveFace = await extractFaceFromImage(liveImageBuffer);
      extractionDetails.live.success = true;
      extractionDetails.live.confidence = liveFace.detection.score;
      console.log('Live face extracted successfully');
    } catch (error) {
      console.error('Error extracting live face:', error);
      extractionDetails.live.error = error.message;
      return res.status(400).json({ 
        success: false, 
        message: 'Could not detect face in live image. Please ensure your face is clearly visible.',
        details: extractionDetails
      });
    }

    try {
      referenceFace = await extractFaceFromImage(referenceImageBuffer);
      extractionDetails.reference.success = true;
      extractionDetails.reference.confidence = referenceFace.detection.score;
      console.log('Reference photo face extracted successfully');
    } catch (error) {
      console.error('Error extracting reference photo face:', error);
      extractionDetails.reference.error = error.message;
      return res.status(400).json({ 
        success: false, 
        message: 'Could not detect face in reference photo. Please try again.',
        details: extractionDetails
      });
    }

    console.log('Comparing faces...');
    const comparisonResult = await compareFaces(liveFace.descriptor, referenceFace.descriptor);
    console.log('Comparison complete:', comparisonResult);

    res.json({
      success: true,
      match: comparisonResult.match,
      similarity: comparisonResult.similarityPercentage / 100,
      similarityPercentage: comparisonResult.similarityPercentage.toFixed(2) + '%',
      confidenceLevel: comparisonResult.confidenceLevel,
      thresholds: comparisonResult.thresholds,
      extractionDetails,
      message: comparisonResult.match 
        ? 'Face verification successful' 
        : 'Face verification failed - faces do not match'
    });
  } catch (error) {
    console.error('Face comparison error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Face comparison failed: ' + error.message
    });
  }
});

// Chatbot endpoint
app.post('/chat', (req, res) => {
  try {
    // Convert message to lowercase and trim whitespace
    const userMessage = req.body.message?.toLowerCase().trim();
    
    if (!userMessage) {
      return res.status(400).json({ 
        error: 'Message is required',
        reply: 'Please type your question to get started! 😊'
      });
    }

    let botResponse = "I'm here to help! You can ask me about:\n" +
                     "📱 Account opening and requirements\n" +
                     "📄 Document verification\n" +
                     "⏳ Application status\n" +
                     "💰 Interest rates\n" +
                     "🔒 Security features\n" +
                     "📞 Customer support\n\n" +
                     "Just click the quick action buttons or type your question!";

    // Account Opening Related - Case insensitive matching
    if (/open account|create account|new account|start account|begin account|apply account/i.test(userMessage)) {
      botResponse = "🎉 Great choice! Here's how to open an account:\n\n" +
                   "1️⃣ Select your preferred bank and branch\n" +
                   "2️⃣ Upload your KYC documents\n" +
                   "3️⃣ Complete the application form\n" +
                   "4️⃣ Wait for verification (2-3 business days)\n\n" +
                   "Need help with documents? Just ask!";
    } 
    // Document Requirements - Case insensitive matching
    else if (/documents|papers|kyc|proof|id|identification|verification/i.test(userMessage)) {
      botResponse = "📄 Here are the documents you'll need:\n\n" +
                   "🆔 Identity Proof:\n" +
                   "   • Aadhaar card or PAN card\n\n" +
                   "🏠 Address Proof:\n" +
                   "   • Government-issued ID\n" +
                   "   • Utility bill (not older than 3 months)\n\n" +
                   "📸 Recent passport-size photo\n\n" +
                   "💰 Income proof (for premium accounts)\n\n" +
                   "Need help uploading? Just let me know!";
    }
    // Account Types - Case insensitive matching
    else if (/account types|kinds of accounts|type of account|account options|savings account|current account|zero balance/i.test(userMessage)) {
      botResponse = "💳 We offer these account types:\n\n" +
                   "1️⃣ Regular Savings\n" +
                   "   • Min. balance: ₹1000\n" +
                   "   • Basic banking features\n\n" +
                   "2️⃣ Premium Savings\n" +
                   "   • Min. balance: ₹5000\n" +
                   "   • Priority services\n\n" +
                   "3️⃣ Zero Balance Account\n" +
                   "   • No minimum balance\n" +
                   "   • Perfect for students\n\n" +
                   "4️⃣ Senior Citizen Account\n" +
                   "   • Higher interest rates\n" +
                   "   • Special benefits\n\n" +
                   "Which one interests you?";
    }
    // Application Status - Case insensitive matching
    else if (/status|application status|check status|track status|progress|update/i.test(userMessage)) {
      botResponse = "📱 Check your application status:\n\n" +
                   "1️⃣ Visit your dashboard\n" +
                   "2️⃣ Click 'View Status'\n" +
                   "3️⃣ Or contact our support\n\n" +
                   "📧 We'll send you email updates at each stage!\n\n" +
                   "Need help finding your status? Just ask!";
    }
    // Processing Time - Case insensitive matching
    else if (/how long|time taken|duration|processing time|wait|when|timeline/i.test(userMessage)) {
      botResponse = "⏱️ Here's our processing timeline:\n\n" +
                   "📄 Document verification: 1-2 business days\n" +
                   "✅ Account activation: 1 business day\n" +
                   "💳 Debit card delivery: 7-10 business days\n\n" +
                   "📧 You'll get email notifications at each step!\n\n" +
                   "Need more details? Just ask!";
    }
    // Security - Case insensitive matching
    else if (/secure|data safe|security|protected|privacy|safe|protection/i.test(userMessage)) {
      botResponse = "🔒 Your security is our priority!\n\n" +
                   "We protect your data with:\n" +
                   "1️⃣ End-to-end encryption\n" +
                   "2️⃣ Secure cloud storage\n" +
                   "3️⃣ Regular security audits\n" +
                   "4️⃣ Two-factor authentication\n" +
                   "5️⃣ Fraud monitoring systems\n\n" +
                   "Feel safe with us! Need more details?";
    }
    // Support - Case insensitive matching
    else if (/help|support|contact|reach|assist|guide|customer service/i.test(userMessage)) {
      botResponse = "📞 We're here to help!\n\n" +
                   "Contact us through:\n" +
                   "1️⃣ 24/7 Customer Care: 1800-XXX-XXXX\n" +
                   "2️⃣ Email: support@bankassistant.com\n" +
                   "3️⃣ Live Chat: 9 AM - 6 PM\n" +
                   "4️⃣ Visit your nearest branch\n\n" +
                   "Need immediate assistance?";
    }
    // Interest Rates - Case insensitive matching
    else if (/interest rate|savings rate|interest|rate of interest|returns|earnings/i.test(userMessage)) {
      botResponse = "💰 Current Interest Rates:\n\n" +
                   "💳 Regular Savings: 3.5% p.a.\n" +
                   "💎 Premium Savings: 4% p.a.\n" +
                   "👴 Senior Citizen: 4.5% p.a.\n" +
                   "📈 Fixed Deposits: 5-7% p.a.\n\n" +
                   "Want to know more about any of these?";
    }
    // Digital Banking - Case insensitive matching
    else if (/mobile banking|app|online banking|digital banking|internet banking|upi|transfer/i.test(userMessage)) {
      botResponse = "📱 Our Digital Banking Features:\n\n" +
                   "1️⃣ Mobile Banking App\n" +
                   "   • Available on Android & iOS\n" +
                   "   • Easy account management\n\n" +
                   "2️⃣ Internet Banking\n" +
                   "   • Full banking services\n" +
                   "   • Secure transactions\n\n" +
                   "3️⃣ UPI Payments\n" +
                   "   • Quick money transfers\n" +
                   "   • Bill payments\n\n" +
                   "Need help setting up? Just ask!";
    }

    res.json({ reply: botResponse });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      reply: '😔 Oops! Something went wrong. Please try again in a moment.'
    });
  }
});

// Initialize models and start server
loadModels()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log('Available routes:');
      console.log('- POST /api/compare-faces');
      console.log('- POST /chat');
    });
  })
  .catch(error => {
    console.error('Failed to initialize face detection models:', error);
    process.exit(1);
  }); 