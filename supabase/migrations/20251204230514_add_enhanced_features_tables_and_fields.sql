/*
  # Enhanced Features - Tables and Fields
  
  ## New Tables
  
  ### 1. `providers`
    - `id` (uuid, primary key)
    - `name` (text) - Provider name
    - `contact_person` (text) - Contact person name
    - `email` (text) - Email address
    - `phone` (text) - Phone number
    - `address` (text) - Physical address
    - `tax_id` (text) - Tax ID / NIT
    - `category` (text) - Materials, Services, Equipment
    - `payment_terms` (text) - Payment terms (30 days, 60 days, etc)
    - `bank_info` (jsonb) - Banking information
    - `status` (text) - active, inactive
    - `notes` (text) - Additional notes
    - `rating` (integer) - 1-5 star rating
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 2. `inventory_transactions`
    - `id` (uuid, primary key)
    - `inventory_item_id` (uuid, foreign key)
    - `transaction_type` (text) - entry, exit, adjustment
    - `quantity` (integer) - Quantity changed
    - `reference_number` (text) - PO number or reference
    - `provider_name` (text) - Provider if applicable
    - `notes` (text) - Transaction notes
    - `created_by` (text) - User who created
    - `created_at` (timestamptz)
  
  ### 3. `milestone_evidence`
    - `id` (uuid, primary key)
    - `milestone_id` (uuid, foreign key)
    - `file_url` (text) - URL to file in storage
    - `file_name` (text) - Original filename
    - `file_type` (text) - image/jpeg, image/png, etc
    - `description` (text) - Photo description
    - `uploaded_by` (text) - User who uploaded
    - `created_at` (timestamptz)
  
  ## Modified Tables
  
  ### `purchase_orders` - Add fields:
    - `received_date` (timestamptz) - When order was received
    - `reception_notes` (text) - Notes about reception
    - `pdf_url` (text) - Link to PDF document
  
  ### `contract_payment_milestones` - Add fields:
    - `paid_date` (timestamptz) - When payment was made
    - `payment_method` (text) - Wire transfer, check, etc
    - `payment_reference` (text) - Transaction reference
  
  ### `contracts` - Add field:
    - `contract_pdf_url` (text) - Link to contract PDF
  
  ### `project_docs` - Add fields:
    - `file_url` (text) - URL to file in storage
    - `file_size` (integer) - File size in bytes
    - `file_type` (text) - MIME type
    - `uploaded_by` (text) - User who uploaded
  
  ## Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  category TEXT DEFAULT 'Materiales',
  payment_terms TEXT DEFAULT '30 días',
  bank_info JSONB,
  status TEXT DEFAULT 'active',
  notes TEXT,
  rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on providers"
  ON providers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'entry',
  quantity INTEGER NOT NULL,
  reference_number TEXT,
  provider_name TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on inventory_transactions"
  ON inventory_transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create milestone_evidence table
CREATE TABLE IF NOT EXISTS milestone_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  description TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE milestone_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on milestone_evidence"
  ON milestone_evidence
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add fields to purchase_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'received_date'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN received_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'reception_notes'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN reception_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN pdf_url TEXT;
  END IF;
END $$;

-- Add fields to contract_payment_milestones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_payment_milestones' AND column_name = 'paid_date'
  ) THEN
    ALTER TABLE contract_payment_milestones ADD COLUMN paid_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_payment_milestones' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE contract_payment_milestones ADD COLUMN payment_method TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_payment_milestones' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE contract_payment_milestones ADD COLUMN payment_reference TEXT;
  END IF;
END $$;

-- Add field to contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'contract_pdf_url'
  ) THEN
    ALTER TABLE contracts ADD COLUMN contract_pdf_url TEXT;
  END IF;
END $$;

-- Add fields to project_docs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_docs' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE project_docs ADD COLUMN file_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_docs' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE project_docs ADD COLUMN file_size INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_docs' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE project_docs ADD COLUMN file_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_docs' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE project_docs ADD COLUMN uploaded_by TEXT;
  END IF;
END $$;

-- Insert sample providers
INSERT INTO providers (name, contact_person, email, phone, category, payment_terms, status, rating)
VALUES
  ('Montajes Eléctricos del Norte', 'Carlos Rodríguez', 'carlos@montajesnorte.com', '+57 300 123 4567', 'Servicios', '30 días', 'active', 5),
  ('Seguridad Alturas Ltda', 'Ana María López', 'ana@seguridadalturas.com', '+57 310 234 5678', 'Servicios', '15 días', 'active', 4),
  ('Ingeniería & Diseños S.A.S', 'Jorge Martínez', 'jorge@ingenieriadiseños.com', '+57 320 345 6789', 'Servicios', '45 días', 'active', 5),
  ('Suministros Solares Colombia', 'María González', 'maria@suministrossolares.com', '+57 301 456 7890', 'Materiales', '60 días', 'active', 4),
  ('Estructuras Metálicas', 'Pedro Sánchez', 'pedro@estructurasmet.com', '+57 315 567 8901', 'Materiales', '30 días', 'active', 4),
  ('Cable & Energía S.A.S', 'Luisa Fernández', 'luisa@cableenergia.com', '+57 312 678 9012', 'Materiales', '45 días', 'active', 5)
ON CONFLICT DO NOTHING;
