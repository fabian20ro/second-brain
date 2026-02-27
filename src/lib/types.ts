export type ContentType = "note" | "link" | "code" | "image" | "document" | "journal";

export type Source = "telegram" | "discord" | "whatsapp" | "api";

export interface Entry {
  id: string;
  content: string;
  content_type: ContentType;
  title: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  source: Source;
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryInput {
  content: string;
  content_type?: ContentType;
  title?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  source?: Source;
  source_message_id?: string;
}

export interface UpdateEntryInput {
  content?: string;
  content_type?: ContentType;
  title?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  query?: string;
  content_type?: ContentType;
  tags?: string[];
  limit?: number;
  offset?: number;
}
