/*
  # Corregir políticas RLS de contratos
  
  1. Problema identificado
    - Las políticas existentes solo permiten acceso al rol 'anon'
    - Los usuarios autenticados usan el rol 'authenticated'
    - Esto bloquea todas las operaciones de usuarios autenticados
  
  2. Solución
    - Eliminar políticas existentes
    - Crear nuevas políticas para usuarios autenticados
    - Permitir todas las operaciones CRUD para usuarios autenticados
  
  3. Seguridad
    - Solo usuarios autenticados pueden realizar operaciones
    - Todas las operaciones están permitidas para usuarios autenticados
    - Los usuarios anónimos no tienen acceso
*/

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can view contracts" ON contracts;
DROP POLICY IF EXISTS "Public can insert contracts" ON contracts;
DROP POLICY IF EXISTS "Public can update contracts" ON contracts;
DROP POLICY IF EXISTS "Public can delete contracts" ON contracts;

-- Crear políticas para usuarios autenticados
CREATE POLICY "Authenticated users can view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contracts"
  ON contracts FOR DELETE
  TO authenticated
  USING (true);
