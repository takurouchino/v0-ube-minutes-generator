"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2, AlertCircle } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  useEffect(() => {
    // ログイン状態の確認が完了したら
    if (!loading) {
      // ログインしていない場合はログインページにリダイレクト
      if (!user && pathname !== "/login") {
        console.log("No user found, redirecting to login")
        router.push("/login")
      }
      // ログイン済みでログインページにいる場合はホームにリダイレクト
      else if (user && pathname === "/login") {
        console.log("User logged in, redirecting to home")
        router.push("/")
      }
    }
  }, [user, loading, router, pathname])

  // セッションタイムアウトの監視
  useEffect(() => {
    if (loading) {
      // 15秒後に警告を表示
      const warningTimeoutId = setTimeout(() => {
        setShowTimeoutWarning(true)
      }, 15000)

      // 30秒後に強制リダイレクト
      const redirectTimeoutId = setTimeout(() => {
        console.warn("Authentication check timeout - redirecting to login")
        if (pathname !== "/login") {
          router.push("/login?timeout=true")
        }
      }, 30000)

      return () => {
        clearTimeout(warningTimeoutId)
        clearTimeout(redirectTimeoutId)
        setShowTimeoutWarning(false)
      }
    } else {
      setShowTimeoutWarning(false)
    }
  }, [loading, router, pathname])

  // ローディング中
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">認証状態を確認中...</p>
          {showTimeoutWarning && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                接続に時間がかかっています。しばらくお待ちください...
              </p>
            </div>
          )}
        </div>
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
