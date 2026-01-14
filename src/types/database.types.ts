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
      branches: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          description: string | null
          address: Json | null
          phone: string | null
          email: string | null
          website_url: string | null
          hours_of_operation: Json | null
          manager_name: string | null
          manager_email: string | null
          google_place_id: string | null
          google_maps_url: string | null
          photo_url: string | null
          cover_image_url: string | null
          region: string | null
          is_active: boolean | null
          is_public: boolean | null
          average_rating: number | null
          total_reviews: number | null
          total_loan_officers: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          description?: string | null
          address?: Json | null
          phone?: string | null
          email?: string | null
          website_url?: string | null
          hours_of_operation?: Json | null
          manager_name?: string | null
          manager_email?: string | null
          google_place_id?: string | null
          google_maps_url?: string | null
          photo_url?: string | null
          cover_image_url?: string | null
          region?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          average_rating?: number | null
          total_reviews?: number | null
          total_loan_officers?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          description?: string | null
          address?: Json | null
          phone?: string | null
          email?: string | null
          website_url?: string | null
          hours_of_operation?: Json | null
          manager_name?: string | null
          manager_email?: string | null
          google_place_id?: string | null
          google_maps_url?: string | null
          photo_url?: string | null
          cover_image_url?: string | null
          region?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          average_rating?: number | null
          total_reviews?: number | null
          total_loan_officers?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
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
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
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
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
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
          linkedin_url: string | null
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
          linkedin_url?: string | null
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
          linkedin_url?: string | null
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
      organizations: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          settings: Json | null
          slug: string
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          settings?: Json | null
          slug: string
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          settings?: Json | null
          slug?: string
          subscription_status?: string | null
          subscription_tier?: string | null
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
      reviews: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
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
          response_at: string | null
          response_by: string | null
          response_synced_at: string | null
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
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
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
          response_at?: string | null
          response_by?: string | null
          response_synced_at?: string | null
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
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
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
          response_at?: string | null
          response_by?: string | null
          response_synced_at?: string | null
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
            foreignKeyName: "reviews_response_by_fkey"
            columns: ["response_by"]
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
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
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
      webhook_configs: {
        Row: {
          allowed_ips: string[] | null
          created_at: string | null
          default_template_id: string | null
          id: string
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
          created_at?: string | null
          default_template_id?: string | null
          id?: string
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
          created_at?: string | null
          default_template_id?: string | null
          id?: string
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
      testimonials: {
        Row: {
          id: string
          organization_id: string
          review_id: string
          loan_officer_id: string | null
          format: string
          content: string
          original_quote: string | null
          key_highlights: string[] | null
          ai_generated: boolean | null
          generation_prompt: string | null
          status: string
          approved_at: string | null
          approved_by: string | null
          rejection_reason: string | null
          published_at: string | null
          published_platforms: string[] | null
          last_exported_at: string | null
          export_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          review_id: string
          loan_officer_id?: string | null
          format?: string
          content: string
          original_quote?: string | null
          key_highlights?: string[] | null
          ai_generated?: boolean | null
          generation_prompt?: string | null
          status?: string
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          published_at?: string | null
          published_platforms?: string[] | null
          last_exported_at?: string | null
          export_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          review_id?: string
          loan_officer_id?: string | null
          format?: string
          content?: string
          original_quote?: string | null
          key_highlights?: string[] | null
          ai_generated?: boolean | null
          generation_prompt?: string | null
          status?: string
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          published_at?: string | null
          published_platforms?: string[] | null
          last_exported_at?: string | null
          export_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
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
          {
            foreignKeyName: "testimonials_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "loan_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_graphics: {
        Row: {
          id: string
          testimonial_id: string
          organization_id: string
          image_url: string | null
          image_data: string | null
          width: number
          height: number
          format: string
          template_name: string | null
          background_color: string | null
          text_color: string | null
          accent_color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          testimonial_id: string
          organization_id: string
          image_url?: string | null
          image_data?: string | null
          width?: number
          height?: number
          format?: string
          template_name?: string | null
          background_color?: string | null
          text_color?: string | null
          accent_color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          testimonial_id?: string
          organization_id?: string
          image_url?: string | null
          image_data?: string | null
          width?: number
          height?: number
          format?: string
          template_name?: string | null
          background_color?: string | null
          text_color?: string | null
          accent_color?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_graphics_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonial_graphics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_templates: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          description: string | null
          format: string
          prompt_template: string
          example_output: string | null
          is_system: boolean | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          description?: string | null
          format: string
          prompt_template: string
          example_output?: string | null
          is_system?: boolean | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          description?: string | null
          format?: string
          prompt_template?: string
          example_output?: string | null
          is_system?: boolean | null
          is_active?: boolean | null
          created_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
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
      get_user_organization_id: { Args: never; Returns: string }
      increment_webhook_trigger_count: {
        Args: { config_id: string }
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
      user_has_role: { Args: { required_roles: string[] }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
