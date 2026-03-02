-- Second Brain: Initial Schema
-- Stores all captured knowledge entries

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'note',
  -- content_type values: note, link, code, image, document, journal
  title TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  -- metadata can hold: url, language, file_name, image_url, etc.
  source TEXT NOT NULL DEFAULT 'api',
  -- source values: telegram, discord, whatsapp, api
  source_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX entries_fts_idx ON entries
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || content));

-- Tags index for filtering
CREATE INDEX entries_tags_idx ON entries USING gin(tags);

-- Content type index for filtering
CREATE INDEX entries_content_type_idx ON entries (content_type);

-- Created at index for sorting/pagination
CREATE INDEX entries_created_at_idx ON entries (created_at DESC);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Ready for future AI features: add an embedding column later
-- ALTER TABLE entries ADD COLUMN embedding vector(1536);
-- CREATE INDEX entries_embedding_idx ON entries USING ivfflat (embedding vector_cosine_ops);
