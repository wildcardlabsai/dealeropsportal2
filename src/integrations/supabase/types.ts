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
      app_role: "super_admin" | "dealer_admin" | "dealer_user"
      contact_method: "phone" | "email" | "whatsapp" | "post"
      dealer_status: "active" | "suspended" | "pending"
      fuel_type:
        | "petrol"
        | "diesel"
        | "electric"
        | "hybrid"
        | "plug_in_hybrid"
        | "other"
      transmission_type: "manual" | "automatic" | "other"
      vehicle_location: "on_site" | "garage" | "customer" | "other"
      vehicle_status:
        | "in_stock"
        | "reserved"
        | "sold"
        | "in_repair"
        | "returned"
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
      app_role: ["super_admin", "dealer_admin", "dealer_user"],
      contact_method: ["phone", "email", "whatsapp", "post"],
      dealer_status: ["active", "suspended", "pending"],
      fuel_type: [
        "petrol",
        "diesel",
        "electric",
        "hybrid",
        "plug_in_hybrid",
        "other",
      ],
      transmission_type: ["manual", "automatic", "other"],
      vehicle_location: ["on_site", "garage", "customer", "other"],
      vehicle_status: ["in_stock", "reserved", "sold", "in_repair", "returned"],
    },
  },
} as const
