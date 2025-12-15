/*
  # Add Missing Fields to Project Equipment Table

  1. Changes
    - Add `status` field to track equipment lifecycle (new, installed, maintenance, retired)
    - Add `purchase_order_id` field to link equipment to purchase orders
    - Add `quantity` field to track number of equipment items
  
  2. Security
    - No changes to existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_equipment' AND column_name = 'status'
  ) THEN
    ALTER TABLE project_equipment ADD COLUMN status text DEFAULT 'new' CHECK (status IN ('new', 'installed', 'maintenance', 'retired'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_equipment' AND column_name = 'purchase_order_id'
  ) THEN
    ALTER TABLE project_equipment ADD COLUMN purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_equipment' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE project_equipment ADD COLUMN quantity integer DEFAULT 1;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_equipment_purchase_order_id ON project_equipment(purchase_order_id);
