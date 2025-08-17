"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"

export type UserProfile = {
  id: string
  company_id: string
  email: string
  full_name: string
  role: "admin" | "manager" | "user"
  company_name: string
  company_slug: string
}

export type Company = {
  id: string
  name: string
  slug: string
  description: string | null
}

type AuthContextType = {
  user: User | null
  userProfile: UserProfile | null
  companies: Company[]
  loading: boolean
  companyId: string | undefined
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, companyId: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  // companyIdを計算
  const companyId = userProfile?.company_id

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 3

    // ブラウザストレージからのセッション復元を試行
    const restoreSessionFromStorage = async () => {
      if (typeof window === 'undefined') return null
      
      try {
        const storedToken = localStorage.getItem('sb-auth-token')
        if (storedToken) {
          const tokenData = JSON.parse(storedToken)
          if (tokenData.access_token && tokenData.expires_at) {
            const expiresAt = new Date(tokenData.expires_at * 1000)
            const now = new Date()
            
            // トークンが有効期限内の場合
            if (expiresAt > now) {
              console.log('Valid session found in storage, restoring...')
              return tokenData
            } else {
              console.log('Stored session expired, clearing...')
              localStorage.removeItem('sb-auth-token')
            }
          }
        }
      } catch (error) {
        console.error('Error restoring session from storage:', error)
        localStorage.removeItem('sb-auth-token')
      }
      
      return null
    }

    // 初期認証状態の確認（リトライ機能付き）
    const getInitialSession = async () => {
      try {
        // まずローカルストレージから復元を試行
        const storedSession = await restoreSessionFromStorage()
        
        if (storedSession && mounted) {
          console.log('Session restored from storage')
          // ストレージからセッションを復元できた場合は一旦設定
          setLoading(false)
          setInitializing(false)
          
          // バックグラウンドでSupabaseからセッション確認
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
              setUser(session?.user ?? null)
              if (session?.user) {
                loadUserProfile(session.user.id)
              }
              loadCompanies()
            }
          }).catch(console.error)
          
          return
        }

        // ストレージから復元できない場合はSupabaseから取得
        const {
          data: { session },
        } = await supabase.auth.getSession()
        
        if (mounted) {
          setUser(session?.user ?? null)

          if (session?.user) {
            await loadUserProfile(session.user.id)
          }

          await loadCompanies()
        }
      } catch (error) {
        console.error("Error during initialization:", error)
        
        // リトライロジック
        if (retryCount < maxRetries && mounted) {
          retryCount++
          console.log(`Retrying authentication... (${retryCount}/${maxRetries})`)
          setTimeout(() => getInitialSession(), 1000 * retryCount)
          return
        }
        
        // ネットワークエラーやセッション期限切れの場合、ユーザーをnullに設定
        if (mounted) {
          setUser(null)
          setUserProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setInitializing(false)
        }
      }
    }

    // タイムアウト機能を追加（15秒で強制終了）
    const initTimeout = setTimeout(() => {
      if (mounted && (loading || initializing)) {
        console.warn("Authentication initialization timeout - forcing completion")
        setLoading(false)
        setInitializing(false)
        setUser(null)
        setUserProfile(null)
      }
    }, 15000)

    getInitialSession().finally(() => {
      clearTimeout(initTimeout)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log("Auth state change:", event, session?.user?.id || "no user")
        
        // セッション期限切れやログアウト時の処理
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing local data')
            setUser(null)
            setUserProfile(null)
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('Token refreshed, updating user data')
            setUser(session.user)
            await loadUserProfile(session.user.id)
          }
        } else {
          setUser(session?.user ?? null)

          if (session?.user) {
            await loadUserProfile(session.user.id)
          } else {
            setUserProfile(null)
          }
        }

        // 初期化が完了していない場合のみloadingを変更
        if (initializing) {
          setLoading(false)
          setInitializing(false)
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(initTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // ブラウザタブ間でのセッション変更を監視
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sb-auth-token') {
        console.log('Auth token changed in another tab')
        
        // 他のタブでログアウトされた場合
        if (!e.newValue && user) {
          console.log('User logged out in another tab')
          setUser(null)
          setUserProfile(null)
        }
        // 他のタブでログインされた場合
        else if (e.newValue && !user) {
          console.log('User logged in in another tab')
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              setUser(session.user)
              loadUserProfile(session.user.id)
            }
          }).catch(console.error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user])

  // ページの可視性変更時にセッション状態を確認
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        console.log('Page became visible, checking session validity')
        
        // ページが表示された時にセッションの有効性を確認
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session && user) {
            console.log('Session expired while page was hidden')
            setUser(null)
            setUserProfile(null)
          } else if (session && !user) {
            console.log('Session restored while page was hidden')
            setUser(session.user)
            loadUserProfile(session.user.id)
          }
        }).catch(console.error)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, loading])

  const loadUserProfile = async (userId: string) => {
    try {
      // タイムアウト機能付きでプロファイルを取得
      const profilePromise = supabase
        .from("user_profiles")
        .select(`
          id, 
          company_id, 
          email, 
          full_name, 
          role,
          companies:company_id (name, slug)
        `)
        .eq("id", userId)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Profile load timeout")), 10000)
      )

      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as { data: any; error: any }

      if (profileError) {
        if (profileError.code !== "PGRST116") {
          // テーブルが存在しない場合のエラーコード
          console.error("Error loading user profile:", profileError)
        }
        return
      }

      if (profileData) {
        const companyData = (profileData.companies as unknown) as { name: string; slug: string } | null
        setUserProfile({
          id: profileData.id as string,
          company_id: profileData.company_id as string,
          email: profileData.email as string,
          full_name: profileData.full_name as string,
          role: profileData.role as "admin" | "manager" | "user",
          company_name: companyData?.name || "",
          company_slug: companyData?.slug || "",
        })
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      // タイムアウトエラーの場合は警告レベルに下げる
      if (error instanceof Error && error.message.includes("timeout")) {
        console.warn("Profile load timeout - user will be prompted to refresh if needed")
      }
    }
  }

  const loadCompanies = async () => {
    try {
      // テーブルが存在するか確認
      const { error: checkError } = await supabase.from("companies").select("id").limit(1)

      if (checkError) {
        // テーブルが存在しない場合は空の配列を設定して続行
        if (checkError.code === "PGRST116") {
          // テーブルが存在しない場合のエラーコード
          console.warn("Companies table does not exist yet. Please run the SQL migrations.")
          setCompanies([])
          return
        }
        console.error("Error checking companies table:", checkError)
        return
      }

      // テーブルが存在する場合はデータを取得
      const { data, error } = await supabase.from("companies").select("*").order("name")

      if (error) {
        console.error("Error loading companies:", error)
        return
      }

      // データが取得できた場合は状態を更新
      if (data && data.length > 0) {
        console.log(`Loaded ${data.length} companies`)
        setCompanies(data.map((item: any) => ({
          id: item.id as string,
          name: item.name as string,
          slug: item.slug as string,
          description: item.description as string | null,
        })))
      } else {
        console.warn("No companies found in the database")
        setCompanies([])
      }
    } catch (error) {
      console.error("Error loading companies:", error)
      // エラーが発生しても空の配列を設定して続行
      setCompanies([])
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string, companyId: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      // ユーザープロファイルを作成
      if (data.user) {
        // テーブルが存在するか確認
        const { error: checkError } = await supabase.from("user_profiles").select("id").limit(1)

        if (checkError && checkError.code === "PGRST116") {
          console.warn("user_profiles table does not exist yet. Please run the SQL migrations.")
          return { error: new Error("Database tables not set up. Please run the SQL migrations.") }
        }

        const { error: profileError } = await supabase.from("user_profiles").insert({
          id: data.user.id,
          company_id: companyId,
          email,
          full_name: fullName,
          role: "user",
        })

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          return { error: profileError }
        }
      }

      return { error: null }
    } catch (error) {
      console.error("Error during sign up:", error)
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserProfile(null)
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error("No user logged in") }

    try {
      const { error } = await supabase.from("user_profiles").update(updates).eq("id", user.id)

      if (!error && userProfile) {
        setUserProfile({ ...userProfile, ...updates })
      }

      return { error }
    } catch (error) {
      console.error("Error updating profile:", error)
      return { error }
    }
  }

  const value = {
    user,
    userProfile,
    companies,
    loading,
    companyId,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

