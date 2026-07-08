import express from "express";
import crypto from "crypto";
import { handleSparkEvent } from "../lib/spark-engine.js";

const router = express.Router();

const WEBHOOK_SECRET = process.env.NEYNAR_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.warn("⚠️  NEYNAR_WEBHOOK_SECRET not set — webhooks will be accepted without verification");
}

// express.raw() gives us the Buffer Neynar signed
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-neynar-signature"];

    // Verify signature if secret is configured
    if (WEBHOOK_SECRET) {
      if (!signature) {
        return res.status(400).json({ error: "Missing X-Neynar-Signature header" });
      }

      const rawBody = req.body; // Buffer
      const expected = crypto
        .createHmac("sha512", WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const sigBuf = Buffer.from(signature, "utf8");
      const expBuf = Buffer.from(expected, "hex");

      const isValid =
        sigBuf.length === expBuf.length &&
        crypto.timingSafeEqual(sigBuf, expBuf);

      if (!isValid) {
        console.warn("Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    // Parse and handle async (respond fast to Neynar)
    const event = JSON.parse(req.body.toString("utf8"));
    
    handleSparkEvent(event).catch((err) =>
      console.error("Spark engine error:", err)
    );

    // Always return 200 — Neynar retries on failures
    res.status(200).json({ success: true, received: event.type });
  }
);

export default router;
