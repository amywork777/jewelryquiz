export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, designData, images } = req.body;
    
    if (!email || !designData) {
      return res.status(400).json({ error: 'Email and design data are required' });
    }

    // Save to database (implement your preferred database here)
    const savedDesign = await saveToDatabase(email, designData, images);
    
    // Send confirmation email
    const emailSent = await sendDesignEmail(email, designData, images);
    
    if (emailSent) {
      return res.status(200).json({ 
        success: true, 
        message: 'Design saved and email sent successfully',
        designId: savedDesign.id
      });
    } else {
      return res.status(500).json({ 
        error: 'Design saved but failed to send email' 
      });
    }
    
  } catch (error) {
    console.error('Error saving design:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

async function saveToDatabase(email, designData, images) {
  // TODO: Implement database saving
  // This could be:
  // - Airtable (simple, no-code database)
  // - Supabase (PostgreSQL with real-time features)
  // - Firebase Firestore
  // - MongoDB Atlas
  // - Simple JSON file storage for MVP
  
  const designRecord = {
    id: generateId(),
    email: email,
    designData: designData,
    images: images,
    created_at: new Date().toISOString(),
    status: 'pending_review'
  };
  
  // For now, just log it (replace with actual database call)
  console.log('Would save to database:', {
    email,
    timestamp: designRecord.created_at,
    journey_type: designData.responses?.journey_type,
    material: designData.responses?.material
  });
  
  return designRecord;
}

async function sendDesignEmail(email, designData, images) {
  // TODO: Implement with your email service (SendGrid, Mailgun, Resend, etc.)
  
  const emailTemplate = generateEmailTemplate(designData, images);
  
  // For now, just log the email content
  console.log('Would send email to:', email);
  console.log('Email subject: Your Custom Charm Design is Being Created! ✨');
  console.log('Email HTML length:', emailTemplate.length);
  
  // Example with SendGrid (uncomment and configure):
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: email,
    from: 'designs@yourjewelrystore.com',
    subject: 'Your Custom Charm Design is Being Created! ✨',
    html: emailTemplate,
  };
  
  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
  */
  
  return true; // Simulate success for now
}

function generateEmailTemplate(designData, images) {
  const responses = designData.responses;
  const journeyType = responses.journey_type === 'A' ? 'Exploratory Design' : 
                     responses.journey_type === 'B' ? 'Idea Refinement' : 'Direct Creation';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Custom Charm Design</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Avenir Next', Arial, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border: 1px solid #e9ecef;">
        <!-- Header -->
        <div style="background-color: #000000; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px;">
                Your Custom Design is Being Created ✨
            </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 25px; line-height: 1.6;">
                Thank you for sharing your vision with us! Our artisans are now crafting your custom charm design based on your preferences.
            </p>
            
            <!-- Design Summary -->
            <div style="background-color: #f8f9fa; padding: 25px; border-left: 4px solid #000000; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 16px; font-weight: 500;">Your Design Summary</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555;">
                    <li style="margin-bottom: 8px;"><strong>Journey Type:</strong> ${journeyType}</li>
                    ${responses.material ? `<li style="margin-bottom: 8px;"><strong>Material:</strong> ${getOptionText(responses.material)}</li>` : ''}
                    ${responses.size_presence ? `<li style="margin-bottom: 8px;"><strong>Style:</strong> ${getOptionText(responses.size_presence)}</li>` : ''}
                    ${responses.inspiration ? `<li style="margin-bottom: 8px;"><strong>Inspiration:</strong> ${responses.inspiration}</li>` : ''}
                    ${responses.symbols ? `<li style="margin-bottom: 8px;"><strong>Meaningful Elements:</strong> ${responses.symbols}</li>` : ''}
                    ${responses.special_details ? `<li style="margin-bottom: 8px;"><strong>Special Details:</strong> ${responses.special_details}</li>` : ''}
                </ul>
            </div>
            
            <!-- Generated Images -->
            ${images && (images.design1 || images.design2) ? `
            <div style="margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 16px; font-weight: 500;">AI-Generated Concepts</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                    These are initial AI concepts based on your preferences. Our artisans will refine these into your final design.
                </p>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    ${images.design1 ? `<img src="${images.design1}" style="width: 200px; height: 200px; object-fit: cover; border: 1px solid #ddd;" alt="Design Concept 1">` : ''}
                    ${images.design2 ? `<img src="${images.design2}" style="width: 200px; height: 200px; object-fit: cover; border: 1px solid #ddd;" alt="Design Concept 2">` : ''}
                </div>
            </div>
            ` : ''}
            
            <!-- Next Steps -->
            <div style="background-color: #e8f4f8; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 16px; font-weight: 500;">What Happens Next?</h3>
                <ol style="margin: 0; padding-left: 20px; color: #555;">
                    <li style="margin-bottom: 10px;">Our design team reviews your preferences and creates detailed mockups</li>
                    <li style="margin-bottom: 10px;">You'll receive your custom design mockup within 24-48 hours</li>
                    <li style="margin-bottom: 10px;">We'll work with you to perfect every detail before crafting</li>
                    <li>Your finished charm will be handcrafted and shipped to you</li>
                </ol>
            </div>
            
            <!-- Contact -->
            <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #e9ecef;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                    Questions? Reply to this email or contact us at 
                    <a href="mailto:support@yourjewelrystore.com" style="color: #000000;">support@yourjewelrystore.com</a>
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #666; font-size: 12px;">
                © 2024 Your Jewelry Store. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;
}

function getOptionText(value) {
  const mapping = {
    'subtle': 'Subtle & delicate',
    'bold-sculptural': 'Bold & sculptural', 
    'classic': 'Classic & balanced',
    'not-sure': 'Not sure yet',
    '14k-gold': '14K Solid Gold',
    'sterling-silver': 'Sterling Silver (925)',
    'gold-plated': 'Gold-Plated Silver',
    'help-decide': 'Help me decide'
  };
  return mapping[value] || value;
}

function generateId() {
  return 'design_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
} 