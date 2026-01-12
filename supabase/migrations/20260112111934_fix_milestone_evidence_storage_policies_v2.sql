/*
  # Fix Milestone Evidence Storage Policies

  1. Changes
    - Drop all existing policies for milestone-evidence bucket
    - Recreate clear and simple policies for authenticated users
    - Ensure bucket allows uploads and access

  2. Security
    - Authenticated users can upload files
    - Authenticated users can view all files
    - Authenticated users can delete their own files
*/

-- Drop all existing policies for milestone-evidence
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated uploads to milestone-evidence" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated read from milestone-evidence" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete from milestone-evidence" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload milestone evidence" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can view milestone evidence" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own milestone evidence" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own milestone evidence" ON storage.objects;
END $$;

-- Ensure bucket exists and is public for easy access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'milestone-evidence',
  'milestone-evidence',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Create simple policies for milestone-evidence
CREATE POLICY "milestone_evidence_upload_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'milestone-evidence');

CREATE POLICY "milestone_evidence_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'milestone-evidence');

CREATE POLICY "milestone_evidence_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'milestone-evidence' AND auth.uid() = owner::uuid)
WITH CHECK (bucket_id = 'milestone-evidence' AND auth.uid() = owner::uuid);

CREATE POLICY "milestone_evidence_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'milestone-evidence' AND auth.uid() = owner::uuid);

-- Allow public SELECT if bucket is public
CREATE POLICY "milestone_evidence_public_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'milestone-evidence');
