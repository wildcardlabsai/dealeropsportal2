export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aftersales: {
        Row: {
          assigned_to: string | null
          case_type: Database["public"]["Enums"]["aftersale_type"]
          created_at: string
          created_by_user_id: string | null
          customer_id: string | null
          dealer_id: string
          description: string | null
          id: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["aftersale_status"]
          subject: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          case_type?: Database["public"]["Enums"]["aftersale_type"]
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id: string
          description?: string | null
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["aftersale_status"]
          subject: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          case_type?: Database["public"]["Enums"]["aftersale_type"]
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id?: string
          description?: string | null
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["aftersale_status"]
          subject?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aftersales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftersales_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftersales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      aftersales_attachments: {
        Row: {
          case_id: string
          created_at: string
          dealer_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by_user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          dealer_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by_user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          dealer_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aftersales_attachments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "aftersales_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftersales_attachments_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      aftersales_cases: {
        Row: {
          assigned_to_user_id: string | null
          case_number: string
          closed_at: string | null
          complaint_date: string
          cost_estimate: number | null
          cra_window: Database["public"]["Enums"]["cra_window"] | null
          created_at: string
          created_by_user_id: string
          customer_comms_notes: string | null
          customer_id: string | null
          dealer_id: string
          description: string
          first_response_at: string | null
          goodwill_amount: number | null
          id: string
          internal_notes: string | null
          invoice_id: string | null
          issue_category: string
          issue_subcategory: string | null
          last_contacted_at: string | null
          next_action_at: string | null
          outcome: Database["public"]["Enums"]["aftersales_outcome"] | null
          priority: string
          resolved_at: string | null
          sale_date: string | null
          sla_target_hours: number
          status: Database["public"]["Enums"]["aftersales_case_status"]
          summary: string
          updated_at: string
          vehicle_id: string | null
          warranty_id: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          case_number: string
          closed_at?: string | null
          complaint_date?: string
          cost_estimate?: number | null
          cra_window?: Database["public"]["Enums"]["cra_window"] | null
          created_at?: string
          created_by_user_id: string
          customer_comms_notes?: string | null
          customer_id?: string | null
          dealer_id: string
          description: string
          first_response_at?: string | null
          goodwill_amount?: number | null
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          issue_category: string
          issue_subcategory?: string | null
          last_contacted_at?: string | null
          next_action_at?: string | null
          outcome?: Database["public"]["Enums"]["aftersales_outcome"] | null
          priority?: string
          resolved_at?: string | null
          sale_date?: string | null
          sla_target_hours?: number
          status?: Database["public"]["Enums"]["aftersales_case_status"]
          summary: string
          updated_at?: string
          vehicle_id?: string | null
          warranty_id?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          case_number?: string
          closed_at?: string | null
          complaint_date?: string
          cost_estimate?: number | null
          cra_window?: Database["public"]["Enums"]["cra_window"] | null
          created_at?: string
          created_by_user_id?: string
          customer_comms_notes?: string | null
          customer_id?: string | null
          dealer_id?: string
          description?: string
          first_response_at?: string | null
          goodwill_amount?: number | null
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          issue_category?: string
          issue_subcategory?: string | null
          last_contacted_at?: string | null
          next_action_at?: string | null
          outcome?: Database["public"]["Enums"]["aftersales_outcome"] | null
          priority?: string
          resolved_at?: string | null
          sale_date?: string | null
          sla_target_hours?: number
          status?: Database["public"]["Enums"]["aftersales_case_status"]
          summary?: string
          updated_at?: string
          vehicle_id?: string | null
          warranty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aftersales_cases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftersales_cases_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftersales_cases_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftersales_cases_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftersales_cases_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      aftersales_updates: {
        Row: {
          case_id: string
          created_at: string
          created_by_user_id: string
          dealer_id: string
          id: string
          message: string
          new_status: string | null
          old_status: string | null
          update_type: Database["public"]["Enums"]["aftersales_update_type"]
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by_user_id: string
          dealer_id: string
          id?: string
          message: string
          new_status?: string | null
          old_status?: string | null
          update_type?: Database["public"]["Enums"]["aftersales_update_type"]
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by_user_id?: string
          dealer_id?: string
          id?: string
          message?: string
          new_status?: string | null
          old_status?: string | null
          update_type?: Database["public"]["Enums"]["aftersales_update_type"]
        }
        Relationships: [
          {
            foreignKeyName: "aftersales_updates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "aftersales_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftersales_updates_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          dealer_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          dealer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          dealer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          content: string | null
          created_at: string
          created_by_user_id: string | null
          customer_id: string | null
          dealer_id: string
          id: string
          log_type: string
          subject: string | null
          vehicle_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id: string
          id?: string
          log_type: string
          subject?: string | null
          vehicle_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id?: string
          id?: string
          log_type?: string
          subject?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_leads: {
        Row: {
          created_at: string
          dealership_name: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          dealership_name?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          dealership_name?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      courtesy_cars: {
        Row: {
          created_at: string
          current_customer_id: string | null
          dealer_id: string
          expected_return: string | null
          id: string
          loaned_at: string | null
          make: string | null
          model: string | null
          notes: string | null
          returned_at: string | null
          status: Database["public"]["Enums"]["courtesy_car_status"]
          updated_at: string
          vehicle_id: string | null
          vrm: string
        }
        Insert: {
          created_at?: string
          current_customer_id?: string | null
          dealer_id: string
          expected_return?: string | null
          id?: string
          loaned_at?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          returned_at?: string | null
          status?: Database["public"]["Enums"]["courtesy_car_status"]
          updated_at?: string
          vehicle_id?: string | null
          vrm: string
        }
        Update: {
          created_at?: string
          current_customer_id?: string | null
          dealer_id?: string
          expected_return?: string | null
          id?: string
          loaned_at?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          returned_at?: string | null
          status?: Database["public"]["Enums"]["courtesy_car_status"]
          updated_at?: string
          vehicle_id?: string | null
          vrm?: string
        }
        Relationships: [
          {
            foreignKeyName: "courtesy_cars_current_customer_id_fkey"
            columns: ["current_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_cars_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_cars_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          consent_marketing: boolean
          consent_marketing_at: string | null
          created_at: string
          dealer_id: string
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          is_deleted: boolean
          last_name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          preferred_contact_method:
            | Database["public"]["Enums"]["contact_method"]
            | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          consent_marketing?: boolean
          consent_marketing_at?: string | null
          created_at?: string
          dealer_id: string
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_deleted?: boolean
          last_name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_contact_method?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          consent_marketing?: boolean
          consent_marketing_at?: string | null
          created_at?: string
          dealer_id?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_deleted?: boolean
          last_name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_contact_method?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          plan_id: string | null
          postcode: string | null
          status: Database["public"]["Enums"]["dealer_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          plan_id?: string | null
          postcode?: string | null
          status?: Database["public"]["Enums"]["dealer_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          plan_id?: string | null
          postcode?: string | null
          status?: Database["public"]["Enums"]["dealer_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          dealer_id: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          related_customer_id: string | null
          related_vehicle_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          dealer_id: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          related_customer_id?: string | null
          related_vehicle_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          dealer_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          related_customer_id?: string | null
          related_vehicle_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_related_vehicle_id_fkey"
            columns: ["related_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          customer_id: string | null
          dealer_id: string
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          updated_at: string
          vat_amount: number
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id: string
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_id: string | null
          dealer_id: string
          email: string | null
          estimated_value: number | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          dealer_id: string
          email?: string | null
          estimated_value?: number | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          dealer_id?: string
          email?: string | null
          estimated_value?: number | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dealer_id: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dealer_id?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dealer_id?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          dealer_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          related_customer_id: string | null
          related_vehicle_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          dealer_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_customer_id?: string | null
          related_vehicle_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          dealer_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_customer_id?: string | null
          related_vehicle_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_vehicle_id_fkey"
            columns: ["related_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          dealer_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dealer_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          dealer_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_checks: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          dealer_id: string
          dvla_data: Json | null
          dvsa_data: Json | null
          gvd_data: Json | null
          id: string
          vrm: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          dealer_id: string
          dvla_data?: Json | null
          dvsa_data?: Json | null
          gvd_data?: Json | null
          id?: string
          vrm: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          dealer_id?: string
          dvla_data?: Json | null
          dvsa_data?: Json | null
          gvd_data?: Json | null
          id?: string
          vrm?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_checks_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          advertised_price: number | null
          colour: string | null
          created_at: string
          customer_id: string | null
          dealer_id: string
          deleted_at: string | null
          derivative: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          id: string
          is_deleted: boolean
          location: Database["public"]["Enums"]["vehicle_location"]
          make: string | null
          mileage: number | null
          model: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          status: Database["public"]["Enums"]["vehicle_status"]
          transmission: Database["public"]["Enums"]["transmission_type"] | null
          updated_at: string
          vin: string | null
          vrm: string | null
          year: number | null
        }
        Insert: {
          advertised_price?: number | null
          colour?: string | null
          created_at?: string
          customer_id?: string | null
          dealer_id: string
          deleted_at?: string | null
          derivative?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          is_deleted?: boolean
          location?: Database["public"]["Enums"]["vehicle_location"]
          make?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission?: Database["public"]["Enums"]["transmission_type"] | null
          updated_at?: string
          vin?: string | null
          vrm?: string | null
          year?: number | null
        }
        Update: {
          advertised_price?: number | null
          colour?: string | null
          created_at?: string
          customer_id?: string | null
          dealer_id?: string
          deleted_at?: string | null
          derivative?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          is_deleted?: boolean
          location?: Database["public"]["Enums"]["vehicle_location"]
          make?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission?: Database["public"]["Enums"]["transmission_type"] | null
          updated_at?: string
          vin?: string | null
          vrm?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      warranties: {
        Row: {
          cost: number | null
          coverage_details: string | null
          created_at: string
          customer_id: string | null
          dealer_id: string
          end_date: string
          id: string
          mileage_limit: number | null
          notes: string | null
          policy_number: string | null
          provider: string | null
          start_date: string
          status: Database["public"]["Enums"]["warranty_status"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          cost?: number | null
          coverage_details?: string | null
          created_at?: string
          customer_id?: string | null
          dealer_id: string
          end_date: string
          id?: string
          mileage_limit?: number | null
          notes?: string | null
          policy_number?: string | null
          provider?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["warranty_status"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          cost?: number | null
          coverage_details?: string | null
          created_at?: string
          customer_id?: string | null
          dealer_id?: string
          end_date?: string
          id?: string
          mileage_limit?: number | null
          notes?: string | null
          policy_number?: string | null
          provider?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["warranty_status"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_dealer_id: { Args: never; Returns: string }
      has_dealer_access: { Args: { _dealer_id: string }; Returns: boolean }
      is_dealer_admin_or_super: {
        Args: { _dealer_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      aftersale_status:
        | "open"
        | "in_progress"
        | "awaiting_parts"
        | "resolved"
        | "closed"
      aftersale_type: "complaint" | "repair" | "recall" | "goodwill" | "other"
      aftersales_case_status:
        | "new"
        | "investigating"
        | "awaiting_customer"
        | "awaiting_garage"
        | "approved_repair"
        | "in_repair"
        | "resolved"
        | "rejected"
        | "closed"
      aftersales_outcome:
        | "repair"
        | "refund"
        | "reject"
        | "goodwill"
        | "partial_refund"
        | "diagnostic_only"
        | "other"
      aftersales_update_type:
        | "note"
        | "status_change"
        | "assignment"
        | "customer_contact"
        | "garage_update"
        | "document_added"
        | "cost_update"
      app_role: "super_admin" | "dealer_admin" | "dealer_user"
      contact_method: "phone" | "email" | "whatsapp" | "post"
      courtesy_car_status: "available" | "on_loan" | "in_service" | "retired"
      cra_window: "within_30_days" | "day_31_to_6_months" | "over_6_months"
      dealer_status: "active" | "suspended" | "pending"
      fuel_type:
        | "petrol"
        | "diesel"
        | "electric"
        | "hybrid"
        | "plug_in_hybrid"
        | "other"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      lead_source:
        | "walk_in"
        | "phone"
        | "website"
        | "autotrader"
        | "ebay"
        | "facebook"
        | "referral"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "viewing"
        | "negotiating"
        | "won"
        | "lost"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done" | "cancelled"
      transmission_type: "manual" | "automatic" | "other"
      vehicle_location: "on_site" | "garage" | "customer" | "other"
      vehicle_status:
        | "in_stock"
        | "reserved"
        | "sold"
        | "in_repair"
        | "returned"
      warranty_status: "active" | "expired" | "claimed" | "voided"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aftersale_status: [
        "open",
        "in_progress",
        "awaiting_parts",
        "resolved",
        "closed",
      ],
      aftersale_type: ["complaint", "repair", "recall", "goodwill", "other"],
      aftersales_case_status: [
        "new",
        "investigating",
        "awaiting_customer",
        "awaiting_garage",
        "approved_repair",
        "in_repair",
        "resolved",
        "rejected",
        "closed",
      ],
      aftersales_outcome: [
        "repair",
        "refund",
        "reject",
        "goodwill",
        "partial_refund",
        "diagnostic_only",
        "other",
      ],
      aftersales_update_type: [
        "note",
        "status_change",
        "assignment",
        "customer_contact",
        "garage_update",
        "document_added",
        "cost_update",
      ],
      app_role: ["super_admin", "dealer_admin", "dealer_user"],
      contact_method: ["phone", "email", "whatsapp", "post"],
      courtesy_car_status: ["available", "on_loan", "in_service", "retired"],
      cra_window: ["within_30_days", "day_31_to_6_months", "over_6_months"],
      dealer_status: ["active", "suspended", "pending"],
      fuel_type: [
        "petrol",
        "diesel",
        "electric",
        "hybrid",
        "plug_in_hybrid",
        "other",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      lead_source: [
        "walk_in",
        "phone",
        "website",
        "autotrader",
        "ebay",
        "facebook",
        "referral",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "viewing",
        "negotiating",
        "won",
        "lost",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done", "cancelled"],
      transmission_type: ["manual", "automatic", "other"],
      vehicle_location: ["on_site", "garage", "customer", "other"],
      vehicle_status: ["in_stock", "reserved", "sold", "in_repair", "returned"],
      warranty_status: ["active", "expired", "claimed", "voided"],
    },
  },
} as const
