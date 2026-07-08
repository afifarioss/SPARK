import crypto from 'crypto';

// ============================================
// CONFIG
// ============================================
const NEYNAR_WEBHOOK_SECRET = process.env.NEYNAR_WEBHOOK_SECRET;
if (!NEYNAR_WEBHOOK_SECRET) {
  console.warn('NEYNAR_WEBHOOK_SECRET not set — webhook verification disabled');
}

// Simple in-memory spark cache (replace with Redis in production)
const recentSparks = [];
const MAX_SPARKS = 100;

// ============================================
// WEBHOOK HANDLER
// ============================================
export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify webhook signature (security)
    const signature = req.headers['x-neynar-signature'];
    if (NEYNAR_WEBHOOK_SECRET && signature) {
      const isValid = verifySignature(req.body, signature, NEYNAR_WEBHOOK_SECRET);
      if (!isValid) {
        console.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // 2. Parse the event
    const event = req.body;
    console.log('Webhook received:', event.type);

    // 3. Handle cast.created events
    if (event.type === 'cast.created') {
      const cast = event.data;
      await processNewCast(cast);
    }

    // 4. Acknowledge receipt immediately
    res.status(200).json({ success: true, processed: event.type });

  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 so Neynar doesn't retry forever
    res.status(200).json({ success: false, error: error.message });
  }
}

// ============================================
// SIGNATURE VERIFICATION
// ============================================
function verifySignature(body, signature, secret) {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(body));
    const expected = hmac.digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch (e) {
    return false;
  }
}

// ============================================
// PROCESS NEW CAST (Real-time SPARK)
// ============================================
async function processNewCast(cast) {
  const spark = new SparkRealtime();
  
  // Quick scan: is this cast alpha-worthy?
  const channel = cast.channel?.id || 'unknown';
  const text = cast.text || '';
  
  // Only process monitored channels
  const monitoredChannels = ['base', 'degen', 'clanker', 'crypto', 'nft'];
  if (!monitoredChannels.includes(channel)) return;

  // Quick alpha score (no API calls needed for speed)
  const alphaScore = spark.quickAlphaScore(text, channel);
  
  if (alphaScore > 30) {
    // Deep analysis (async, non-blocking)
    spark.deepAnalyze(cast).then(result => {
      if (result.totalScore > 50) {
        // Store in memory cache
        const sparkData = {
          ...result,
          receivedAt: new Date().toISOString(),
          webhook: true
        };
        recentSparks.unshift(sparkData);
        if (recentSparks.length > MAX_SPARKS) recentSparks.pop();
        
        console.log(`🔥 SPARK detected: ${result.author} in /${channel} — Score: ${result.totalScore}`);
      }
    });
  }
}

// ============================================
// REALTIME SPARK CLASS (Lightweight)
// ============================================
class SparkRealtime {
  quickAlphaScore(text, channel) {
    const keywords = {
      'base': ['base', 'nft', 'mint', 'frame', 'build'],
      'degen': ['token', 'meme', 'airdrop', 'trade', 'pump'],
      'clanker': ['clanker', 'agent', 'ai', 'bot'],
      'crypto': ['bitcoin', 'eth', 'defi', 'layer2'],
      'nft': ['art', 'mint', 'drop', 'whitelist']
    };
    
    const words = keywords[channel] || [];
    let score = 0;
    const lower = text.toLowerCase();
    
    words.forEach(w => { if (lower.includes(w)) score += 5; });
    
    const indicators = ['🚀', '💎', 'alpha', 'early', 'gem', '🔥', '⚡'];
    indicators.forEach(i => { if (lower.includes(i)) score += 3; });
    
    const tokens = text.match(/\$[A-Z]{2,5}/g);
    if (tokens) score += tokens.length * 2;
    
    return Math.min(score, 100);
  }

  async deepAnalyze(cast) {
    // Lightweight analysis without Neynar API calls
    // (to keep webhook response fast)
    const text = cast.text || '';
    const sentiment = this.analyzeSentiment(text);
    const mentions = this.extractMentions(text);
    
    return {
      author: cast.author?.username || 'unknown',
      fid: cast.author?.fid,
      text: text.substring(0, 200),
      alphaScore: this.quickAlphaScore(text, cast.channel?.id),
      totalScore: 50 + Math.random() * 30, // Placeholder — replace with real scoring
      sentiment: this.getSentimentLabel(sentiment),
      mentions: mentions,
      hasFrame: cast.frames && cast.frames.length > 0,
      channel: `/${cast.channel?.id || 'unknown'}`,
      timestamp: cast.timestamp,
      sparkId: this.generateSparkId()
    };
  }

  analyzeSentiment(text) {
    const pos = ['🚀', '💎', 'bull', 'buy', 'moon', 'alpha', '🔥', '⚡'];
    const neg = ['💀', 'bear', 'sell', 'dump', 'scam', 'rug', '🚨'];
    let score = 0;
    const lower = (text || '').toLowerCase();
    pos.forEach(w => { if (lower.includes(w)) score += 2; });
    neg.forEach(w => { if (lower.includes(w)) score -= 2; });
    return Math.max(-10, Math.min(10, score));
  }

  getSentimentLabel(score) {
    if (score > 3) return 'Ignited 🟢';
    if (score > 0) return 'Warm 📈';
    if (score === 0) return 'Neutral ⚪';
    if (score > -3) return 'Caution ⚠️';
    return 'Alert 🔴';
  }

  extractMentions(text) {
    const mentions = [];
    const tokens = (text || '').match(/\$[A-Z]{2,5}/g);
    if (tokens) mentions.push(...tokens);
    const users = (text || '').match(/@[a-zA-Z0-9_]+/g);
    if (users) mentions.push(...users);
    return mentions;
  }

  generateSparkId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'SPARK-';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}
