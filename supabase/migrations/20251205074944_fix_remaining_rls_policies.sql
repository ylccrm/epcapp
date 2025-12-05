/*
  # Corregir políticas RLS restantes
  
  1. Tablas con políticas incorrectas (usando 'anon')
    - inventory_items
    - project_docs
    - project_milestones
    - purchase_orders
  
  2. Tablas con políticas incompletas
    - inventory_transactions (solo 1 política)
    - milestone_evidence (solo 1 política)
    - providers (solo 1 política)
  
  3. Solución
    - Corregir todas las políticas para usar 'authenticated'
    - Completar políticas faltantes (INSERT, UPDATE, DELETE)
    - Asegurar que todas las tablas tengan las 4 operaciones CRUD
*/

-- ====================
-- TABLA: inventory_items
-- ====================
DROP POLICY IF EXISTS "Public can view inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Public can insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Public can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Public can delete inventory items" ON inventory_items;

CREATE POLICY "Authenticated users can view inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (true);

-- ====================
-- TABLA: project_docs
-- ====================
DROP POLICY IF EXISTS "Public can view project documents" ON project_docs;
DROP POLICY IF EXISTS "Public can insert project documents" ON project_docs;
DROP POLICY IF EXISTS "Public can update project documents" ON project_docs;
DROP POLICY IF EXISTS "Public can delete project documents" ON project_docs;

CREATE POLICY "Authenticated users can view project docs"
  ON project_docs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project docs"
  ON project_docs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project docs"
  ON project_docs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project docs"
  ON project_docs FOR DELETE
  TO authenticated
  USING (true);

-- ====================
-- TABLA: project_milestones
-- ====================
DROP POLICY IF EXISTS "Public can view project milestones" ON project_milestones;
DROP POLICY IF EXISTS "Public can insert project milestones" ON project_milestones;
DROP POLICY IF EXISTS "Public can update project milestones" ON project_milestones;
DROP POLICY IF EXISTS "Public can delete project milestones" ON project_milestones;

CREATE POLICY "Authenticated users can view project milestones"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project milestones"
  ON project_milestones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project milestones"
  ON project_milestones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project milestones"
  ON project_milestones FOR DELETE
  TO authenticated
  USING (true);

-- ====================
-- TABLA: purchase_orders
-- ====================
DROP POLICY IF EXISTS "Public can view purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Public can insert purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Public can update purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Public can delete purchase orders" ON purchase_orders;

CREATE POLICY "Authenticated users can view purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete purchase orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (true);

-- ====================
-- TABLA: inventory_transactions (completar políticas)
-- ====================
DROP POLICY IF EXISTS "Users can view their own transactions" ON inventory_transactions;

CREATE POLICY "Authenticated users can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory transactions"
  ON inventory_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory transactions"
  ON inventory_transactions FOR DELETE
  TO authenticated
  USING (true);

-- ====================
-- TABLA: milestone_evidence (completar políticas)
-- ====================
DROP POLICY IF EXISTS "Users can view evidence" ON milestone_evidence;

CREATE POLICY "Authenticated users can view milestone evidence"
  ON milestone_evidence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert milestone evidence"
  ON milestone_evidence FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update milestone evidence"
  ON milestone_evidence FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete milestone evidence"
  ON milestone_evidence FOR DELETE
  TO authenticated
  USING (true);

-- ====================
-- TABLA: providers (completar políticas)
-- ====================
DROP POLICY IF EXISTS "Users can view providers" ON providers;

CREATE POLICY "Authenticated users can view providers"
  ON providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert providers"
  ON providers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update providers"
  ON providers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete providers"
  ON providers FOR DELETE
  TO authenticated
  USING (true);
