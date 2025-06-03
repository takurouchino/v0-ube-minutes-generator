import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export type Database = {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string
          name: string
          position: string | null
          role: string | null
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          position?: string | null
          role?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: string | null
          role?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      themes: {
        Row: {
          id: string
          name: string
          category: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      theme_participants: {
        Row: {
          id: string
          theme_id: string
          participant_id: string
          role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          theme_id: string
          participant_id: string
          role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          theme_id?: string
          participant_id?: string
          role?: string | null
          created_at?: string
        }
      }
      minutes: {
        Row: {
          id: string
          theme_id: string | null
          title: string
          date: string
          time: string
          content: string | null
          summary_progress: string | null
          summary_key_points: string | null
          summary_decisions: string | null
          summary_actions: string | null
          keywords: string[] | null
          status: string
          author: string | null
          approver: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          theme_id?: string | null
          title: string
          date: string
          time: string
          content?: string | null
          summary_progress?: string | null
          summary_key_points?: string | null
          summary_decisions?: string | null
          summary_actions?: string | null
          keywords?: string[] | null
          status?: string
          author?: string | null
          approver?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          theme_id?: string | null
          title?: string
          date?: string
          time?: string
          content?: string | null
          summary_progress?: string | null
          summary_key_points?: string | null
          summary_decisions?: string | null
          summary_actions?: string | null
          keywords?: string[] | null
          status?: string
          author?: string | null
          approver?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      minute_participants: {
        Row: {
          id: string
          minute_id: string
          participant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          minute_id: string
          participant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          minute_id?: string
          participant_id?: string
          created_at?: string
        }
      }
    }
  }
}
