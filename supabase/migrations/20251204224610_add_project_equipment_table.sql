/*
  # Agregar Tabla de Equipos/Activos del Proyecto

  ## Nueva Tabla
  
  1. **project_equipment**
     - Tabla para registrar equipos y activos instalados en el proyecto (inversores, paneles, etc.)
     - Campos: id, project_id, equipment_name, equipment_type, serial_number, supplier, installation_date, warranty_years, warranty_expiry_date, notes, created_at
     - Equipment types: inverter, panel_batch, transformer, meter, other

  ## Seguridad
  - RLS habilitado en la tabla
  - Políticas para usuarios autenticados
*/

-- CREAR TABLA DE EQUIPOS DEL PROYECTO
CREATE TABLE IF NOT EXISTS project_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  equipment_type text CHECK (equipment_type IN ('inverter', 'panel_batch', 'transformer', 'meter', 'battery', 'other')),
  serial_number text,
  supplier text,
  installation_date date,
  warranty_years integer DEFAULT 0,
  warranty_expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project equipment"
  ON project_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert project equipment"
  ON project_equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update project equipment"
  ON project_equipment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete project equipment"
  ON project_equipment FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_project_equipment_project_id ON project_equipment(project_id);
