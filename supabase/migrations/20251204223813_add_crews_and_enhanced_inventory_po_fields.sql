/*
  # Agregar Equipos y Campos Adicionales para Inventario y Órdenes de Compra

  ## Nuevas Tablas
  
  1. **project_crews**
     - Tabla para gestionar los equipos de trabajo asignados a proyectos
     - Campos: id, project_id, name, leader, members_count, current_task, status, specialty, phone, created_at
     - Status: active, inactive, on_leave
     - Specialty: instalacion, electrico, montaje, supervision

  ## Modificaciones a Tablas Existentes

  2. **inventory_items** - Campos adicionales:
     - supplier (proveedor)
     - unit (unidad de medida: pza, m, kg, caja, palet)
     - warehouse_location (ubicación en bodega)
     - min_stock (stock mínimo para alertas)
     - last_purchase_date (última fecha de compra)
     - description (descripción detallada del producto)

  3. **purchase_orders** - Campos adicionales:
     - order_number (número único de orden)
     - order_date (fecha de la orden)
     - expected_delivery_date (fecha esperada de entrega)
     - received_date (fecha real de recepción)
     - payment_terms (términos de pago)
     - notes (notas adicionales)

  4. **purchase_order_items** - Nueva tabla para items detallados:
     - Tabla de detalle para los items de cada orden de compra
     - Campos: id, purchase_order_id, inventory_item_id, quantity, unit_price_usd, subtotal_usd

  ## Seguridad
  - RLS habilitado en todas las nuevas tablas
  - Políticas para usuarios autenticados
*/

-- 1. CREAR TABLA DE EQUIPOS (CREWS)
CREATE TABLE IF NOT EXISTS project_crews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  leader text NOT NULL,
  members_count integer NOT NULL DEFAULT 1,
  current_task text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  specialty text CHECK (specialty IN ('instalacion', 'electrico', 'montaje', 'supervision')),
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view crews"
  ON project_crews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert crews"
  ON project_crews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update crews"
  ON project_crews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete crews"
  ON project_crews FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_project_crews_project_id ON project_crews(project_id);

-- 2. AGREGAR CAMPOS ADICIONALES A INVENTORY_ITEMS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN supplier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'unit'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN unit text DEFAULT 'pza' CHECK (unit IN ('pza', 'm', 'kg', 'caja', 'palet', 'rollo', 'litro'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'warehouse_location'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN warehouse_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'min_stock'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN min_stock integer DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'last_purchase_date'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN last_purchase_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN description text;
  END IF;
END $$;

-- 3. AGREGAR CAMPOS ADICIONALES A PURCHASE_ORDERS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN order_number text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'order_date'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN order_date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'expected_delivery_date'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN expected_delivery_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'received_date'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN received_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN payment_terms text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'notes'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN notes text;
  END IF;
END $$;

-- 4. CREAR TABLA DE ITEMS DE ÓRDENES DE COMPRA
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_usd numeric(10, 2) NOT NULL DEFAULT 0,
  subtotal_usd numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase order items"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert purchase order items"
  ON purchase_order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update purchase order items"
  ON purchase_order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete purchase order items"
  ON purchase_order_items FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_inventory_id ON purchase_order_items(inventory_item_id);
