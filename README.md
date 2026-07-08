# 🔥 SPARK - Farcaster Intelligence Engine

> *"Don't just consume alpha. SPARK it."*

[![Farcaster](https://img.shields.io/badge/Farcaster-Native-purple)](https://farcaster.xyz)
[![Base](https://img.shields.io/badge/Base-L2-blue)](https://base.org)

SPARK is a Farcaster-native intelligence engine that discovers alpha using **FID reputation scoring**, **channel-specific analysis**, and **Frame execution**. It turns the Farcaster firehose into actionable intelligence.

---

## ✨ Features

- 🧠 **FID Reputation Layer** — Real-time reputation scoring per Farcaster ID
- 📡 **Channel-Specific Intelligence** — Deep analysis of `/base`, `/degen`, `/clanker`, `/crypto`, `/nft`
- 🖼️ **Frame Support** — Native Farcaster Frame meta tags
- ⚡ **Reputation API** — Query any FID: `GET /api/reputation?fid=1234`
- 🔓 **Open Source** — Transparent scoring algorithm

---
---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Neynar API Key](https://neynar.com)

### 1. Clone & Install
```bash
git clone https://github.com/afifarioss/SPARK.git
cd SPARK
npm install

2. Environment
cp .env.example .env
# Edit .env and add your NEYNAR_API_KEY

3. Run Locally
npm run dev

4. Test
curl http://localhost:3000/api/stats
curl http://localhost:3000/api/reputation?fid=3

5. Register Webhook (with ngrok)
# Terminal 1
npm run dev

# Terminal 2
npx ngrok http 3000

# Terminal 3 — set WEBHOOK_TARGET_URL in .env, then:
npm run webhook:create

---

---

📡 API Endpoints
Endpoint	Method	Description	
`/`	GET	Health check	
`/webhooks/neynar`	POST	Neynar webhook receiver	
`/api/sparks/live`	GET	Live sparks from webhooks	
`/api/stats`	GET	Spark statistics	
`/api/reputation?fid=1234`	GET	FID reputation score	

---

---


🏷️ Reputation Tiers
Score	Tier	Badge	
90+	Legendary	⭐⭐⭐	
70-89	Expert	⭐⭐	
50-69	Builder	⭐	
30-49	Community	🤝	
<30	Newcomer	🌱	


---

---

🛠️ Tech Stack
 
Runtime: Node.js 18+
 
Framework: Express.js
 
API: Neynar v2 (Farcaster)
 
Cache: In-memory (Redis-ready)
 
Chain: Base L2

---

---


🚀 Deploy to Vercel
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

Add environment variables in Vercel Dashboard:
 
 NEYNAR_API_KEY 
 
 NEYNAR_WEBHOOK_SECRET 

---


📜 License
MIT © afifarioss
💎 "Don't just consume alpha. SPARK it." 

