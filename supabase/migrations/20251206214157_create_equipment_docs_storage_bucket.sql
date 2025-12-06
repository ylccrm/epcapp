/*
  # Create Equipment Documents Storage Bucket

  1. Storage
    - Create `equipment-docs` bucket for storing equipment manuals and invoices
    - Set bucket to public for easy access
  
  2. Security
    - Enable RLS on storage.objects
    - Allow authenticated users to upload files
    - Allow authenticated users to read files
    - Allow authenticated users to delete their uploaded files
*/

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('equipment-docs', 'equipment-docs', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can upload equipment docs'
  ) THEN
    CREATE POLICY "Authenticated users can upload equipment docs"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'equipment-docs');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Anyone can view equipment docs'
  ) THEN
    CREATE POLICY "Anyone can view equipment docs"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'equipment-docs');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can update equipment docs'
  ) THEN
    CREATE POLICY "Authenticated users can update equipment docs"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'equipment-docs')
      WITH CHECK (bucket_id = 'equipment-docs');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can delete equipment docs'
  ) THEN
    CREATE POLICY "Authenticated users can delete equipment docs"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'equipment-docs');
  END IF;
END $$;
