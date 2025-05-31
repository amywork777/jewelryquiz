// STEP 3: CREATE PRODUCT IN SHOPIFY (Backend)
// Creates Shopify products with metafields and generates checkout URLs

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

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

// Shopify configuration
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL; // e.g., 'your-store.myshopify.com'
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = '2024-01';

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
    
    if (designData.status !== 'rendered') {
      return res.status(400).json({ 
        error: `Design must be rendered first. Current status: ${designData.status}` 
      });
    }

    console.log('Creating Shopify product for design:', {
      design_id: designData.design_id,
      dog_name: designData.dog_name,
      email: designData.email
    });

    // Create Shopify product
    const shopifyProduct = await createShopifyProduct(designData);
    
    // Update Firestore document
    await updateDoc(designRef, {
      shopify_product_id: shopifyProduct.product.id,
      shopify_variant_id: shopifyProduct.product.variants[0].id,
      product_url: `https://${SHOPIFY_STORE_URL}/products/${shopifyProduct.product.handle}`,
      checkout_url: `https://${SHOPIFY_STORE_URL}/cart/${shopifyProduct.product.variants[0].id}:1`,
      status: 'ready',
      shopify_created_at: new Date()
    });
    
    console.log('Shopify product created successfully:', {
      design_id: designData.design_id,
      product_id: shopifyProduct.product.id,
      product_url: `https://${SHOPIFY_STORE_URL}/products/${shopifyProduct.product.handle}`
    });
    
    return res.status(200).json({
      success: true,
      design_id: designData.design_id,
      shopify_product_id: shopifyProduct.product.id,
      product_url: `https://${SHOPIFY_STORE_URL}/products/${shopifyProduct.product.handle}`,
      checkout_url: `https://${SHOPIFY_STORE_URL}/cart/${shopifyProduct.product.variants[0].id}:1`,
      message: 'Shopify product created successfully'
    });
    
  } catch (error) {
    console.error('Error creating Shopify product:', error);
    return res.status(500).json({ 
      error: 'Failed to create Shopify product',
      details: error.message
    });
  }
}

async function createShopifyProduct(designData) {
  const { dog_name, email, photo_url, render_url, design_id, designData: quizData } = designData;
  
  // Prepare product data
  const productData = {
    product: {
      title: `Custom Dog Charm – ${dog_name}`,
      body_html: `<p>A beautiful custom charm featuring ${dog_name}, designed specifically for you.</p>
                  <p>This unique piece captures the personality and essence of your beloved pet in elegant jewelry form.</p>
                  <p><strong>Features:</strong></p>
                  <ul>
                    <li>Custom design based on your dog's photo</li>
                    <li>High-quality materials</li>
                    <li>Perfect for necklaces or bracelets</li>
                    <li>Handcrafted with attention to detail</li>
                  </ul>`,
      vendor: 'Taiyaki Custom Charms',
      product_type: 'Custom Jewelry',
      status: 'active',
      tags: ['taiyaki', 'custom-charm', 'dog-jewelry', 'personalized'],
      images: [
        {
          src: render_url,
          alt: `Custom charm design for ${dog_name}`
        }
      ],
      variants: [
        {
          title: 'Default Title',
          price: '100.00',
          sku: `DOG-CHARM-${design_id}`,
          inventory_management: 'shopify',
          inventory_quantity: 1,
          weight: 10, // grams
          weight_unit: 'g'
        }
      ],
      metafields: [
        {
          namespace: 'taiyaki',
          key: 'customer_email',
          value: email,
          type: 'single_line_text_field'
        },
        {
          namespace: 'taiyaki',
          key: 'dog_name',
          value: dog_name,
          type: 'single_line_text_field'
        },
        {
          namespace: 'taiyaki',
          key: 'design_id',
          value: design_id,
          type: 'single_line_text_field'
        },
        {
          namespace: 'taiyaki',
          key: 'original_photo_url',
          value: photo_url,
          type: 'url'
        }
      ]
    }
  };
  
  // Add quiz data to metafields if available
  if (quizData && quizData.responses) {
    const responses = quizData.responses;
    
    if (responses.material) {
      productData.product.metafields.push({
        namespace: 'taiyaki',
        key: 'material_preference',
        value: responses.material,
        type: 'single_line_text_field'
      });
    }
    
    if (responses.size_presence) {
      productData.product.metafields.push({
        namespace: 'taiyaki',
        key: 'style_preference',
        value: responses.size_presence,
        type: 'single_line_text_field'
      });
    }
    
    if (responses.inspiration) {
      productData.product.metafields.push({
        namespace: 'taiyaki',
        key: 'inspiration',
        value: responses.inspiration,
        type: 'multi_line_text_field'
      });
    }
    
    if (responses.symbols) {
      productData.product.metafields.push({
        namespace: 'taiyaki',
        key: 'meaningful_elements',
        value: responses.symbols,
        type: 'multi_line_text_field'
      });
    }
    
    if (responses.special_details) {
      productData.product.metafields.push({
        namespace: 'taiyaki',
        key: 'special_details',
        value: responses.special_details,
        type: 'multi_line_text_field'
      });
    }
  }

  // Make API call to Shopify
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

  const result = await response.json();
  return result;
} 