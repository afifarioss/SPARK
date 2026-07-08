import "dotenv/config";
import express from "express";
import webhookRouter from "./routes/webhook.js";
import apiRouter from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Health check
app.get("/", (req, res) => {
  res.json({
    name: "SPARK Realtime Engine",
    version: "1.2.0",
    status: "🔥 Ignited",
    endpoints: {
      webhook: "POST /webhooks/neynar",
      liveSparks: "GET /api/sparks/live",
      stats: "GET /api/stats",
      reputation: "GET /api/reputation?fid=1234"
    }
  });
});

// 1. Webhook route — raw body for HMAC, mount BEFORE express.json()
app.use("/webhooks/neynar", webhookRouter);

// 2. Global JSON middleware — ONLY for routes after this point
app.use(express.json());

// 3. API routes
app.use("/api", apiRouter);

// 4. Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`
🔥 SPARK Realtime Engine v1.2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Local:      http://localhost:${PORT}
Webhook:    POST http://localhost:${PORT}/webhooks/neynar
Live Sparks: GET  http://localhost:${PORT}/api/sparks/live
Stats:      GET  http://localhost:${PORT}/api/stats
Reputation: GET  http://localhost:${PORT}/api/reputation?fid=1234
  `);
});
