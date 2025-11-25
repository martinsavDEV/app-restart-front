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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      lot_templates: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
          template_lines: Json
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          template_lines?: Json
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          template_lines?: Json
          updated_at?: string
        }
        Relationships: []
      }
      lots: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          label: string
          order_index: number
          quote_version_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          label: string
          order_index?: number
          quote_version_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          label?: string
          order_index?: number
          quote_version_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_quote_version_id_fkey"
            columns: ["quote_version_id"]
            isOneToOne: false
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      price_items: {
        Row: {
          created_at: string
          date_modif: string | null
          id: string
          item: string
          item_id: string | null
          lot_code: string
          price_reference: string | null
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_modif?: string | null
          id?: string
          item: string
          item_id?: string | null
          lot_code?: string
          price_reference?: string | null
          unit: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_modif?: string | null
          id?: string
          item?: string
          item_id?: string | null
          lot_code?: string
          price_reference?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          department: string | null
          description: string | null
          id: string
          n_wtg: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          n_wtg?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          n_wtg?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_lines: {
        Row: {
          code: string
          comment: string | null
          created_at: string
          designation: string
          id: string
          lot_id: string
          order_index: number
          price_source: string | null
          quantity: number
          total_price: number | null
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          code: string
          comment?: string | null
          created_at?: string
          designation: string
          id?: string
          lot_id: string
          order_index?: number
          price_source?: string | null
          quantity?: number
          total_price?: number | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          code?: string
          comment?: string | null
          created_at?: string
          designation?: string
          id?: string
          lot_id?: string
          order_index?: number
          price_source?: string | null
          quantity?: number
          total_price?: number | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_lines_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_settings: {
        Row: {
          created_at: string
          hub_height: number | null
          id: string
          n_wtg: number
          quote_version_id: string
          settings: Json | null
          turbine_model: string | null
          turbine_power: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hub_height?: number | null
          id?: string
          n_wtg?: number
          quote_version_id: string
          settings?: Json | null
          turbine_model?: string | null
          turbine_power?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hub_height?: number | null
          id?: string
          n_wtg?: number
          quote_version_id?: string
          settings?: Json | null
          turbine_model?: string | null
          turbine_power?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_settings_quote_version_id_fkey"
            columns: ["quote_version_id"]
            isOneToOne: true
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          comment: string | null
          created_at: string | null
          date_creation: string | null
          id: string
          last_update: string | null
          project_id: string
          total_amount: number | null
          type: string | null
          updated_at: string | null
          version_label: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          date_creation?: string | null
          id?: string
          last_update?: string | null
          project_id: string
          total_amount?: number | null
          type?: string | null
          updated_at?: string | null
          version_label: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          date_creation?: string | null
          id?: string
          last_update?: string | null
          project_id?: string
          total_amount?: number | null
          type?: string | null
          updated_at?: string | null
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_documents: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          label: string
          reference: string | null
          version_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          label: string
          reference?: string | null
          version_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          label?: string
          reference?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_documents_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
