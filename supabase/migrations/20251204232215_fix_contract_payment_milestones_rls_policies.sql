/*
  # Fix RLS Policies for Contract Payment Milestones

  1. Changes
    - Drop existing restrictive policies that require authenticated users
    - Create new policies that allow anonymous (anon) users to perform operations
    - Align policies with the contracts table which also allows anon access
  
  2. Security Notes
    - Since the contracts table allows anon access, payment milestones should too
    - These policies maintain the same permissive structure as the parent contracts table
    - This ensures the application works without authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view payment milestones" ON contract_payment_milestones;
DROP POLICY IF EXISTS "Users can insert payment milestones" ON contract_payment_milestones;
DROP POLICY IF EXISTS "Users can update payment milestones" ON contract_payment_milestones;
DROP POLICY IF EXISTS "Users can delete payment milestones" ON contract_payment_milestones;

-- Create new policies for anon users (matching contracts table)
CREATE POLICY "Public can view payment milestones"
  ON contract_payment_milestones FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert payment milestones"
  ON contract_payment_milestones FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update payment milestones"
  ON contract_payment_milestones FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete payment milestones"
  ON contract_payment_milestones FOR DELETE
  TO anon
  USING (true);