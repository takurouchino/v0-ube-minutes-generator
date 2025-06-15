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

  // companyIdを計算
  const companyId = userProfile?.company_id

  useEffect(() => {
    let mounted = true

    // 初期認証状態の確認
    const getInitialSession = async () => {
      try {
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
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }

        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      // まず直接user_profilesテーブルから取得を試みる
      const { data: profileData, error: profileError } = await supabase
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
