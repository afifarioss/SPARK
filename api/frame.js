// Farcaster Frame Meta Tags + Simple UI
export default function handler(req, res) {
  const { channel = 'base' } = req.query;
  
  const imageUrl = `https://your-app.vercel.app/api/frame-image?channel=${channel}`;
  
  // Frame HTML with proper meta tags
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:button:1" content="🔥 Ignite ${channel}" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:1:target" content="https://your-app.vercel.app/api/frame-action?channel=${channel}" />
  <meta property="fc:frame:button:2" content="📊 Reputation" />
  <meta property="fc:frame:button:2:action" content="post" />
  <meta property="fc:frame:button:2:target" content="https://your-app.vercel.app/api/frame-reputation" />
  <title>SPARK - Farcaster Intelligence</title>
  <style>
    body { font-family: monospace; background: #0a0a0a; color: #fff; text-align: center; padding: 40px; }
    h1 { color: #ff6b35; }
    .badge { background: #ff6b35; color: #000; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🔥 SPARK</h1>
  <p>Farcaster Intelligence Engine</p>
  <span class="badge">Channel: /${channel}</span>
  <p>Frame loaded. Interact via Warpcast.</p>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
