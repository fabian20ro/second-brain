import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createEntry, listEntries, searchEntries } from "../../src/services/entries.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case "GET": {
        const { q, type, tags, limit, offset } = req.query;

        // If a search query is provided, use full-text search
        if (typeof q === "string" && q.trim()) {
          const results = await searchEntries(q, Number(limit) || 20);
          return res.status(200).json(results);
        }

        // Otherwise list with optional filters
        const entries = await listEntries({
          content_type: typeof type === "string" ? type as any : undefined,
          tags: typeof tags === "string" ? tags.split(",") : undefined,
          limit: Number(limit) || 20,
          offset: Number(offset) || 0,
        });
        return res.status(200).json(entries);
      }

      case "POST": {
        const entry = await createEntry(req.body);
        return res.status(201).json(entry);
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Entries API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
