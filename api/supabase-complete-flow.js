// SUPABASE-INTEGRATED COMPLETE TAIYAKI FLOW
// Tracks all parts of the quiz and design process in Supabase
// Uses Supabase Storage for all file uploads

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
  const { createClient } = await import('@supabase/supabase-js');
  const { v4: uuidv4 } = await import('uuid');
  const OpenAI = (await import('openai')).default;
  const nodemailer = (await import('nodemailer')).default;

  // Initialize Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

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
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });

  let session_id = null;
  let design_id = null;

  try {
    const { formData, imageGenerationPrompts } = req.body;
    
    if (!formData || !formData.email) {
      return res.status(400).json({ 
        error: 'Form data with email is required' 
      });
    }

    // Generate unique IDs
    session_id = uuidv4();
    design_id = uuidv4();

    console.log('🚀 Starting Supabase-only Taiyaki flow:', { session_id, design_id, email: formData.email });

    // Get user info for tracking
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    const referrer = req.headers.referer || '';

    // STEP 1: Create initial quiz session in Supabase
    console.log('📊 Step 1: Creating quiz session in Supabase...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        session_id,
        design_id,
        email: formData.email,
        dog_name: formData.dogName || null,
        status: 'started',
        form_data: formData,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // Track individual quiz responses
    const responses = [];
    for (const [key, value] of Object.entries(formData)) {
      if (key !== 'dogPhotoData' && value !== null && value !== undefined && value !== '') {
        responses.push({
          session_id,
          question_key: key,
          question_value: String(value)
        });
      }
    }

    if (responses.length > 0) {
      const { error: responsesError } = await supabase
        .from('quiz_responses')
        .insert(responses);

      if (responsesError) {
        console.warn('Failed to insert quiz responses:', responsesError.message);
      }
    }

    console.log('✅ Step 1 complete: Session created in Supabase');

    // STEP 2: Upload photo to Supabase Storage
    console.log('📸 Step 2: Uploading photo to Supabase Storage...');
    let photo_url = null;
    
    if (formData.dogPhotoData) {
      const timestamp = Date.now();
      const photoBuffer = Buffer.from(formData.dogPhotoData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const photoPath = `uploads/${formData.email}/${timestamp}.jpg`;
      
      // Upload to Supabase Storage
      const { data: photoUpload, error: photoError } = await supabase.storage
        .from('taiyaki-uploads')
        .upload(photoPath, photoBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (photoError) {
        throw new Error(`Failed to upload photo: ${photoError.message}`);
      }

      // Get public URL
      const { data: photoUrlData } = supabase.storage
        .from('taiyaki-uploads')
        .getPublicUrl(photoPath);
      
      photo_url = photoUrlData.publicUrl;

      // Update session with photo URL
      await supabase
        .from('quiz_sessions')
        .update({
          photo_url,
          photo_uploaded_at: new Date().toISOString(),
          status: 'photo_uploaded'
        })
        .eq('session_id', session_id);
    }

    console.log('✅ Step 2 complete: Photo uploaded to Supabase Storage');

    // STEP 3: Generate AI design
    console.log('🎨 Step 3: Generating AI design...');
    const startTime = Date.now();
    
    // Create design prompt
    let prompt = imageGenerationPrompts?.designPrompt || createDesignPrompt(formData);
    
    const renderResult = await generateAIDesign(prompt, formData.dogPhotoData, { supabase });
    const generationTime = Date.now() - startTime;

    // Update session with render details
    await supabase
      .from('quiz_sessions')
      .update({
        render_url: renderResult.render_url,
        ai_prompt: prompt,
        design_generated_at: new Date().toISOString(),
        status: 'design_generated'
      })
      .eq('session_id', session_id);

    // Track design iteration
    await supabase
      .from('design_iterations')
      .insert({
        session_id,
        iteration_number: 1,
        prompt_used: prompt,
        render_url: renderResult.render_url,
        generation_time_ms: generationTime
      });

    console.log('✅ Step 3 complete: AI design generated and stored in Supabase');

    // STEP 4: Create Shopify product
    console.log('🛒 Step 4: Creating Shopify product...');
    const productData = {
      email: formData.email,
      dog_name: formData.dogName || 'Custom Charm',
      materials: formData.materials || 'sterling-silver',
      render_url: renderResult.render_url,
      design_id
    };

    const shopifyResult = await createShopifyProduct(productData, { SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN, SHOPIFY_API_VERSION });
    
    const product_url = `https://${SHOPIFY_STORE_URL}/products/${shopifyResult.product.handle}`;
    const checkout_url = `https://${SHOPIFY_STORE_URL}/cart/${shopifyResult.product.variants[0].id}:1`;

    // Update session with Shopify details
    await supabase
      .from('quiz_sessions')
      .update({
        shopify_product_id: shopifyResult.product.id.toString(),
        shopify_variant_id: shopifyResult.product.variants[0].id.toString(),
        product_url,
        checkout_url,
        shopify_created_at: new Date().toISOString(),
        status: 'product_created'
      })
      .eq('session_id', session_id);

    console.log('✅ Step 4 complete: Shopify product created');

    // STEP 5: Send email notification
    console.log('📧 Step 5: Sending email notification...');
    const emailData = {
      ...productData,
      product_url,
      checkout_url
    };
    
    const emailResult = await sendCharmReadyEmail(emailData, { transporter, FROM_EMAIL });

    // Update session as completed
    await supabase
      .from('quiz_sessions')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        email_id: emailResult.messageId,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('session_id', session_id);

    console.log('✅ Step 5 complete: Email sent');
    console.log('🎉 Complete Supabase-only flow finished successfully!');

    return res.status(200).json({
      success: true,
      session_id,
      design_id,
      render_url: renderResult.render_url,
      product_url,
      checkout_url,
      email_sent: true,
      message: 'Design processed successfully with Supabase-only storage'
    });
    
  } catch (error) {
    console.error('❌ Error in Supabase-only flow:', error);
    
    // Update session status to error if we have a session_id
    if (session_id) {
      try {
        await supabase
          .from('quiz_sessions')
          .update({
            status: 'error',
            error_message: error.message,
            error_at: new Date().toISOString()
          })
          .eq('session_id', session_id);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to complete design flow',
      details: error.message,
      session_id,
      design_id
    });
  }
}

// Create design prompt based on form data
function createDesignPrompt(formData) {
  let prompt = "";
  
  if (formData.dogPhotoData) {
    prompt += "Create a custom charm that exactly replicates the subject shown in the reference photo. ";
  } else {
    prompt += "Create a custom charm design. ";
  }
  
  // Add material-specific details
  let materialType = "polished reflective sterling silver metal";
  let charmMetal = "silver";
  
  if (formData.materials) {
    if (formData.materials === 'sterling-silver') {
      materialType = "polished reflective sterling silver metal";
      charmMetal = "silver";
    } else if (formData.materials === '14k-gold') {
      materialType = "polished reflective 14K gold metal";
      charmMetal = "gold";
    } else if (formData.materials === 'gold-plated') {
      materialType = "polished reflective gold-plated metal";
      charmMetal = "gold";
    }
  }
  
  prompt += `
  Subject: a ${charmMetal} charm that exactly matches the subject from the reference photo
  Style: high-gloss 3D sculptural metal
  Material: ${materialType}
  Lighting: studio lighting with soft reflections and minimal shadows
  Background: clean transparent background
  Presentation: floating product shot, charm angled to show volume and shine
  Detail: smooth, rounded surfaces with subtle contours, single integrated hook at top
  Camera: close-up, eye-level with a slight tilt
  Requirements: ENTIRE subject must be fully encapsulated within charm boundaries, complete silhouette capturing all key features, single hook (no jump rings), consistent metal finish throughout, EXACT replication of the subject's appearance, distinctive features, and proportions
  `;
  
  return prompt;
}

// Generate AI design using OpenAI and store in Supabase
async function generateAIDesign(prompt, photoData, { supabase }) {
  try {
    // Prepare the input content
    let inputContent = [];
    
    inputContent.push({
      type: "input_text",
      text: prompt
    });
    
    if (photoData) {
      inputContent.push({
        type: "input_image",
        image_url: photoData
      });
    }
    
    const requestBody = {
      model: "gpt-4.1-mini",
      input: [{
        role: "user",
        content: inputContent
      }],
      tools: [{
        type: "image_generation",
        quality: "high",
        size: "1024x1024",
        background: "transparent"
      }]
    };
    
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const imageGenerationCalls = data.output?.filter(output => output.type === "image_generation_call");
    
    if (imageGenerationCalls && imageGenerationCalls.length > 0 && imageGenerationCalls[0].result) {
      const imageBase64 = imageGenerationCalls[0].result;
      
      // Upload to Supabase Storage
      const timestamp = Date.now();
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const imagePath = `renders/${timestamp}.png`;
      
      const { data: imageUpload, error: imageError } = await supabase.storage
        .from('taiyaki-uploads')
        .upload(imagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: false
        });

      if (imageError) {
        throw new Error(`Failed to upload render: ${imageError.message}`);
      }

      // Get public URL
      const { data: imageUrlData } = supabase.storage
        .from('taiyaki-uploads')
        .getPublicUrl(imagePath);
      
      const render_url = imageUrlData.publicUrl;
      
      return { render_url, prompt };
    } else {
      throw new Error('Invalid response format from OpenAI API');
    }
    
  } catch (error) {
    console.error('Error generating AI design:', error);
    throw error;
  }
}

// Create Shopify product
async function createShopifyProduct(designData, { SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN, SHOPIFY_API_VERSION }) {
  const productTitle = `Custom ${designData.dog_name} Charm`;
  const productDescription = `A beautiful custom charm featuring ${designData.dog_name}, handcrafted with attention to detail.`;
  
  // Determine price based on material
  let price = '89.00';
  if (designData.materials === '14k-gold') {
    price = '299.00';
  } else if (designData.materials === 'gold-plated') {
    price = '129.00';
  }

  const product = {
    product: {
      title: productTitle,
      body_html: productDescription,
      vendor: 'Taiyaki',
      product_type: 'Jewelry',
      tags: ['custom', 'charm', 'personalized', 'dog', designData.materials],
      images: [
        {
          src: designData.render_url,
          alt: productTitle
        }
      ],
      variants: [
        {
          title: 'Default Title',
          price: price,
          sku: `CHARM-${designData.design_id}`,
          inventory_management: 'shopify',
          inventory_quantity: 1,
          requires_shipping: true,
          taxable: true
        }
      ]
    }
  };

  const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Send email notification
async function sendCharmReadyEmail(designData, { transporter, FROM_EMAIL }) {
  const subject = `Your Custom ${designData.dog_name} Charm is Ready! 🐕✨`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your Custom Charm is Ready!</h2>
      <p>Hi there!</p>
      <p>Your beautiful custom ${designData.dog_name} charm has been created and is ready for purchase.</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <img src="${designData.render_url}" alt="Your custom charm" style="max-width: 300px; border-radius: 8px;">
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${designData.checkout_url}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Order Your Charm Now</a>
      </div>
      
      <p>You can also view the full product details <a href="${designData.product_url}">here</a>.</p>
      
      <p>Thank you for choosing Taiyaki for your custom jewelry!</p>
      
      <p>Best regards,<br>The Taiyaki Team</p>
    </div>
  `;

  const mailOptions = {
    from: FROM_EMAIL,
    to: designData.email,
    subject: subject,
    html: htmlContent
  };

  return await transporter.sendMail(mailOptions);
} 