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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          clinic: string
          created_at: string
          dependent_id: string | null
          id: string
          notes: string | null
          owner_id: string
          patient_name: string
          patient_phone: string | null
          scheduled_at: string
          service: string
          status: string
        }
        Insert: {
          clinic: string
          created_at?: string
          dependent_id?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          patient_name?: string
          patient_phone?: string | null
          scheduled_at: string
          service: string
          status?: string
        }
        Update: {
          clinic?: string
          created_at?: string
          dependent_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          patient_name?: string
          patient_phone?: string | null
          scheduled_at?: string
          service?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "dependents"
            referencedColumns: ["id"]
          },
        ]
      }
      dependents: {
        Row: {
          blood_type: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          kind: string
          last_name: string | null
          name: string
          owner_id: string
          photo_path: string | null
          relationship: string
          species: string | null
          state_province: string | null
          vaccination_center: string | null
          weight_kg: number | null
        }
        Insert: {
          blood_type?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          kind?: string
          last_name?: string | null
          name: string
          owner_id: string
          photo_path?: string | null
          relationship: string
          species?: string | null
          state_province?: string | null
          vaccination_center?: string | null
          weight_kg?: number | null
        }
        Update: {
          blood_type?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          kind?: string
          last_name?: string | null
          name?: string
          owner_id?: string
          photo_path?: string | null
          relationship?: string
          species?: string | null
          state_province?: string | null
          vaccination_center?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      document_access_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          detail: string | null
          document_id: string
          id: string
          owner_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          detail?: string | null
          document_id: string
          id?: string
          owner_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          detail?: string | null
          document_id?: string
          id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "patient_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          clinic_name: string
          created_at: string
          document_id: string
          expires_at: string
          id: string
          owner_id: string
          revoked_at: string | null
        }
        Insert: {
          clinic_name: string
          created_at?: string
          document_id: string
          expires_at: string
          id?: string
          owner_id: string
          revoked_at?: string | null
        }
        Update: {
          clinic_name?: string
          created_at?: string
          document_id?: string
          expires_at?: string
          id?: string
          owner_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "patient_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_ugx: number
          appointment_id: string | null
          clinic_name: string
          created_at: string
          dependent_id: string | null
          due_on: string | null
          id: string
          invoice_number: string
          items: Json
          owner_id: string
          paid_at: string | null
          patient_name: string
          payment_method: string | null
          status: string
        }
        Insert: {
          amount_ugx: number
          appointment_id?: string | null
          clinic_name: string
          created_at?: string
          dependent_id?: string | null
          due_on?: string | null
          id?: string
          invoice_number?: string
          items?: Json
          owner_id: string
          paid_at?: string | null
          patient_name: string
          payment_method?: string | null
          status?: string
        }
        Update: {
          amount_ugx?: number
          appointment_id?: string | null
          clinic_name?: string
          created_at?: string
          dependent_id?: string | null
          due_on?: string | null
          id?: string
          invoice_number?: string
          items?: Json
          owner_id?: string
          paid_at?: string | null
          patient_name?: string
          payment_method?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "dependents"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          category: string
          created_at: string
          dependent_id: string | null
          id: string
          mime_type: string | null
          owner_id: string
          storage_path: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          dependent_id?: string | null
          id?: string
          mime_type?: string | null
          owner_id: string
          storage_path: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          dependent_id?: string | null
          id?: string
          mime_type?: string | null
          owner_id?: string
          storage_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "dependents"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blood_type: string | null
          country: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          height_cm: number | null
          id: string
          last_name: string
          marital_status: string | null
          mobile_number: string
          nationality: string | null
          state_province: string | null
          weight_kg: number | null
        }
        Insert: {
          blood_type?: string | null
          country: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          height_cm?: number | null
          id: string
          last_name: string
          marital_status?: string | null
          mobile_number: string
          nationality?: string | null
          state_province?: string | null
          weight_kg?: number | null
        }
        Update: {
          blood_type?: string | null
          country?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          last_name?: string
          marital_status?: string | null
          mobile_number?: string
          nationality?: string | null
          state_province?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          message: string
          owner_id: string | null
          phone: string
          provider_response: string | null
          status: string
        }
        Insert: {
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind: string
          message: string
          owner_id?: string | null
          phone: string
          provider_response?: string | null
          status: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          message?: string
          owner_id?: string | null
          phone?: string
          provider_response?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          dependent_id: string | null
          id: string
          note: string | null
          owner_id: string
          taken: boolean
          taken_on: string | null
          updated_at: string
          vaccine_key: string
        }
        Insert: {
          dependent_id?: string | null
          id?: string
          note?: string | null
          owner_id: string
          taken?: boolean
          taken_on?: string | null
          updated_at?: string
          vaccine_key: string
        }
        Update: {
          dependent_id?: string | null
          id?: string
          note?: string | null
          owner_id?: string
          taken?: boolean
          taken_on?: string | null
          updated_at?: string
          vaccine_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "dependents"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_content: {
        Row: {
          description: string | null
          dose: string | null
          group_label: string | null
          info: Json | null
          name: string | null
          route: string | null
          short: string | null
          updated_at: string
          updated_by: string | null
          vaccine_key: string
        }
        Insert: {
          description?: string | null
          dose?: string | null
          group_label?: string | null
          info?: Json | null
          name?: string | null
          route?: string | null
          short?: string | null
          updated_at?: string
          updated_by?: string | null
          vaccine_key: string
        }
        Update: {
          description?: string | null
          dose?: string | null
          group_label?: string | null
          info?: Json | null
          name?: string | null
          route?: string | null
          short?: string | null
          updated_at?: string
          updated_by?: string | null
          vaccine_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      document_shared_with_staff: { Args: { _doc: string }; Returns: boolean }
      get_invoice_for_payment: {
        Args: { _number: string }
        Returns: {
          amount_ugx: number
          clinic_name: string
          due_on: string
          invoice_number: string
          items: Json
          paid_at: string
          patient_name: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_certificate: {
        Args: { _member: string }
        Returns: {
          date_of_birth: string
          full_name: string
          taken_on: string
          vaccine_key: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "patient"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "staff", "patient"],
    },
  },
} as const
