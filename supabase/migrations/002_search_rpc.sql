-- Full-text search RPC function
CREATE OR REPLACE FUNCTION search_entries(search_query TEXT, result_limit INT DEFAULT 20)
RETURNS SETOF entries AS $$
BEGIN
  RETURN QUERY
    SELECT *
    FROM entries
    WHERE to_tsvector('english', coalesce(title, '') || ' ' || content)
          @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank(
      to_tsvector('english', coalesce(title, '') || ' ' || content),
      plainto_tsquery('english', search_query)
    ) DESC, created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
