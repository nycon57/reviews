-- Add latitude and longitude columns to branches table
-- Enables branch-based map coordinates for the directory

ALTER TABLE branches
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create spatial index for efficient geographic queries
CREATE INDEX IF NOT EXISTS idx_branches_coordinates
ON branches (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN branches.latitude IS 'Geographic latitude coordinate for map display';
COMMENT ON COLUMN branches.longitude IS 'Geographic longitude coordinate for map display';
