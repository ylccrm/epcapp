/*
  # Update payment milestone status values

  1. Changes
    - Remove 'Facturado' status from payment_milestones table
    - Update allowed status values to: 'Pendiente', 'Cumplido', 'Pagado'
    - Update existing 'Facturado' records to 'Cumplido'

  2. Security
    - Maintains existing RLS policies
*/

UPDATE payment_milestones
SET status = 'Cumplido'
WHERE status = 'Facturado';

ALTER TABLE payment_milestones
DROP CONSTRAINT IF EXISTS payment_milestones_status_check;

ALTER TABLE payment_milestones
ADD CONSTRAINT payment_milestones_status_check 
CHECK (status IN ('Pendiente', 'Cumplido', 'Pagado'));