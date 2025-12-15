/*
  # Create Milestone Evidence Storage Bucket

  1. Storage Bucket
    - milestone-evidence bucket for storing photos, documents, and videos

  2. Security
    - Authenticated users can upload files
    - Authenticated users can view files
    - Users can delete their own files
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'milestone-evidence',
  'milestone-evidence',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload milestone evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'milestone-evidence');

CREATE POLICY "Authenticated users can view milestone evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'milestone-evidence');

CREATE POLICY "Users can update their own milestone evidence"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'milestone-evidence' AND auth.uid() = owner::uuid)
WITH CHECK (bucket_id = 'milestone-evidence' AND auth.uid() = owner::uuid);

CREATE POLICY "Users can delete their own milestone evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'milestone-evidence' AND auth.uid() = owner::uuid);
