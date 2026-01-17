-- Migration: Create storage buckets for avatars and logos
-- Description: Sets up public storage buckets for user avatars and organization logos

-- Create avatars bucket (for user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Create logos bucket (for organization logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[];

-- Storage policies for avatars bucket
-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Storage policies for logos bucket
-- Allow organization admins to upload logos
DROP POLICY IF EXISTS "Org admins can upload logos" ON storage.objects;
CREATE POLICY "Org admins can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
    AND u.role = 'admin'
  )
);

-- Allow organization admins to update logos
DROP POLICY IF EXISTS "Org admins can update logos" ON storage.objects;
CREATE POLICY "Org admins can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
    AND u.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'logos' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
    AND u.role = 'admin'
  )
);

-- Allow organization admins to delete logos
DROP POLICY IF EXISTS "Org admins can delete logos" ON storage.objects;
CREATE POLICY "Org admins can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
    AND u.role = 'admin'
  )
);

-- Allow public read access to logos
DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
CREATE POLICY "Logos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');
