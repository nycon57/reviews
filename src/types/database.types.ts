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
          id: string
          email: string
          organization_id: string | null
          reason: string | null
          unsubscribed_at: string | null
          token: string
        }
        Insert: {
          id?: string
          email: string
          organization_id?: string | null
          reason?: string | null
          unsubscribed_at?: string | null
          token?: string
        }
        Update: {
          id?: string
          email?: string
          organization_id?: string | null
          reason?: string | null
          unsubscribed_at?: string | null
          token?: string
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
      loan_officers: {
        Row: {
          address: Json | null
          auto_request_reviews: boolean | null
          average_rating: number | null
          bio: string | null
          branch: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: Record<string, never>; Returns: string }
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
