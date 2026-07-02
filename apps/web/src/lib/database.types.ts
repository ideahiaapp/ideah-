export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          crp: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          crp?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          email?: string | null;
          crp?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          therapist_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          birth_date: string | null;
          approach: string | null;
          approach_label: string | null;
          status: string;
          start_date: string | null;
          last_session: string | null;
          next_session: string | null;
          total_sessions: number;
          session_frequency: string | null;
          session_duration: number;
          initials: string | null;
          color: string | null;
          occupation: string | null;
          referral: string | null;
          main_demand: string | null;
          notes: string | null;
          emergency_contact: string | null;
          anamnese_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          approach?: string | null;
          approach_label?: string | null;
          status?: string;
          start_date?: string | null;
          last_session?: string | null;
          next_session?: string | null;
          total_sessions?: number;
          session_frequency?: string | null;
          session_duration?: number;
          initials?: string | null;
          color?: string | null;
          occupation?: string | null;
          referral?: string | null;
          main_demand?: string | null;
          notes?: string | null;
          emergency_contact?: string | null;
          anamnese_id?: string | null;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          approach?: string | null;
          approach_label?: string | null;
          status?: string;
          start_date?: string | null;
          last_session?: string | null;
          next_session?: string | null;
          total_sessions?: number;
          session_frequency?: string | null;
          session_duration?: number;
          initials?: string | null;
          color?: string | null;
          occupation?: string | null;
          referral?: string | null;
          main_demand?: string | null;
          notes?: string | null;
          emergency_contact?: string | null;
          anamnese_id?: string | null;
          updated_at?: string;
        };
      };
      evolutions: {
        Row: {
          id: string;
          therapist_id: string;
          client_id: string;
          session_date: string;
          content: string;
          hypothesis: string | null;
          interventions: string | null;
          next_session_plan: string | null;
          mood: number | null;
          ai_hypothesis: string | null;
          session_number: number | null;
          cfp_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          client_id: string;
          session_date: string;
          content: string;
          hypothesis?: string | null;
          interventions?: string | null;
          next_session_plan?: string | null;
          mood?: number | null;
          ai_hypothesis?: string | null;
          session_number?: number | null;
          cfp_confirmed?: boolean;
        };
        Update: {
          session_date?: string;
          content?: string;
          hypothesis?: string | null;
          interventions?: string | null;
          next_session_plan?: string | null;
          mood?: number | null;
          ai_hypothesis?: string | null;
          session_number?: number | null;
          cfp_confirmed?: boolean;
          updated_at?: string;
        };
      };
      supervisions: {
        Row: {
          id: string;
          therapist_id: string;
          client_id: string | null;
          title: string;
          approach: string;
          messages_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          client_id?: string | null;
          title: string;
          approach: string;
          messages_count?: number;
        };
        Update: {
          title?: string;
          approach?: string;
          client_id?: string | null;
          messages_count?: number;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id:           string;
          therapist_id: string;
          client_id:    string;
          date:         string;
          start_time:   string;
          duration:     number;
          status:       string;
          notes:        string | null;
          price:        number | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:          string;
          therapist_id: string;
          client_id:    string;
          date:         string;
          start_time:   string;
          duration?:    number;
          status?:      string;
          notes?:       string | null;
          price?:       number | null;
        };
        Update: {
          date?:       string;
          start_time?: string;
          duration?:   number;
          status?:     string;
          notes?:      string | null;
          price?:      number | null;
          updated_at?: string;
        };
      };
      supervision_messages: {
        Row: {
          id: string;
          supervision_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          supervision_id: string;
          role: "user" | "assistant";
          content: string;
        };
        Update: Record<string, never>;
      };
    };
  };
}

/* Aliases convenientes */
export type Profile            = Database["public"]["Tables"]["profiles"]["Row"];
export type Client             = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert       = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate       = Database["public"]["Tables"]["clients"]["Update"];
export type Evolution          = Database["public"]["Tables"]["evolutions"]["Row"];
export type EvolutionInsert    = Database["public"]["Tables"]["evolutions"]["Insert"];
export type EvolutionUpdate    = Database["public"]["Tables"]["evolutions"]["Update"];
export type Supervision        = Database["public"]["Tables"]["supervisions"]["Row"];
export type SupervisionInsert  = Database["public"]["Tables"]["supervisions"]["Insert"];
export type SupervisionMessage = Database["public"]["Tables"]["supervision_messages"]["Row"];
export type SupervisionMessageInsert = Database["public"]["Tables"]["supervision_messages"]["Insert"];
export type Session       = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];
