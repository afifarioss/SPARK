import express from 'express';
import crypto from 'crypto';
import 'dotenv/config';

// ============================================
// CONFIG
// ============================================
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.NEYNAR_WEBHOOK_SECRET;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

if (!WEBHOOK_SECRET) {
  console.warn('⚠️  NEYNAR_WEBHOOK_SECRET not set — webhooks will fail verification');
}

// In-memory spark store (replace with Redis for production)
const liveSparks = [];
const MAX_SPARKS = 500;

// Monitored channels
const MONITORED = ['base', 'degen', 'clanker', 'crypto', 'nft'];

const app = express();

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.json({
    name: 'SPARK Realtime Engine',
    version: '1.2.0',
    status: '🔥 Ignited',
    sparksCached: liveSparks.length,
    monitoredChannels: MONITORED
  });
});

// ============================================
// WEBHOOK ENDPOINT (Raw body for HMAC)
// ============================================
app.post('/webhooks/neynar', 
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-neynar-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing X-Neynar-Signature' });
    }

    // Verify HMAC-SHA512
    const rawBody = req.body; // Buffer
    const expected = crypto
      .createHmac('sha512', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'hex');

    const isValid = 
      sigBuf.length === expBuf.length && 
      crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse and handle async (respond fast)
    const event = JSON.parse(rawBody.toString('utf8'));
    
    handleEvent(event).catch(err => 
      console.error('Webhook handler error:', err)
    );

    res.status(200).json({ success: true, received: event.type });
  }
);

// ============================================
// EVENT HANDLER (SPARK Logic)
// ============================================
async function handleEvent(event) {
  switch (event.type) {
    case 'cast.created': {
      const cast = event.data;
      const channel = cast.channel?.id;
      
      // Only process monitored channels
      if (!MONITORED.includes(channel)) return;
      
      // Real-time alpha detection
      const spark = await detectSpark(cast, channel);
      
      if (spark && spark.totalScore > 50) {
        liveSparks.unshift(spark);
        if (liveSparks.length > MAX_SPARKS) liveSparks.pop();
        
        console.log(`🔥 [${channel}] @${spark.author}: ${spark.totalScore} pts — ${spark.text.substring(0, 60)}...`);
        
        // TODO: Post to Farcaster, send notification, etc.
      }
      break;
    }
    
    case 'reaction.created': {
      // Boost existing spark scores based on reactions
      const { reaction } = event.data;
      boostSparkEngagement(reaction.target_cast_hash);
      break;
    }
    
    default:
      console.log('Unhandled:', event.type);
  }
}

// ============================================
// SPARK REALTIME ENGINE
// ============================================
async function detectSpark(cast, channel) {
  const text = cast.text || '';
  const author = cast.author?.username || 'unknown';
  const fid = cast.author?.fid;
  
  // Quick alpha score (no API calls = fast)
  const alphaScore = calcAlphaScore(text, channel);
  
  // Skip low-signal casts immediately
  if (alphaScore < 20) return null;
  
  // Sentiment analysis
  const sentiment = analyzeSentiment(text);
  
  // Engagement boost from cast itself
  const engagement = (cast.reactions?.count || 0) + 
                    (cast.replies?.count || 0) * 2 + 
                    (cast.recasts?.count || 0) * 1.5;
  
  // Total score
  const totalScore = (alphaScore * 0.5) + 
                    (Math.abs(sentiment) * 3) + 
                    (Math.min(engagement / 10, 10));
  
  if (totalScore < 50) return null;
  
  return {
    sparkId: generateSparkId(),
    author,
    fid,
    text: text.substring(0, 200),
    channel: `/${channel}`,
    alphaScore: Math.round(alphaScore),
    totalScore: Math.round(totalScore),
    sentiment: getSentimentLabel(sentiment),
    mentions: extractMentions(text),
    hasFrame: cast.frames && cast.frames.length > 0,
    frameAction: detectFrameAction(text),
    timestamp: cast.timestamp,
    castHash: cast.hash,
    receivedAt: new Date().toISOString()
  };
}

