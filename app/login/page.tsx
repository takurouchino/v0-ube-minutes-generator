"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import type { Company } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp, companies: authCompanies, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)

  // 公開APIから会社データを取得するための状態
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  // 🔍 デバッグ用: コンポーネント初期化ログ
  console.log("🚀 LoginPage component initialized")
  console.log("📅 Deploy Timestamp:", new Date().toISOString())
  console.log("🌐 Environment:", {
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
  })
  console.log("📊 Initial State:", {
    authLoading,
    loadingCompanies,
    authCompanies,
    companies
  })
  
  // バージョン確認用のユニークID
  console.log("🔢 Code Version: SPINNER_FIX_v2.0 - " + Date.now())

  // 公開APIから会社データを取得
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true)
        console.log("会社データを取得中...")

        // 10秒でタイムアウト設定
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.log("会社データ取得がタイムアウトしました")
          controller.abort()
        }, 10000)

        const response = await fetch("/api/public/companies", {
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error("会社データの取得に失敗しました")
        }

        const data = await response.json()

        if (data.companies && Array.isArray(data.companies)) {
          console.log(`公開APIから${data.companies.length}件の会社データを取得しました`)
          setCompanies(data.companies)
        } else {
          console.warn("会社データが正しい形式ではありません")
          setCompanies([])
        }
      } catch (err) {
        console.error("会社データ取得エラー:", err)
        // 認証コンテキストから取得した会社データをフォールバックとして使用
        if (authCompanies.length > 0) {
          console.log("認証コンテキストの会社データを使用します")
          setCompanies(authCompanies)
        } else {
          console.log("フォールバック: 空の会社リストを設定")
          setCompanies([])
        }
      } finally {
        setLoadingCompanies(false)
        console.log("会社データ取得処理完了")
      }
    }

    // 5秒後に強制終了する安全装置
    const safetyTimeout = setTimeout(() => {
      console.log("⏰ 安全装置: 会社データローディングを強制終了")
      console.log("🔧 setLoadingCompanies(false) - Safety timeout triggered")
      setLoadingCompanies(false)
    }, 5000)

    console.log("📡 Starting fetchCompanies process...")
    fetchCompanies().finally(() => {
      console.log("🏁 fetchCompanies process completed")
      clearTimeout(safetyTimeout)
    })
  }, [authCompanies])

  // 🔍 デバッグ用: Auth状態の変化を監視
  useEffect(() => {
    console.log("🔐 Auth State Changed:", {
      authLoading,
      hasUser: !!authCompanies,
      authCompaniesLength: authCompanies?.length || 0,
      timestamp: new Date().toISOString()
    })
  }, [authLoading, authCompanies])

  // 🔍 デバッグ用: Companies状態の変化を監視
  useEffect(() => {
    console.log("🏢 Companies State Changed:", {
      loadingCompanies,
      companiesLength: companies.length,
      companies: companies.slice(0, 3), // 最初の3つだけ表示
      timestamp: new Date().toISOString()
    })
  }, [loadingCompanies, companies])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        router.push("/")
      }
    } catch (err: any) {
      setError(err.message || "ログインに失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // 会社選択を必須に変更
    if (!companyId) {
      setError("会社を選択してください")
      setIsSubmitting(false)
      return
    }

    // 会社データが読み込めていない場合
    if (companies.length === 0) {
      setError("会社データが読み込めません。管理者にお問い合わせください。")
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await signUp(email, password, fullName, companyId)
      if (error) {
        if (error.message?.includes("Database tables not set up")) {
          setSetupRequired(true)
        } else {
          setError(error.message)
        }
      } else {
        setActiveTab("login")
        setError("アカウントが作成されました。ログインしてください。")
      }
    } catch (err: any) {
      setError(err.message || "サインアップに失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 🔍 デバッグ用: レンダリング条件チェック
  console.log("🎯 Render Check:", {
    authLoading: authLoading,
    loadingCompanies: loadingCompanies,
    shouldShowSpinner: authLoading,
    shouldShowLoginForm: !authLoading,
    timestamp: new Date().toISOString()
  })

  // 認証コンテキストのロード中はローディング表示
  // 会社データのロードは10秒でタイムアウト
  if (authLoading) {
    console.log("🔄 SHOWING SPINNER - authLoading is true")
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  console.log("✅ SHOWING LOGIN FORM - authLoading is false")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">議事録ジェネレーター</CardTitle>
          <CardDescription className="text-center">ログインまたは新規登録してください</CardDescription>
        </CardHeader>
        <CardContent>
          {setupRequired ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>データベースのセットアップが必要です。管理者にお問い合わせください。</AlertDescription>
            </Alert>
          ) : error ? (
            <Alert variant={error.includes("作成されました") ? "default" : "destructive"} className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="register">新規登録</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  ログイン
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">氏名</Label>
                  <Input
                    id="fullName"
                    placeholder="山田 太郎"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {/* 会社選択UIの改善 - 公開APIから取得したデータを使用 */}
                <div className="space-y-2">
                  <Label htmlFor="company">
                    会社 <span className="text-red-500">*</span>
                  </Label>
                  <Select value={companyId} onValueChange={setCompanyId} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="会社を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.length > 0 ? (
                        companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-companies" disabled>
                          利用可能な会社がありません
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {!companyId && <p className="text-xs text-red-500 mt-1">会社の選択は必須です</p>}
                  {companies.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">
                      会社データが読み込めません。管理者にお問い合わせください。
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  登録
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} UBE Minutes Generator
        </CardFooter>
      </Card>
    </div>
  )
}
