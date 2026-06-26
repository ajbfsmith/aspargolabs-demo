export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Hand-maintained to match `supabase/migrations` (intake + bask attribution + attribution_visits).
 * Regenerate with: `npm run db:gen-types` when linked to a project.
 */
export type Database = {
  public: {
    Tables: {
      call_sessions: {
        Row: {
          id: string;
          call_id: string;
          assistant_id: string | null;
          status: string;
          current_state: string;
          patient_phone: string | null;
          started_at: string;
          ended_at: string | null;
          completion_pct: number;
          hard_stop_reason: string | null;
          needs_review: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          assistant_id?: string | null;
          status?: string;
          current_state?: string;
          patient_phone?: string | null;
          started_at?: string;
          ended_at?: string | null;
          completion_pct?: number;
          hard_stop_reason?: string | null;
          needs_review?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          assistant_id?: string | null;
          status?: string;
          current_state?: string;
          patient_phone?: string | null;
          started_at?: string;
          ended_at?: string | null;
          completion_pct?: number;
          hard_stop_reason?: string | null;
          needs_review?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      intake_fields: {
        Row: {
          id: string;
          session_id: string;
          field_key: string;
          value: Json | null;
          status: string;
          confidence: number | null;
          source: string;
          evidence: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          field_key: string;
          value?: Json | null;
          status?: string;
          confidence?: number | null;
          source?: string;
          evidence?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          field_key?: string;
          value?: Json | null;
          status?: string;
          confidence?: number | null;
          source?: string;
          evidence?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      intake_events: {
        Row: {
          id: string;
          session_id: string;
          event_type: string;
          payload: Json;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          event_type: string;
          payload?: Json;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          event_type?: string;
          payload?: Json;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      captured_future_slots: {
        Row: {
          id: string;
          session_id: string;
          field_key: string;
          value: Json;
          confidence: number | null;
          evidence: string | null;
          confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          field_key: string;
          value: Json;
          confidence?: number | null;
          evidence?: string | null;
          confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          field_key?: string;
          value?: Json;
          confidence?: number | null;
          evidence?: string | null;
          confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      final_reconciliations: {
        Row: {
          id: string;
          session_id: string;
          source: string;
          live_state: Json;
          structured_output: Json;
          differences: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          source: string;
          live_state?: Json;
          structured_output?: Json;
          differences?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          source?: string;
          live_state?: Json;
          structured_output?: Json;
          differences?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      todos: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      attribution_visits: {
        Row: {
          id: string;
          utm_source: string;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          dest_path: string;
          referrer: string | null;
          visited_at: string;
          ip: string | null;
          user_agent: string | null;
        };
        Insert: {
          id: string;
          utm_source: string;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          dest_path?: string;
          referrer?: string | null;
          visited_at: string;
          ip?: string | null;
          user_agent?: string | null;
        };
        Update: Partial<{
          id: string;
          utm_source: string;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          dest_path: string;
          referrer: string | null;
          visited_at: string;
          ip: string | null;
          user_agent: string | null;
        }>;
        Relationships: [];
      };
      link_clicks: {
        Row: {
          id: string;
          campaign_id: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          clicked_at: string;
          ip: string | null;
          user_agent: string | null;
          journey_id: string | null;
          session_id: string | null;
        };
        Insert: {
          id: string;
          campaign_id: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          clicked_at: string;
          ip?: string | null;
          user_agent?: string | null;
          journey_id?: string | null;
          session_id?: string | null;
        };
        Update: Partial<{
          id: string;
          campaign_id: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          clicked_at: string;
          ip: string | null;
          user_agent: string | null;
          journey_id: string | null;
          session_id: string | null;
        }>;
        Relationships: [];
      };
      bask_patients: {
        Row: {
          patient_id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          first_seen_at: string;
          last_seen_at: string;
          updated_at: string;
          latest_session_id: string | null;
          total_journeys: number;
          total_conversions: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      bask_patient_journeys: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      bask_webhook_events: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      bask_journey_events: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
