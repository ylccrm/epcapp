/*
  # Ensure Project Currency Fields Exist

  1. Changes
    - Verify and add currency field if not exists
    - Verify and add currency_country field if not exists
    - Verify and add exchange_rate field if not exists

  2. Security
    - No changes to RLS policies
*/

DO $$
BEGIN
  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE projects ADD COLUMN currency text DEFAULT 'USD' NOT NULL;
  END IF;

  -- Add currency_country column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'currency_country'
  ) THEN
    ALTER TABLE projects ADD COLUMN currency_country text DEFAULT 'United States';
  END IF;

  -- Add exchange_rate column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'exchange_rate'
  ) THEN
    ALTER TABLE projects ADD COLUMN exchange_rate numeric(10, 4) DEFAULT 1.0 NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN projects.exchange_rate IS 'Exchange rate from USD to local currency (e.g., 4000 for COP means 1 USD = 4000 COP)';
