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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      board_interest: {
        Row: {
          created_at: string
          email: string
          id: string
          linkedin_url: string | null
          name: string
          organization: string
          statement: string
          title: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          linkedin_url?: string | null
          name: string
          organization: string
          statement: string
          title: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          organization?: string
          statement?: string
          title?: string
        }
        Relationships: []
      }
      briefing_requests: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          interaction: string
          last_name: string
          message: string | null
          organization: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          interaction: string
          last_name: string
          message?: string | null
          organization: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          interaction?: string
          last_name?: string
          message?: string | null
          organization?: string
          role?: string
        }
        Relationships: []
      }
      certification_interest: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      portal_activity: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          member_id: string | null
          metadata: Json
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          member_id?: string | null
          metadata?: Json
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          member_id?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "portal_activity_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_inquiries: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          member_id: string
          message: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["portal_inquiry_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          member_id: string
          message: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["portal_inquiry_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          member_id?: string
          message?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["portal_inquiry_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_inquiries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_members: {
        Row: {
          created_at: string
          email: string
          entity: Database["public"]["Enums"]["portal_entity"]
          first_access_at: string | null
          first_name: string
          id: string
          invited_at: string
          last_access_at: string | null
          last_name: string
          organization: string
          package_status: Database["public"]["Enums"]["portal_package_status"]
          professional_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["portal_member_status"]
          title: string | null
          updated_at: string
          user_id: string
          why_you: string
        }
        Insert: {
          created_at?: string
          email: string
          entity: Database["public"]["Enums"]["portal_entity"]
          first_access_at?: string | null
          first_name: string
          id?: string
          invited_at?: string
          last_access_at?: string | null
          last_name: string
          organization: string
          package_status?: Database["public"]["Enums"]["portal_package_status"]
          professional_name?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["portal_member_status"]
          title?: string | null
          updated_at?: string
          user_id: string
          why_you: string
        }
        Update: {
          created_at?: string
          email?: string
          entity?: Database["public"]["Enums"]["portal_entity"]
          first_access_at?: string | null
          first_name?: string
          id?: string
          invited_at?: string
          last_access_at?: string | null
          last_name?: string
          organization?: string
          package_status?: Database["public"]["Enums"]["portal_package_status"]
          professional_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["portal_member_status"]
          title?: string | null
          updated_at?: string
          user_id?: string
          why_you?: string
        }
        Relationships: []
      }
      portal_profiles: {
        Row: {
          contact_requested: boolean
          created_at: string
          current_organization: string | null
          current_stage: number
          experience_answers: Json
          final_notes: string | null
          headshot_path: string | null
          id: string
          member_id: string
          preferred_email: string | null
          preferred_name: string | null
          preferred_phone: string | null
          professional_role: string | null
          questions: string | null
          reopened_at: string | null
          restriction_details: string | null
          restriction_status: string | null
          submitted_at: string | null
          updated_at: string
          visibility_instructions: Json
        }
        Insert: {
          contact_requested?: boolean
          created_at?: string
          current_organization?: string | null
          current_stage?: number
          experience_answers?: Json
          final_notes?: string | null
          headshot_path?: string | null
          id?: string
          member_id: string
          preferred_email?: string | null
          preferred_name?: string | null
          preferred_phone?: string | null
          professional_role?: string | null
          questions?: string | null
          reopened_at?: string | null
          restriction_details?: string | null
          restriction_status?: string | null
          submitted_at?: string | null
          updated_at?: string
          visibility_instructions?: Json
        }
        Update: {
          contact_requested?: boolean
          created_at?: string
          current_organization?: string | null
          current_stage?: number
          experience_answers?: Json
          final_notes?: string | null
          headshot_path?: string | null
          id?: string
          member_id?: string
          preferred_email?: string | null
          preferred_name?: string | null
          preferred_phone?: string | null
          professional_role?: string | null
          questions?: string | null
          reopened_at?: string | null
          restriction_details?: string | null
          restriction_status?: string | null
          submitted_at?: string | null
          updated_at?: string
          visibility_instructions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "portal_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "portal_members"
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
      vanguard_interest: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          property: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          property: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          property?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_vanguard_seats: {
        Args: never
        Returns: {
          filled: number
          total: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "board_member" | "advisor"
      portal_entity: "prsc" | "dis" | "both"
      portal_inquiry_status: "open" | "resolved"
      portal_member_status: "invited" | "active" | "revoked"
      portal_package_status:
        | "awaiting_profile"
        | "in_preparation"
        | "profile_received"
        | "package_ready"
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
      app_role: ["admin", "board_member", "advisor"],
      portal_entity: ["prsc", "dis", "both"],
      portal_inquiry_status: ["open", "resolved"],
      portal_member_status: ["invited", "active", "revoked"],
      portal_package_status: [
        "awaiting_profile",
        "in_preparation",
        "profile_received",
        "package_ready",
      ],
    },
  },
} as const
