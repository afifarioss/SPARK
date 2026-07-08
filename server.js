import "dotenv/config";
import express from "express";
import webhookRouter from "./routes/webhook.js";
import apiRouter from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// ORDER MATTERS — DO NOT REORDER
// ============================================

// 1. Health check (no body parsing needed)
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

// 2. Webhook route — MUST use express.raw() for HMAC
//    Mount BEFORE any global express.json()
app.use("/webhooks/neynar", webhookRouter);

// 3. Global JSON middleware — ONLY for routes after this point
app.use(express.json());

// 4. API routes (need JSON parsing)
app.use("/api", apiRouter);

// 5. Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`
🔥 SPARK Realtime Engine v1.2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server:     http://localhost:${PORT}
Webhook:    POST http://localhost:${PORT}/webhooks/neynar
Live Sparks: GET  http://localhost:${PORT}/api/sparks/live
Stats:      GET  http://localhost:${PORT}/api/stats
Reputation: GET  http://localhost:${PORT}/api/reputation?fid=1234

⚠️  Webhook uses raw body (HMAC). API routes use JSON.
⚠️  Order: webhook → express.json() → api routes
  `);
});
