/*
  # Sistema de Gestión de Pagos y Compromisos

  1. Nuevas Tablas
    - `wbs_items` - Catálogo de rubros/ítems (Work Breakdown Structure)
      - Disciplinas: PV, Eléctrico, Civil, Seguridad, Ingeniería, Permisos
      - Componentes y descripción técnica
    
    - `purchase_commitments` - Órdenes de compra/servicio (compromisos)
      - Proveedor, proyecto, tipo, montos, fechas
      - Estado del compromiso
    
    - `payment_milestones` - Hitos de pago por compromiso
      - % o monto fijo, condición de cumplimiento
      - Fecha planificada y real
    
    - `invoices` - Facturas recibidas
      - Relacionadas a compromisos y hitos
      - Montos, impuestos, documentos
    
    - `payments` - Pagos realizados
      - Fecha, monto, método, referencia
      - Estado y observaciones

  2. Seguridad
    - Deshabilitar RLS para acceso público (sin autenticación)
*/

-- Tabla de WBS (Work Breakdown Structure) - Catálogo de rubros
CREATE TABLE IF NOT EXISTS wbs_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discipline text NOT NULL CHECK (discipline IN ('PV', 'Eléctrico', 'Civil', 'Seguridad', 'Ingeniería', 'Permisos', 'SCADA', 'O&M')),
  component text NOT NULL,
  description text,
  unit text DEFAULT 'UN',
  item_type text DEFAULT 'Equipo' CHECK (item_type IN ('Equipo', 'Servicio', 'Subcontrato', 'Material')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabla de compromisos (OC/OS)
CREATE TABLE IF NOT EXISTS purchase_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id),
  commitment_number text UNIQUE,
  commitment_type text DEFAULT 'Equipo' CHECK (commitment_type IN ('Equipo', 'Servicio', 'Subcontrato', 'Mixto')),
  wbs_item_id uuid REFERENCES wbs_items(id),
  description text,
  currency text DEFAULT 'USD',
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  retention_amount numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  issue_date date DEFAULT CURRENT_DATE,
  delivery_date date,
  status text DEFAULT 'Cotizado' CHECK (status IN ('Cotizado', 'Aprobado', 'Ordenado', 'Entregado', 'Cerrado', 'Cancelado')),
  notes text,
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de hitos de pago por compromiso
CREATE TABLE IF NOT EXISTS payment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid REFERENCES purchase_commitments(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  milestone_description text,
  percentage numeric CHECK (percentage >= 0 AND percentage <= 100),
  amount numeric DEFAULT 0,
  condition_description text,
  planned_date date,
  completed_date date,
  status text DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Cumplido', 'Facturado', 'Pagado')),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  commitment_id uuid REFERENCES purchase_commitments(id),
  milestone_id uuid REFERENCES payment_milestones(id),
  supplier_id uuid REFERENCES suppliers(id),
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  currency text DEFAULT 'USD',
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  retention_amount numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  status text DEFAULT 'Recibida' CHECK (status IN ('Recibida', 'Aprobada', 'Programada', 'Pagada', 'Rechazada')),
  attachment_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id),
  commitment_id uuid REFERENCES purchase_commitments(id),
  supplier_id uuid REFERENCES suppliers(id),
  payment_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  payment_method text DEFAULT 'Transferencia' CHECK (payment_method IN ('Transferencia', 'Cheque', 'Efectivo', 'Tarjeta', 'Otro')),
  reference_number text,
  bank_account text,
  status text DEFAULT 'Programado' CHECK (status IN ('Programado', 'Pagado', 'Parcial', 'Rechazado', 'Cancelado')),
  notes text,
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_wbs_items_discipline ON wbs_items(discipline);
CREATE INDEX IF NOT EXISTS idx_purchase_commitments_project ON purchase_commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_commitments_supplier ON purchase_commitments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_commitments_status ON purchase_commitments(status);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_commitment ON payment_milestones(commitment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_commitment ON invoices(commitment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- Deshabilitar RLS en todas las tablas nuevas
ALTER TABLE wbs_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_commitments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Insertar catálogo base de WBS para proyectos solares
INSERT INTO wbs_items (code, discipline, component, description, unit, item_type) VALUES
-- PV
('PV-001', 'PV', 'Módulos Fotovoltaicos', 'Paneles solares monocristalinos/policristalinos', 'UN', 'Equipo'),
('PV-002', 'PV', 'Estructura de Montaje', 'Estructura en aluminio o acero galvanizado', 'KG', 'Material'),
('PV-003', 'PV', 'Tornillería y Conectores', 'Tornillería inoxidable, conectores MC4', 'KG', 'Material'),
('PV-004', 'PV', 'Cajas String', 'Cajas combinadoras DC', 'UN', 'Equipo'),
('PV-005', 'PV', 'Cable DC', 'Cable solar 4mm2, 6mm2', 'M', 'Material'),
('PV-006', 'PV', 'Instalación Paneles', 'Mano de obra instalación módulos', 'UN', 'Servicio'),

-- Inversores
('INV-001', 'Eléctrico', 'Inversores', 'Inversores string o central', 'UN', 'Equipo'),
('INV-002', 'Eléctrico', 'Transformador', 'Transformador elevador (si aplica)', 'UN', 'Equipo'),
('INV-003', 'Eléctrico', 'Tableros AC', 'Tableros de distribución AC', 'UN', 'Equipo'),
('INV-004', 'Eléctrico', 'Protecciones', 'Breakers, fusibles, DPS', 'UN', 'Material'),

-- Eléctrico
('ELE-001', 'Eléctrico', 'Canalizaciones', 'Bandejas, tuberías EMT/PVC', 'M', 'Material'),
('ELE-002', 'Eléctrico', 'Cable AC', 'Cable THW, THHN calibres varios', 'M', 'Material'),
('ELE-003', 'Eléctrico', 'Puesta a Tierra', 'Sistema SPT, varillas, cable cobre', 'UN', 'Material'),
('ELE-004', 'Eléctrico', 'Instalación Eléctrica', 'Mano de obra eléctrica', 'M', 'Servicio'),

-- Seguridad
('SEG-001', 'Seguridad', 'Líneas de Vida', 'Sistema de líneas de vida horizontal/vertical', 'M', 'Material'),
('SEG-002', 'Seguridad', 'Anclajes', 'Puntos de anclaje certificados', 'UN', 'Material'),
('SEG-003', 'Seguridad', 'Apantallamiento', 'Sistema de pararrayos (DPS externo)', 'UN', 'Equipo'),

-- SCADA
('SCA-001', 'SCADA', 'Datalogger', 'Sistema de monitoreo y comunicaciones', 'UN', 'Equipo'),
('SCA-002', 'SCADA', 'Smart Meter', 'Medidor inteligente', 'UN', 'Equipo'),
('SCA-003', 'SCADA', 'Comunicaciones', 'Router, antenas, cableado red', 'UN', 'Material'),

-- Ingeniería
('ING-001', 'Ingeniería', 'Ingeniería de Detalle', 'Planos eléctricos, estructurales, civiles', 'UN', 'Servicio'),
('ING-002', 'Ingeniería', 'Memorias de Cálculo', 'Memorias estructurales, eléctricas', 'UN', 'Servicio'),
('ING-003', 'Ingeniería', 'Comisionamiento', 'Pruebas, puesta en marcha, SAT', 'UN', 'Servicio'),

-- Permisos
('PER-001', 'Permisos', 'UPME', 'Registro UPME/autoridad competente', 'UN', 'Servicio'),
('PER-002', 'Permisos', 'Conexión Operador', 'Trámites ante operador de red', 'UN', 'Servicio'),
('PER-003', 'Permisos', 'Licencias', 'Licencias de construcción, ambientales', 'UN', 'Servicio')
ON CONFLICT (code) DO NOTHING;
