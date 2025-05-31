import OpenAI from 'openai';

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
    const { prompt, photoData } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required' 
      });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('Generating image with prompt:', prompt.substring(0, 100) + '...');

    // Generate image with OpenAI DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json"
    });

    const imageData = `data:image/png;base64,${response.data[0].b64_json}`;
    
    console.log('Image generated successfully');
    
    return res.status(200).json({
      success: true,
      imageData: imageData,
      message: 'Image generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid request to OpenAI API',
        details: error.message
      });
    } else if (error.status === 401) {
      return res.status(500).json({ 
        error: 'OpenAI API authentication failed',
        details: 'Invalid API key'
      });
    } else if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        details: 'Too many requests to OpenAI API'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message
    });
  }
} 