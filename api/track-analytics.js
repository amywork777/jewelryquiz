// Analytics Tracking API Endpoint
// Receives and stores user interaction events in Supabase

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
    // Dynamic import for Vercel compatibility
    const { createClient } = await import('@supabase/supabase-js');

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { events } = req.body;
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        error: 'Events array is required' 
      });
    }

    // Validate and clean events
    const validEvents = events.filter(event => {
      return event.session_id && 
             event.event_type && 
             event.timestamp;
    }).map(event => ({
      session_id: event.session_id,
      event_type: event.event_type,
      event_data: event.event_data || {},
      page_url: event.event_data?.page_url || null,
      timestamp: event.timestamp
    }));

    if (validEvents.length === 0) {
      return res.status(400).json({ 
        error: 'No valid events found' 
      });
    }

    // Insert events into Supabase
    const { data, error } = await supabase
      .from('user_analytics')
      .insert(validEvents);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to store analytics events',
        details: error.message 
      });
    }

    console.log(`📊 Stored ${validEvents.length} analytics events`);

    return res.status(200).json({
      success: true,
      events_stored: validEvents.length,
      message: 'Analytics events stored successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in analytics tracking:', error);
    
    return res.status(500).json({ 
      error: 'Failed to process analytics events',
      details: error.message
    });
  }
} 