import express from "express";
import { getLiveSparks, getStats } from "../lib/cache.js";
import axios from "axios";

const router = express.Router();
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_URL = "https://api.neynar.com/v2";

// ============================================
// LIVE SPARKS
// ============================================
router.get("/sparks/live", (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const channel = req.query.channel;

  let sparks = getLiveSparks();
  if (channel) {
    sparks = sparks.filter((s) => s.channel === `/${channel}`);
  }

  res.json({
    success: true,
    source: "webhook",
    count: sparks.length,
    sparks: sparks.slice(0, limit),
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// STATS
// ============================================
router.get("/stats", (req, res) => {
  const sparks = getLiveSparks();
  const byChannel = {};

  sparks.forEach((s) => {
    byChannel[s.channel] = (byChannel[s.channel] || 0) + 1;
  });

  res.json({
    success: true,
    totalSparks: sparks.length,
    byChannel,
    lastSpark: sparks[0]?.receivedAt || null,
    uptime: process.uptime(),
  });
});

// ============================================
// REPUTATION (FID Lookup)
// ============================================
router.get("/reputation", async (req, res) => {
  const { fid } = req.query;
  if (!fid) {
    return res.status(400).json({
      success: false,
      error: "Missing ?fid= parameter",
    });
  }

  try {
    const reputation = await calculateReputation(fid);
    res.json({
      success: true,
      data: reputation,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// REPUTATION CALCULATION (Neynar API)
// ============================================
async function calculateReputation(fid) {
  const [followers, following, casts] = await Promise.all([
    neynarGet("/farcaster/followers", { fid, limit: 100 }).catch(() => []),
    neynarGet("/farcaster/following", { fid, limit: 100 }).catch(() => []),
    neynarGet("/farcaster/casts", { fid, limit: 50 }).catch(() => []),
  ]);

  const engagementRate = calcEngagementRate(casts);
  const networkDensity = calcNetworkDensity(followers, following);
  const contentQuality = analyzeContentQuality(casts);
  const channelDiversity = calcChannelDiversity(casts);

  let score =
    engagementRate * 0.30 +
    networkDensity * 0.25 +
    contentQuality * 0.25 +
    channelDiversity * 0.20;

  if (isChannelExpert(casts, "base")) score *= 1.15;
  if (isChannelExpert(casts, "degen")) score *= 1.10;

  const finalScore = Math.round(score * 100);

  return {
    fid: parseInt(fid),
    username: casts[0]?.author?.username || "unknown",
    score: finalScore,
    breakdown: {
      engagementRate: Math.round(engagementRate * 100),
      networkDensity: Math.round(networkDensity * 100),
      contentQuality: Math.round(contentQuality * 100),
      channelDiversity: Math.round(channelDiversity * 100),
    },
    trustLevel: getTrustLevel(score),
    stats: {
      followers: followers.length,
      following: following.length,
      totalCasts: casts.length,
      channels: [
        ...new Set(casts.map((c) => c.channel?.id).filter(Boolean)),
      ],
    },
    sparkBadge: getSparkBadge(finalScore),
  };
}

async function neynarGet(endpoint, params = {}) {
  const res = await axios.get(`${NEYNAR_URL}${endpoint}`, {
    params,
    headers: { "x-api-key": NEYNAR_API_KEY },
    timeout: 10000,
  });
  return res.data;
}

function calcEngagementRate(casts) {
  if (!casts?.length) return 0;
  let total = 0;
  casts.forEach((c) => {
    total +=
      (c.reactions?.count || 0) +
      (c.replies?.count || 0) +
      (c.recasts?.count || 0);
  });
  return Math.min(total / (casts.length * 10), 1);
}

function calcNetworkDensity(followers, following) {
  const total = followers.length + following.length;
  if (total === 0) return 0;
  return Math.min(followers.length / (following.length + 1) / 10, 1);
}

function analyzeContentQuality(casts) {
  if (!casts?.length) return 0;
  let quality = 0;
  casts.forEach((c) => {
    const text = c.text || "";
    if (text.length > 100) quality += 2;
    if (text.includes("?")) quality += 1;
    if (text.match(/https?:\/\/[^\s]+/g)) quality += 1;
  });
  return Math.min(quality / (casts.length * 4), 1);
}

function calcChannelDiversity(casts) {
  if (!casts?.length) return 0;
  const channels = new Set(casts.map((c) => c.channel?.id).filter(Boolean));
  return Math.min(channels.size / 5, 1);
}

function isChannelExpert(casts, channel) {
  if (!casts?.length) return false;
  const count = casts.filter((c) => c.channel?.id === channel).length;
  return count / casts.length > 0.3;
}

function getTrustLevel(score) {
  if (score > 0.8) return "Legendary";
  if (score > 0.6) return "Expert";
  if (score > 0.4) return "Builder";
  if (score > 0.2) return "Community Member";
  return "Newcomer";
}

function getSparkBadge(score) {
  if (score >= 90) return "⭐⭐⭐ Legendary";
  if (score >= 70) return "⭐⭐ Expert";
  if (score >= 50) return "⭐ Builder";
  if (score >= 30) return "🤝 Community";
  return "🌱 Newcomer";
}

export default router;
