import axios from 'axios';

const API_KEY = process.env.NEYNAR_API_KEY || 'NEYNAR_API_DEMO';
const NEYNAR_URL = 'https://api.neynar.com/v2/farcaster';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const result = await runSpark();
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function runSpark() {
  const spark = new Spark();
  return await spark.ignite();
}

// ============================================
// 🔥 SPARK CORE - Intelligence Engine
// ============================================

class Spark {
  constructor() {
    this.channels = ['/base', '/degen', '/clanker', '/crypto', '/nft'];
    this.igniteThreshold = 50;
    this.version = '1.0.0';
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

      score = (engagementRate * 0.3) + 
              (networkDensity * 0.25) + 
              (contentQuality * 0.25) + 
              (channelDiversity * 0.2);

      if (this.isChannelExpert(casts, '/base')) score *= 1.2;
      if (this.isChannelExpert(casts, '/degen')) score *= 1.15;

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

  async scanChannel(channel) {
    try {
      const casts = await this.getChannelCasts(channel, 50);
      const sparks = [];

      for (const cast of casts) {
        const reputation = await this.calculateFIDReputation(cast.author.fid);
        const alphaScore = this.calcAlphaScore(cast.text, channel);
        const sentiment = this.analyzeSentiment(cast.text);
        const mentions = this.extractMentions(cast.text);
        const frameData = this.detectFrames(cast);

        const totalScore = (alphaScore * 0.4) + 
                          (reputation.score * 0.3) + 
                          (sentiment * 0.15) + 
                          (this.calcEngagementBoost(cast) * 0.15);

        if (totalScore > this.igniteThreshold) {
          sparks.push({
            author: cast.author.username,
            fid: cast.author.fid,
            reputation: reputation,
            text: cast.text.substring(0, 200),
            alphaScore: Math.round(alphaScore),
            totalScore: Math.round(totalScore),
            sentiment: this.getSentimentLabel(sentiment),
            mentions: mentions,
            hasFrame: frameData.hasFrame,
            frameAction: frameData.action,
            channel: channel,
            timestamp: cast.timestamp,
            sparkId: this.generateSparkId()
          });
        }
      }

      sparks.sort((a, b) => b.totalScore - a.totalScore);
      
      return {
        channel,
        sparks: sparks.slice(0, 5),
        count: sparks.length
      };

    } catch (error) {
      return { channel, sparks: [], count: 0 };
    }
  }

  detectFrames(cast) {
    const hasFrame = cast.frames && cast.frames.length > 0;
    let action = null;
    if (hasFrame) {
      const text = cast.text.toLowerCase();
      if (text.includes('mint') || text.includes('claim')) action = 'mint';
      else if (text.includes('buy') || text.includes('trade')) action = 'trade';
      else if (text.includes('vote')) action = 'vote';
      else action = 'interact';
    }
    return { hasFrame, action };
  }

  generateFrameURL(spark) {
    if (!spark.hasFrame) return null;
    return `https://frames.spark.xyz/${spark.frameAction}?cast=${spark.cast?.hash}`;
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

  calcAlphaScore(text, channel) {
    const channelKeywords = {
      '/base': ['base', 'nft', 'mint', 'collection', 'art', 'creator', 'frame', 'build'],
      '/degen': ['token', 'meme', 'airdrop', 'farm', 'liquidity', 'trade', 'yield'],
      '/clanker': ['clanker', 'agent', 'ai', 'autonomous', 'bot', 'automation', 'spark'],
      '/crypto': ['bitcoin', 'eth', 'layer2', 'defi', 'protocol', 'governance'],
      '/nft': ['art', 'collectible', 'rarity', 'mint', 'whitelist', 'reveal']
    };

    const keywords = channelKeywords[channel] || [];
    let score = 0;
    const textLower = text.toLowerCase();

    const alphaIndicators = ['🚀', '💎', 'alpha', 'early', 'undervalued', 'gem', 'next', '🔥', '⚡'];
    alphaIndicators.forEach(word => {
      if (textLower.includes(word)) score += 5;
    });

    keywords.forEach(word => {
      if (textLower.includes(word)) score += 3;
    });

    const priceMatches = text.match(/\$[A-Z]{2,5}/g);
    if (priceMatches) score += priceMatches.length * 4;

    return Math.min(score, 100);
  }

  analyzeSentiment(text) {
    const positive = ['🚀', '💎', 'bull', 'buy', 'moon', 'gain', 'profit', 'alpha', '🔥', '⚡'];
    const negative = ['💀', 'bear', 'sell', 'dump', 'scam', 'rug', 'waste', 'lose'];
    let score = 0;
    const textLower = text.toLowerCase();
    positive.forEach(word => { if (textLower.includes(word)) score += 2; });
    negative.forEach(word => { if (textLower.includes(word)) score -= 2; });
    return Math.max(-10, Math.min(10, score));
  }

  getSentimentLabel(score) {
    if (score > 3) return 'Ignited 🟢';
    if (score > 0) return 'Warm 📈';
    if (score === 0) return 'Neutral ⚪';
    if (score > -3) return 'Caution ⚠️';
    return 'Cool 🔴';
  }

  generateSparkId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'SPARK-';
    for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
  }

  async getFollowers(fid) {
    const res = await axios.get(`${NEYNAR_URL}/follower`, {
      params: { fid },
      headers: { 'x-api-key': API_KEY }
    });
    return res.data.users || [];
  }

  async getFollowing(fid) {
    const res = await axios.get(`${NEYNAR_URL}/following`, {
      params: { fid },
      headers: { 'x-api-key': API_KEY }
    });
    return res.data.users || [];
  }

  async getUserCasts(fid) {
    const res = await axios.get(`${NEYNAR_URL}/casts`, {
      params: { fid, limit: 50 },
      headers: { 'x-api-key': API_KEY }
    });
    return res.data.casts || [];
  }

  async getChannelCasts(channel, limit = 50) {
    const res = await axios.get(`${NEYNAR_URL}/feed`, {
      params: {
        feed_type: 'filter',
        filter_type: 'channel',
        channel_id: channel.replace('/', ''),
        limit: limit
      },
      headers: { 'x-api-key': API_KEY }
    });
    return res.data.casts || [];
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
      if (cast.channel?.id === channel.replace('/', '')) count++;
    });
    return count / casts.length > 0.3;
  }

  calcEngagementBoost(cast) {
    const engagement = (cast.reactions?.count || 0) + 
                      (cast.replies?.count || 0) * 2 +
                      (cast.recasts?.count || 0) * 1.5;
    return Math.min(engagement / 100, 1) * 100;
  }

  extractMentions(text) {
    const mentions = [];
    const tokens = text.match(/\$[A-Z]{2,5}/g);
    if (tokens) mentions.push(...tokens);
    const users = text.match(/@[a-zA-Z0-9_]+/g);
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

  async ignite() {
    const allSparks = [];
    let totalSparks = 0;

    for (const channel of this.channels) {
      const result = await this.scanChannel(channel);
      totalSparks += result.count;
      if (result.sparks.length > 0) {
        allSparks.push({
          channel: channel,
          sparks: result.sparks,
          count: result.count
        });
      }
    }

    return {
      summary: {
        channelsIgnited: this.channels.length,
        totalSparks: totalSparks,
        version: this.version
      },
      sparks: allSparks,
      timestamp: new Date().toISOString(),
      message: '💎 "Don\'t just consume alpha. SPARK it."'
    };
  }
}