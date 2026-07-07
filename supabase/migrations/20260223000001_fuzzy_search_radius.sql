-- Enable pg_trgm for fuzzy text matching (trigram similarity)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indexes for fuzzy search on full_name and city
CREATE INDEX IF NOT EXISTS idx_users_fullname_trgm
  ON users USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_city_trgm
  ON users USING gin ((address->>'city') gin_trgm_ops);

-- RPC function: search professionals within a radius (Haversine formula)
-- Returns user IDs + distance in miles, ordered by proximity.
-- Uses branch coordinates as primary, falls back to user coordinates.
CREATE OR REPLACE FUNCTION search_professionals_by_radius(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_miles INTEGER DEFAULT 50
)
RETURNS TABLE(user_id UUID, distance_miles DOUBLE PRECISION)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    u.id AS user_id,
    3959 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(search_lat)) * cos(radians(COALESCE(b.latitude, u.latitude)))
        * cos(radians(COALESCE(b.longitude, u.longitude)) - radians(search_lng))
        + sin(radians(search_lat)) * sin(radians(COALESCE(b.latitude, u.latitude)))
      ))
    ) AS distance_miles
  FROM users u
  LEFT JOIN branches b ON u.branch_id = b.id
  WHERE u.is_active = true
    AND COALESCE(b.latitude, u.latitude) IS NOT NULL
    AND COALESCE(b.longitude, u.longitude) IS NOT NULL
    AND 3959 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(search_lat)) * cos(radians(COALESCE(b.latitude, u.latitude)))
        * cos(radians(COALESCE(b.longitude, u.longitude)) - radians(search_lng))
        + sin(radians(search_lat)) * sin(radians(COALESCE(b.latitude, u.latitude)))
      ))
    ) <= radius_miles
  ORDER BY distance_miles ASC;
$$;

-- RPC function: fuzzy city search using trigram similarity
-- Returns user IDs with similarity score above threshold
CREATE OR REPLACE FUNCTION search_users_by_fuzzy_city(
  search_city TEXT,
  similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE(user_id UUID, similarity_score REAL)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    u.id AS user_id,
    similarity(address->>'city', search_city) AS similarity_score
  FROM users u
  WHERE u.is_active = true
    AND address->>'city' IS NOT NULL
    AND similarity(address->>'city', search_city) >= similarity_threshold
  ORDER BY similarity_score DESC;
$$;
