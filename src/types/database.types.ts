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
      api_key_usage_logs: {
        Row: {
          api_key_id: string
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown
          method: string
          organization_id: string
          request_body_size: number | null
          request_id: string | null
          response_body_size: number | null
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method: string
          organization_id: string
          request_body_size?: number | null
          request_id?: string | null
          response_body_size?: number | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method?: string
          organization_id?: string
          request_body_size?: number | null
          request_id?: string | null
          response_body_size?: number | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          environment: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          permissions: string[] | null
          rate_limit: number | null
          request_count: number | null
          rotated_at: string | null
          rotated_from: string | null
          scopes: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          permissions?: string[] | null
          rate_limit?: number | null
          request_count?: number | null
          rotated_at?: string | null
          rotated_from?: string | null
          scopes?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          permissions?: string[] | null
          rate_limit?: number | null
          request_count?: number | null
          rotated_at?: string | null
          rotated_from?: string | null
          scopes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_rotated_from_fkey"
            columns: ["rotated_from"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limit_windows: {
        Row: {
          api_key_id: string
          created_at: string | null
          id: string
          request_count: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          id?: string
          request_count?: number | null
          window_end: string
          window_start: string
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          id?: string
          request_count?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limit_windows_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json
          description: string
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          organization_id: string | null
          slug: string
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria?: Json
          description: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          organization_id?: string | null
          slug: string
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          organization_id?: string | null
          slug?: string
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: Json | null
          average_rating: number | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          google_maps_url: string | null
          google_place_id: string | null
          hours_of_operation: Json | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          manager_email: string | null
          manager_name: string | null
          name: string
          organization_id: string
          phone: string | null
          photo_url: string | null
          region: string | null
          slug: string
          total_loan_officers: number | null
          total_reviews: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: Json | null
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          hours_of_operation?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          manager_email?: string | null
          manager_name?: string | null
          name: string
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          region?: string | null
          slug: string
          total_loan_officers?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: Json | null
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          hours_of_operation?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          manager_email?: string | null
          manager_name?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          region?: string | null
          slug?: string
          total_loan_officers?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_listings: {
        Row: {
          accuracy_score: number | null
          branch_id: string | null
          business_categories: string[] | null
          business_description: string | null
          business_email: string | null
          business_keywords: string[] | null
          business_name: string
          business_phone: string | null
          business_website: string | null
          city: string | null
          country: string
          cover_photo_url: string | null
          created_at: string | null
          hours_of_operation: Json | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_accuracy_check: string | null
          logo_url: string | null
          merged_from: string | null
          nap_consistency_status: string | null
          organization_id: string
          photos: string[] | null
          postal_code: string | null
          potential_duplicates: string[] | null
          social_links: Json | null
          state: string | null
          street_address: string | null
          street_address_2: string | null
          updated_at: string | null
        }
        Insert: {
          accuracy_score?: number | null
          branch_id?: string | null
          business_categories?: string[] | null
          business_description?: string | null
          business_email?: string | null
          business_keywords?: string[] | null
          business_name: string
          business_phone?: string | null
          business_website?: string | null
          city?: string | null
          country?: string
          cover_photo_url?: string | null
          created_at?: string | null
          hours_of_operation?: Json | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_accuracy_check?: string | null
          logo_url?: string | null
          merged_from?: string | null
          nap_consistency_status?: string | null
          organization_id: string
          photos?: string[] | null
          postal_code?: string | null
          potential_duplicates?: string[] | null
          social_links?: Json | null
          state?: string | null
          street_address?: string | null
          street_address_2?: string | null
          updated_at?: string | null
        }
        Update: {
          accuracy_score?: number | null
          branch_id?: string | null
          business_categories?: string[] | null
          business_description?: string | null
          business_email?: string | null
          business_keywords?: string[] | null
          business_name?: string
          business_phone?: string | null
          business_website?: string | null
          city?: string | null
          country?: string
          cover_photo_url?: string | null
          created_at?: string | null
          hours_of_operation?: Json | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_accuracy_check?: string | null
          logo_url?: string | null
          merged_from?: string | null
          nap_consistency_status?: string | null
          organization_id?: string
          photos?: string[] | null
          postal_code?: string | null
          potential_duplicates?: string[] | null
          social_links?: Json | null
          state?: string | null
          street_address?: string | null
          street_address_2?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_connections: {
        Row: {
          access_token: string | null
          conflicts: Json | null
          created_at: string | null
          directory_listing_id: string | null
          directory_url: string | null
          directory_username: string | null
          has_conflicts: boolean | null
          id: string
          is_connected: boolean | null
          is_verified: boolean | null
          last_sync_at: string | null
          listing_id: string
          nap_match_score: number | null
          organization_id: string
          platform: string
          refresh_token: string | null
          remote_nap_data: Json | null
          sync_error: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          conflicts?: Json | null
          created_at?: string | null
          directory_listing_id?: string | null
          directory_url?: string | null
          directory_username?: string | null
          has_conflicts?: boolean | null
          id?: string
          is_connected?: boolean | null
          is_verified?: boolean | null
          last_sync_at?: string | null
          listing_id: string
          nap_match_score?: number | null
          organization_id: string
          platform: string
          refresh_token?: string | null
          remote_nap_data?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          conflicts?: Json | null
          created_at?: string | null
          directory_listing_id?: string | null
          directory_url?: string | null
          directory_username?: string | null
          has_conflicts?: boolean | null
          id?: string
          is_connected?: boolean | null
          is_verified?: boolean | null
          last_sync_at?: string | null
          listing_id?: string
          nap_match_score?: number | null
          organization_id?: string
          platform?: string
          refresh_token?: string | null
          remote_nap_data?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_connections_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_rate_limits: {
        Row: {
          created_at: string | null
          emails_sent: number | null
          id: string
          max_emails_per_day: number | null
          max_emails_per_hour: number | null
          organization_id: string
          updated_at: string | null
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          max_emails_per_day?: number | null
          max_emails_per_hour?: number | null
          organization_id: string
          updated_at?: string | null
          window_end: string
          window_start: string
        }
        Update: {
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          max_emails_per_day?: number | null
          max_emails_per_hour?: number | null
          organization_id?: string
          updated_at?: string | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_rate_limits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          from_email: string
          from_name: string | null
          id: string
          loan_officer_id: string | null
          opened_at: string | null
          organization_id: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          survey_id: string | null
          template_name: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          loan_officer_id?: string | null
          opened_at?: string | null
          organization_id?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          survey_id?: string | null
          template_name?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          loan_officer_id?: string | null
          opened_at?: string | null
          organization_id?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          survey_id?: string | null
          template_name?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribes: {
        Row: {
          email: string
          id: string
          organization_id: string | null
          reason: string | null
          token: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          token?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          token?: string
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_settings: {
        Row: {
          badge_notification_enabled: boolean | null
          created_at: string | null
          custom_settings: Json | null
          id: string
          is_enabled: boolean | null
          leaderboard_refresh_interval: string | null
          organization_id: string
          public_leaderboard: boolean | null
          show_badges_on_profile: boolean | null
          updated_at: string | null
        }
        Insert: {
          badge_notification_enabled?: boolean | null
          created_at?: string | null
          custom_settings?: Json | null
          id?: string
          is_enabled?: boolean | null
          leaderboard_refresh_interval?: string | null
          organization_id: string
          public_leaderboard?: boolean | null
          show_badges_on_profile?: boolean | null
          updated_at?: string | null
        }
        Update: {
          badge_notification_enabled?: boolean | null
          created_at?: string | null
          custom_settings?: Json | null
          id?: string
          is_enabled?: boolean | null
          leaderboard_refresh_interval?: string | null
          organization_id?: string
          public_leaderboard?: boolean | null
          show_badges_on_profile?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_connections: {
        Row: {
          access_token: string
          average_rating: number | null
          created_at: string | null
          google_account_email: string | null
          google_account_id: string
          google_account_name: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          loan_officer_id: string | null
          location_address: string | null
          location_id: string
          location_name: string | null
          organization_id: string
          refresh_token: string
          reviews_count: number | null
          scopes: string[] | null
          sync_error: string | null
          sync_status: string | null
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          average_rating?: number | null
          created_at?: string | null
          google_account_email?: string | null
          google_account_id: string
          google_account_name?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          loan_officer_id?: string | null
          location_address?: string | null
          location_id: string
          location_name?: string | null
          organization_id: string
          refresh_token: string
          reviews_count?: number | null
          scopes?: string[] | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          average_rating?: number | null
          created_at?: string | null
          google_account_email?: string | null
          google_account_id?: string
          google_account_name?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          loan_officer_id?: string | null
          location_address?: string | null
          location_id?: string
          location_name?: string | null
          organization_id?: string
          refresh_token?: string
          reviews_count?: number | null
          scopes?: string[] | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_connections_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_review_replies: {
        Row: {
          connection_id: string
          created_at: string | null
          error_message: string | null
          google_reply_time: string | null
          id: string
          organization_id: string
          reply_text: string
          review_id: string
          sent_at: string | null
          sent_by: string | null
          status: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          error_message?: string | null
          google_reply_time?: string | null
          id?: string
          organization_id: string
          reply_text: string
          review_id: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          error_message?: string | null
          google_reply_time?: string | null
          id?: string
          organization_id?: string
          reply_text?: string
          review_id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_review_replies_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_review_replies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_review_replies_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sync_logs: {
        Row: {
          completed_at: string | null
          connection_id: string
          duration_ms: number | null
          errors: string[] | null
          id: string
          metadata: Json | null
          organization_id: string
          reviews_created: number | null
          reviews_fetched: number | null
          reviews_updated: number | null
          started_at: string | null
          status: string | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          duration_ms?: number | null
          errors?: string[] | null
          id?: string
          metadata?: Json | null
          organization_id: string
          reviews_created?: number | null
          reviews_fetched?: number | null
          reviews_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          duration_ms?: number | null
          errors?: string[] | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          reviews_created?: number | null
          reviews_fetched?: number | null
          reviews_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_sync_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          average_rating: number | null
          created_at: string | null
          id: string
          loan_officer_id: string
          nps_score: number | null
          organization_id: string
          period_key: string
          period_type: string
          rank: number
          reputation_score: number
          snapshot_date: string
          total_reviews: number
        }
        Insert: {
          average_rating?: number | null
          created_at?: string | null
          id?: string
          loan_officer_id: string
          nps_score?: number | null
          organization_id: string
          period_key: string
          period_type: string
          rank: number
          reputation_score?: number
          snapshot_date?: string
          total_reviews?: number
        }
        Update: {
          average_rating?: number | null
          created_at?: string | null
          id?: string
          loan_officer_id?: string
          nps_score?: number | null
          organization_id?: string
          period_key?: string
          period_type?: string
          rank?: number
          reputation_score?: number
          snapshot_date?: string
          total_reviews?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_accuracy_history: {
        Row: {
          accuracy_score: number
          breakdown: Json | null
          checked_at: string | null
          id: string
          listing_id: string
          organization_id: string
        }
        Insert: {
          accuracy_score: number
          breakdown?: Json | null
          checked_at?: string | null
          id?: string
          listing_id: string
          organization_id: string
        }
        Update: {
          accuracy_score?: number
          breakdown?: Json | null
          checked_at?: string | null
          id?: string
          listing_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_accuracy_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_accuracy_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_alerts: {
        Row: {
          alert_type: string
          connection_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          listing_id: string | null
          organization_id: string
          platform: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          listing_id?: string | null
          organization_id: string
          platform?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          listing_id?: string | null
          organization_id?: string
          platform?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_alerts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "directory_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_alerts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_sync_logs: {
        Row: {
          changes_applied: Json | null
          changes_detected: Json | null
          completed_at: string | null
          conflicts_found: Json | null
          connection_id: string
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          organization_id: string
          started_at: string | null
          status: string | null
          sync_direction: string
          sync_type: string
        }
        Insert: {
          changes_applied?: Json | null
          changes_detected?: Json | null
          completed_at?: string | null
          conflicts_found?: Json | null
          connection_id: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          organization_id: string
          started_at?: string | null
          status?: string | null
          sync_direction: string
          sync_type: string
        }
        Update: {
          changes_applied?: Json | null
          changes_detected?: Json | null
          completed_at?: string | null
          conflicts_found?: Json | null
          connection_id?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          organization_id?: string
          started_at?: string | null
          status?: string | null
          sync_direction?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "directory_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_sync_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_officers: {
        Row: {
          address: Json | null
          auto_request_reviews: boolean | null
          average_rating: number | null
          bio: string | null
          branch: string | null
          branch_id: string | null
          created_at: string | null
          email: string
          full_name: string
          google_business_id: string | null
          google_place_id: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          linkedin_url: string | null
          longitude: number | null
          nmls_id: string | null
          nps_score: number | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          receive_notifications: boolean | null
          region: string | null
          reputation_score: number | null
          title: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          zillow_profile_url: string | null
        }
        Insert: {
          address?: Json | null
          auto_request_reviews?: boolean | null
          average_rating?: number | null
          bio?: string | null
          branch?: string | null
          branch_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          google_business_id?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          linkedin_url?: string | null
          longitude?: number | null
          nmls_id?: string | null
          nps_score?: number | null
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          receive_notifications?: boolean | null
          region?: string | null
          reputation_score?: number | null
          title?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          zillow_profile_url?: string | null
        }
        Update: {
          address?: Json | null
          auto_request_reviews?: boolean | null
          average_rating?: number | null
          bio?: string | null
          branch?: string | null
          branch_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          google_business_id?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          linkedin_url?: string | null
          longitude?: number | null
          nmls_id?: string | null
          nps_score?: number | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          receive_notifications?: boolean | null
          region?: string | null
          reputation_score?: number | null
          title?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          zillow_profile_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_officers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_officers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_officers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_snapshots: {
        Row: {
          computed_at: string | null
          id: string
          loan_officer_id: string | null
          metrics: Json
          organization_id: string
          period_end: string
          period_start: string
          period_type: string
        }
        Insert: {
          computed_at?: string | null
          id?: string
          loan_officer_id?: string | null
          metrics?: Json
          organization_id: string
          period_end: string
          period_start: string
          period_type: string
        }
        Update: {
          computed_at?: string | null
          id?: string
          loan_officer_id?: string | null
          metrics?: Json
          organization_id?: string
          period_end?: string
          period_start?: string
          period_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_snapshots_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_survey_mappings: {
        Row: {
          created_at: string | null
          delay_hours: number | null
          description: string | null
          id: string
          is_active: boolean | null
          milestone_name: string
          organization_id: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delay_hours?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          milestone_name: string
          organization_id: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delay_hours?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          milestone_name?: string
          organization_id?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_survey_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_survey_mappings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_digest_queue: {
        Row: {
          created_at: string | null
          digest_type: string
          id: string
          notification_id: string
          processed_at: string | null
          scheduled_for: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          digest_type: string
          id?: string
          notification_id: string
          processed_at?: string | null
          scheduled_for: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          digest_type?: string
          id?: string
          notification_id?: string
          processed_at?: string | null
          scheduled_for?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_digest_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: true
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_digest_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          digest_day_of_week: number | null
          digest_enabled: boolean | null
          digest_frequency: string | null
          digest_hour: number | null
          digest_timezone: string | null
          email_badge_earned: boolean | null
          email_enabled: boolean | null
          email_mention: boolean | null
          email_negative_review: boolean | null
          email_new_review: boolean | null
          email_response_posted: boolean | null
          email_review_approved: boolean | null
          id: string
          in_app_badge_earned: boolean | null
          in_app_enabled: boolean | null
          in_app_mention: boolean | null
          in_app_negative_review: boolean | null
          in_app_new_review: boolean | null
          in_app_response_posted: boolean | null
          in_app_review_approved: boolean | null
          instant_alert_enabled: boolean | null
          instant_alert_threshold: number | null
          last_digest_sent_at: string | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          slack_channel: string | null
          slack_digest: boolean | null
          slack_enabled: boolean | null
          slack_negative_review: boolean | null
          slack_new_review: boolean | null
          slack_webhook_url: string | null
          teams_digest: boolean | null
          teams_enabled: boolean | null
          teams_negative_review: boolean | null
          teams_new_review: boolean | null
          teams_webhook_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          digest_day_of_week?: number | null
          digest_enabled?: boolean | null
          digest_frequency?: string | null
          digest_hour?: number | null
          digest_timezone?: string | null
          email_badge_earned?: boolean | null
          email_enabled?: boolean | null
          email_mention?: boolean | null
          email_negative_review?: boolean | null
          email_new_review?: boolean | null
          email_response_posted?: boolean | null
          email_review_approved?: boolean | null
          id?: string
          in_app_badge_earned?: boolean | null
          in_app_enabled?: boolean | null
          in_app_mention?: boolean | null
          in_app_negative_review?: boolean | null
          in_app_new_review?: boolean | null
          in_app_response_posted?: boolean | null
          in_app_review_approved?: boolean | null
          instant_alert_enabled?: boolean | null
          instant_alert_threshold?: number | null
          last_digest_sent_at?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          slack_channel?: string | null
          slack_digest?: boolean | null
          slack_enabled?: boolean | null
          slack_negative_review?: boolean | null
          slack_new_review?: boolean | null
          slack_webhook_url?: string | null
          teams_digest?: boolean | null
          teams_enabled?: boolean | null
          teams_negative_review?: boolean | null
          teams_new_review?: boolean | null
          teams_webhook_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          digest_day_of_week?: number | null
          digest_enabled?: boolean | null
          digest_frequency?: string | null
          digest_hour?: number | null
          digest_timezone?: string | null
          email_badge_earned?: boolean | null
          email_enabled?: boolean | null
          email_mention?: boolean | null
          email_negative_review?: boolean | null
          email_new_review?: boolean | null
          email_response_posted?: boolean | null
          email_review_approved?: boolean | null
          id?: string
          in_app_badge_earned?: boolean | null
          in_app_enabled?: boolean | null
          in_app_mention?: boolean | null
          in_app_negative_review?: boolean | null
          in_app_new_review?: boolean | null
          in_app_response_posted?: boolean | null
          in_app_review_approved?: boolean | null
          instant_alert_enabled?: boolean | null
          instant_alert_threshold?: number | null
          last_digest_sent_at?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          slack_channel?: string | null
          slack_digest?: boolean | null
          slack_enabled?: boolean | null
          slack_negative_review?: boolean | null
          slack_new_review?: boolean | null
          slack_webhook_url?: string | null
          teams_digest?: boolean | null
          teams_enabled?: boolean | null
          teams_negative_review?: boolean | null
          teams_new_review?: boolean | null
          teams_webhook_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          archived_at: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          loan_officer_id: string | null
          message: string
          metadata: Json | null
          organization_id: string | null
          priority: number | null
          read_at: string | null
          review_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          loan_officer_id?: string | null
          message: string
          metadata?: Json | null
          organization_id?: string | null
          priority?: number | null
          read_at?: string | null
          review_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          loan_officer_id?: string | null
          message?: string
          metadata?: Json | null
          organization_id?: string | null
          priority?: number | null
          read_at?: string | null
          review_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_steps: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data: Json | null
          id: string
          organization_id: string
          step_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          organization_id: string
          step_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          organization_id?: string
          step_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          account_type: string | null
          billing_email: string | null
          created_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed_at: string | null
          onboarding_status: string | null
          primary_color: string | null
          selected_billing_cycle: string | null
          selected_plan: string | null
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          subscription_cancelled_at: string | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          billing_email?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed_at?: string | null
          onboarding_status?: string | null
          primary_color?: string | null
          selected_billing_cycle?: string | null
          selected_plan?: string | null
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          subscription_cancelled_at?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          billing_email?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed_at?: string | null
          onboarding_status?: string | null
          primary_color?: string | null
          selected_billing_cycle?: string | null
          selected_plan?: string | null
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          subscription_cancelled_at?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_exports: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_range_end: string
          date_range_start: string
          export_format: string
          file_name: string
          filters: Json | null
          id: string
          organization_id: string
          row_count: number | null
          template_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_range_end: string
          date_range_start: string
          export_format: string
          file_name: string
          filters?: Json | null
          id?: string
          organization_id: string
          row_count?: number | null
          template_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_range_end?: string
          date_range_start?: string
          export_format?: string
          file_name?: string
          filters?: Json | null
          id?: string
          organization_id?: string
          row_count?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_exports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_exports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_exports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_shares: {
        Row: {
          access_count: number | null
          created_at: string | null
          date_range_end: string
          date_range_start: string
          expires_at: string | null
          filters: Json | null
          id: string
          last_accessed_at: string | null
          organization_id: string
          share_token: string
          shared_by: string | null
          template_id: string
          title: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          date_range_end: string
          date_range_start: string
          expires_at?: string | null
          filters?: Json | null
          id?: string
          last_accessed_at?: string | null
          organization_id: string
          share_token: string
          shared_by?: string | null
          template_id: string
          title: string
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          date_range_end?: string
          date_range_start?: string
          expires_at?: string | null
          filters?: Json | null
          id?: string
          last_accessed_at?: string | null
          organization_id?: string
          share_token?: string
          shared_by?: string | null
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_shares_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_shares_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_history: {
        Row: {
          breakdown: Json | null
          change_amount: number
          change_reason: string | null
          id: string
          loan_officer_id: string
          new_score: number
          previous_score: number
          recorded_at: string | null
        }
        Insert: {
          breakdown?: Json | null
          change_amount: number
          change_reason?: string | null
          id?: string
          loan_officer_id: string
          new_score: number
          previous_score: number
          recorded_at?: string | null
        }
        Update: {
          breakdown?: Json | null
          change_amount?: number
          change_reason?: string | null
          id?: string
          loan_officer_id?: string
          new_score?: number
          previous_score?: number
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_history_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
        ]
      }
      response_analytics: {
        Row: {
          created_at: string | null
          id: string
          loan_officer_id: string
          organization_id: string
          platform: string
          posted_successfully: boolean | null
          response_time_hours: number | null
          review_id: string
          sentiment_before: number | null
          template_used: string | null
          was_ai_suggested: boolean | null
          was_edited_from_template: boolean | null
          word_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          loan_officer_id: string
          organization_id: string
          platform: string
          posted_successfully?: boolean | null
          response_time_hours?: number | null
          review_id: string
          sentiment_before?: number | null
          template_used?: string | null
          was_ai_suggested?: boolean | null
          was_edited_from_template?: boolean | null
          word_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          loan_officer_id?: string
          organization_id?: string
          platform?: string
          posted_successfully?: boolean | null
          response_time_hours?: number | null
          review_id?: string
          sentiment_before?: number | null
          template_used?: string | null
          was_ai_suggested?: boolean | null
          was_edited_from_template?: boolean | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "response_analytics_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_analytics_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_analytics_template_used_fkey"
            columns: ["template_used"]
            isOneToOne: false
            referencedRelation: "response_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      response_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          tone: string | null
          updated_at: string | null
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          tone?: string | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          tone?: string | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "response_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          ai_suggested_response: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_email: string | null
          customer_location: string | null
          customer_name: string | null
          featured: boolean | null
          id: string
          is_published: boolean | null
          key_phrases: string[] | null
          loan_officer_id: string
          organization_id: string
          published_at: string | null
          rating: number
          rejection_reason: string | null
          response_approved_at: string | null
          response_approved_by: string | null
          response_at: string | null
          response_by: string | null
          response_post_error: string | null
          response_posted_at: string | null
          response_rejected_at: string | null
          response_rejected_by: string | null
          response_rejection_reason: string | null
          response_status: string | null
          response_synced_at: string | null
          response_template_id: string | null
          response_text: string | null
          review_date: string
          sentiment_label: string | null
          sentiment_score: number | null
          source: string
          source_review_id: string | null
          source_url: string | null
          status: string | null
          survey_response_id: string | null
          synced_at: string | null
          text: string | null
          themes: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          ai_suggested_response?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_location?: string | null
          customer_name?: string | null
          featured?: boolean | null
          id?: string
          is_published?: boolean | null
          key_phrases?: string[] | null
          loan_officer_id: string
          organization_id: string
          published_at?: string | null
          rating: number
          rejection_reason?: string | null
          response_approved_at?: string | null
          response_approved_by?: string | null
          response_at?: string | null
          response_by?: string | null
          response_post_error?: string | null
          response_posted_at?: string | null
          response_rejected_at?: string | null
          response_rejected_by?: string | null
          response_rejection_reason?: string | null
          response_status?: string | null
          response_synced_at?: string | null
          response_template_id?: string | null
          response_text?: string | null
          review_date: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          source: string
          source_review_id?: string | null
          source_url?: string | null
          status?: string | null
          survey_response_id?: string | null
          synced_at?: string | null
          text?: string | null
          themes?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_suggested_response?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_location?: string | null
          customer_name?: string | null
          featured?: boolean | null
          id?: string
          is_published?: boolean | null
          key_phrases?: string[] | null
          loan_officer_id?: string
          organization_id?: string
          published_at?: string | null
          rating?: number
          rejection_reason?: string | null
          response_approved_at?: string | null
          response_approved_by?: string | null
          response_at?: string | null
          response_by?: string | null
          response_post_error?: string | null
          response_posted_at?: string | null
          response_rejected_at?: string | null
          response_rejected_by?: string | null
          response_rejection_reason?: string | null
          response_status?: string | null
          response_synced_at?: string | null
          response_template_id?: string | null
          response_text?: string | null
          review_date?: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          source?: string
          source_review_id?: string | null
          source_url?: string | null
          status?: string | null
          survey_response_id?: string | null
          synced_at?: string | null
          text?: string | null
          themes?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_response_approved_by_fkey"
            columns: ["response_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_response_by_fkey"
            columns: ["response_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_response_rejected_by_fkey"
            columns: ["response_rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_survey_response_id_fkey"
            columns: ["survey_response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      salesforce_connections: {
        Row: {
          access_token: string
          accounts_synced: number | null
          auto_create_surveys: boolean | null
          contacts_synced: number | null
          created_at: string | null
          field_mappings: Json | null
          id: string
          instance_url: string
          is_active: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          opportunities_synced: number | null
          opportunity_stage_trigger: string | null
          organization_id: string
          refresh_token: string
          salesforce_org_id: string
          salesforce_user_id: string
          salesforce_username: string | null
          scopes: string[] | null
          sync_accounts: boolean | null
          sync_contacts: boolean | null
          sync_error: string | null
          sync_opportunities: boolean | null
          sync_status: string | null
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          accounts_synced?: number | null
          auto_create_surveys?: boolean | null
          contacts_synced?: number | null
          created_at?: string | null
          field_mappings?: Json | null
          id?: string
          instance_url: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          opportunities_synced?: number | null
          opportunity_stage_trigger?: string | null
          organization_id: string
          refresh_token: string
          salesforce_org_id: string
          salesforce_user_id: string
          salesforce_username?: string | null
          scopes?: string[] | null
          sync_accounts?: boolean | null
          sync_contacts?: boolean | null
          sync_error?: string | null
          sync_opportunities?: boolean | null
          sync_status?: string | null
          token_expires_at: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          accounts_synced?: number | null
          auto_create_surveys?: boolean | null
          contacts_synced?: number | null
          created_at?: string | null
          field_mappings?: Json | null
          id?: string
          instance_url?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          opportunities_synced?: number | null
          opportunity_stage_trigger?: string | null
          organization_id?: string
          refresh_token?: string
          salesforce_org_id?: string
          salesforce_user_id?: string
          salesforce_username?: string | null
          scopes?: string[] | null
          sync_accounts?: boolean | null
          sync_contacts?: boolean | null
          sync_error?: string | null
          sync_opportunities?: boolean | null
          sync_status?: string | null
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      salesforce_contact_mappings: {
        Row: {
          connection_id: string
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          last_synced_at: string | null
          loan_officer_id: string | null
          organization_id: string
          salesforce_account_id: string | null
          salesforce_contact_id: string
          salesforce_data: Json | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          last_synced_at?: string | null
          loan_officer_id?: string | null
          organization_id: string
          salesforce_account_id?: string | null
          salesforce_contact_id: string
          salesforce_data?: Json | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          last_synced_at?: string | null
          loan_officer_id?: string | null
          organization_id?: string
          salesforce_account_id?: string | null
          salesforce_contact_id?: string
          salesforce_data?: Json | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_contact_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "salesforce_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_contact_mappings_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_contact_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      salesforce_opportunity_mappings: {
        Row: {
          close_date: string | null
          connection_id: string
          created_at: string | null
          id: string
          last_synced_at: string | null
          opportunity_amount: number | null
          opportunity_name: string | null
          opportunity_stage: string | null
          organization_id: string
          salesforce_account_id: string | null
          salesforce_contact_id: string | null
          salesforce_data: Json | null
          salesforce_opportunity_id: string
          survey_id: string | null
          survey_triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          close_date?: string | null
          connection_id: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          opportunity_amount?: number | null
          opportunity_name?: string | null
          opportunity_stage?: string | null
          organization_id: string
          salesforce_account_id?: string | null
          salesforce_contact_id?: string | null
          salesforce_data?: Json | null
          salesforce_opportunity_id: string
          survey_id?: string | null
          survey_triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          close_date?: string | null
          connection_id?: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          opportunity_amount?: number | null
          opportunity_name?: string | null
          opportunity_stage?: string | null
          organization_id?: string
          salesforce_account_id?: string | null
          salesforce_contact_id?: string | null
          salesforce_data?: Json | null
          salesforce_opportunity_id?: string
          survey_id?: string | null
          survey_triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_opportunity_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "salesforce_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_opportunity_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_opportunity_mappings_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      salesforce_review_data: {
        Row: {
          connection_id: string
          created_at: string | null
          id: string
          organization_id: string
          review_id: string
          salesforce_account_id: string | null
          salesforce_contact_id: string | null
          salesforce_record_id: string | null
          sync_error: string | null
          synced_at: string | null
          synced_to_salesforce: boolean | null
          updated_at: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          id?: string
          organization_id: string
          review_id: string
          salesforce_account_id?: string | null
          salesforce_contact_id?: string | null
          salesforce_record_id?: string | null
          sync_error?: string | null
          synced_at?: string | null
          synced_to_salesforce?: boolean | null
          updated_at?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          id?: string
          organization_id?: string
          review_id?: string
          salesforce_account_id?: string | null
          salesforce_contact_id?: string | null
          salesforce_record_id?: string | null
          sync_error?: string | null
          synced_at?: string | null
          synced_to_salesforce?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_review_data_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "salesforce_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_review_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_review_data_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      salesforce_sync_logs: {
        Row: {
          completed_at: string | null
          connection_id: string
          duration_ms: number | null
          errors: string[] | null
          id: string
          metadata: Json | null
          object_type: string | null
          organization_id: string
          records_created: number | null
          records_failed: number | null
          records_fetched: number | null
          records_updated: number | null
          started_at: string | null
          status: string | null
          sync_direction: string | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          duration_ms?: number | null
          errors?: string[] | null
          id?: string
          metadata?: Json | null
          object_type?: string | null
          organization_id: string
          records_created?: number | null
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_direction?: string | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          duration_ms?: number | null
          errors?: string[] | null
          id?: string
          metadata?: Json | null
          object_type?: string | null
          organization_id?: string
          records_created?: number | null
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_direction?: string | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "salesforce_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesforce_sync_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          organization_id: string
          recipients: string[]
          schedule: string
          schedule_day_of_month: number | null
          schedule_day_of_week: number | null
          schedule_time: string | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          organization_id: string
          recipients?: string[]
          schedule: string
          schedule_day_of_month?: number | null
          schedule_day_of_week?: number | null
          schedule_time?: string | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          organization_id?: string
          recipients?: string[]
          schedule?: string
          schedule_day_of_month?: number | null
          schedule_day_of_week?: number | null
          schedule_time?: string | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          notification_id: string | null
          organization_id: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          success: boolean | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          organization_id?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          organization_id?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_webhook_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhook_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_distribution_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          organization_id: string
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          scheduled_at: string
          status: string | null
          survey_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          organization_id: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at: string
          status?: string | null
          survey_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          organization_id?: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string
          status?: string | null
          survey_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_distribution_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_distribution_queue_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          ai_summary: string | null
          answers: Json
          created_at: string | null
          id: string
          ip_address: unknown
          key_phrases: string[] | null
          nps_score: number | null
          overall_rating: number | null
          sentiment_label: string | null
          sentiment_score: number | null
          submitted_at: string | null
          survey_id: string
          testimonial_text: string | null
          themes: string[] | null
          user_agent: string | null
        }
        Insert: {
          ai_summary?: string | null
          answers?: Json
          created_at?: string | null
          id?: string
          ip_address?: unknown
          key_phrases?: string[] | null
          nps_score?: number | null
          overall_rating?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          submitted_at?: string | null
          survey_id: string
          testimonial_text?: string | null
          themes?: string[] | null
          user_agent?: string | null
        }
        Update: {
          ai_summary?: string | null
          answers?: Json
          created_at?: string | null
          id?: string
          ip_address?: unknown
          key_phrases?: string[] | null
          nps_score?: number | null
          overall_rating?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          submitted_at?: string | null
          survey_id?: string
          testimonial_text?: string | null
          themes?: string[] | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_templates: {
        Row: {
          branding: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          questions: Json
          thank_you_config: Json | null
          updated_at: string | null
        }
        Insert: {
          branding?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          questions?: Json
          thank_you_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          branding?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          questions?: Json
          thank_you_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          completed_at: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          expires_at: string | null
          id: string
          last_reminder_at: string | null
          loan_officer_id: string
          opened_at: string | null
          organization_id: string
          reminder_count: number | null
          sent_at: string | null
          source: string | null
          source_metadata: Json | null
          status: string | null
          template_id: string
          token: string
          transaction_date: string | null
          transaction_id: string | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          loan_officer_id: string
          opened_at?: string | null
          organization_id: string
          reminder_count?: number | null
          sent_at?: string | null
          source?: string | null
          source_metadata?: Json | null
          status?: string | null
          template_id: string
          token?: string
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          loan_officer_id?: string
          opened_at?: string | null
          organization_id?: string
          reminder_count?: number | null
          sent_at?: string | null
          source?: string | null
          source_metadata?: Json | null
          status?: string | null
          template_id?: string
          token?: string
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      teams_webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          notification_id: string | null
          organization_id: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          success: boolean | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          organization_id?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          organization_id?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_webhook_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_webhook_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_graphics: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string
          format: string
          height: number
          id: string
          image_data: string | null
          image_url: string | null
          organization_id: string
          template_name: string | null
          testimonial_id: string
          text_color: string | null
          width: number
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          format?: string
          height?: number
          id?: string
          image_data?: string | null
          image_url?: string | null
          organization_id: string
          template_name?: string | null
          testimonial_id: string
          text_color?: string | null
          width?: number
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          format?: string
          height?: number
          id?: string
          image_data?: string | null
          image_url?: string | null
          organization_id?: string
          template_name?: string | null
          testimonial_id?: string
          text_color?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_graphics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonial_graphics_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_templates: {
        Row: {
          created_at: string
          description: string | null
          example_output: string | null
          format: Database["public"]["Enums"]["testimonial_format"]
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          organization_id: string | null
          prompt_template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          example_output?: string | null
          format: Database["public"]["Enums"]["testimonial_format"]
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          organization_id?: string | null
          prompt_template: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          example_output?: string | null
          format?: Database["public"]["Enums"]["testimonial_format"]
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          organization_id?: string | null
          prompt_template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          ai_generated: boolean | null
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string
          export_count: number | null
          format: Database["public"]["Enums"]["testimonial_format"]
          generation_prompt: string | null
          id: string
          key_highlights: string[] | null
          last_exported_at: string | null
          loan_officer_id: string | null
          organization_id: string
          original_quote: string | null
          published_at: string | null
          published_platforms: string[] | null
          rejection_reason: string | null
          review_id: string
          status: Database["public"]["Enums"]["testimonial_status"]
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string
          export_count?: number | null
          format?: Database["public"]["Enums"]["testimonial_format"]
          generation_prompt?: string | null
          id?: string
          key_highlights?: string[] | null
          last_exported_at?: string | null
          loan_officer_id?: string | null
          organization_id: string
          original_quote?: string | null
          published_at?: string | null
          published_platforms?: string[] | null
          rejection_reason?: string | null
          review_id: string
          status?: Database["public"]["Enums"]["testimonial_status"]
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string
          export_count?: number | null
          format?: Database["public"]["Enums"]["testimonial_format"]
          generation_prompt?: string | null
          id?: string
          key_highlights?: string[] | null
          last_exported_at?: string | null
          loan_officer_id?: string | null
          organization_id?: string
          original_quote?: string | null
          published_at?: string | null
          published_platforms?: string[] | null
          rejection_reason?: string | null
          review_id?: string
          status?: Database["public"]["Enums"]["testimonial_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          created_at: string | null
          earned_at: string | null
          id: string
          loan_officer_id: string
          notified_at: string | null
          progress: Json | null
        }
        Insert: {
          badge_id: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          loan_officer_id: string
          notified_at?: string | null
          progress?: Json | null
        }
        Update: {
          badge_id?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          loan_officer_id?: string
          notified_at?: string | null
          progress?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          is_owner: boolean | null
          last_login_at: string | null
          notification_preferences: Json | null
          organization_id: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_owner?: boolean | null
          last_login_at?: string | null
          notification_preferences?: Json | null
          organization_id?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_owner?: boolean | null
          last_login_at?: string | null
          notification_preferences?: Json | null
          organization_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_testimonial_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          max_retries: number | null
          organization_id: string
          priority: number | null
          processed_at: string | null
          request_id: string
          retry_count: number | null
          scheduled_at: string
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          organization_id: string
          priority?: number | null
          processed_at?: string | null
          request_id: string
          retry_count?: number | null
          scheduled_at: string
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          organization_id?: string
          priority?: number | null
          processed_at?: string | null
          request_id?: string
          retry_count?: number | null
          scheduled_at?: string
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_testimonial_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonial_queue_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "video_testimonial_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      video_testimonial_requests: {
        Row: {
          created_at: string
          created_by: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          expires_at: string | null
          id: string
          last_reminder_at: string | null
          loan_officer_id: string
          max_duration_seconds: number | null
          opened_at: string | null
          organization_id: string
          prompt_text: string | null
          reminder_count: number | null
          sent_at: string | null
          source: string | null
          source_metadata: Json | null
          status: Database["public"]["Enums"]["video_testimonial_request_status"]
          submitted_at: string | null
          token: string
          transaction_date: string | null
          transaction_id: string | null
          transaction_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          loan_officer_id: string
          max_duration_seconds?: number | null
          opened_at?: string | null
          organization_id: string
          prompt_text?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          source?: string | null
          source_metadata?: Json | null
          status?: Database["public"]["Enums"]["video_testimonial_request_status"]
          submitted_at?: string | null
          token?: string
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          loan_officer_id?: string
          max_duration_seconds?: number | null
          opened_at?: string | null
          organization_id?: string
          prompt_text?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          source?: string | null
          source_metadata?: Json | null
          status?: Database["public"]["Enums"]["video_testimonial_request_status"]
          submitted_at?: string | null
          token?: string
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_testimonial_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonial_requests_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonial_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_testimonial_responses: {
        Row: {
          ai_generated_text: string | null
          ai_generation_completed_at: string | null
          ai_generation_error: string | null
          ai_generation_status: string | null
          approval_status: Database["public"]["Enums"]["video_testimonial_approval_status"]
          approved_at: string | null
          approved_by: string | null
          browser: string | null
          consent_given: boolean
          consent_ip_address: unknown
          consent_timestamp: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          height: number | null
          id: string
          ip_address: unknown
          key_phrases: string[] | null
          loan_officer_id: string
          marketing_consent: boolean | null
          mime_type: string
          organization_id: string
          published_at: string | null
          published_platforms: string[] | null
          rejection_reason: string | null
          request_id: string
          sentiment_label: string | null
          sentiment_score: number | null
          submitted_at: string
          thumbnail_url: string | null
          transcription: string | null
          transcription_completed_at: string | null
          transcription_error: string | null
          transcription_status: string | null
          updated_at: string
          user_agent: string | null
          video_path: string
          video_url: string
          width: number | null
        }
        Insert: {
          ai_generated_text?: string | null
          ai_generation_completed_at?: string | null
          ai_generation_error?: string | null
          ai_generation_status?: string | null
          approval_status?: Database["public"]["Enums"]["video_testimonial_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          browser?: string | null
          consent_given?: boolean
          consent_ip_address?: unknown
          consent_timestamp?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          ip_address?: unknown
          key_phrases?: string[] | null
          loan_officer_id: string
          marketing_consent?: boolean | null
          mime_type: string
          organization_id: string
          published_at?: string | null
          published_platforms?: string[] | null
          rejection_reason?: string | null
          request_id: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          submitted_at?: string
          thumbnail_url?: string | null
          transcription?: string | null
          transcription_completed_at?: string | null
          transcription_error?: string | null
          transcription_status?: string | null
          updated_at?: string
          user_agent?: string | null
          video_path: string
          video_url: string
          width?: number | null
        }
        Update: {
          ai_generated_text?: string | null
          ai_generation_completed_at?: string | null
          ai_generation_error?: string | null
          ai_generation_status?: string | null
          approval_status?: Database["public"]["Enums"]["video_testimonial_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          browser?: string | null
          consent_given?: boolean
          consent_ip_address?: unknown
          consent_timestamp?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          ip_address?: unknown
          key_phrases?: string[] | null
          loan_officer_id?: string
          marketing_consent?: boolean | null
          mime_type?: string
          organization_id?: string
          published_at?: string | null
          published_platforms?: string[] | null
          rejection_reason?: string | null
          request_id?: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          submitted_at?: string
          thumbnail_url?: string | null
          transcription?: string | null
          transcription_completed_at?: string | null
          transcription_error?: string | null
          transcription_status?: string | null
          updated_at?: string
          user_agent?: string | null
          video_path?: string
          video_url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_testimonial_responses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonial_responses_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonial_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonial_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "video_testimonial_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          allowed_ips: string[] | null
          api_key_id: string | null
          created_at: string | null
          default_template_id: string | null
          id: string
          integration_settings: Json | null
          integration_type: string | null
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          organization_id: string
          secret_key: string
          settings: Json | null
          trigger_count: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_ips?: string[] | null
          api_key_id?: string | null
          created_at?: string | null
          default_template_id?: string | null
          id?: string
          integration_settings?: Json | null
          integration_type?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          organization_id: string
          secret_key: string
          settings?: Json | null
          trigger_count?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_ips?: string[] | null
          api_key_id?: string | null
          created_at?: string | null
          default_template_id?: string | null
          id?: string
          integration_settings?: Json | null
          integration_type?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          organization_id?: string
          secret_key?: string
          settings?: Json | null
          trigger_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_configs_default_template_id_fkey"
            columns: ["default_template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: unknown
          organization_id: string | null
          payload: Json | null
          processing_time_ms: number | null
          status: string | null
          survey_id: string | null
          user_agent: string | null
          webhook_config_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          payload?: Json | null
          processing_time_ms?: number | null
          status?: string | null
          survey_id?: string | null
          user_agent?: string | null
          webhook_config_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          payload?: Json | null
          processing_time_ms?: number | null
          status?: string | null
          survey_id?: string | null
          user_agent?: string | null
          webhook_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_api_rate_limit: {
        Args: { p_api_key_id: string; p_rate_limit?: number }
        Returns: {
          current_count: number
          is_allowed: boolean
          limit_count: number
          reset_at: string
        }[]
      }
      check_badges_for_loan_officer: {
        Args: { p_loan_officer_id: string }
        Returns: {
          badge_name: string
          badge_slug: string
          newly_earned: boolean
        }[]
      }
      check_rate_limit: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      cleanup_old_rate_limit_windows: { Args: never; Returns: number }
      get_pending_distribution_items: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          organization_id: string
          scheduled_at: string
          survey_id: string
          type: string
        }[]
      }
      get_pending_video_testimonial_items: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          organization_id: string
          request_id: string
          scheduled_at: string
          type: string
        }[]
      }
      get_user_organization_id: { Args: never; Returns: string }
      increment_api_key_request_count: {
        Args: { p_api_key_id: string }
        Returns: undefined
      }
      increment_webhook_trigger_count: {
        Args: { config_id: string }
        Returns: undefined
      }
      mark_video_testimonial_submitted: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      schedule_survey_reminders: {
        Args: {
          p_organization_id: string
          p_send_3day?: boolean
          p_send_7day?: boolean
          p_survey_id: string
        }
        Returns: undefined
      }
      schedule_video_testimonial_reminders: {
        Args: {
          p_organization_id: string
          p_request_id: string
          p_send_3day?: boolean
          p_send_7day?: boolean
        }
        Returns: undefined
      }
      user_has_manager_access: { Args: { user_id: string }; Returns: boolean }
      user_has_role: { Args: { required_roles: string[] }; Returns: boolean }
      user_is_enterprise_admin: { Args: { user_id: string }; Returns: boolean }
      validate_api_key: {
        Args: { p_key_hash: string; p_required_scopes?: string[] }
        Returns: {
          api_key_id: string
          error_message: string
          is_valid: boolean
          organization_id: string
          rate_limit: number
          scopes: string[]
        }[]
      }
    }
    Enums: {
      testimonial_format: "short" | "medium" | "long" | "social" | "headline"
      testimonial_status: "draft" | "approved" | "rejected" | "published"
      video_testimonial_approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "published"
      video_testimonial_request_status:
        | "pending"
        | "sent"
        | "opened"
        | "recording"
        | "submitted"
        | "expired"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
      testimonial_format: ["short", "medium", "long", "social", "headline"],
      testimonial_status: ["draft", "approved", "rejected", "published"],
      video_testimonial_approval_status: [
        "pending",
        "approved",
        "rejected",
        "published",
      ],
      video_testimonial_request_status: [
        "pending",
        "sent",
        "opened",
        "recording",
        "submitted",
        "expired",
        "cancelled",
      ],
    },
  },
} as const
