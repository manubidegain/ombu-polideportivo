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
          calendar_id: string | null
          calendar_sync_enabled: boolean | null
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
          calendar_id?: string | null
          calendar_sync_enabled?: boolean | null
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
          calendar_id?: string | null
          calendar_sync_enabled?: boolean | null
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
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expiry_date: number | null
          google_account_id: string | null
          google_email: string | null
          id: string
          is_active: boolean | null
          refresh_token: string
          scope: string | null
          token_type: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expiry_date?: number | null
          google_account_id?: string | null
          google_email?: string | null
          id?: string
          is_active?: boolean | null
          refresh_token: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expiry_date?: number | null
          google_account_id?: string | null
          google_email?: string | null
          id?: string
          is_active?: boolean | null
          refresh_token?: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      player_achievements: {
        Row: {
          achievement_type: string
          awarded_at: string | null
          category_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          tournament_id: string | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          awarded_at?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          tournament_id?: string | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          awarded_at?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          tournament_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tournament_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
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
          calendar_event_id: string | null
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
          calendar_event_id?: string | null
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
          calendar_event_id?: string | null
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
      tournament_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_teams: number
          min_teams: number | null
          name: string
          tournament_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_teams: number
          min_teams?: number | null
          name: string
          tournament_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_teams?: number
          min_teams?: number | null
          name?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_categories_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_invitations: {
        Row: {
          category_id: string
          contact_phone: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invitee_email: string
          invitee_id: string | null
          inviter_email: string
          inviter_id: string
          responded_at: string | null
          status: string | null
          team_name: string
          tournament_id: string
          unavailable_slot_ids: string[] | null
        }
        Insert: {
          category_id: string
          contact_phone?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email: string
          invitee_id?: string | null
          inviter_email: string
          inviter_id: string
          responded_at?: string | null
          status?: string | null
          team_name: string
          tournament_id: string
          unavailable_slot_ids?: string[] | null
        }
        Update: {
          category_id?: string
          contact_phone?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string
          invitee_id?: string | null
          inviter_email?: string
          inviter_id?: string
          responded_at?: string | null
          status?: string | null
          team_name?: string
          tournament_id?: string
          unavailable_slot_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_invitations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tournament_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_invitations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          completed_at: string | null
          court_id: string | null
          created_at: string | null
          id: string
          reservation_id: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          score: Json | null
          series_id: string | null
          status: string | null
          team1_id: string
          team2_id: string
          tournament_id: string
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          court_id?: string | null
          created_at?: string | null
          id?: string
          reservation_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          score?: Json | null
          series_id?: string | null
          status?: string | null
          team1_id: string
          team2_id: string
          tournament_id: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          court_id?: string | null
          created_at?: string | null
          id?: string
          reservation_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          score?: Json | null
          series_id?: string | null
          status?: string | null
          team1_id?: string
          team2_id?: string
          tournament_id?: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "tournament_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          file_name: string
          file_path: string
          id: string
          is_featured: boolean | null
          tournament_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_name: string
          file_path: string
          id?: string
          is_featured?: boolean | null
          tournament_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_name?: string
          file_path?: string
          id?: string
          is_featured?: boolean | null
          tournament_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_photos_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          category_id: string
          contact_email: string
          contact_phone: string | null
          id: string
          payment_amount: number | null
          payment_date: string | null
          payment_status: string | null
          player_names: Json | null
          player1_id: string
          player2_id: string | null
          registered_at: string | null
          status: string | null
          team_name: string | null
          team_type: string
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          contact_email: string
          contact_phone?: string | null
          id?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_status?: string | null
          player_names?: Json | null
          player1_id: string
          player2_id?: string | null
          registered_at?: string | null
          status?: string | null
          team_name?: string | null
          team_type: string
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          contact_email?: string
          contact_phone?: string | null
          id?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_status?: string | null
          player_names?: Json | null
          player1_id?: string
          player2_id?: string | null
          registered_at?: string | null
          status?: string | null
          team_name?: string | null
          team_type?: string
          tournament_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tournament_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_series: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name: string
          phase: string
          series_number: number
          status: string | null
          team_count: number
          tournament_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          phase?: string
          series_number: number
          status?: string | null
          team_count: number
          tournament_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          phase?: string
          series_number?: number
          status?: string | null
          team_count?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_series_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tournament_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_series_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_series_teams: {
        Row: {
          created_at: string | null
          games_lost: number | null
          games_won: number | null
          id: string
          matches_lost: number | null
          matches_played: number | null
          matches_won: number | null
          points: number | null
          position: number | null
          registration_id: string
          series_id: string
          sets_lost: number | null
          sets_won: number | null
        }
        Insert: {
          created_at?: string | null
          games_lost?: number | null
          games_won?: number | null
          id?: string
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          points?: number | null
          position?: number | null
          registration_id: string
          series_id: string
          sets_lost?: number | null
          sets_won?: number | null
        }
        Update: {
          created_at?: string | null
          games_lost?: number | null
          games_won?: number | null
          id?: string
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          points?: number | null
          position?: number | null
          registration_id?: string
          series_id?: string
          sets_lost?: number | null
          sets_won?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_series_teams_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_series_teams_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "tournament_series"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_team_unavailability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          reason: string | null
          registration_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          reason?: string | null
          registration_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          reason?: string | null
          registration_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_team_unavailability_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_time_slots: {
        Row: {
          court_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          tournament_id: string
        }
        Insert: {
          court_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          tournament_id: string
        }
        Update: {
          court_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_time_slots_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_time_slots_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          games_per_set: number
          id: string
          match_duration_minutes: number
          name: string
          registration_deadline: string | null
          registration_price: number
          sets_to_win: number
          sport_type: string
          start_date: string
          status: string
          tiebreak_points: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          games_per_set?: number
          id?: string
          match_duration_minutes?: number
          name: string
          registration_deadline?: string | null
          registration_price?: number
          sets_to_win?: number
          sport_type?: string
          start_date: string
          status?: string
          tiebreak_points?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          games_per_set?: number
          id?: string
          match_duration_minutes?: number
          name?: string
          registration_deadline?: string | null
          registration_price?: number
          sets_to_win?: number
          sport_type?: string
          start_date?: string
          status?: string
          tiebreak_points?: number
          updated_at?: string | null
        }
        Relationships: []
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
