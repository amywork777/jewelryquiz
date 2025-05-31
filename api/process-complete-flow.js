// COMPLETE TAIYAKI FLOW ORCHESTRATOR
// Runs the entire pipeline: Upload → Render → Shopify → Email

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

  // Dynamic imports for Vercel compatibility
  const { initializeApp } = await import('firebase/app');
  const { getFirestore, collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const { v4: uuidv4 } = await import('uuid');
  const OpenAI = (await import('openai')).default;
  const nodemailer = (await import('nodemailer')).default;

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

  // Initialize services
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Service configurations
  const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
  const SHOPIFY_API_VERSION = '2024-01';
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'taiyaki@taiyaki.ai';

  // Create Gmail transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });

  let designRef = null;
  let design_id = null;

  try {
    const { photo, email, dog_name, designData } = req.body;
    
    if (!photo || !email || !dog_name) {
      return res.status(400).json({ 
        error: 'Photo, email, and dog name are required' 
      });
    }

    console.log('🚀 Starting complete Taiyaki flow for:', { email, dog_name });

    // STEP 1: Upload photo and create design document
    console.log('📸 Step 1: Uploading photo...');
    const uploadResult = await uploadPhotoAndCreateDesign({ photo, email, dog_name, designData }, { db, storage, collection, addDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, uuidv4 });
    designRef = uploadResult.designRef;
    design_id = uploadResult.design_id;
    
    console.log('✅ Step 1 complete:', { design_id, firestore_id: uploadResult.firestore_id });

    // STEP 2: Generate AI render
    console.log('🎨 Step 2: Generating AI render...');
    const renderResult = await generateAndUploadRender(uploadResult.designData, { openai, storage, ref, uploadBytes, getDownloadURL });
    
    await updateDoc(designRef, {
      render_url: renderResult.render_url,
      ai_prompt: renderResult.prompt,
      status: 'rendered',
      rendered_at: new Date()
    });
    
    console.log('✅ Step 2 complete:', { render_url: renderResult.render_url });

    // STEP 3: Create Shopify product
    console.log('🛒 Step 3: Creating Shopify product...');
    const shopifyResult = await createShopifyProduct({
      ...uploadResult.designData,
      render_url: renderResult.render_url
    }, { SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN, SHOPIFY_API_VERSION });
    
    await updateDoc(designRef, {
      shopify_product_id: shopifyResult.product.id,
      shopify_variant_id: shopifyResult.product.variants[0].id,
      product_url: `https://${SHOPIFY_STORE_URL}/products/${shopifyResult.product.handle}`,
      checkout_url: `https://${SHOPIFY_STORE_URL}/cart/${shopifyResult.product.variants[0].id}:1`,
      status: 'ready',
      shopify_created_at: new Date()
    });
    
    console.log('✅ Step 3 complete:', { 
      product_id: shopifyResult.product.id,
      checkout_url: `https://${SHOPIFY_STORE_URL}/cart/${shopifyResult.product.variants[0].id}:1`
    });

    // STEP 4: Send email notification
    console.log('📧 Step 4: Sending email notification...');
    const finalDesignData = {
      ...uploadResult.designData,
      render_url: renderResult.render_url,
      product_url: `https://${SHOPIFY_STORE_URL}/products/${shopifyResult.product.handle}`,
      checkout_url: `https://${SHOPIFY_STORE_URL}/cart/${shopifyResult.product.variants[0].id}:1`
    };
    
    const emailResult = await sendCharmReadyEmail(finalDesignData, { transporter, FROM_EMAIL });
    
    await updateDoc(designRef, {
      email_sent: true,
      email_sent_at: new Date(),
      email_id: emailResult.messageId,
      flow_completed: true,
      flow_completed_at: new Date()
    });
    
    console.log('✅ Step 4 complete:', { email_sent: true });
    console.log('🎉 Complete Taiyaki flow finished successfully!');

    return res.status(200).json({
      success: true,
      design_id,
      firestore_id: uploadResult.firestore_id,
      render_url: renderResult.render_url,
      product_url: finalDesignData.product_url,
      checkout_url: finalDesignData.checkout_url,
      email_sent: true,
      message: 'Complete Taiyaki flow executed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in Taiyaki flow:', error);
    
    // Update design status to error if we have a reference
    if (designRef) {
      try {
        await updateDoc(designRef, {
          status: 'error',
          error_message: error.message,
          error_at: new Date()
        });
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to complete Taiyaki flow',
      details: error.message,
      design_id
    });
  }
}

// STEP 1: Upload photo and create design document
async function uploadPhotoAndCreateDesign({ photo, email, dog_name, designData }, { db, storage, collection, addDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, uuidv4 }) {
  const design_id = uuidv4();
  const timestamp = Date.now();
  
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
  
  return {
    design_id,
    firestore_id: docRef.id,
    designRef: docRef,
    designData: {
      design_id,
      email,
      dog_name,
      photo_url,
      designData
    }
  };
}

// STEP 2: Generate AI render and upload to storage
async function generateAndUploadRender(designData, { openai, storage, ref, uploadBytes, getDownloadURL }) {
  const { dog_name, photo_url, designData: quizData } = designData;
  
  // Create detailed prompt
  let prompt = `Create a beautiful, elegant dog charm design featuring ${dog_name}. `;
  
  // Determine metal type - default to sterling silver if not specified
  let metalType = 'sterling silver';
  
  if (quizData && quizData.responses && quizData.responses.material) {
    const materialMap = {
      'sterling_silver': 'sterling silver',
      'gold_filled': 'gold',
      'solid_gold': 'gold'
    };
    metalType = materialMap[quizData.responses.material] || 'sterling silver';
  }
  
  prompt += `Made in ${metalType} metal only. `;
  
  if (quizData && quizData.responses) {
    const responses = quizData.responses;
    
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
  IMPORTANT: Use ONLY ${metalType} metal finish - no colors, no enamel, no painted details. 
  The design should be monochromatic in ${metalType} tones only.
  Style: clean, professional product photography on white background. 
  The design should capture the essence and personality of the dog while being wearable and elegant. 
  High-quality, detailed, photorealistic rendering with metallic ${metalType} finish only.`;

  // Generate image with OpenAI
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "hd",
    response_format: "b64_json"
  });

  // Upload rendered design to Firebase Storage
  const renderPath = `renders/${designData.email}/${designData.design_id}.png`;
  const renderRef = ref(storage, renderPath);
  
  const renderBuffer = Buffer.from(response.data[0].b64_json, 'base64');
  
  const renderSnapshot = await uploadBytes(renderRef, renderBuffer, {
    contentType: 'image/png'
  });
  
  const render_url = await getDownloadURL(renderSnapshot.ref);
  
  return {
    render_url,
    prompt
  };
}

// STEP 3: Create Shopify product
async function createShopifyProduct(designData, { SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN, SHOPIFY_API_VERSION }) {
  const { dog_name, email, photo_url, render_url, design_id, designData: quizData } = designData;
  
  const productData = {
    product: {
      title: `Custom Dog Charm – ${dog_name}`,
      body_html: `<p>A beautiful custom charm featuring ${dog_name}, designed specifically for you.</p>
                  <p>This unique piece captures the personality and essence of your beloved pet in elegant jewelry form.</p>`,
      vendor: 'Taiyaki Custom Charms',
      product_type: 'Custom Jewelry',
      status: 'active',
      tags: ['taiyaki', 'custom-charm', 'dog-jewelry', 'personalized'],
      images: [{ src: render_url, alt: `Custom charm design for ${dog_name}` }],
      variants: [{
        title: 'Default Title',
        price: '100.00',
        sku: `DOG-CHARM-${design_id}`,
        inventory_management: 'shopify',
        inventory_quantity: 1,
        weight: 10,
        weight_unit: 'g'
      }],
      metafields: [
        { namespace: 'taiyaki', key: 'customer_email', value: email, type: 'single_line_text_field' },
        { namespace: 'taiyaki', key: 'dog_name', value: dog_name, type: 'single_line_text_field' },
        { namespace: 'taiyaki', key: 'design_id', value: design_id, type: 'single_line_text_field' },
        { namespace: 'taiyaki', key: 'original_photo_url', value: photo_url, type: 'url' }
      ]
    }
  };

  const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
}

// STEP 4: Send email notification
async function sendCharmReadyEmail(designData, { transporter, FROM_EMAIL }) {
  const { dog_name, email, render_url, checkout_url, product_url, design_id } = designData;

  const mailOptions = {
    from: `"Taiyaki Custom Charms" <${FROM_EMAIL}>`,
    to: email,
    subject: `Your charm is ready 🐾 – ${dog_name}`,
    html: generateEmailTemplate(designData),
    text: `Your custom charm featuring ${dog_name} is ready! View and purchase it here: ${checkout_url}`
  };

  const result = await transporter.sendMail(mailOptions);
  return { messageId: result.messageId };
}

function generateEmailTemplate(designData) {
  const { dog_name, render_url, checkout_url, product_url } = designData;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Custom Charm is Ready!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Avenir Next', Arial, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
                Your charm is ready! 🐾
            </h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">
                ${dog_name}'s custom charm is waiting for you
            </p>
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <img src="${render_url}" 
                     style="max-width: 300px; width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);" 
                     alt="Your custom ${dog_name} charm">
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="${checkout_url}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; text-decoration: none; padding: 18px 40px; border-radius: 50px; 
                          font-size: 18px; font-weight: 500; letter-spacing: 0.5px; 
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    ✨ View & Buy Now ✨
                </a>
            </div>
            
            <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                        border-radius: 12px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: white; font-size: 24px; font-weight: 300;">
                    Special Price: $100
                </h3>
                <p style="margin: 0; color: white; opacity: 0.9; font-size: 16px;">
                    Limited time offer for custom designs
                </p>
            </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
                Made with ❤️ by Taiyaki Custom Charms
            </p>
        </div>
    </div>
</body>
</html>`;
} 