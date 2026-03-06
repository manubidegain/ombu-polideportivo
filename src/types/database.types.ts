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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blocked_dates: {
        Row: {
          block_date: string
          court_id: string | null
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          reason: string
          start_time: string | null
          type: string
          updated_at: string
        }
        Insert: {
          block_date: string
          court_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          reason: string
          start_time?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          block_date?: string
          court_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          reason?: string
          start_time?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          has_lighting: boolean
          id: string
          image_url: string | null
          is_covered: boolean
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          has_lighting: boolean
          id?: string
          image_url?: string | null
          is_covered: boolean
          name: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          has_lighting?: boolean
          id?: string
          image_url?: string | null
          is_covered?: boolean
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          court_id: string | null
          created_at: string
          day_of_week: number | null
          duration_minutes: number | null
          end_date: string | null
          id: string
          is_active: boolean
          is_promotion: boolean
          price: number
          priority: number
          promotion_name: string | null
          start_date: string | null
          timeslot_config_id: string | null
          updated_at: string
        }
        Insert: {
          court_id?: string | null
          created_at?: string
          day_of_week?: number | null
          duration_minutes?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_promotion?: boolean
          price: number
          priority?: number
          promotion_name?: string | null
          start_date?: string | null
          timeslot_config_id?: string | null
          updated_at?: string
        }
        Update: {
          court_id?: string | null
          created_at?: string
          day_of_week?: number | null
          duration_minutes?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_promotion?: boolean
          price?: number
          priority?: number
          promotion_name?: string | null
          start_date?: string | null
          timeslot_config_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_timeslot_config_id_fkey"
            columns: ["timeslot_config_id"]
            isOneToOne: false
            referencedRelation: "timeslot_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_players: {
        Row: {
          created_at: string
          id: string
          invitation_email: string
          invitation_token: string | null
          invited_at: string
          invited_by: string
          reservation_id: string
          responded_at: string | null
          status: string
          team_assignment: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_email: string
          invitation_token?: string | null
          invited_at?: string
          invited_by: string
          reservation_id: string
          responded_at?: string | null
          status?: string
          team_assignment?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invitation_email?: string
          invitation_token?: string | null
          invited_at?: string
          invited_by?: string
          reservation_id?: string
          responded_at?: string | null
          status?: string
          team_assignment?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_players_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_players_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_teams: {
        Row: {
          created_at: string
          formation_method: string | null
          id: string
          reservation_id: string
          team_a_name: string | null
          team_b_name: string | null
          team_size: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          formation_method?: string | null
          id?: string
          reservation_id: string
          team_a_name?: string | null
          team_b_name?: string | null
          team_size?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          formation_method?: string | null
          id?: string
          reservation_id?: string
          team_a_name?: string | null
          team_b_name?: string | null
          team_size?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_teams_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          court_id: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          duration_minutes: number
          google_calendar_event_id: string | null
          id: string
          is_recurring: boolean
          join_approval_required: boolean | null
          notes: string | null
          payment_status: string
          price: number
          recurrence_end_date: string | null
          recurrence_parent_id: string | null
          requires_lighting: boolean
          reservation_date: string
          share_token: string | null
          start_time: string
          status: string
          timeslot_config_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          court_id: string
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          duration_minutes: number
          google_calendar_event_id?: string | null
          id?: string
          is_recurring?: boolean
          join_approval_required?: boolean | null
          notes?: string | null
          payment_status?: string
          price: number
          recurrence_end_date?: string | null
          recurrence_parent_id?: string | null
          requires_lighting?: boolean
          reservation_date: string
          share_token?: string | null
          start_time: string
          status?: string
          timeslot_config_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          court_id?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          duration_minutes?: number
          google_calendar_event_id?: string | null
          id?: string
          is_recurring?: boolean
          join_approval_required?: boolean | null
          notes?: string | null
          payment_status?: string
          price?: number
          recurrence_end_date?: string | null
          recurrence_parent_id?: string | null
          requires_lighting?: boolean
          reservation_date?: string
          share_token?: string | null
          start_time?: string
          status?: string
          timeslot_config_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_timeslot_config_id_fkey"
            columns: ["timeslot_config_id"]
            isOneToOne: false
            referencedRelation: "timeslot_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeslot_configs: {
        Row: {
          court_id: string
          created_at: string
          day_of_week: number
          duration_minutes: number
          id: string
          is_active: boolean
          max_concurrent_bookings: number
          requires_lighting: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          court_id: string
          created_at?: string
          day_of_week: number
          duration_minutes: number
          id?: string
          is_active?: boolean
          max_concurrent_bookings?: number
          requires_lighting?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          court_id?: string
          created_at?: string
          day_of_week?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          max_concurrent_bookings?: number
          requires_lighting?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeslot_configs_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          email_notifications: boolean
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          whatsapp_notifications: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_notifications?: boolean
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          whatsapp_notifications?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          email_notifications?: boolean
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp_notifications?: boolean
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
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
