export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Test dynamic imports
    const { initializeApp } = await import('firebase/app');
    const { v4: uuidv4 } = await import('uuid');
    
    // Test environment variables
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };
    
    return res.status(200).json({
      success: true,
      message: 'Dynamic imports working!',
      uuid: uuidv4(),
      hasFirebaseConfig: !!firebaseConfig.apiKey,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasShopify: !!process.env.SHOPIFY_ACCESS_TOKEN,
      hasEmail: !!process.env.EMAIL_USER
    });
    
  } catch (error) {
    return res.status(500).json({
      error: 'Import failed',
      details: error.message
    });
  }
} 