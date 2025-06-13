"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { updateUserCompany, getCompanies } from "@/lib/admin-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminPage() {
  const { userProfile, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [companies, setCompanies] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  // 会社一覧を取得
  useEffect(() => {
    async function loadCompanies() {
      setLoadingCompanies(true)
      const result = await getCompanies()
      if (result.success) {
        setCompanies(result.companies)
      }
      setLoadingCompanies(false)
    }

    loadCompanies()
  }, [])

  // 管理者権限チェック
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userProfile || userProfile.role !== "admin") {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>このページにアクセスする権限がありません。管理者のみアクセス可能です。</AlertDescription>
        </Alert>
      </div>
    )
  }

  // ユーザーの会社を更新
  const handleUpdateUserCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSubmitting(true)

    if (!email || !selectedCompanyId) {
      setMessage({ type: "error", text: "メールアドレスと会社を入力してください" })
      setIsSubmitting(false)
      return
    }

    const result = await updateUserCompany(email, selectedCompanyId)

    if (result.success) {
      setMessage({ type: "success", text: `${email}の会社を更新しました` })
      setEmail("")
      setSelectedCompanyId("")
    } else {
      setMessage({ type: "error", text: `エラーが発生しました: ${result.error}` })
    }

    setIsSubmitting(false)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">管理者ページ</h1>

      {message && (
        <Alert variant={message.type === "success" ? "default" : "destructive"} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* ユーザー会社更新フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザーの会社を更新</CardTitle>
            <CardDescription>既存ユーザーの所属会社を変更します</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateUserCompany} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ユーザーメールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">会社</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="会社を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || loadingCompanies}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                更新
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 会社一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>会社一覧</CardTitle>
            <CardDescription>システムに登録されている会社</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCompanies ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : companies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名前</TableHead>
                    <TableHead>スラッグ</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>{company.name}</TableCell>
                      <TableCell>{company.slug}</TableCell>
                      <TableCell className="font-mono text-xs">{company.id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground">会社が登録されていません</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
