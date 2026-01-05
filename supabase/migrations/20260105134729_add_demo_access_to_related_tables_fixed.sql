/*
  # Add Demo Project Access to Related Tables

  1. Changes
    - Add policies to allow viewing data from demo projects (projects with NULL created_by)
    - Applies to all related tables: milestones, contracts, inventory, equipment, crews, docs, etc.
  
  2. Security
    - Only SELECT operations allowed
    - Users must be authenticated
    - Only applies to records linked to demo projects
*/

-- Project Milestones
DROP POLICY IF EXISTS "Demo project milestones visible to all" ON project_milestones;
CREATE POLICY "Demo project milestones visible to all"
  ON project_milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_milestones.project_id 
      AND projects.created_by IS NULL
    )
  );

-- Milestone Evidence
DROP POLICY IF EXISTS "Demo milestone evidence visible to all" ON milestone_evidence;
CREATE POLICY "Demo milestone evidence visible to all"
  ON milestone_evidence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_milestones pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.id = milestone_evidence.milestone_id 
      AND p.created_by IS NULL
    )
  );

-- Contracts
DROP POLICY IF EXISTS "Demo project contracts visible to all" ON contracts;
CREATE POLICY "Demo project contracts visible to all"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = contracts.project_id 
      AND projects.created_by IS NULL
    )
  );

-- Contract Payment Milestones
DROP POLICY IF EXISTS "Demo contract milestones visible to all" ON contract_payment_milestones;
CREATE POLICY "Demo contract milestones visible to all"
  ON contract_payment_milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts 
      JOIN projects ON projects.id = contracts.project_id
      WHERE contracts.id = contract_payment_milestones.contract_id 
      AND projects.created_by IS NULL
    )
  );

-- Purchase Orders
DROP POLICY IF EXISTS "Demo project POs visible to all" ON purchase_orders;
CREATE POLICY "Demo project POs visible to all"
  ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = purchase_orders.project_id 
      AND projects.created_by IS NULL
    )
  );

-- Purchase Order Items
DROP POLICY IF EXISTS "Demo PO items visible to all" ON purchase_order_items;
CREATE POLICY "Demo PO items visible to all"
  ON purchase_order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      JOIN projects p ON p.id = po.project_id
      WHERE po.id = purchase_order_items.purchase_order_id 
      AND p.created_by IS NULL
    )
  );

-- Project Equipment
DROP POLICY IF EXISTS "Demo project equipment visible to all" ON project_equipment;
CREATE POLICY "Demo project equipment visible to all"
  ON project_equipment
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_equipment.project_id 
      AND projects.created_by IS NULL
    )
  );

-- Project Crews
DROP POLICY IF EXISTS "Demo project crews visible to all" ON project_crews;
CREATE POLICY "Demo project crews visible to all"
  ON project_crews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_crews.project_id 
      AND projects.created_by IS NULL
    )
  );

-- Project Docs
DROP POLICY IF EXISTS "Demo project docs visible to all" ON project_docs;
CREATE POLICY "Demo project docs visible to all"
  ON project_docs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_docs.project_id 
      AND projects.created_by IS NULL
    )
  );

-- Project Collaborators
DROP POLICY IF EXISTS "Demo project collaborators visible to all" ON project_collaborators;
CREATE POLICY "Demo project collaborators visible to all"
  ON project_collaborators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.created_by IS NULL
    )
  );

-- Notifications related to demo projects
DROP POLICY IF EXISTS "Demo project notifications visible to all" ON notifications;
CREATE POLICY "Demo project notifications visible to all"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = notifications.related_project_id 
      AND projects.created_by IS NULL
    )
  );
