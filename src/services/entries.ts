import { getSupabase } from "../lib/supabase.js";
import { detectContentType } from "../lib/content-detector.js";
import type { Entry, CreateEntryInput, UpdateEntryInput, SearchOptions } from "../lib/types.js";

const TABLE = "entries";

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  const db = getSupabase();

  // Auto-detect content type if not provided
  const detected = detectContentType(input.content);

  const row = {
    content: input.content,
    content_type: input.content_type ?? detected.type,
    title: input.title ?? detected.title,
    tags: input.tags ?? [],
    metadata: { ...detected.metadata, ...input.metadata },
    source: input.source ?? "api",
    source_message_id: input.source_message_id ?? null,
  };

  const { data, error } = await db.from(TABLE).insert(row).select().single();
  if (error) throw error;
  return data as Entry;
}

export async function getEntry(id: string): Promise<Entry | null> {
  const db = getSupabase();
  const { data, error } = await db.from(TABLE).select().eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data as Entry;
}

export async function updateEntry(id: string, input: UpdateEntryInput): Promise<Entry> {
  const db = getSupabase();
  const { data, error } = await db.from(TABLE).update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const db = getSupabase();
  const { error } = await db.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function listEntries(options: SearchOptions = {}): Promise<Entry[]> {
  const db = getSupabase();
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  let query = db.from(TABLE).select();

  if (options.content_type) {
    query = query.eq("content_type", options.content_type);
  }

  if (options.tags && options.tags.length > 0) {
    query = query.overlaps("tags", options.tags);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function searchEntries(query: string, limit = 20): Promise<Entry[]> {
  const db = getSupabase();

  // Use PostgreSQL full-text search via RPC
  const { data, error } = await db.rpc("search_entries", {
    search_query: query,
    result_limit: limit,
  });

  if (error) {
    // Fallback: if the RPC doesn't exist yet, use ilike
    const { data: fallback, error: fallbackError } = await db
      .from(TABLE)
      .select()
      .or(`content.ilike.%${query}%,title.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fallbackError) throw fallbackError;
    return (fallback ?? []) as Entry[];
  }

  return (data ?? []) as Entry[];
}

export async function addTags(id: string, newTags: string[]): Promise<Entry> {
  const entry = await getEntry(id);
  if (!entry) throw new Error(`Entry ${id} not found`);

  const merged = [...new Set([...entry.tags, ...newTags])];
  return updateEntry(id, { tags: merged });
}
