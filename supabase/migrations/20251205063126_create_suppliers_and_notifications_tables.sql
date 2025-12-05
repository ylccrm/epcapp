/*
  # Crear tablas de Proveedores y Notificaciones
  
  1. Nueva Tabla: suppliers (proveedores)
    - `id` (uuid, primary key)
    - `name` (text) - Nombre del proveedor
    - `contact_person` (text) - Persona de contacto
    - `email` (text) - Email
    - `phone` (text) - Teléfono
    - `address` (text) - Dirección
    - `tax_id` (text) - NIT/RUT
    - `category` (text) - Categoría (Paneles, Inversores, Eléctrico, etc.)
    - `payment_terms` (text) - Términos de pago
    - `rating` (integer) - Calificación 1-5
    - `status` (text) - Estado (active, inactive)
    - `notes` (text) - Notas adicionales
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  2. Nueva Tabla: notifications (notificaciones)
    - `id` (uuid, primary key)
    - `title` (text) - Título
    - `message` (text) - Mensaje
    - `type` (text) - Tipo (alert, info, success, warning)
    - `category` (text) - Categoría (payment, inventory, milestone, general)
    - `is_read` (boolean) - Leída o no
    - `related_project_id` (uuid, nullable) - Proyecto relacionado
    - `related_contract_id` (uuid, nullable) - Contrato relacionado
    - `created_at` (timestamptz)
  
  3. Seguridad
    - RLS habilitado en ambas tablas
    - Políticas para usuarios autenticados
*/

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  category text DEFAULT 'General',
  payment_terms text DEFAULT '30 días',
  rating integer DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('alert', 'info', 'success', 'warning')),
  category text DEFAULT 'general' CHECK (category IN ('payment', 'inventory', 'milestone', 'general')),
  is_read boolean DEFAULT false,
  related_project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  related_contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para suppliers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para suppliers
CREATE POLICY "Users can view all suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para notifications
CREATE POLICY "Users can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (true);

-- Datos de ejemplo para proveedores
INSERT INTO suppliers (name, contact_person, email, phone, category, payment_terms, rating, status) VALUES
('Distribuidora Solar Colombia', 'Carlos Méndez', 'carlos@distsolarcol.com', '+57 300 123 4567', 'Paneles Solares', '50% adelanto, 50% entrega', 5, 'active'),
('Inversores y Más S.A.S', 'María González', 'maria@inversoresymas.com', '+57 310 234 5678', 'Inversores', '30 días', 4, 'active'),
('Cables & Energía', 'Pedro Ramírez', 'pedro@cablesenergia.com', '+57 320 345 6789', 'Eléctrico', '45 días', 4, 'active'),
('Estructuras Metálicas del Norte', 'Ana Torres', 'ana@estructurasnorte.com', '+57 315 456 7890', 'Estructuras', '50% adelanto, 50% instalado', 5, 'active'),
('Seguridad Alturas Ltda', 'Juan Pérez', 'juan@seguridadalturas.com', '+57 300 567 8901', 'HSE', '30 días', 5, 'active'),
('Montajes Eléctricos del Norte', 'Luis Gómez', 'luis@montajesnorte.com', '+57 312 678 9012', 'Instalación', '60 días', 3, 'active');

-- Datos de ejemplo para notificaciones
INSERT INTO notifications (title, message, type, category, is_read) VALUES
('Pago Vencido', 'El contrato con Cables & Energía tiene un pago vencido de $5,800,000 COP', 'alert', 'payment', false),
('Stock Bajo', 'Cable Solar 6mm Rojo tiene solo 2 unidades. Mínimo: 20', 'warning', 'inventory', false),
('Hito Completado', 'Se completó el hito "Instalación de Estructura" en Planta Industrial XYZ', 'success', 'milestone', false),
('Nuevo Proveedor', 'Se agregó el proveedor "Distribuidora Solar Colombia" al sistema', 'info', 'general', true),
('Stock Crítico', 'Cable Solar 6mm Negro tiene solo 8 unidades. Mínimo: 20', 'warning', 'inventory', false);
