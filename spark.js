import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.NEYNAR_API_KEY || 'NEYNAR_API_DEMO';
const NEYNAR_URL = 'https://api.neynar.com/v2/farcaster';

// ============================================
// 🔥 SPARK CORE - Intelligence Engine
// ============================================

class Spark {
  constructor() {
    this.channels = ['/base', '/degen', '/clanker', '/crypto', '/nft'];
    this.igniteThreshold = 50; // Minimum score to surface
    this.version = '1.0.0';
  }

  // ============================================
  // 1. FID REPUTATION LAYER (EigenTrust/PoQ)
  // ============================================
  
  async calculateFIDReputation(fid) {
    try {
      const [followers, following, casts] = await Promise.all([
        this.getFollowers(fid),
        this.getFollowing(fid),
        this.getUserCasts(fid)
      ]);

      // EigenTrust-style scoring
      let score = 0;

      // PoQ (Proof of Quality) metrics
      const engagementRate = this.calcEngagementRate(casts);
      const networkDensity = this.calcNetworkDensity(followers, following);
      const contentQuality = this.analyzeContentQuality(casts);
      const channelDiversity = this.calcChannelDiversity(casts);

      // Weighted scoring (customizable)
      score = (engagementRate * 0.3) + 
              (networkDensity * 0.25) + 
              (contentQuality * 0.25) + 
              (channelDiversity * 0.2);

      // Boost for channel-specific expertise
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
      console.error('❌ Reputation error:', error.message);
      return { fid, score: 0, trustLevel: 'Unknown' };
    }
  }

  // ============================================
  // 2. CHANNEL-SPECIFIC INTELLIGENCE
  // ============================================

