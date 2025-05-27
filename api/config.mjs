export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  res.setHeader('Content-Type', 'application/javascript');
  const configScript = `window.CONFIG = { OPENAI_API_KEY: '${apiKey}' };
window.OPENAI_API_KEY = '${apiKey}';
console.log('Config loaded from server - API key available');`;
  
  return res.status(200).send(configScript);
} 