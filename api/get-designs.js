export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get designs from database
    const designs = await getDesignsByEmail(email);
    
    return res.status(200).json({ 
      success: true,
      email: email,
      designs: designs,
      count: designs.length
    });
    
  } catch (error) {
    console.error('Error retrieving designs:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

async function getDesignsByEmail(email) {
  // TODO: Implement database query
  // This would query your database for all designs by this email
  // For now, return mock data structure
  
  console.log('Would query database for designs by email:', email);
  
  // Mock response structure - replace with actual database query
  const mockDesigns = [
    {
      id: 'design_1234567890_abc123',
      email: email,
      created_at: '2024-01-15T10:30:00Z',
      status: 'completed',
      journey_type: 'A',
      material: 'sterling-silver',
      style: 'classic',
      has_images: true,
      summary: 'Elegant heart charm with meaningful symbols'
    }
  ];
  
  // In a real implementation, this would be something like:
  /*
  const designs = await db.collection('designs')
    .where('email', '==', email)
    .orderBy('created_at', 'desc')
    .limit(50)
    .get();
  
  return designs.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  */
  
  return mockDesigns;
} 