"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getThemes, addParticipant, addParticipantToTheme, type Theme } from "@/lib/supabase-storage"

export default function NewParticipantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [name, setName] = useState("")
  const [position, setPosition] = useState("")
  const [role, setRole] = useState("")
  const [department, setDepartment] = useState("")
  const [loading, setLoading] = useState(false)

  // テーマデータの取得
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const storedThemes = await getThemes()
        setThemes(storedThemes)
      } catch (error) {
        console.error("Failed to load themes:", error)
        toast({
          title: "エラー",
          description: "テーマの読み込みに失敗しました",
          variant: "destructive",
        })
      }
    }

    loadThemes()
  }, [toast])

  // テーマの選択状態を切り替え
  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) => (prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "氏名は必須です",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // 参加者を追加
      const newParticipant = await addParticipant({
        name,
        position,
        role,
        department,
      })

      if (!newParticipant) {
        throw new Error("参加者の追加に失敗しました")
      }

      // 選択されたテーマに参加者を追加
      for (const themeId of selectedThemes) {
        await addParticipantToTheme(themeId, newParticipant.id)
      }

      toast({
        title: "参加者を登録しました",
        description: `${name}さんが正常に登録されました`,
      })

      router.push("/participants")
    } catch (error) {
      console.error("Failed to add participant:", error)
      toast({
        title: "エラー",
        description: "参加者の登録に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/participants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">新規参加者登録</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>参加者情報</CardTitle>
            <CardDescription>新しい会議参加者の情報を入力してください。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">氏名</Label>
              <Input
                id="name"
                placeholder="例: 山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">役職</Label>
              <Input
                id="position"
                placeholder="例: 工場長"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">役割</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="役割を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="管理者">管理者</SelectItem>
                  <SelectItem value="品質管理">品質管理</SelectItem>
                  <SelectItem value="生産管理">生産管理</SelectItem>
                  <SelectItem value="安全管理">安全管理</SelectItem>
                  <SelectItem value="社外コンサル">社外コンサル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">所属部署</Label>
              <Input
                id="department"
                placeholder="例: 製造部"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-4">
              <Label>参加テーマ</Label>
              <p className="text-sm text-muted-foreground mb-2">
                この参加者が定常的に参加するテーマを選択してください。
              </p>
              <div className="space-y-2">
                {themes.length > 0 ? (
                  themes.map((theme) => (
                    <div key={theme.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`theme-${theme.id}`}
                        checked={selectedThemes.includes(theme.id)}
                        onCheckedChange={() => toggleTheme(theme.id)}
                      />
                      <Label htmlFor={`theme-${theme.id}`} className="font-normal">
                        {theme.name}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">テーマが登録されていません</div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/participants">キャンセル</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "登録中..." : "登録する"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
