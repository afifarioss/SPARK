import axios from 'axios';

// ============================================
// CONFIG - No fallback key. Must set in Vercel.
// ============================================
const API_KEY = process.env.NEYNAR_API_KEY;
if (!API_KEY) {
  throw new Error('NEYNAR_API_KEY is required. Add it in Vercel Environment Variables.');
}

const NEYNAR_URL = 'https://api.neynar.com/v2';

// Simple in-memory cache (resets on cold start, good enough for MVP)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ============================================
// API HANDLER
// ============================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const spark = new Spark();
    const result = await spark.ignite();
    
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('SPARK ERROR:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check NEYNAR_API_KEY in Vercel dashboard'
    });
  }
}

// ============================================
// 🔥 SPARK CORE - Fixed & Optimized
// ============================================

class Spark {
  constructor() {
    this.channels = ['base', 'degen', 'clanker', 'crypto', 'nft'];
    this.igniteThreshold = 50;
    this.version = '1.1.0';
  }

  async ignite() {
    const allSparks = [];
    let totalSparks = 0;

    for (const channel of this.channels) {
      try {
        const result = await this.scanChannel(channel);
        totalSparks += result.count;
        if (result.sparks.length > 0) {
          allSparks.push({
            channel: `/${channel}`,
            sparks: result.sparks,
            count: result.count
          });
        }
        // Small delay to avoid Neynar rate limits
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Channel ${channel} failed:`, err.message);
      }
    }

    return {
      summary: {
        channelsScanned: this.channels.length,
        channelsIgnited: allSparks.length,
        totalSparks: totalSparks,
        version: this.version
      },
      sparks: allSparks,
      timestamp: new Date().toISOString(),
      message: '💎 "Don\'t just consume alpha. SPARK it."'
    };
  }

  async scanChannel(channel) {
    const cacheKey = `channel_${channel}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const casts = await this.getChannelCasts(channel, 50);
    const sparks = [];

    for (const cast of casts) {
      try {
        // Batch reputation calls with cache
        const reputation = await this.getCachedReputation(cast.author.fid);
        const alphaScore = this.calcAlphaScore(cast.text, channel);
        const sentiment = this.analyzeSentiment(cast.text);
        const mentions = this.extractMentions(cast.text);
        const frameData = this.detectFrames(cast);
        const engagementBoost = this.calcEngagementBoost(cast);

        // FIXED: Sentiment absolute value (controversy = attention)
        // Rug warnings and hype both score high
        const totalScore = (alphaScore * 0.40) + 
                          (reputation.score * 0.30) + 
                          (Math.abs(sentiment) * 2.5) +  // -10 to 10 → 0 to 25
                          (engagementBoost * 0.15);

        if (totalScore > this.igniteThreshold) {
          sparks.push({
            author: cast.author.username || 'unknown',
            fid: cast.author.fid,
            reputation: reputation,
            text: (cast.text || '').substring(0, 200),
            alphaScore: Math.round(alphaScore),
            totalScore: Math.round(totalScore),
            sentiment: this.getSentimentLabel(sentiment),
            mentions: mentions,
            hasFrame: frameData.hasFrame,
            frameAction: frameData.action,
            channel: `/${channel}`,
            timestamp: cast.timestamp,
            sparkId: this.generateSparkId()
          });
        }
      } catch (err) {
        // Skip bad casts, keep scanning
        continue;
      }
    }

    sparks.sort((a, b) => b.totalScore - a.totalScore);
    
    const result = {
      channel: `/${channel}`,
      sparks: sparks.slice(0, 5),
      count: sparks.length
    };

    setCache(cacheKey, result);
    return result;
  }

  // ============================================
  // REPUTATION ENGINE (with cache)
  // ============================================
  
  async getCachedReputation(fid) {
    const cacheKey = `rep_${fid}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    
    const rep = await this.calculateFIDReputation(fid);
    setCache(cacheKey, rep);
    return rep;
  }

  async calculateFIDReputation(fid) {
    try {
      const [followers, following, casts] = await Promise.all([
        this.getFollowers(fid),
        this.getFollowing(fid),
        this.getUserCasts(fid)
      ]);

      let score = 0;
      const engagementRate = this.calcEngagementRate(casts);
      const networkDensity = this.calcNetworkDensity(followers, following);
      const contentQuality = this.analyzeContentQuality(casts);
      const channelDiversity = this.calcChannelDiversity(casts);

      score = (engagementRate * 0.30) + 
              (networkDensity * 0.25) + 
              (contentQuality * 0.25) + 
              (channelDiversity * 0.20);

      // Channel expert multipliers
      if (this.isChannelExpert(casts, 'base')) score *= 1.15;
      if (this.isChannelExpert(casts, 'degen')) score *= 1.10;

      return {
        fid,
        score: Math.round(score * 100),
        engagementRate: Math.round(engagementRate * 100),
        networkDensity: Math.round(networkDensity * 100),
        contentQuality: Math.round(contentQuality * 100),
        channelDiversity: Math.round(channelDiversity * 100),
        trustLevel: this.getTrustLevel(score)
      };
    } catch (error) {
      return { fid, score: 0, trustLevel: 'Unknown' };
    }
  }

  // ============================================
  // NEYNAR API CALLS (Fixed endpoints)
  // ============================================

  async neynarGet(endpoint, params = {}) {
    const res = await axios.get(`${NEYNAR_URL}${endpoint}`, {
      params,
      headers: { 'x-api-key': API_KEY },
      timeout: 10000
    });
    return res.data;
  }

  async getFollowers(fid) {
    try {
      const data = await this.neynarGet('/farcaster/followers', { fid, limit: 100 });
      return data.users || [];
    } catch (e) {
      return [];
    }
  }

  async getFollowing(fid) {
    try {
      const data = await this.neynarGet('/farcaster/following', { fid, limit: 100 });
      return data.users || [];
    } catch (e) {
      return [];
    }
  }

  async getUserCasts(fid) {
    try {
      const data = await this.neynarGet('/farcaster/casts', { fid, limit: 50 });
      return data.casts || [];
    } catch (e) {
      return [];
    }
  }

  async getChannelCasts(channel, limit = 50) {
    try {
      // FIXED: Correct Neynar v2 feed params
      const data = await this.neynarGet('/farcaster/feed', {
        feed_type: 'filter',
        filter_type: 'channel_id',
        channel_id: channel,
        limit: limit
      });
      return data.casts || [];
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // SCORING ALGORITHMS
  // ============================================

  calcAlphaScore(text, channel) {
    const channelKeywords = {
      'base': ['base', 'nft', 'mint', 'collection', 'art', 'creator', 'frame', 'build', 'onchain'],
      'degen': ['token', 'meme', 'airdrop', 'farm', 'liquidity', 'trade', 'yield', 'pump'],
      'clanker': ['clanker', 'agent', 'ai', 'autonomous', 'bot', 'automation', 'spark', 'virtuals'],
      'crypto': ['bitcoin', 'eth', 'layer2', 'defi', 'protocol', 'governance', 'btc'],
      'nft': ['art', 'collectible', 'rarity', 'mint', 'whitelist', 'reveal', 'drop']
    };

    const keywords = channelKeywords[channel] || [];
    let score = 0;
    const textLower = (text || '').toLowerCase();

    // Alpha indicators (emojis & keywords)
    const alphaIndicators = ['🚀', '💎', 'alpha', 'early', 'undervalued', 'gem', 'next', '🔥', '⚡', '👀', '💰'];
    alphaIndicators.forEach(word => {
      if (textLower.includes(word)) score += 5;
    });

    // Channel keywords
    keywords.forEach(word => {
      if (textLower.includes(word)) score += 3;
    });

    // Token tickers
    const priceMatches = text.match(/\$[A-Z]{2,5}/g);
    if (priceMatches) score += priceMatches.length * 4;

    return Math.min(score, 100);
  }

  analyzeSentiment(text) {
    const positive = ['🚀', '💎', 'bull', 'buy', 'moon', 'gain', 'profit', 'alpha', '🔥', '⚡', '👀'];
    const negative = ['💀', 'bear', 'sell', 'dump', 'scam', 'rug', 'waste', 'lose', '🚨', '❌'];
    let score = 0;
    const textLower = (text || '').toLowerCase();
    
    positive.forEach(word => { 
      if (textLower.includes(word)) score += 2; 
    });
    negative.forEach(word => { 
      if (textLower.includes(word)) score -= 2; 
    });
    
    return Math.max(-10, Math.min(10, score));
  }

  getSentimentLabel(score) {
    if (score > 3) return 'Ignited 🟢';
    if (score > 0) return 'Warm 📈';
    if (score === 0) return 'Neutral ⚪';
    if (score > -3) return 'Caution ⚠️';
    return 'Alert 🔴';
  }

  calcEngagementRate(casts) {
    if (!casts || casts.length === 0) return 0;
    let totalEngagement = 0;
    casts.forEach(cast => {
      totalEngagement += (cast.reactions?.count || 0) + 
                        (cast.replies?.count || 0) + 
                        (cast.recasts?.count || 0);
    });
    return Math.min(totalEngagement / (casts.length * 10), 1);
  }

  calcNetworkDensity(followers, following) {
    const total = followers.length + following.length;
    if (total === 0) return 0;
    const density = followers.length / (following.length + 1);
    return Math.min(density / 10, 1);
  }

  analyzeContentQuality(casts) {
    if (!casts || casts.length === 0) return 0;
    let quality = 0;
    casts.forEach(cast => {
      const text = cast.text || '';
      if (text.length > 100) quality += 2;
      if (text.includes('?')) quality += 1;
      if (text.match(/https?:\/\/[^\s]+/g)) quality += 1;
    });
    return Math.min(quality / (casts.length * 4), 1);
  }

  calcChannelDiversity(casts) {
    if (!casts || casts.length === 0) return 0;
    const channels = new Set();
    casts.forEach(cast => {
      if (cast.channel?.id) channels.add(cast.channel.id);
    });
    return Math.min(channels.size / 5, 1);
  }

  isChannelExpert(casts, channel) {
    if (!casts || casts.length === 0) return false;
    let count = 0;
    casts.forEach(cast => {
      if (cast.channel?.id === channel) count++;
    });
    return count / casts.length > 0.3;
  }

  calcEngagementBoost(cast) {
    const engagement = (cast.reactions?.count || 0) + 
                      (cast.replies?.count || 0) * 2 +
                      (cast.recasts?.count || 0) * 1.5;
    // FIXED: Normalized 0-1, then scaled to 0-100
    return Math.min(engagement / 50, 1) * 100;
  }

  extractMentions(text) {
    const mentions = [];
    const tokens = (text || '').match(/\$[A-Z]{2,5}/g);
    if (tokens) mentions.push(...tokens);
    const users = (text || '').match(/@[a-zA-Z0-9_]+/g);
    if (users) mentions.push(...users);
    return mentions;
  }

  getTrustLevel(score) {
    if (score > 0.8) return 'Legendary ⭐';
    if (score > 0.6) return 'Expert 🧠';
    if (score > 0.4) return 'Builder 🔧';
    if (score > 0.2) return 'Community Member 🤝';
    return 'Newcomer 🌱';
  }

  detectFrames(cast) {
    const hasFrame = cast.frames && cast.frames.length > 0;
    let action = null;
    if (hasFrame) {
      const text = (cast.text || '').toLowerCase();
      if (text.includes('mint') || text.includes('claim')) action = 'mint';
      else if (text.includes('buy') || text.includes('trade') || text.includes('swap')) action = 'trade';
      else if (text.includes('vote') || text.includes('poll')) action = 'vote';
      else action = 'interact';
    }
    return { hasFrame, action };
  }

  generateFrameURL(spark) {
    if (!spark.hasFrame || !spark.frameAction) return null;
    // FIXED: Use fid and sparkId instead of undefined cast.hash
    return `https://frames.spark.xyz/${spark.frameAction}?fid=${spark.fid}&id=${spark.sparkId}`;
  }

  generateSparkId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'SPARK-';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  async checkAccess(userFid) {
    return {
      hasAccess: true,
      tier: 'free',
      credits: 10,
      paymentUrl: `https://pay.spark.xyz/x402?fid=${userFid}`,
      sparkCredits: '⚡ 10 free sparks remaining'
    };
  }
}
