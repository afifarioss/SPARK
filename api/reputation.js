import axios from 'axios';

const API_KEY = process.env.NEYNAR_API_KEY;
if (!API_KEY) throw new Error('NEYNAR_API_KEY required');

const NEYNAR_URL = 'https://api.neynar.com/v2';

// Simple cache
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { fid } = req.query;
  
  if (!fid) {
    return res.status(400).json({
      success: false,
      error: 'Missing ?fid= parameter. Usage: /api/reputation?fid=1234'
    });
  }

  try {
    const cached = getCache(`rep_${fid}`);
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached });
    }

    const reputation = await calculateReputation(parseInt(fid));
    setCache(`rep_${fid}`, reputation);
    
    res.status(200).json({
      success: true,
      cached: false,
      data: reputation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function neynarGet(endpoint, params = {}) {
  const res = await axios.get(`${NEYNAR_URL}${endpoint}`, {
    params,
    headers: { 'x-api-key': API_KEY },
    timeout: 10000
  });
  return res.data;
}

async function calculateReputation(fid) {
  const [followers, following, casts] = await Promise.all([
    neynarGet('/farcaster/followers', { fid, limit: 100 }).then(d => d.users || []).catch(() => []),
    neynarGet('/farcaster/following', { fid, limit: 100 }).then(d => d.users || []).catch(() => []),
    neynarGet('/farcaster/casts', { fid, limit: 50 }).then(d => d.casts || []).catch(() => [])
  ]);

  let score = 0;
  const engagementRate = calcEngagementRate(casts);
  const networkDensity = calcNetworkDensity(followers, following);
  const contentQuality = analyzeContentQuality(casts);
  const channelDiversity = calcChannelDiversity(casts);

  score = (engagementRate * 0.30) + 
          (networkDensity * 0.25) + 
          (contentQuality * 0.25) + 
          (channelDiversity * 0.20);

  // Expert multipliers
  if (isChannelExpert(casts, 'base')) score *= 1.15;
  if (isChannelExpert(casts, 'degen')) score *= 1.10;

  const finalScore = Math.round(score * 100);

  return {
    fid,
    username: casts[0]?.author?.username || 'unknown',
    score: finalScore,
    breakdown: {
      engagementRate: Math.round(engagementRate * 100),
      networkDensity: Math.round(networkDensity * 100),
      contentQuality: Math.round(contentQuality * 100),
      channelDiversity: Math.round(channelDiversity * 100)
    },
    trustLevel: getTrustLevel(score),
    stats: {
      followers: followers.length,
      following: following.length,
      totalCasts: casts.length,
      channels: [...new Set(casts.map(c => c.channel?.id).filter(Boolean))]
    },
    sparkBadge: getSparkBadge(finalScore)
  };
}

function getSparkBadge(score) {
  if (score >= 90) return '⭐⭐⭐ Legendary';
  if (score >= 70) return '⭐⭐ Expert';
  if (score >= 50) return '⭐ Builder';
  if (score >= 30) return '🤝 Community';
  return '🌱 Newcomer';
}

function getTrustLevel(score) {
  if (score > 0.8) return 'Legendary';
  if (score > 0.6) return 'Expert';
  if (score > 0.4) return 'Builder';
  if (score > 0.2) return 'Community Member';
  return 'Newcomer';
}

function calcEngagementRate(casts) {
  if (!casts || casts.length === 0) return 0;
  let total = 0;
  casts.forEach(c => {
    total += (c.reactions?.count || 0) + (c.replies?.count || 0) + (c.recasts?.count || 0);
  });
  return Math.min(total / (casts.length * 10), 1);
}

function calcNetworkDensity(followers, following) {
  const total = followers.length + following.length;
  if (total === 0) return 0;
  return Math.min(followers.length / (following.length + 1) / 10, 1);
}

function analyzeContentQuality(casts) {
  if (!casts || casts.length === 0) return 0;
  let quality = 0;
  casts.forEach(c => {
    const text = c.text || '';
    if (text.length > 100) quality += 2;
    if (text.includes('?')) quality += 1;
    if (text.match(/https?:\/\/[^\s]+/g)) quality += 1;
  });
  return Math.min(quality / (casts.length * 4), 1);
}

function calcChannelDiversity(casts) {
  if (!casts || casts.length === 0) return 0;
  const channels = new Set(casts.map(c => c.channel?.id).filter(Boolean));
  return Math.min(channels.size / 5, 1);
}

function isChannelExpert(casts, channel) {
  if (!casts || casts.length === 0) return false;
  const count = casts.filter(c => c.channel?.id === channel).length;
  return count / casts.length > 0.3;
}
