import { getTelegramConfig } from "../config.js";
import { createEntry, searchEntries, listEntries, deleteEntry, addTags } from "./entries.js";
import type { Entry } from "../lib/types.js";

// Telegram Bot API types (subset we need)
interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from?: { id: number; first_name: string };
  text?: string;
  photo?: { file_id: string }[];
  document?: { file_id: string; file_name?: string };
  caption?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  const { botToken } = getTelegramConfig();
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

function formatEntry(entry: Entry): string {
  const tags = entry.tags.length > 0 ? `\nTags: ${entry.tags.join(", ")}` : "";
  const type = `[${entry.content_type}]`;
  const title = entry.title ? `*${entry.title}*\n` : "";
  const preview = entry.content.length > 200
    ? entry.content.slice(0, 200) + "..."
    : entry.content;
  return `${type} ${title}${preview}${tags}\n\`${entry.id.slice(0, 8)}\``;
}

function formatEntryList(entries: Entry[]): string {
  if (entries.length === 0) return "No entries found.";
  return entries.map(formatEntry).join("\n\n---\n\n");
}

async function handleCommand(
  chatId: number,
  command: string,
  args: string
): Promise<void> {
  switch (command) {
    case "/start":
    case "/help": {
      await sendMessage(chatId, [
        "*Second Brain Bot*",
        "",
        "Send me anything and I'll save it to your second brain.",
        "",
        "*Commands:*",
        "/search `<query>` — search your entries",
        "/recent — show recent entries",
        "/tag `<id> <tag1> <tag2>` — add tags to an entry",
        "/delete `<id>` — delete an entry",
        "/help — show this message",
      ].join("\n"));
      break;
    }

    case "/search": {
      if (!args) {
        await sendMessage(chatId, "Usage: /search `<query>`");
        return;
      }
      const results = await searchEntries(args, 5);
      await sendMessage(chatId, formatEntryList(results));
      break;
    }

    case "/recent": {
      const limit = parseInt(args) || 5;
      const recent = await listEntries({ limit: Math.min(limit, 10) });
      await sendMessage(chatId, formatEntryList(recent));
      break;
    }

    case "/tag": {
      const parts = args.split(/\s+/);
      if (parts.length < 2) {
        await sendMessage(chatId, "Usage: /tag `<id-prefix> <tag1> <tag2> ...`");
        return;
      }
      const [idPrefix, ...tags] = parts;
      try {
        // Allow short ID prefixes — find matching entry
        const entries = await listEntries({ limit: 50 });
        const match = entries.find((e) => e.id.startsWith(idPrefix));
        if (!match) {
          await sendMessage(chatId, `No entry found starting with \`${idPrefix}\``);
          return;
        }
        const updated = await addTags(match.id, tags);
        await sendMessage(chatId, `Tags updated: ${updated.tags.join(", ")}`);
      } catch {
        await sendMessage(chatId, "Failed to update tags.");
      }
      break;
    }

    case "/delete": {
      if (!args) {
        await sendMessage(chatId, "Usage: /delete `<id-prefix>`");
        return;
      }
      try {
        const entries = await listEntries({ limit: 50 });
        const match = entries.find((e) => e.id.startsWith(args.trim()));
        if (!match) {
          await sendMessage(chatId, `No entry found starting with \`${args.trim()}\``);
          return;
        }
        await deleteEntry(match.id);
        await sendMessage(chatId, "Entry deleted.");
      } catch {
        await sendMessage(chatId, "Failed to delete entry.");
      }
      break;
    }

    default:
      // Unknown command — save it as a note
      await saveMessage(chatId, `${command} ${args}`.trim(), null);
  }
}

async function saveMessage(
  chatId: number,
  text: string,
  messageId: number | null
): Promise<void> {
  const entry = await createEntry({
    content: text,
    source: "telegram",
    source_message_id: messageId?.toString(),
  });

  const tags = entry.tags.length > 0 ? ` | tags: ${entry.tags.join(", ")}` : "";
  await sendMessage(
    chatId,
    `Saved as *${entry.content_type}*${tags}\n\`${entry.id.slice(0, 8)}\``
  );
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text || message.caption || "";

  if (!text) {
    // Photo or document without caption — note it for now
    if (message.photo) {
      await saveMessage(chatId, "[image received — file storage coming soon]", message.message_id);
    } else if (message.document) {
      const name = message.document.file_name ?? "unnamed";
      await saveMessage(chatId, `[document: ${name} — file storage coming soon]`, message.message_id);
    }
    return;
  }

  // Check if it's a command
  if (text.startsWith("/")) {
    const spaceIdx = text.indexOf(" ");
    const command = spaceIdx > 0 ? text.slice(0, spaceIdx) : text;
    const args = spaceIdx > 0 ? text.slice(spaceIdx + 1).trim() : "";
    await handleCommand(chatId, command.toLowerCase(), args);
    return;
  }

  // Regular message — save it
  await saveMessage(chatId, text, message.message_id);
}