  async scanChannel(channel) {
    console.log(`\n⚡ Igniting ${channel}...`);
    
    try {
      const casts = await this.getChannelCasts(channel, 50);
      const sparks = [];

      for (const cast of casts) {
        // Get FID reputation
        const reputation = await this.calculateFIDReputation(cast.author.fid);
        
        // Analyze content
        const alphaScore = this.calcAlphaScore(cast.text, channel);
        const sentiment = this.analyzeSentiment(cast.text);
        const mentions = this.extractMentions(cast.text);
        const frameData = this.detectFrames(cast);

        // Weighted total score
        const totalScore = (alphaScore * 0.4) + 
                          (reputation.score * 0.3) + 
                          (sentiment * 0.15) + 
                          (this.calcEngagementBoost(cast) * 0.15);

        if (totalScore > this.igniteThreshold) {
          sparks.push({
            cast: cast,
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

      // Sort by total score
      sparks.sort((a, b) => b.totalScore - a.totalScore);
      
      return {
        channel,
        sparks: sparks.slice(0, 5), // Top 5 sparks
        count: sparks.length
      };

    } catch (error) {
      console.error(`❌ Channel scan error:`, error.message);
      return { channel, sparks: [], count: 0 };
    }
  }

  // ============================================
  // 3. FRAME EXECUTION (See it → SPARK it)
  // ============================================

  detectFrames(cast) {
    const hasFrame = cast.frames && cast.frames.length > 0;
    let action = null;

    if (hasFrame) {
      const text = cast.text.toLowerCase();
      if (text.includes('mint') || text.includes('claim')) {
        action = 'mint';
      } else if (text.includes('buy') || text.includes('trade')) {
        action = 'trade';
      } else if (text.includes('vote')) {
        action = 'vote';
      } else {
        action = 'interact';
      }
    }

    return { hasFrame, action };
  }

  generateFrameURL(spark) {
    if (!spark.hasFrame) return null;
    const baseAction = spark.frameAction || 'interact';
    return `https://frames.spark.xyz/${baseAction}?cast=${spark.cast.hash}&fid=${spark.fid}`;
  }

  // ============================================
  // 4. x402 PAYMENT INTEGRATION
  // ============================================

  async checkAccess(userFid) {
    return {
      hasAccess: true,
      tier: 'free',
      credits: 10,
      paymentUrl: `https://pay.spark.xyz/x402?fid=${userFid}`,
      sparkCredits: '⚡ 10 free sparks remaining'
    };
  }

  // ============================================
  // 5. OPEN-SOURCE SCORING ALGORITHM
  // ============================================

  calcAlphaScore(text, channel) {
    // Channel-specific keywords
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

    // Alpha indicators
    const alphaIndicators = ['🚀', '💎', 'alpha', 'early', 'undervalued', 'gem', 'next', '🔥', '⚡'];
    alphaIndicators.forEach(word => {
      if (textLower.includes(word)) score += 5;
    });

    // Channel keyword matching
    keywords.forEach(word => {
      if (textLower.includes(word)) score += 3;
    });

    // Price mentions (high signal)
    const priceMatches = text.match(/\$[A-Z]{2,5}/g);
    if (priceMatches) {
      score += priceMatches.length * 4;
    }

    // Urgency indicators
    const urgencyWords = ['limit', 'supply', 'soon', 'now', 'today', 'hours', 'minutes'];
    urgencyWords.forEach(word => {
      if (textLower.includes(word)) score += 3;
    });

    return Math.min(score, 100);
  }

  analyzeSentiment(text) {
    const positive = ['🚀', '💎', 'bull', 'buy', 'moon', 'gain', 'profit', 'alpha', '🔥', '⚡'];
    const negative = ['💀', 'bear', 'sell', 'dump', 'scam', 'rug', 'waste', 'lose'];
    
    let score = 0;
    const textLower = text.toLowerCase();
    
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
    return 'Cool 🔴';
  }

  generateSparkId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'SPARK-';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

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

  // ============================================
  // 🔥 MAIN: Generate SPARK Report
  // ============================================

  async ignite() {
    console.log('\n' + '🔥'.repeat(30));
    console.log('⚡ SPARK - Farcaster Intelligence Engine');
    console.log('🔥'.repeat(30));
    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log(`🔍 Scanning ${this.channels.length} channels...\n`);

    const allSparks = [];
    let totalSparks = 0;

    for (const channel of this.channels) {
      const result = await this.scanChannel(channel);
      totalSparks += result.count;
      
      if (result.sparks.length > 0) {
        console.log(`\n📌 ${channel.toUpperCase()} - ${result.sparks.length} Sparks`);
        console.log('─'.repeat(50));
        
        result.sparks.forEach((spark, i) => {
          console.log(`\n${i+1}. 🔥 ${spark.sparkId} - @${spark.author} [FID: ${spark.fid}]`);
          console.log(`   🏆 Reputation: ${spark.reputation.score}/100 (${spark.reputation.trustLevel})`);
          console.log(`   📊 Alpha Score: ${spark.alphaScore}/100`);
          console.log(`   💬 "${spark.text}"`);
          console.log(`   ${spark.sentiment}`);
          if (spark.mentions.length > 0) {
            console.log(`   📈 ${spark.mentions.join(', ')}`);
          }
          if (spark.hasFrame) {
            console.log(`   🖼️  Frame Action: ${spark.frameAction} → ${this.generateFrameURL(spark)}`);
          }
          console.log(`   ⏰ ${new Date(spark.timestamp).toLocaleTimeString()}`);
        });
      }
    }

    // Summary
    console.log('\n' + '🔥'.repeat(30));
    console.log('📊 SPARK SUMMARY');
    console.log('🔥'.repeat(30));
    console.log(`✅ Channels Ignited: ${this.channels.length}`);
    console.log(`🔎 Total Sparks Found: ${totalSparks}`);
    console.log(`🤖 Generated by SPARK v${this.version}`);
    console.log(`🔓 Open Source: github.com/your-username/spark`);
    console.log(`⚡ Try x402 micro-payments: pay.spark.xyz`);
    console.log('\n💎 "Don\'t just consume alpha. SPARK it."');
    console.log('🔥'.repeat(30) + '\n');

    return {
      totalSparks,
      channels: this.channels.length,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================
// 🚀 RUN SPARK
// ============================================

const spark = new Spark();
await spark.ignite();

// Auto-ignite every 15 minutes
// setInterval(() => spark.ignite(), 15 * 60 * 1000);