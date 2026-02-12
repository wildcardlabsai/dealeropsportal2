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
          actor_role: string | null
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          dealer_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          summary: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          actor_role?: string | null
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          dealer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          summary?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          actor_role?: string | null
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          dealer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          summary?: string | null
          user_agent?: string | null
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
      billing_documents: {
        Row: {
          amount: number
          created_at: string
          created_by_user_id: string | null
          dealer_id: string
          description: string | null
          document_type: string
          id: string
          pdf_url: string | null
          upgrade_request_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by_user_id?: string | null
          dealer_id: string
          description?: string | null
          document_type?: string
          id?: string
          pdf_url?: string | null
          upgrade_request_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by_user_id?: string | null
          dealer_id?: string
          description?: string | null
          document_type?: string
          id?: string
          pdf_url?: string | null
          upgrade_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_documents_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_documents_upgrade_request_id_fkey"
            columns: ["upgrade_request_id"]
            isOneToOne: false
            referencedRelation: "upgrade_requests"
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
          current_mileage: number | null
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
          vin: string | null
          vrm: string
        }
        Insert: {
          created_at?: string
          current_customer_id?: string | null
          current_mileage?: number | null
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
          vin?: string | null
          vrm: string
        }
        Update: {
          created_at?: string
          current_customer_id?: string | null
          current_mileage?: number | null
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
          vin?: string | null
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
      courtesy_loans: {
        Row: {
          actual_return_at: string | null
          agreement_pdf_url: string | null
          agreement_signed_at: string | null
          agreement_signed_by: string | null
          agreement_signed_mode: string | null
          assigned_to_user_id: string | null
          courtesy_car_id: string
          created_at: string
          created_by_user_id: string | null
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          damage_in_notes: string | null
          damage_out_notes: string | null
          dealer_id: string
          deposit_amount: number | null
          driving_licence_checked: boolean | null
          excess_amount: number | null
          expected_return_at: string | null
          fuel_in: string | null
          fuel_out: string | null
          id: string
          insurance_confirmed: boolean | null
          loan_reason: string | null
          loan_start_at: string
          mileage_in: number | null
          mileage_out: number | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_return_at?: string | null
          agreement_pdf_url?: string | null
          agreement_signed_at?: string | null
          agreement_signed_by?: string | null
          agreement_signed_mode?: string | null
          assigned_to_user_id?: string | null
          courtesy_car_id: string
          created_at?: string
          created_by_user_id?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          damage_in_notes?: string | null
          damage_out_notes?: string | null
          dealer_id: string
          deposit_amount?: number | null
          driving_licence_checked?: boolean | null
          excess_amount?: number | null
          expected_return_at?: string | null
          fuel_in?: string | null
          fuel_out?: string | null
          id?: string
          insurance_confirmed?: boolean | null
          loan_reason?: string | null
          loan_start_at?: string
          mileage_in?: number | null
          mileage_out?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_return_at?: string | null
          agreement_pdf_url?: string | null
          agreement_signed_at?: string | null
          agreement_signed_by?: string | null
          agreement_signed_mode?: string | null
          assigned_to_user_id?: string | null
          courtesy_car_id?: string
          created_at?: string
          created_by_user_id?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          damage_in_notes?: string | null
          damage_out_notes?: string | null
          dealer_id?: string
          deposit_amount?: number | null
          driving_licence_checked?: boolean | null
          excess_amount?: number | null
          expected_return_at?: string | null
          fuel_in?: string | null
          fuel_out?: string | null
          id?: string
          insurance_confirmed?: boolean | null
          loan_reason?: string | null
          loan_start_at?: string
          mileage_in?: number | null
          mileage_out?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courtesy_loans_courtesy_car_id_fkey"
            columns: ["courtesy_car_id"]
            isOneToOne: false
            referencedRelation: "courtesy_cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_loans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_loans_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
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
      dealer_onboarding_events: {
        Row: {
          created_at: string | null
          created_by_superadmin_user_id: string | null
          dealer_id: string
          event_type: string
          id: string
          payload_json: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by_superadmin_user_id?: string | null
          dealer_id: string
          event_type: string
          id?: string
          payload_json?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by_superadmin_user_id?: string | null
          dealer_id?: string
          event_type?: string
          id?: string
          payload_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_onboarding_events_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_preferences: {
        Row: {
          aftersales_first_response_sla_hours: number | null
          courtesy_agreement_template_id: string | null
          created_at: string | null
          data_retention_months: number | null
          dealer_id: string
          default_email_template_id: string | null
          default_review_platform_id: string | null
          default_sms_template_id: string | null
          handover_template_id: string | null
          invoice_trigger_review_request: string | null
          notifications_email_enabled: boolean | null
          notifications_inapp_enabled: boolean | null
          task_reminder_hours: number | null
          updated_at: string | null
        }
        Insert: {
          aftersales_first_response_sla_hours?: number | null
          courtesy_agreement_template_id?: string | null
          created_at?: string | null
          data_retention_months?: number | null
          dealer_id: string
          default_email_template_id?: string | null
          default_review_platform_id?: string | null
          default_sms_template_id?: string | null
          handover_template_id?: string | null
          invoice_trigger_review_request?: string | null
          notifications_email_enabled?: boolean | null
          notifications_inapp_enabled?: boolean | null
          task_reminder_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          aftersales_first_response_sla_hours?: number | null
          courtesy_agreement_template_id?: string | null
          created_at?: string | null
          data_retention_months?: number | null
          dealer_id?: string
          default_email_template_id?: string | null
          default_review_platform_id?: string | null
          default_sms_template_id?: string | null
          handover_template_id?: string | null
          invoice_trigger_review_request?: string | null
          notifications_email_enabled?: boolean | null
          notifications_inapp_enabled?: boolean | null
          task_reminder_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_preferences_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: true
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_security_settings: {
        Row: {
          allow_password_reset: boolean | null
          created_at: string | null
          dealer_id: string
          ip_allowlist_json: Json | null
          require_mfa: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_password_reset?: boolean | null
          created_at?: string | null
          dealer_id: string
          ip_allowlist_json?: Json | null
          require_mfa?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_password_reset?: boolean | null
          created_at?: string | null
          dealer_id?: string
          ip_allowlist_json?: Json | null
          require_mfa?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_security_settings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: true
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_subscriptions: {
        Row: {
          created_at: string
          dealer_id: string
          id: string
          next_review_date: string | null
          notes: string | null
          plan_id: string
          start_date: string
          status: string
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          dealer_id: string
          id?: string
          next_review_date?: string | null
          notes?: string | null
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          dealer_id?: string
          id?: string
          next_review_date?: string | null
          notes?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_subscriptions_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bank_details_text: string | null
          city: string | null
          company_number: string | null
          created_at: string
          default_currency: string | null
          email: string | null
          fca_number: string | null
          ico_number: string | null
          id: string
          invoice_footer_text: string | null
          is_active: boolean | null
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          plan_id: string | null
          postcode: string | null
          primary_colour: string | null
          status: Database["public"]["Enums"]["dealer_status"]
          timezone: string | null
          trading_name: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bank_details_text?: string | null
          city?: string | null
          company_number?: string | null
          created_at?: string
          default_currency?: string | null
          email?: string | null
          fca_number?: string | null
          ico_number?: string | null
          id?: string
          invoice_footer_text?: string | null
          is_active?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          plan_id?: string | null
          postcode?: string | null
          primary_colour?: string | null
          status?: Database["public"]["Enums"]["dealer_status"]
          timezone?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bank_details_text?: string | null
          city?: string | null
          company_number?: string | null
          created_at?: string
          default_currency?: string | null
          email?: string | null
          fca_number?: string | null
          ico_number?: string | null
          id?: string
          invoice_footer_text?: string | null
          is_active?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan_id?: string | null
          postcode?: string | null
          primary_colour?: string | null
          status?: Database["public"]["Enums"]["dealer_status"]
          timezone?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          category: string
          created_at: string
          created_by_user_id: string | null
          dealer_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_format: string
          template_html: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          dealer_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_format?: string
          template_html?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          dealer_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_format?: string
          template_html?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
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
      email_outbox: {
        Row: {
          attachments_json: Json | null
          body_html: string | null
          body_text: string
          created_at: string | null
          dealer_id: string | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          attachments_json?: Json | null
          body_html?: string | null
          body_text: string
          created_at?: string | null
          dealer_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          attachments_json?: Json | null
          body_html?: string | null
          body_text?: string
          created_at?: string | null
          dealer_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          dealer_id: string
          id: string
          legal_name: string
          notes: string | null
          postcode: string | null
          town: string | null
          trading_name: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          dealer_id: string
          id?: string
          legal_name: string
          notes?: string | null
          postcode?: string | null
          town?: string | null
          trading_name?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          dealer_id?: string
          id?: string
          legal_name?: string
          notes?: string | null
          postcode?: string | null
          town?: string | null
          trading_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_companies_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          category: string
          created_at: string
          created_by_user_id: string
          dealer_id: string
          id: string
          name: string
          pdf_url: string
          related_entity_id: string | null
          related_entity_type: string
          template_id: string | null
          variables_json: Json | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by_user_id: string
          dealer_id: string
          id?: string
          name: string
          pdf_url: string
          related_entity_id?: string | null
          related_entity_type?: string
          template_id?: string | null
          variables_json?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by_user_id?: string
          dealer_id?: string
          id?: string
          name?: string
          pdf_url?: string
          related_entity_id?: string | null
          related_entity_type?: string
          template_id?: string | null
          variables_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_items: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by_user_id: string | null
          dealer_id: string
          handover_id: string
          id: string
          item_label: string
          notes: string | null
          section: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by_user_id?: string | null
          dealer_id: string
          handover_id: string
          id?: string
          item_label: string
          notes?: string | null
          section?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by_user_id?: string | null
          dealer_id?: string
          handover_id?: string
          id?: string
          item_label?: string
          notes?: string | null
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_items_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_items_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "handovers"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_photos: {
        Row: {
          caption: string | null
          created_at: string
          dealer_id: string
          file_url: string
          handover_id: string
          id: string
          photo_type: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          dealer_id: string
          file_url: string
          handover_id: string
          id?: string
          photo_type?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          dealer_id?: string
          file_url?: string
          handover_id?: string
          id?: string
          photo_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_photos_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_photos_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "handovers"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_templates: {
        Row: {
          created_at: string
          dealer_id: string | null
          id: string
          is_default: boolean
          items_json: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_id?: string | null
          id?: string
          is_default?: boolean
          items_json?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_id?: string | null
          id?: string
          is_default?: boolean
          items_json?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_templates_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      handovers: {
        Row: {
          created_at: string
          customer_id: string
          dealer_id: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_type: string
          fuel_level: string | null
          handover_number: string | null
          handover_pdf_url: string | null
          id: string
          invoice_id: string | null
          keys_count: number
          mileage_at_handover: number | null
          notes: string | null
          salesman_name: string | null
          scheduled_delivery_at: string | null
          signature_image_url: string | null
          signature_mode: string | null
          signature_name: string | null
          signed_at: string | null
          staff_user_id: string | null
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          dealer_id: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_type?: string
          fuel_level?: string | null
          handover_number?: string | null
          handover_pdf_url?: string | null
          id?: string
          invoice_id?: string | null
          keys_count?: number
          mileage_at_handover?: number | null
          notes?: string | null
          salesman_name?: string | null
          scheduled_delivery_at?: string | null
          signature_image_url?: string | null
          signature_mode?: string | null
          signature_name?: string | null
          signed_at?: string | null
          staff_user_id?: string | null
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          dealer_id?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_type?: string
          fuel_level?: string | null
          handover_number?: string | null
          handover_pdf_url?: string | null
          id?: string
          invoice_id?: string | null
          keys_count?: number
          mileage_at_handover?: number | null
          notes?: string | null
          salesman_name?: string | null
          scheduled_delivery_at?: string | null
          signature_image_url?: string | null
          signature_mode?: string | null
          signature_name?: string | null
          signed_at?: string | null
          staff_user_id?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handovers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handovers_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handovers_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handovers_vehicle_id_fkey"
            columns: ["vehicle_id"]
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
          vat_rate: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
          vat_rate?: number
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
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          dealer_id: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method_type"]
          received_at: string | null
          reference: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          dealer_id: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method_type"]
          received_at?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          dealer_id?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method_type"]
          received_at?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_due: number | null
          cancelled_at: string | null
          created_at: string
          created_by_user_id: string | null
          customer_id: string | null
          dealer_id: string
          delivery_fee: number | null
          deposit_amount: number | null
          due_date: string | null
          finance_company_id: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          notes: string | null
          paid_at: string | null
          pdf_url: string | null
          sale_date: string | null
          sale_type: Database["public"]["Enums"]["sale_type"]
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          updated_at: string
          vat_amount: number
          vehicle_first_reg_override: string | null
          vehicle_id: string | null
          vehicle_make_model_override: string | null
          vehicle_mileage_override: number | null
          vehicle_vin_override: string | null
          vehicle_vrm_override: string | null
        }
        Insert: {
          balance_due?: number | null
          cancelled_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id: string
          delivery_fee?: number | null
          deposit_amount?: number | null
          due_date?: string | null
          finance_company_id?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          sale_date?: string | null
          sale_type?: Database["public"]["Enums"]["sale_type"]
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vehicle_first_reg_override?: string | null
          vehicle_id?: string | null
          vehicle_make_model_override?: string | null
          vehicle_mileage_override?: number | null
          vehicle_vin_override?: string | null
          vehicle_vrm_override?: string | null
        }
        Update: {
          balance_due?: number | null
          cancelled_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id?: string
          delivery_fee?: number | null
          deposit_amount?: number | null
          due_date?: string | null
          finance_company_id?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          sale_date?: string | null
          sale_type?: Database["public"]["Enums"]["sale_type"]
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vehicle_first_reg_override?: string | null
          vehicle_id?: string | null
          vehicle_make_model_override?: string | null
          vehicle_mileage_override?: number | null
          vehicle_vin_override?: string | null
          vehicle_vrm_override?: string | null
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
            foreignKeyName: "invoices_finance_company_id_fkey"
            columns: ["finance_company_id"]
            isOneToOne: false
            referencedRelation: "finance_companies"
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
      lead_activities: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          dealer_id: string
          id: string
          lead_id: string
          message: string | null
          new_stage: string | null
          occurred_at: string
          old_stage: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          dealer_id: string
          id?: string
          lead_id: string
          message?: string | null
          new_stage?: string | null
          occurred_at?: string
          old_stage?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          dealer_id?: string
          id?: string
          lead_id?: string
          message?: string | null
          new_stage?: string | null
          occurred_at?: string
          old_stage?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_appointments: {
        Row: {
          appointment_type: string
          created_at: string
          dealer_id: string
          ends_at: string | null
          id: string
          lead_id: string
          location: string | null
          notes: string | null
          starts_at: string
          status: string
        }
        Insert: {
          appointment_type?: string
          created_at?: string
          dealer_id: string
          ends_at?: string | null
          id?: string
          lead_id: string
          location?: string | null
          notes?: string | null
          starts_at: string
          status?: string
        }
        Update: {
          appointment_type?: string
          created_at?: string
          dealer_id?: string
          ends_at?: string | null
          id?: string
          lead_id?: string
          location?: string | null
          notes?: string | null
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_appointments_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          created_by_user_id: string | null
          customer_id: string | null
          dealer_id: string
          email: string | null
          estimated_value: number | null
          finance_required: boolean
          first_name: string
          id: string
          last_contacted_at: string | null
          last_name: string
          lead_number: string | null
          lost_reason: string | null
          next_action_at: string | null
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          vehicle_id: string | null
          vehicle_interest_text: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id: string
          email?: string | null
          estimated_value?: number | null
          finance_required?: boolean
          first_name: string
          id?: string
          last_contacted_at?: string | null
          last_name: string
          lead_number?: string | null
          lost_reason?: string | null
          next_action_at?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          vehicle_id?: string | null
          vehicle_interest_text?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id?: string
          email?: string | null
          estimated_value?: number | null
          finance_required?: boolean
          first_name?: string
          id?: string
          last_contacted_at?: string | null
          last_name?: string
          lead_number?: string | null
          lost_reason?: string | null
          next_action_at?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          vehicle_id?: string | null
          vehicle_interest_text?: string | null
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
      part_exchanges: {
        Row: {
          created_at: string
          dealer_id: string
          id: string
          invoice_id: string
          px_allowance: number
          px_make_model: string | null
          px_mileage: number | null
          px_notes: string | null
          px_settlement: number | null
          px_vin: string | null
          px_vrm: string | null
        }
        Insert: {
          created_at?: string
          dealer_id: string
          id?: string
          invoice_id: string
          px_allowance?: number
          px_make_model?: string | null
          px_mileage?: number | null
          px_notes?: string | null
          px_settlement?: number | null
          px_vin?: string | null
          px_vrm?: string | null
        }
        Update: {
          created_at?: string
          dealer_id?: string
          id?: string
          invoice_id?: string
          px_allowance?: number
          px_make_model?: string | null
          px_mileage?: number | null
          px_notes?: string | null
          px_settlement?: number | null
          px_vin?: string | null
          px_vrm?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_exchanges_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_exchanges_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_flags: {
        Row: {
          created_at: string
          dealer_id: string
          enabled: boolean
          id: string
          key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          enabled?: boolean
          id?: string
          key: string
          user_id: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          enabled?: boolean
          id?: string
          key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_flags_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          annual_price: number | null
          created_at: string
          features_json: Json | null
          id: string
          is_active: boolean
          max_checks_per_month: number | null
          max_users: number | null
          monthly_price: number
          name: string
          updated_at: string
        }
        Insert: {
          annual_price?: number | null
          created_at?: string
          features_json?: Json | null
          id?: string
          is_active?: boolean
          max_checks_per_month?: number | null
          max_users?: number | null
          monthly_price?: number
          name: string
          updated_at?: string
        }
        Update: {
          annual_price?: number | null
          created_at?: string
          features_json?: Json | null
          id?: string
          is_active?: boolean
          max_checks_per_month?: number | null
          max_users?: number | null
          monthly_price?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      support_attachments: {
        Row: {
          created_at: string
          dealer_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          message_id: string | null
          storage_url: string
          ticket_id: string
          uploaded_by_user_id: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          storage_url: string
          ticket_id: string
          uploaded_by_user_id: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          storage_url?: string
          ticket_id?: string
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_attachments_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_role: string
          author_user_id: string | null
          created_at: string
          dealer_id: string
          id: string
          is_internal_note: boolean
          message: string
          ticket_id: string
        }
        Insert: {
          author_role?: string
          author_user_id?: string | null
          created_at?: string
          dealer_id: string
          id?: string
          is_internal_note?: boolean
          message: string
          ticket_id: string
        }
        Update: {
          author_role?: string
          author_user_id?: string | null
          created_at?: string
          dealer_id?: string
          id?: string
          is_internal_note?: boolean
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to_superadmin_user_id: string | null
          category: string
          closed_at: string | null
          created_at: string
          created_by_user_id: string
          dealer_id: string
          first_response_at: string | null
          id: string
          last_message_at: string
          priority: string
          related_entity_id: string | null
          related_entity_type: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to_superadmin_user_id?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          created_by_user_id: string
          dealer_id: string
          first_response_at?: string | null
          id?: string
          last_message_at?: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to_superadmin_user_id?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          created_by_user_id?: string
          dealer_id?: string
          first_response_at?: string | null
          id?: string
          last_message_at?: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_dealer_id_fkey"
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
      upgrade_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by_user_id: string | null
          created_at: string
          current_plan_id: string | null
          dealer_id: string
          declined_at: string | null
          id: string
          request_notes: string | null
          requested_by_user_id: string
          requested_plan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          current_plan_id?: string | null
          dealer_id: string
          declined_at?: string | null
          id?: string
          request_notes?: string | null
          requested_by_user_id: string
          requested_plan_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          current_plan_id?: string | null
          dealer_id?: string
          declined_at?: string | null
          id?: string
          request_notes?: string | null
          requested_by_user_id?: string
          requested_plan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_requests_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upgrade_requests_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upgrade_requests_requested_plan_id_fkey"
            columns: ["requested_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_files: {
        Row: {
          category: string
          created_at: string
          dealer_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          related_entity_id: string | null
          related_entity_type: string
          uploaded_by_user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          dealer_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          related_entity_id?: string | null
          related_entity_type?: string
          uploaded_by_user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          dealer_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          related_entity_id?: string | null
          related_entity_type?: string
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
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
          cached_until: string | null
          created_at: string
          created_by_user_id: string | null
          dealer_id: string
          dvla_json: Json | null
          dvla_status: Database["public"]["Enums"]["check_provider_status"]
          dvsa_json: Json | null
          dvsa_status: Database["public"]["Enums"]["check_provider_status"]
          error_message: string | null
          gvd_json: Json | null
          gvd_status: Database["public"]["Enums"]["check_provider_status"]
          id: string
          requested_at: string
          status: Database["public"]["Enums"]["check_run_status"]
          summary_data: Json | null
          updated_at: string
          vrm: string
        }
        Insert: {
          cached_until?: string | null
          created_at?: string
          created_by_user_id?: string | null
          dealer_id: string
          dvla_json?: Json | null
          dvla_status?: Database["public"]["Enums"]["check_provider_status"]
          dvsa_json?: Json | null
          dvsa_status?: Database["public"]["Enums"]["check_provider_status"]
          error_message?: string | null
          gvd_json?: Json | null
          gvd_status?: Database["public"]["Enums"]["check_provider_status"]
          id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["check_run_status"]
          summary_data?: Json | null
          updated_at?: string
          vrm: string
        }
        Update: {
          cached_until?: string | null
          created_at?: string
          created_by_user_id?: string | null
          dealer_id?: string
          dvla_json?: Json | null
          dvla_status?: Database["public"]["Enums"]["check_provider_status"]
          dvsa_json?: Json | null
          dvsa_status?: Database["public"]["Enums"]["check_provider_status"]
          error_message?: string | null
          gvd_json?: Json | null
          gvd_status?: Database["public"]["Enums"]["check_provider_status"]
          id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["check_run_status"]
          summary_data?: Json | null
          updated_at?: string
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
          certificate_pdf_url: string | null
          cost: number | null
          cost_to_dealer: number | null
          coverage_details: string | null
          created_at: string
          created_by_user_id: string | null
          customer_id: string | null
          dealer_id: string
          duration_months: number | null
          end_date: string
          id: string
          invoice_id: string | null
          mileage_limit: number | null
          notes: string | null
          policy_number: string | null
          price_sold: number | null
          provider: string | null
          start_date: string
          status: Database["public"]["Enums"]["warranty_status"]
          updated_at: string
          vehicle_id: string | null
          warranty_number: string | null
          warranty_product_name: string | null
          warranty_type: string | null
        }
        Insert: {
          certificate_pdf_url?: string | null
          cost?: number | null
          cost_to_dealer?: number | null
          coverage_details?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id: string
          duration_months?: number | null
          end_date: string
          id?: string
          invoice_id?: string | null
          mileage_limit?: number | null
          notes?: string | null
          policy_number?: string | null
          price_sold?: number | null
          provider?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["warranty_status"]
          updated_at?: string
          vehicle_id?: string | null
          warranty_number?: string | null
          warranty_product_name?: string | null
          warranty_type?: string | null
        }
        Update: {
          certificate_pdf_url?: string | null
          cost?: number | null
          cost_to_dealer?: number | null
          coverage_details?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          dealer_id?: string
          duration_months?: number | null
          end_date?: string
          id?: string
          invoice_id?: string | null
          mileage_limit?: number | null
          notes?: string | null
          policy_number?: string | null
          price_sold?: number | null
          provider?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["warranty_status"]
          updated_at?: string
          vehicle_id?: string | null
          warranty_number?: string | null
          warranty_product_name?: string | null
          warranty_type?: string | null
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
            foreignKeyName: "warranties_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      warranty_claims: {
        Row: {
          aftersales_case_id: string | null
          claim_amount: number | null
          claim_date: string
          created_at: string
          dealer_id: string
          description: string
          id: string
          status: string
          warranty_id: string
        }
        Insert: {
          aftersales_case_id?: string | null
          claim_amount?: number | null
          claim_date?: string
          created_at?: string
          dealer_id: string
          description: string
          id?: string
          status?: string
          warranty_id: string
        }
        Update: {
          aftersales_case_id?: string | null
          claim_amount?: number | null
          claim_date?: string
          created_at?: string
          dealer_id?: string
          description?: string
          id?: string
          status?: string
          warranty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_aftersales_case_id_fkey"
            columns: ["aftersales_case_id"]
            isOneToOne: false
            referencedRelation: "aftersales_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
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
      check_provider_status: "success" | "failed" | "not_run"
      check_run_status: "success" | "partial" | "failed"
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
        | "appointment_set"
        | "test_drive"
        | "finance"
        | "reserved"
        | "sold"
      payment_method_type: "bacs" | "card" | "cash" | "finance" | "other"
      sale_type: "cash" | "finance" | "part_finance"
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
      check_provider_status: ["success", "failed", "not_run"],
      check_run_status: ["success", "partial", "failed"],
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
        "appointment_set",
        "test_drive",
        "finance",
        "reserved",
        "sold",
      ],
      payment_method_type: ["bacs", "card", "cash", "finance", "other"],
      sale_type: ["cash", "finance", "part_finance"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done", "cancelled"],
      transmission_type: ["manual", "automatic", "other"],
      vehicle_location: ["on_site", "garage", "customer", "other"],
      vehicle_status: ["in_stock", "reserved", "sold", "in_repair", "returned"],
      warranty_status: ["active", "expired", "claimed", "voided"],
    },
  },
} as const
