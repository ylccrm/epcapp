/*
  # Add Currency Configuration to Projects

  1. Changes
    - Add `currency` field to store currency code (USD, COP, EUR, MXN, etc.)
    - Add `currency_country` field to store country name for context
    - Add `exchange_rate` field to store exchange rate relative to USD
  
  2. Details
    - Default currency is USD with exchange rate 1.0
    - Each project can have its own currency configuration
    - Exchange rates are stored relative to USD for consistency
    - All monetary values in database remain in USD, conversion happens in UI
  
  3. Security
    - No changes to existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'currency'
  ) THEN
    ALTER TABLE projects ADD COLUMN currency text DEFAULT 'USD' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'currency_country'
  ) THEN
    ALTER TABLE projects ADD COLUMN currency_country text DEFAULT 'United States';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'exchange_rate'
  ) THEN
    ALTER TABLE projects ADD COLUMN exchange_rate numeric(10, 4) DEFAULT 1.0 NOT NULL;
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN projects.exchange_rate IS 'Exchange rate from USD to local currency (e.g., 4000 for COP means 1 USD = 4000 COP)';
