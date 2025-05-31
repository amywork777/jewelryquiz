// STEP 4: SEND EMAIL TO USER
// Sends notification emails with charm preview and checkout links

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

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

// Gmail configuration
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
    
    if (designData.status !== 'ready') {
      return res.status(400).json({ 
        error: `Design must be ready first. Current status: ${designData.status}` 
      });
    }

    console.log('Sending email for design:', {
      design_id: designData.design_id,
      dog_name: designData.dog_name,
      email: designData.email
    });

    // Send email
    const emailResult = await sendCharmReadyEmail(designData);
    
    // Update Firestore document
    await updateDoc(designRef, {
      email_sent: true,
      email_sent_at: new Date(),
      email_id: emailResult.messageId || null
    });
    
    console.log('Email sent successfully:', {
      design_id: designData.design_id,
      email: designData.email,
      email_id: emailResult.messageId
    });
    
    return res.status(200).json({
      success: true,
      design_id: designData.design_id,
      email_sent: true,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message
    });
  }
}

async function sendCharmReadyEmail(designData) {
  const { 
    dog_name, 
    email, 
    render_url, 
    checkout_url, 
    product_url,
    design_id 
  } = designData;

  const emailTemplate = generateEmailTemplate(designData);

  // Using Gmail/Nodemailer
  const mailOptions = {
    from: `"Taiyaki Custom Charms" <${FROM_EMAIL}>`,
    to: email,
    subject: `Your charm is ready 🐾 – ${dog_name}`,
    html: emailTemplate,
    text: `Your custom charm featuring ${dog_name} is ready! View and purchase it here: ${checkout_url}`
  };

  const result = await transporter.sendMail(mailOptions);
  return { messageId: result.messageId };
}

function generateEmailTemplate(designData) {
  const { 
    dog_name, 
    render_url, 
    checkout_url, 
    product_url,
    designData: quizData 
  } = designData;

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
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
                Your charm is ready! 🐾
            </h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">
                ${dog_name}'s custom charm is waiting for you
            </p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Charm Preview -->
            <div style="text-align: center; margin-bottom: 40px;">
                <img src="${render_url}" 
                     style="max-width: 300px; width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);" 
                     alt="Your custom ${dog_name} charm">
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${checkout_url}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; text-decoration: none; padding: 18px 40px; border-radius: 50px; 
                          font-size: 18px; font-weight: 500; letter-spacing: 0.5px; 
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); 
                          transition: all 0.3s ease;">
                    ✨ View & Buy Now ✨
                </a>
            </div>
            
            <!-- Product Details -->
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 12px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px; font-weight: 500;">
                    About Your Custom Charm
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
                    <li>Designed specifically for ${dog_name}</li>
                    <li>High-quality materials and craftsmanship</li>
                    <li>Perfect for necklaces or bracelets</li>
                    <li>Unique design that captures your pet's personality</li>
                    <li>Handcrafted with attention to detail</li>
                </ul>
            </div>
            
            ${quizData && quizData.responses ? generateQuizSummary(quizData.responses) : ''}
            
            <!-- Pricing -->
            <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                        border-radius: 12px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: white; font-size: 24px; font-weight: 300;">
                    Special Price: $100
                </h3>
                <p style="margin: 0; color: white; opacity: 0.9; font-size: 16px;">
                    Limited time offer for custom designs
                </p>
            </div>
            
            <!-- Secondary CTA -->
            <div style="text-align: center; margin: 40px 0;">
                <p style="color: #666; margin-bottom: 20px;">
                    Want to see more details first?
                </p>
                <a href="${product_url}" 
                   style="color: #667eea; text-decoration: none; font-weight: 500; border-bottom: 2px solid #667eea;">
                    View Product Page →
                </a>
            </div>
            
            <!-- Footer Info -->
            <div style="border-top: 1px solid #e9ecef; padding-top: 30px; margin-top: 40px;">
                <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
                    Questions? We're here to help!
                </h4>
                <p style="color: #666; margin: 0; line-height: 1.6;">
                    Reply to this email or contact us at 
                    <a href="mailto:support@taiyaki.ai" style="color: #667eea;">support@taiyaki.ai</a>
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                Made with ❤️ by Taiyaki Custom Charms
            </p>
            <p style="margin: 0; color: #999; font-size: 12px;">
                © 2024 Taiyaki. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;
}

function generateQuizSummary(responses) {
  const materialMap = {
    'sterling_silver': 'Sterling Silver',
    'gold_filled': 'Gold-Filled',
    'solid_gold': 'Solid Gold'
  };
  
  const styleMap = {
    'delicate_minimal': 'Delicate & Minimal',
    'statement_bold': 'Bold Statement',
    'classic_timeless': 'Classic & Timeless'
  };

  return `
    <div style="background-color: #e8f4f8; padding: 25px; border-radius: 12px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 500;">
            Your Design Preferences
        </h3>
        <div style="color: #555; line-height: 1.6;">
            ${responses.material ? `<p style="margin: 5px 0;"><strong>Material:</strong> ${materialMap[responses.material] || responses.material}</p>` : ''}
            ${responses.size_presence ? `<p style="margin: 5px 0;"><strong>Style:</strong> ${styleMap[responses.size_presence] || responses.size_presence}</p>` : ''}
            ${responses.inspiration ? `<p style="margin: 5px 0;"><strong>Inspiration:</strong> ${responses.inspiration}</p>` : ''}
            ${responses.symbols ? `<p style="margin: 5px 0;"><strong>Meaningful Elements:</strong> ${responses.symbols}</p>` : ''}
            ${responses.special_details ? `<p style="margin: 5px 0;"><strong>Special Details:</strong> ${responses.special_details}</p>` : ''}
        </div>
    </div>`;
} 