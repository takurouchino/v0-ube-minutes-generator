"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ログイン状態の確認が完了したら
    if (!loading) {
      // ログインしていない場合はログインページにリダイレクト
      if (!user && pathname !== "/login") {
        router.push("/login")
      }
      // ログイン済みでログインページにいる場合はホームにリダイレクト
      else if (user && pathname === "/login") {
        router.push("/")
      }
    }
  }, [user, loading, router, pathname])

  // ローディング中
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ログインページ以外でログインしていない場合は何も表示しない
  if (!user && pathname !== "/login") {
    return null
  }

  // ログイン済みでログインページの場合は何も表示しない
  if (user && pathname === "/login") {
    return null
  }

  // それ以外の場合は子コンポーネントを表示
  return <>{children}</>
}
