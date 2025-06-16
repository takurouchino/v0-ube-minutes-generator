"use client"

import React from "react"
import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import {
  getParticipants,
  getThemes,
  updateParticipant,
  addParticipantToTheme,
  removeParticipantFromTheme,
  type Participant,
  type Theme,
} from "@/lib/supabase-storage"
import { useAuth } from "@/lib/auth-context"

export default function EditParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const { id } = use(params)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [name, setName] = useState("")
  const [position, setPosition] = useState("")
  const [role, setRole] = useState("")
  const [department, setDepartment] = useState("")
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [originalThemes, setOriginalThemes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // 参加者データを取得
        const participants = await getParticipants(userProfile?.company_id)
        const foundParticipant = participants.find((p) => p.id === id)

        if (!foundParticipant) {
          setError("参加者が見つかりませんでした")
          setTimeout(() => router.push("/participants"), 2000)
          return
        }

        setParticipant(foundParticipant)
        setName(foundParticipant.name)
        setPosition(foundParticipant.position)
        setRole(foundParticipant.role)
        setDepartment(foundParticipant.department)
        setSelectedThemes(foundParticipant.themes)
        setOriginalThemes(foundParticipant.themes)

        // テーマデータを取得
        const themesData = await getThemes(userProfile?.company_id)
        setThemes(themesData)
      } catch (err) {
        console.error("Failed to load participant data:", err)
        setError("データの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    if (userProfile?.company_id) {
      loadData()
    }
  }, [id, router, userProfile])

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

    if (!participant) return

    try {
      // 参加者情報を更新
      const updatedParticipant: Participant = {
        ...participant,
        name,
        position,
        role,
        department,
      }

      const success = await updateParticipant(updatedParticipant)

      if (!success) {
        throw new Error("参加者情報の更新に失敗しました")
      }

      // テーマの変更を反映
      // 削除されたテーマから参加者を削除
      for (const themeId of originalThemes) {
        if (!selectedThemes.includes(themeId)) {
          await removeParticipantFromTheme(themeId, participant.id)
        }
      }

      // 追加されたテーマに参加者を追加
      for (const themeId of selectedThemes) {
        if (!originalThemes.includes(themeId)) {
          await addParticipantToTheme(themeId, participant.id)
        }
      }

      toast({
        title: "参加者情報を更新しました",
        description: `${name}さんの情報が正常に更新されました`,
      })

      router.push("/participants")
    } catch (error) {
      console.error("Failed to update participant:", error)
      toast({
        title: "エラー",
        description: "参加者情報の更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center h-[50vh]">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button asChild>
            <Link href="/participants">参加者一覧に戻る</Link>
          </Button>
        </div>
      </div>
    )
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
        <h1 className="text-3xl font-bold tracking-tight">参加者編集</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>参加者情報</CardTitle>
            <CardDescription>参加者の情報を編集してください。</CardDescription>
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
              <Label htmlFor="department">部署</Label>
              <Input
                id="department"
                placeholder="例: 開発部"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
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
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              更新する
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
