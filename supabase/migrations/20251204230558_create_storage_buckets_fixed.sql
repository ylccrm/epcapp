/*
  # Create Storage Buckets
  
  ## Buckets Created
  1. purchase-order-pdfs - For purchase order PDF files
  2. project-documents - For project documentation files
  3. milestone-evidence - For milestone photos and evidence
  4. provider-documents - For provider related documents
  5. equipment-photos - For equipment photos and manuals
  
  ## Security
  - All buckets are public for simplicity (can be restricted later)
  - File size limits enforced at application level
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('purchase-order-pdfs', 'purchase-order-pdfs', true),
  ('project-documents', 'project-documents', true),
  ('milestone-evidence', 'milestone-evidence', true),
  ('provider-documents', 'provider-documents', true),
  ('equipment-photos', 'equipment-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Purchase order pdfs policies
  DROP POLICY IF EXISTS "Allow authenticated uploads to purchase-order-pdfs" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated read from purchase-order-pdfs" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete from purchase-order-pdfs" ON storage.objects;
  
  -- Project documents policies
  DROP POLICY IF EXISTS "Allow authenticated uploads to project-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated read from project-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete from project-documents" ON storage.objects;
  
  -- Milestone evidence policies
  DROP POLICY IF EXISTS "Allow authenticated uploads to milestone-evidence" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated read from milestone-evidence" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete from milestone-evidence" ON storage.objects;
  
  -- Provider documents policies
  DROP POLICY IF EXISTS "Allow authenticated uploads to provider-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated read from provider-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete from provider-documents" ON storage.objects;
  
  -- Equipment photos policies
  DROP POLICY IF EXISTS "Allow authenticated uploads to equipment-photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated read from equipment-photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete from equipment-photos" ON storage.objects;
END $$;

-- Create policies for purchase-order-pdfs
CREATE POLICY "Allow authenticated uploads to purchase-order-pdfs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'purchase-order-pdfs');

CREATE POLICY "Allow authenticated read from purchase-order-pdfs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'purchase-order-pdfs');

CREATE POLICY "Allow authenticated delete from purchase-order-pdfs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'purchase-order-pdfs');

-- Create policies for project-documents
CREATE POLICY "Allow authenticated uploads to project-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-documents');

CREATE POLICY "Allow authenticated read from project-documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-documents');

CREATE POLICY "Allow authenticated delete from project-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-documents');

-- Create policies for milestone-evidence
CREATE POLICY "Allow authenticated uploads to milestone-evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'milestone-evidence');

CREATE POLICY "Allow authenticated read from milestone-evidence"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'milestone-evidence');

CREATE POLICY "Allow authenticated delete from milestone-evidence"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'milestone-evidence');

-- Create policies for provider-documents
CREATE POLICY "Allow authenticated uploads to provider-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'provider-documents');

CREATE POLICY "Allow authenticated read from provider-documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'provider-documents');

CREATE POLICY "Allow authenticated delete from provider-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'provider-documents');

-- Create policies for equipment-photos
CREATE POLICY "Allow authenticated uploads to equipment-photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'equipment-photos');

CREATE POLICY "Allow authenticated read from equipment-photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'equipment-photos');

CREATE POLICY "Allow authenticated delete from equipment-photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'equipment-photos');
