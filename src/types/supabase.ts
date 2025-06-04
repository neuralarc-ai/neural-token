
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string
          created_at: string
          name: string
          model: string
          key_fragment: string
          full_key: string 
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          model: string
          key_fragment: string
          full_key: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          model?: string
          key_fragment?: string
          full_key?: string
        }
        Relationships: []
      }
      token_entries: {
        Row: {
          id: string
          created_at: string
          api_key_id: string
          date: string 
          tokens: number
        }
        Insert: {
          id?: string
          created_at?: string
          api_key_id: string
          date: string
          tokens: number
        }
        Update: {
          id?: string
          created_at?: string
          api_key_id?: string
          date?: string
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "token_entries_api_key_id_fkey"
            columns: ["api_key_id"]
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          created_at: string
          name: string
          amount: number
          billing_cycle: "monthly" | "yearly"
          start_date: string 
          category: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          amount: number
          billing_cycle: "monthly" | "yearly"
          start_date: string
          category?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          amount?: number
          billing_cycle?: "monthly" | "yearly"
          start_date?: string
          category?: string | null
          notes?: string | null
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

// Helper types from existing src/types/index.ts for mapping
// This helps ensure our app's internal types match Supabase row types where applicable.
// We can refine this further if needed, but Supabase generated types are the source of truth for DB interactions.
export type StoredApiKeyRow = Database['public']['Tables']['api_keys']['Row'];
export type TokenEntryRow = Database['public']['Tables']['token_entries']['Row'];
export type SubscriptionEntryRow = Database['public']['Tables']['subscriptions']['Row'];
