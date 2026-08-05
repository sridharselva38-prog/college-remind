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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          college_id: string | null
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          college_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          college_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          address: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          payment_link: string | null
          phone: string | null
          reminder_language: string
          support_contact: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          payment_link?: string | null
          phone?: string | null
          reminder_language?: string
          support_contact?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          payment_link?: string | null
          phone?: string | null
          reminder_language?: string
          support_contact?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      fee_records: {
        Row: {
          academic_year: string | null
          balance_fee: number | null
          college_id: string
          created_at: string
          discount: number
          due_date: string
          id: string
          late_fee: number
          notes: string | null
          paid_fee: number
          scholarship: number
          status: Database["public"]["Enums"]["fee_status"]
          student_id: string
          term: string | null
          total_fee: number
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          balance_fee?: number | null
          college_id: string
          created_at?: string
          discount?: number
          due_date: string
          id?: string
          late_fee?: number
          notes?: string | null
          paid_fee?: number
          scholarship?: number
          status?: Database["public"]["Enums"]["fee_status"]
          student_id: string
          term?: string | null
          total_fee?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          balance_fee?: number | null
          college_id?: string
          created_at?: string
          discount?: number
          due_date?: string
          id?: string
          late_fee?: number
          notes?: string | null
          paid_fee?: number
          scholarship?: number
          status?: Database["public"]["Enums"]["fee_status"]
          student_id?: string
          term?: string | null
          total_fee?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_records_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          college_id: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          college_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          college_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          college_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          college_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_logs: {
        Row: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          college_id: string
          created_at: string
          error_message: string | null
          fee_record_id: string | null
          id: string
          message_body: string | null
          provider_ref: string | null
          recipient: Database["public"]["Enums"]["recipient_type"]
          recipient_value: string | null
          retry_count: number
          sent_at: string
          sent_by: string | null
          stage: Database["public"]["Enums"]["reminder_stage"]
          status: Database["public"]["Enums"]["reminder_status"]
          student_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          college_id: string
          created_at?: string
          error_message?: string | null
          fee_record_id?: string | null
          id?: string
          message_body?: string | null
          provider_ref?: string | null
          recipient: Database["public"]["Enums"]["recipient_type"]
          recipient_value?: string | null
          retry_count?: number
          sent_at?: string
          sent_by?: string | null
          stage: Database["public"]["Enums"]["reminder_stage"]
          status?: Database["public"]["Enums"]["reminder_status"]
          student_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          college_id?: string
          created_at?: string
          error_message?: string | null
          fee_record_id?: string | null
          id?: string
          message_body?: string | null
          provider_ref?: string | null
          recipient?: Database["public"]["Enums"]["recipient_type"]
          recipient_value?: string | null
          retry_count?: number
          sent_at?: string
          sent_by?: string | null
          stage?: Database["public"]["Enums"]["reminder_stage"]
          status?: Database["public"]["Enums"]["reminder_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "fee_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          college_id: string | null
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          college_id?: string | null
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          college_id: string
          course: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          is_active: boolean
          parent_email: string | null
          parent_phone: string | null
          photo_url: string | null
          register_number: string
          section: string | null
          semester: number | null
          student_email: string | null
          student_phone: string | null
          updated_at: string
          user_id: string | null
          year: number | null
        }
        Insert: {
          address?: string | null
          college_id: string
          course?: string | null
          created_at?: string
          department?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          parent_email?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          register_number: string
          section?: string | null
          semester?: number | null
          student_email?: string | null
          student_phone?: string | null
          updated_at?: string
          user_id?: string | null
          year?: number | null
        }
        Update: {
          address?: string | null
          college_id?: string
          course?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          parent_email?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          register_number?: string
          section?: string | null
          semester?: number | null
          student_email?: string | null
          student_phone?: string | null
          updated_at?: string
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      [_ in never]: never
    }
    Enums: {
      app_role: "super_admin" | "college_admin" | "student"
      fee_status: "pending" | "partial" | "paid" | "overdue"
      recipient_type: "student" | "parent"
      reminder_channel: "whatsapp" | "email" | "push"
      reminder_stage:
        | "before_15"
        | "before_7"
        | "before_3"
        | "due_today"
        | "after_1"
        | "after_7"
      reminder_status: "queued" | "sent" | "delivered" | "failed"
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
      app_role: ["super_admin", "college_admin", "student"],
      fee_status: ["pending", "partial", "paid", "overdue"],
      recipient_type: ["student", "parent"],
      reminder_channel: ["whatsapp", "email", "push"],
      reminder_stage: [
        "before_15",
        "before_7",
        "before_3",
        "due_today",
        "after_1",
        "after_7",
      ],
      reminder_status: ["queued", "sent", "delivered", "failed"],
    },
  },
} as const
