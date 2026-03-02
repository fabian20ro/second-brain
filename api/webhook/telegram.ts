import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleTelegramUpdate } from "../../src/services/telegram.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: verify webhook secret via query param
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await handleTelegramUpdate(req.body);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    // Always return 200 to Telegram so it doesn't retry endlessly
    return res.status(200).json({ ok: true, error: "internal" });
  }
}
