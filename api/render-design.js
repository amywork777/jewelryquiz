// STEP 2: TRIGGER AI RENDER PIPELINE (Backend)
// Processes uploaded photos and generates rendered charm designs

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import OpenAI from 'openai';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { design_id, firestore_id } = req.body;
    
    if (!design_id && !firestore_id) {
      return res.status(400).json({ 
        error: 'Either design_id or firestore_id is required' 
      });
    }

    // Get design document from Firestore
    const designRef = doc(db, 'designs', firestore_id);
    const designSnap = await getDoc(designRef);
    
    if (!designSnap.exists()) {
      return res.status(404).json({ error: 'Design not found' });
    }
    
    const designData = designSnap.data();
    
    if (designData.status !== 'pending') {
      return res.status(400).json({ 
        error: `Design is already ${designData.status}` 
      });
    }

    console.log('Processing design:', {
      design_id: designData.design_id,
      dog_name: designData.dog_name,
      email: designData.email
    });

    // Generate AI charm design
    const renderResult = await generateCharmDesign(designData);
    
    // Upload rendered design to Firebase Storage
    const renderPath = `renders/${designData.email}/${designData.design_id}.png`;
    const renderRef = ref(storage, renderPath);
    
    // Convert base64 to buffer
    const renderBuffer = Buffer.from(renderResult.imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    const renderSnapshot = await uploadBytes(renderBuffer, renderRef, {
      contentType: 'image/png'
    });
    
    const render_url = await getDownloadURL(renderSnapshot.ref);
    
    // Update Firestore document
    await updateDoc(designRef, {
      render_url,
      ai_prompt: renderResult.prompt,
      status: 'rendered',
      rendered_at: new Date()
    });
    
    console.log('Design rendered successfully:', {
      design_id: designData.design_id,
      render_url
    });
    
    return res.status(200).json({
      success: true,
      design_id: designData.design_id,
      render_url,
      message: 'Design rendered successfully'
    });
    
  } catch (error) {
    console.error('Error rendering design:', error);
    return res.status(500).json({ 
      error: 'Failed to render design',
      details: error.message
    });
  }
}

async function generateCharmDesign(designData) {
  const { dog_name, photo_url, designData: quizData } = designData;
  
  // Create a detailed prompt based on the dog photo and quiz responses
  let prompt = `Create a beautiful, elegant dog charm design featuring ${dog_name}. `;
  
  if (quizData && quizData.responses) {
    const responses = quizData.responses;
    
    if (responses.material) {
      const materialMap = {
        'sterling_silver': 'sterling silver',
        'gold_filled': 'gold-filled',
        'solid_gold': 'solid gold'
      };
      prompt += `Made in ${materialMap[responses.material] || 'premium metal'}. `;
    }
    
    if (responses.size_presence) {
      const styleMap = {
        'delicate_minimal': 'delicate and minimal style',
        'statement_bold': 'bold statement piece',
        'classic_timeless': 'classic timeless design'
      };
      prompt += `${styleMap[responses.size_presence] || 'elegant style'}. `;
    }
    
    if (responses.inspiration) {
      prompt += `Inspired by: ${responses.inspiration}. `;
    }
    
    if (responses.symbols) {
      prompt += `Include meaningful elements: ${responses.symbols}. `;
    }
    
    if (responses.special_details) {
      prompt += `Special details: ${responses.special_details}. `;
    }
  }
  
  prompt += `The charm should be jewelry-quality, suitable for a necklace or bracelet. 
  Style: clean, professional product photography on white background. 
  The design should capture the essence and personality of the dog while being wearable and elegant. 
  High-quality, detailed, photorealistic rendering.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json"
    });

    return {
      imageData: `data:image/png;base64,${response.data[0].b64_json}`,
      prompt: prompt
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate design: ${error.message}`);
  }
} 