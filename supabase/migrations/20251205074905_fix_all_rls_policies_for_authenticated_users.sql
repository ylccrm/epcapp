/*
  # Corregir todas las políticas RLS para usuarios autenticados
  
  1. Problema
    - Varias tablas tienen políticas RLS configuradas para el rol 'anon'
    - Los usuarios autenticados usan el rol 'authenticated'
    - Esto causa errores de violación de políticas de seguridad
  
  2. Tablas afectadas
    - projects
    - contract_payment_milestones
  
  3. Solución
    - Eliminar políticas existentes para 'anon'
    - Crear nuevas políticas para 'authenticated'
    - Permitir operaciones CRUD para usuarios autenticados
  
  4. Seguridad
    - Solo usuarios autenticados pueden acceder a los datos
    - Todas las operaciones están permitidas para usuarios autenticados
*/

-- ====================
-- TABLA: projects
-- ====================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can view all projects" ON projects;
DROP POLICY IF EXISTS "Public can insert projects" ON projects;
DROP POLICY IF EXISTS "Public can update projects" ON projects;
DROP POLICY IF EXISTS "Public can delete projects" ON projects;

-- Crear políticas para usuarios autenticados
CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- ====================
-- TABLA: contract_payment_milestones
-- ====================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can view payment milestones" ON contract_payment_milestones;
DROP POLICY IF EXISTS "Public can insert payment milestones" ON contract_payment_milestones;
DROP POLICY IF EXISTS "Public can update payment milestones" ON contract_payment_milestones;
DROP POLICY IF EXISTS "Public can delete payment milestones" ON contract_payment_milestones;

-- Crear políticas para usuarios autenticados
CREATE POLICY "Authenticated users can view payment milestones"
  ON contract_payment_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payment milestones"
  ON contract_payment_milestones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment milestones"
  ON contract_payment_milestones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete payment milestones"
  ON contract_payment_milestones FOR DELETE
  TO authenticated
  USING (true);
