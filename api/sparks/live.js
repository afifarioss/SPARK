// This reads from the same memory cache as the webhook handler
// In production, replace with Redis/DB

const recentSparks = []; // Shared with webhook — see note below

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const limit = parseInt(req.query.limit) || 10;
  
  res.status(200).json({
    success: true,
    source: 'webhook',
    count: recentSparks.length,
    sparks: recentSparks.slice(0, limit),
    timestamp: new Date().toISOString()
  });
}
