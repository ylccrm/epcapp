/*
  # Add Equipment File Fields

  1. Changes
    - Add `manual_url` field to store equipment manual PDF
    - Add `invoice_url` field to store purchase invoice/receipt
    - Add `purchase_date` field to track when equipment was purchased
  
  2. Security
    - No changes to existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_equipment' AND column_name = 'manual_url'
  ) THEN
    ALTER TABLE project_equipment ADD COLUMN manual_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_equipment' AND column_name = 'invoice_url'
  ) THEN
    ALTER TABLE project_equipment ADD COLUMN invoice_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_equipment' AND column_name = 'purchase_date'
  ) THEN
    ALTER TABLE project_equipment ADD COLUMN purchase_date date;
  END IF;
END $$;
