/*
  # Solar EPC Management System - Complete Schema

  ## Overview
  Complete database schema for managing Solar EPC projects including projects, inventory,
  milestones, contracts, purchase orders, and documentation.

  ## Tables Created

  1. **projects**
     - Core project information
     - Columns: id, name, client, status, total_budget_usd, start_date, location, created_at
     - Status values: draft, execution, finished

  2. **inventory_items**
     - Global catalog of materials and equipment
     - Columns: id, sku, name, category, stock_quantity, unit_cost_usd, image_url, created_at
     - Categories: panels, inverters, structure, electrical, hse

  3. **project_milestones**
     - Project execution milestones (7 standard milestones per project)
     - Columns: id, project_id, name, progress_percentage, subcontractor_id, order_index, created_at
     - Progress: 0-100

  4. **contracts**
     - Financial contracts with subcontractors
     - Columns: id, project_id, subcontractor_name, service_type, total_value_usd, paid_amount_usd, created_at

  5. **purchase_orders**
     - Material purchase orders
     - Columns: id, project_id, provider_name, status, total_usd, created_at
     - Status: pending, received

  6. **project_docs**
     - Project documentation storage
     - Columns: id, project_id, category, file_url, file_name, created_at
     - Categories: engineering, legal, hse

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users to manage their data
*/

-- 1. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'execution', 'finished')),
  total_budget_usd numeric(12, 2) NOT NULL DEFAULT 0,
  start_date date,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- 2. INVENTORY ITEMS TABLE (Global Catalog)
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('panels', 'inverters', 'structure', 'electrical', 'hse')),
  stock_quantity integer NOT NULL DEFAULT 0,
  unit_cost_usd numeric(10, 2) NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert inventory"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update inventory"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete inventory"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (true);

-- 3. PROJECT MILESTONES TABLE
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  subcontractor_name text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert milestones"
  ON project_milestones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update milestones"
  ON project_milestones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete milestones"
  ON project_milestones FOR DELETE
  TO authenticated
  USING (true);

-- 4. CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subcontractor_name text NOT NULL,
  service_type text NOT NULL,
  total_value_usd numeric(12, 2) NOT NULL DEFAULT 0,
  paid_amount_usd numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete contracts"
  ON contracts FOR DELETE
  TO authenticated
  USING (true);

-- 5. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
  total_usd numeric(12, 2) NOT NULL DEFAULT 0,
  items_description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update purchase orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete purchase orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (true);

-- 6. PROJECT DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS project_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('engineering', 'legal', 'hse')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents"
  ON project_docs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert documents"
  ON project_docs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update documents"
  ON project_docs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete documents"
  ON project_docs FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_project_id ON project_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);