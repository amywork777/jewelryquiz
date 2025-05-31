// STEP 1: UPLOAD DESIGN
// Uploads photo to Firebase Storage and creates Firestore document

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
    // Dynamic imports for Vercel compatibility
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { v4: uuidv4 } = await import('uuid');

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

    const { photo, email, dog_name, designData } = req.body;
    
    if (!photo || !email || !dog_name) {
      return res.status(400).json({ 
        error: 'Photo, email, and dog name are required' 
      });
    }

    const design_id = uuidv4();
    const timestamp = Date.now();
    
    console.log('Uploading design for:', { email, dog_name, design_id });
    
    // Convert base64 photo to buffer
    const photoBuffer = Buffer.from(photo.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    // Upload photo to Firebase Storage
    const photoPath = `uploads/${email}/${timestamp}.jpg`;
    const photoRef = ref(storage, photoPath);
    
    const photoSnapshot = await uploadBytes(photoRef, photoBuffer, {
      contentType: 'image/jpeg'
    });
    
    const photo_url = await getDownloadURL(photoSnapshot.ref);
    
    // Create Firestore document
    const designDoc = {
      design_id,
      email,
      dog_name,
      photo_url,
      created_at: serverTimestamp(),
      status: 'pending',
      designData: designData || null
    };
    
    const docRef = await addDoc(collection(db, 'designs'), designDoc);
    
    console.log('Design uploaded successfully:', {
      design_id,
      firestore_id: docRef.id,
      photo_url
    });
    
    return res.status(200).json({
      success: true,
      design_id,
      firestore_id: docRef.id,
      photo_url,
      status: 'pending',
      message: 'Design uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading design:', error);
    return res.status(500).json({ 
      error: 'Failed to upload design',
      details: error.message
    });
  }
} 