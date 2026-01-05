/*
  # Deshabilitar RLS para acceso público

  1. Cambios
    - Deshabilitar RLS en todas las tablas principales
    - Permitir acceso público sin autenticación
  
  2. Notas
    - La aplicación ahora funciona sin login
    - Todas las tablas son accesibles públicamente
*/

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_payment_milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_crews DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_docs DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_project_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
