import { createClient } from "@supabase/supabase-js"

// Add this line to re-export the createClient function
export { createClient }

// Make sure we have the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a singleton instance for client-side usage
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // セッションの永続化設定を強化
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sb-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // セッション自動リフレッシュの設定
        flowType: 'pkce'
      },
      // リアルタイム接続の設定
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      // グローバル設定
      global: {
        headers: {
          'X-Client-Info': 'ube-minutes-generator'
        }
      }
    })

    // ブラウザタブ間でのセッション同期を強化
    if (typeof window !== 'undefined') {
      // storageイベントを監視してタブ間でセッション変更を同期
      window.addEventListener('storage', (e) => {
        if (e.key === 'sb-auth-token' && e.newValue !== e.oldValue) {
          console.log('Session changed in another tab, refreshing auth state')
          supabaseInstance?.auth.getSession()
        }
      })
    }
  }

  return supabaseInstance
}

// Export the supabase client for backward compatibility
export const supabase = getSupabaseClient()

// Type definitions remain the same
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
          background: string | null // 追加
          purpose: string | null // 追加
          references: string | null // 追加
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          description?: string | null
          background?: string | null // 追加
          purpose?: string | null // 追加
          references?: string | null // 追加
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          description?: string | null
          background?: string | null // 追加
          purpose?: string | null // 追加
          references?: string | null // 追加
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
