"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getThemes, type Theme } from "@/lib/supabase-storage"
import { ThemeTable } from "./theme-table"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context" // useAuthをインポート

export default function ThemesPage() {
  const { toast } = useToast()
  const { userProfile } = useAuth() // useAuthを使用して会社IDを取得
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadThemes = async () => {
      try {
        setLoading(true)
        console.log("Loading themes...")
        // 会社IDを引数として渡す
        const storedThemes = await getThemes(userProfile?.company_id)
        console.log("Themes loaded:", storedThemes)
        setThemes(storedThemes || [])
        setError(null)
      } catch (error) {
        console.error("Failed to load themes:", error)
        setError("テーマの読み込みに失敗しました。")
        toast({
          title: "エラー",
          description: "テーマの読み込みに失敗しました。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    // userProfileが読み込まれたら実行
    if (userProfile?.company_id) {
      loadThemes()
    }
  }, [toast, userProfile]) // userProfileを依存配列に追加

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">テーマ管理</h1>
        <Button asChild>
          <Link href="/themes/new">
            <Plus className="mr-2 h-4 w-4" />
            新規テーマ登録
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : themes.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium mb-2">テーマがまだ登録されていません</h3>
          <p className="text-muted-foreground mb-6">新しいテーマを登録して、議事録の管理を始めましょう。</p>
          <Button asChild>
            <Link href="/themes/new">
              <Plus className="mr-2 h-4 w-4" />
              最初のテーマを登録する
            </Link>
          </Button>
        </div>
      ) : (
        <ThemeTable themes={themes} />
      )}
    </div>
  )
}
