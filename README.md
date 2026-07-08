# 🔥 SPARK - Farcaster Intelligence Engine

> *"Don't just consume alpha. SPARK it."*

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Farcaster](https://img.shields.io/badge/Farcaster-Native-purple)](https://farcaster.xyz)
[![Base](https://img.shields.io/badge/Base-L2-blue)](https://base.org)

SPARK is a Farcaster-native intelligence engine that discovers alpha using **FID reputation scoring**, **channel-specific analysis**, and **Frame execution**. It turns the Farcaster firehose into actionable intelligence.

---

## ✨ Features

### 🧠 FID Reputation Layer
- Real-time reputation scoring per Farcaster ID
- Trust levels: Legendary → Expert → Builder → Community Member → Newcomer
- Based on engagement quality, network density, content quality & channel diversity
- **Not** based on raw follower count

### 📡 Channel-Specific Intelligence
- Deep analysis of `/base`, `/degen`, `/clanker`, `/crypto`, `/nft`
- Channel-specific keyword matching & alpha scoring
- Auto-detection of Frames, tokens, and mentions

### 🖼️ Farcaster Frame Support
- Native Frame meta tags for Warpcast embeds
- "See it → Trade it" loop inside the feed
- Auto-detects Frame actions: `mint`, `trade`, `vote`, `interact`

### ⚡ Reputation API
- Query any FID: `GET /api/reputation?fid=1234`
- Cached, fast, JSON-native
- Perfect for other builders to integrate

### 🔓 Open Source
- Transparent scoring algorithm
- Community auditable
- Built for Base & Farcaster

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Neynar API Key](https://neynar.com) (free tier works)
- Vercel account

### 1. Clone
```bash
git clone https://github.com/afifarioss/SPARK.git
cd SPARK
2. Install
npm install axios
3. Set Environment Variable
In Vercel dashboard → Settings → Environment Variables:
NEYNAR_API_KEY=your_neynar_api_key_here
4. Deploy
vercel --prod

---

📡 API Endpoints
🔥 Ignite (Main Engine)
Returns top alpha sparks across all monitored channels.
GET /api/spark
Response:
{
  "success": true,
  "data": {
    "summary": {
      "channelsScanned": 5,
      "channelsIgnited": 3,
      "totalSparks": 12,
      "version": "1.1.0"
    },
    "sparks": [
      {
        "channel": "/base",
        "sparks": [
          {
            "author": "jacek",
            "fid": 1234,
            "reputation": {
              "score": 87,
              "trustLevel": "Expert 🧠"
            },
            "text": "New Base frame just dropped...",
            "alphaScore": 72,
            "totalScore": 91,
            "sentiment": "Ignited 🟢",
            "mentions": ["$DEGEN", "@base"],
            "hasFrame": true,
            "frameAction": "mint",
            "sparkId": "SPARK-A7B3C9"
          }
        ],
        "count": 4
      }
    ]
  },
  "timestamp": "2026-07-08T23:00:00.000Z"
}
🧠 Reputation (Per FID)
Query any Farcaster user's SPARK reputation score.
GET /api/reputation?fid={fid}
Example:
https://your-app.vercel.app/api/reputation?fid=1234
Response:
{
  "success": true,
  "data": {
    "fid": 1234,
    "username": "jacek",
    "score": 87,
    "breakdown": {
      "engagementRate": 85,
      "networkDensity": 70,
      "contentQuality": 90,
      "channelDiversity": 60
    },
    "trustLevel": "Expert",
    "stats": {
      "followers": 1200,
      "following": 340,
      "totalCasts": 450,
      "channels": ["base", "degen", "clanker"]
    },
    "sparkBadge": "⭐⭐ Expert"
  }
}


🖼️ Frame
Farcaster Frame meta tag endpoint for Warpcast embeds.
GET /api/frame?channel=base
🏷️ Reputation Tiers
Score	Tier	Badge	
90+	Legendary	⭐⭐⭐	
70-89	Expert	⭐⭐	
50-69	Builder	⭐	
30-49	Community Member	🤝	
<30	Newcomer	🌱	
🧠 Scoring Algorithm
SPARK reputation is calculated from four weighted dimensions:
Dimension	Weight	Description	
Engagement Rate	30%	Reactions + replies + recasts per cast	
Network Density	25%	Follower/following ratio quality	
Content Quality	25%	Length, links, questions = signal	
Channel Diversity	20%	Activity across multiple channels	
Expert Multipliers:
 
 🟦 /base  expert: +15%
 
 🟦 /degen  expert: +10%

🛠️ Tech Stack
 
Runtime: Node.js 18+
 
Framework: Vercel Serverless Functions
 
API: Neynar v2 (Farcaster)
 
Cache: In-memory LRU (Redis-ready)
 
Chain: Base L2 (Frame-ready)

🗺️ Roadmap
 
FID reputation scoring
 
Channel-specific alpha detection
 
Frame meta tag support
 
Reputation API endpoint
 
Onchain attestations (EAS)
 
Smart wallet execution
 
AI semantic layer (LLM)
 
SPARK tokenized agent (Clanker/Virtuals)

🤝 Contributing
Built for the Farcaster & Base community. PRs welcome.
1. 
Fork the repo
2. 
Create a branch:  git checkout -b feature/amazing 
3. 
Commit:  git commit -m 'Add amazing feature' 
4. 
Push:  git push origin feature/amazing 
5. 
Open a PR

📜 License
MIT © afifarioss


🔗 Links
 
Live API:  https://your-app.vercel.app/api/spark 
 
Reputation API:  https://your-app.vercel.app/api/reputation?fid=1234 
 
Frame:  https://your-app.vercel.app/api/frame?channel=base 
 
Farcaster: farcaster.xyz
 
Base: base.org
 
Neynar: neynar.com

💎 "Don't just consume alpha. SPARK it." 
