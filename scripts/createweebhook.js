import "dotenv/config";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not set");
}

const TARGET_URL = process.env.WEBHOOK_TARGET_URL;
if (!TARGET_URL) {
  throw new Error("WEBHOOK_TARGET_URL is not set. Example: https://your-app.vercel.app/api/webhooks/neynar");
}

const client = new NeynarAPIClient(
  new Configuration({ apiKey: process.env.NEYNAR_API_KEY })
);

async function main() {
  console.log("Creating Neynar webhook...");
  console.log("Target URL:", TARGET_URL);

  const webhook = await client.publishWebhook({
    name: "spark-realtime",
    url: TARGET_URL,
    subscription: {
      "cast.created": {},
    },
  });

  console.log("\n✅ Webhook created!");
  console.log("Webhook ID:", webhook.webhook?.id);

  const secret = webhook.webhook?.secrets?.[0]?.value;
  if (secret) {
    console.log("\n🔐 NEYNAR_WEBHOOK_SECRET=" + secret);
    console.log("Add this to Vercel Environment Variables!");
  }
}

main().catch((err) => {
  console.error("\n❌ Failed:", err.message);
  process.exit(1);
});
