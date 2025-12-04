export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          client: string
          status: 'draft' | 'execution' | 'finished'
          total_budget_usd: number
          start_date: string | null
          location: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          client: string
          status?: 'draft' | 'execution' | 'finished'
          total_budget_usd?: number
          start_date?: string | null
          location?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          client?: string
          status?: 'draft' | 'execution' | 'finished'
          total_budget_usd?: number
          start_date?: string | null
          location?: string | null
          created_at?: string | null
        }
      }
      inventory_items: {
        Row: {
          id: string
          sku: string
          name: string
          category: 'panels' | 'inverters' | 'structure' | 'electrical' | 'hse'
          stock_quantity: number
          unit_cost_usd: number
          image_url: string | null
          supplier: string | null
          unit: 'pza' | 'm' | 'kg' | 'caja' | 'palet' | 'rollo' | 'litro'
          warehouse_location: string | null
          min_stock: number
          last_purchase_date: string | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          sku: string
          name: string
          category: 'panels' | 'inverters' | 'structure' | 'electrical' | 'hse'
          stock_quantity?: number
          unit_cost_usd?: number
          image_url?: string | null
          supplier?: string | null
          unit?: 'pza' | 'm' | 'kg' | 'caja' | 'palet' | 'rollo' | 'litro'
          warehouse_location?: string | null
          min_stock?: number
          last_purchase_date?: string | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          category?: 'panels' | 'inverters' | 'structure' | 'electrical' | 'hse'
          stock_quantity?: number
          unit_cost_usd?: number
          image_url?: string | null
          supplier?: string | null
          unit?: 'pza' | 'm' | 'kg' | 'caja' | 'palet' | 'rollo' | 'litro'
          warehouse_location?: string | null
          min_stock?: number
          last_purchase_date?: string | null
          description?: string | null
          created_at?: string | null
        }
      }
      project_milestones: {
        Row: {
          id: string
          project_id: string
          name: string
          progress_percentage: number
          subcontractor_name: string | null
          order_index: number
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          progress_percentage?: number
          subcontractor_name?: string | null
          order_index?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          progress_percentage?: number
          subcontractor_name?: string | null
          order_index?: number
          created_at?: string | null
        }
      }
      contracts: {
        Row: {
          id: string
          project_id: string
          subcontractor_name: string
          service_type: string
          total_value_usd: number
          paid_amount_usd: number
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          subcontractor_name: string
          service_type: string
          total_value_usd?: number
          paid_amount_usd?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          subcontractor_name?: string
          service_type?: string
          total_value_usd?: number
          paid_amount_usd?: number
          created_at?: string | null
        }
      }
      purchase_orders: {
        Row: {
          id: string
          project_id: string
          provider_name: string
          status: 'pending' | 'received'
          total_usd: number
          items_description: string | null
          order_number: string | null
          order_date: string | null
          expected_delivery_date: string | null
          received_date: string | null
          payment_terms: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          provider_name: string
          status?: 'pending' | 'received'
          total_usd?: number
          items_description?: string | null
          order_number?: string | null
          order_date?: string | null
          expected_delivery_date?: string | null
          received_date?: string | null
          payment_terms?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          provider_name?: string
          status?: 'pending' | 'received'
          total_usd?: number
          items_description?: string | null
          order_number?: string | null
          order_date?: string | null
          expected_delivery_date?: string | null
          received_date?: string | null
          payment_terms?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          inventory_item_id: string | null
          item_name: string
          quantity: number
          unit_price_usd: number
          subtotal_usd: number
          created_at: string | null
        }
        Insert: {
          id?: string
          purchase_order_id: string
          inventory_item_id?: string | null
          item_name: string
          quantity?: number
          unit_price_usd?: number
          subtotal_usd?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          purchase_order_id?: string
          inventory_item_id?: string | null
          item_name?: string
          quantity?: number
          unit_price_usd?: number
          subtotal_usd?: number
          created_at?: string | null
        }
      }
      project_docs: {
        Row: {
          id: string
          project_id: string
          category: 'engineering' | 'legal' | 'hse'
          file_url: string
          file_name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          category: 'engineering' | 'legal' | 'hse'
          file_url: string
          file_name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          category?: 'engineering' | 'legal' | 'hse'
          file_url?: string
          file_name?: string
          created_at?: string | null
        }
      }
      contract_payment_milestones: {
        Row: {
          id: string
          contract_id: string
          milestone_name: string
          percentage: number
          amount_usd: number
          status: 'pending' | 'paid'
          order_index: number
          paid_date: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          milestone_name: string
          percentage?: number
          amount_usd?: number
          status?: 'pending' | 'paid'
          order_index?: number
          paid_date?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          milestone_name?: string
          percentage?: number
          amount_usd?: number
          status?: 'pending' | 'paid'
          order_index?: number
          paid_date?: string | null
          created_at?: string | null
        }
      }
      project_crews: {
        Row: {
          id: string
          project_id: string
          name: string
          leader: string
          members_count: number
          current_task: string | null
          status: 'active' | 'inactive' | 'on_leave'
          specialty: 'instalacion' | 'electrico' | 'montaje' | 'supervision' | null
          phone: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          leader: string
          members_count?: number
          current_task?: string | null
          status?: 'active' | 'inactive' | 'on_leave'
          specialty?: 'instalacion' | 'electrico' | 'montaje' | 'supervision' | null
          phone?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          leader?: string
          members_count?: number
          current_task?: string | null
          status?: 'active' | 'inactive' | 'on_leave'
          specialty?: 'instalacion' | 'electrico' | 'montaje' | 'supervision' | null
          phone?: string | null
          created_at?: string | null
        }
      }
      project_equipment: {
        Row: {
          id: string
          project_id: string
          equipment_name: string
          equipment_type: 'inverter' | 'panel_batch' | 'transformer' | 'meter' | 'battery' | 'other' | null
          serial_number: string | null
          supplier: string | null
          installation_date: string | null
          warranty_years: number
          warranty_expiry_date: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          equipment_name: string
          equipment_type?: 'inverter' | 'panel_batch' | 'transformer' | 'meter' | 'battery' | 'other' | null
          serial_number?: string | null
          supplier?: string | null
          installation_date?: string | null
          warranty_years?: number
          warranty_expiry_date?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          equipment_name?: string
          equipment_type?: 'inverter' | 'panel_batch' | 'transformer' | 'meter' | 'battery' | 'other' | null
          serial_number?: string | null
          supplier?: string | null
          installation_date?: string | null
          warranty_years?: number
          warranty_expiry_date?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