function calcAlphaScore(text, channel) {
  const keywords = {
    'base': ['base', 'nft', 'mint', 'frame', 'build', 'onchain', 'creator'],
    'degen': ['token', 'meme', 'airdrop', 'trade', 'pump', 'farm', 'yield'],
    'clanker': ['clanker', 'agent', 'ai', 'bot', 'automation', 'virtuals'],
    'crypto': ['bitcoin', 'eth', 'defi', 'layer2', 'btc', 'protocol'],
    'nft': ['art', 'mint', 'drop', 'whitelist', 'reveal', 'collectible']
  };
  
  const words = keywords[channel] || [];
  let score = 0;
  const lower = text.toLowerCase();
  
  words.forEach(w => { if (lower.includes(w)) score += 5; });
  
  const indicators = ['🚀', '💎', 'alpha', 'early', 'gem', '🔥', '⚡', '👀', '💰'];
  indicators.forEach(i => { if (lower.includes(i)) score += 4; });
  
  const tokens = text.match(/\$[A-Z]{2,5}/g);
  if (tokens) score += tokens.length * 3;
  
  return Math.min(score, 100);
}

function analyzeSentiment(text) {
  const pos = ['🚀', '💎', 'bull', 'buy', 'moon', 'alpha', '🔥', '⚡', '👀'];
  const neg = ['💀', 'bear', 'sell', 'dump', 'scam', 'rug', '🚨', '❌'];
  let score = 0;
  const lower = (text || '').toLowerCase();
  pos.forEach(w => { if (lower.includes(w)) score += 2; });
  neg.forEach(w => { if (lower.includes(w)) score -= 2; });
  return Math.max(-10, Math.min(10, score));
}

function getSentimentLabel(score) {
  if (score > 3) return 'Ignited 🟢';
  if (score > 0) return 'Warm 📈';
  if (score === 0) return 'Neutral ⚪';
  if (score > -3) return 'Caution ⚠️';
  return 'Alert 🔴';
}

function extractMentions(text) {
  const m = [];
  const tokens = (text || '').match(/\$[A-Z]{2,5}/g);
  if (tokens) m.push(...tokens);
  const users = (text || '').match(/@[a-zA-Z0-9_]+/g);
  if (users) m.push(...users);
  return m;
}

function detectFrameAction(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('mint') || lower.includes('claim')) return 'mint';
  if (lower.includes('buy') || lower.includes('trade') || lower.includes('swap')) return 'trade';
  if (lower.includes('vote') || lower.includes('poll')) return 'vote';
  return 'interact';
}

function generateSparkId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'SPARK-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function boostSparkEngagement(castHash) {
  const spark = liveSparks.find(s => s.castHash === castHash);
  if (spark) {
    spark.totalScore = Math.round(spark.totalScore * 1.1); // +10% per reaction
    spark.boosted = true;
  }
}

// ============================================
// API ROUTES (JSON parsing enabled here)
// ============================================
app.use(express.json());

// Get live sparks
app.get('/api/sparks/live', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const channel = req.query.channel;
  
  let sparks = liveSparks;
  if (channel) {
    sparks = sparks.filter(s => s.channel === `/${channel}`);
  }
  
  res.json({
    success: true,
    count: sparks.length,
    sparks: sparks.slice(0, limit),
    timestamp: new Date().toISOString()
  });
});

// Get spark stats
app.get('/api/stats', (req, res) => {
  const byChannel = {};
  liveSparks.forEach(s => {
    byChannel[s.channel] = (byChannel[s.channel] || 0) + 1;
  });
  
  res.json({
    success: true,
    totalSparks: liveSparks.length,
    byChannel,
    lastSpark: liveSparks[0]?.receivedAt || null,
    uptime: process.uptime()
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
🔥 SPARK Realtime Engine v1.2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server: http://localhost:${PORT}
Webhook: POST http://localhost:${PORT}/webhooks/neynar
API: GET http://localhost:${PORT}/api/sparks/live
Stats: GET http://localhost:${PORT}/api/stats

Monitored: ${MONITORED.map(c => '/' + c).join(', ')}

Set NEYNAR_WEBHOOK_SECRET to verify webhooks.
Run with: node server.js
  `);
});
