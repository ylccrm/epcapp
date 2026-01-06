/*
  # Add payment receipt field to payment milestones

  1. Changes
    - Add `payment_receipt_url` column to `payment_milestones` table to store payment receipts
    - Add `paid_date` column to track when payment was made
    - Add `paid_by` column to track who marked it as paid

  2. Storage
    - Create storage bucket for payment receipts if it doesn't exist
    - Set up RLS policies for secure access
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_milestones' AND column_name = 'payment_receipt_url'
  ) THEN
    ALTER TABLE payment_milestones ADD COLUMN payment_receipt_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_milestones' AND column_name = 'paid_date'
  ) THEN
    ALTER TABLE payment_milestones ADD COLUMN paid_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_milestones' AND column_name = 'paid_by'
  ) THEN
    ALTER TABLE payment_milestones ADD COLUMN paid_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload payment receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Authenticated users can view payment receipts" ON storage.objects;
CREATE POLICY "Authenticated users can view payment receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Users can update their uploaded payment receipts" ON storage.objects;
CREATE POLICY "Users can update their uploaded payment receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Users can delete payment receipts" ON storage.objects;
CREATE POLICY "Users can delete payment receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-receipts');