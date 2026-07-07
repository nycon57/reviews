-- Curated background-music library for video clip rendering.
-- Global (not org-scoped): tracks are licensed platform-wide and selectable
-- in the Share Studio asset creator. Writes happen via service role only.

CREATE TABLE clip_music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mood TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  duration_seconds NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clip_music_tracks ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can browse the active library.
CREATE POLICY "authenticated_read_active_clip_music" ON clip_music_tracks
  FOR SELECT TO authenticated USING (is_active = TRUE);
