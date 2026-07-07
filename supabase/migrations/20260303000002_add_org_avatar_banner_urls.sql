-- Add avatar_url and banner_url columns to organizations for profile photo and cover photo
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;
