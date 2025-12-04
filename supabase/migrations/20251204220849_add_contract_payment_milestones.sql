/*
  # Add Contract Payment Milestones Table

  1. New Table
    - `contract_payment_milestones`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key to contracts)
      - `milestone_name` (text) - Name/description of payment milestone
      - `percentage` (numeric) - Percentage of total contract value
      - `amount_usd` (numeric) - Calculated amount in USD
      - `status` (text) - Payment status: pending, paid
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS contract_payment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  percentage numeric(5, 2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  amount_usd numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contract_payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment milestones"
  ON contract_payment_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert payment milestones"
  ON contract_payment_milestones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payment milestones"
  ON contract_payment_milestones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete payment milestones"
  ON contract_payment_milestones FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_payment_milestones_contract 
  ON contract_payment_milestones(contract_id);
