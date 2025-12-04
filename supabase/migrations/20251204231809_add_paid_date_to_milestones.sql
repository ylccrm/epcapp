/*
  # Add paid_date Column to Payment Milestones

  1. Changes
    - Add `paid_date` column to `contract_payment_milestones` table
      - Type: timestamptz (timestamp with timezone)
      - Nullable: allows null for pending payments
      - Purpose: track when each payment milestone was marked as paid
  
  2. Notes
    - This field is populated when a milestone status changes to 'paid'
    - Used to display payment history and audit trail
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_payment_milestones' AND column_name = 'paid_date'
  ) THEN
    ALTER TABLE contract_payment_milestones ADD COLUMN paid_date timestamptz;
  END IF;
END $$;