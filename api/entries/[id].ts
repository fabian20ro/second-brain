import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEntry, updateEntry, deleteEntry } from "../../src/services/entries.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Missing entry id" });
  }

  try {
    switch (req.method) {
      case "GET": {
        const entry = await getEntry(id);
        if (!entry) return res.status(404).json({ error: "Not found" });
        return res.status(200).json(entry);
      }

      case "PUT":
      case "PATCH": {
        const updated = await updateEntry(id, req.body);
        return res.status(200).json(updated);
      }

      case "DELETE": {
        await deleteEntry(id);
        return res.status(204).end();
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Entry API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
