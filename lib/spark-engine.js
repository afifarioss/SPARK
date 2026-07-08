import { addSpark, boostSpark } from "./cache.js";

const MONITORED = ["base", "degen", "clanker", "crypto", "nft"];

export async function handleSparkEvent(event) {
  switch (event.type) {
    case "cast.created": {
      const cast = event.data;
      const channel = cast.channel?.id;

      if (!MONITORED.includes(channel)) return;

      const spark = detectSpark(cast, channel);
      if (spark && spark.totalScore > 50) {
        addSpark(spark);
        console.log(
          `🔥 [${channel}] @${spark.author}: ${spark.totalScore} pts — ${spark.text.substring(0, 60)}...`
        );
      }
      break;
    }

    case "reaction.created": {
      const { target_cast_hash } = event.data.reaction || {};
      if (target_cast_hash) {
        boostSpark(target_cast_hash);
      }
      break;
    }

    default:
      console.log("Unhandled event:", event.type);
  }
}

function detectSpark(cast, channel) {
  const text = cast.text || "";
  const alphaScore = calcAlphaScore(text, channel);

  if (alphaScore < 20) return null;

  const sentiment = analyzeSentiment(text);
  const engagement =
    (cast.reactions?.count || 0) +
    (cast.replies?.count || 0) * 2 +
    (cast.recasts?.count || 0) * 1.5;

  const totalScore = alphaScore * 0.5 + Math.abs(sentiment) * 3 + Math.min(engagement / 10, 10);

  if (totalScore < 50) return null;

  return {
    sparkId: generateSparkId(),
    author: cast.author?.username || "unknown",
    fid: cast.author?.fid,
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
    receivedAt: new Date().toISOString(),
  };
}

function calcAlphaScore(text, channel) {
  const keywords = {
    base: ["base", "nft", "mint", "frame", "build", "onchain", "creator"],
    degen: ["token", "meme", "airdrop", "trade", "pump", "farm", "yield"],
    clanker: ["clanker", "agent", "ai", "bot", "automation", "virtuals"],
    crypto: ["bitcoin", "eth", "defi", "layer2", "btc", "protocol"],
    nft: ["art", "mint", "drop", "whitelist", "reveal", "collectible"],
  };

  const words = keywords[channel] || [];
  let score = 0;
  const lower = text.toLowerCase();

  words.forEach((w) => {
    if (lower.includes(w)) score += 5;
  });

  const indicators = ["🚀", "💎", "alpha", "early", "gem", "🔥", "⚡", "👀", "💰"];
  indicators.forEach((i) => {
    if (lower.includes(i)) score += 4;
  });

  const tokens = text.match(/\$[A-Z]{2,5}/g);
  if (tokens) score += tokens.length * 3;

  return Math.min(score, 100);
}

function analyzeSentiment(text) {
  const pos = ["🚀", "💎", "bull", "buy", "moon", "alpha", "🔥", "⚡", "👀"];
  const neg = ["💀", "bear", "sell", "dump", "scam", "rug", "🚨", "❌"];
  let score = 0;
  const lower = (text || "").toLowerCase();
  pos.forEach((w) => {
    if (lower.includes(w)) score += 2;
  });
  neg.forEach((w) => {
    if (lower.includes(w)) score -= 2;
  });
  return Math.max(-10, Math.min(10, score));
}

function getSentimentLabel(score) {
  if (score > 3) return "Ignited 🟢";
  if (score > 0) return "Warm 📈";
  if (score === 0) return "Neutral ⚪";
  if (score > -3) return "Caution ⚠️";
  return "Alert 🔴";
}

function extractMentions(text) {
  const m = [];
  const tokens = (text || "").match(/\$[A-Z]{2,5}/g);
  if (tokens) m.push(...tokens);
  const users = (text || "").match(/@[a-zA-Z0-9_]+/g);
  if (users) m.push(...users);
  return m;
}

function detectFrameAction(text) {
  const lower = (text || "").toLowerCase();
  if (lower.includes("mint") || lower.includes("claim")) return "mint";
  if (lower.includes("buy") || lower.includes("trade") || lower.includes("swap"))
    return "trade";
  if (lower.includes("vote") || lower.includes("poll")) return "vote";
  return "interact";
}

function generateSparkId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "SPARK-";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
