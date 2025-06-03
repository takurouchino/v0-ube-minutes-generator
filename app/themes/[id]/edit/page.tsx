"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import {
  getThemes,
  getParticipantsByTheme,
  getParticipants,
  updateTheme,
  addParticipantToTheme,
  removeParticipantFromTheme,
  type Theme,
  type Participant,
} from "@/lib/supabase-storage"
import { AddParticipantModal } from "@/components/add-participant-modal"

export default function ThemeEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [themeParticipants, setThemeParticipants] = useState<Participant[]>([])
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [addParticipantModalOpen, setAddParticipantModalOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const themes = await getThemes()
        const foundTheme = themes.find((t) => t.id === params.id)

        if (foundTheme) {
          setTheme(foundTheme)
          setName(foundTheme.name)
          setCategory(foundTheme.category)
          setDescription(foundTheme.description)

          // テーマに参加している参加者を取得
          const participants = await getParticipantsByTheme(foundTheme.id)
          setThemeParticipants(participants)
          setSelectedParticipants(participants.map((p) => p.id))

          // 全参加者を取得
          const allParticipants = await getParticipants()
          setAllParticipants(allParticipants)
        } else {
          setError("テーマが見つかりませんでした")
          setTimeout(() => router.push("/themes"), 2000)
        }
      } catch (err) {
        console.error("Failed to load theme data:", err)
        setError("データの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id, router])

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    )
  }

  // 新規参加者が追加された後の処理
  const handleParticipantAdded = async () => {
    try {
      // 参加者リストを再読み込み
      const updatedParticipants = await getParticipants()
      setAllParticipants(updatedParticipants)

      toast({
        title: "参加者を追加しました",
        description: "新しい参加者が参加者マスタに追加されました",
      })
    } catch (error) {
      console.error("Failed to reload participants:", error)
      toast({
        title: "警告",
        description: "参加者リストの更新に失敗しました。ページを再読み込みしてください。",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "テーマ名は必須です",
        variant: "destructive",
      })
      return
    }

    if (theme) {
      try {
        const updatedTheme: Theme = {
          ...theme,
          name,
          category,
          description,
        }

        const success = await updateTheme(updatedTheme)

        if (!success) {
          throw new Error("テーマの更新に失敗しました")
        }

        // 参加者の変更を反映
        const currentParticipantIds = themeParticipants.map((p) => p.id)

        // 削除された参加者を処理
        for (const participantId of currentParticipantIds) {
          if (!selectedParticipants.includes(participantId)) {
            await removeParticipantFromTheme(theme.id, participantId)
          }
        }

        // 追加された参加者を処理
        for (const participantId of selectedParticipants) {
          if (!currentParticipantIds.includes(participantId)) {
            await addParticipantToTheme(theme.id, participantId)
          }
        }

        toast({
          title: "テーマを更新しました",
          description: "テーマ情報が正常に更新されました",
        })

        router.push("/themes")
      } catch (err) {
        console.error("Failed to update theme:", err)
        toast({
          title: "エラー",
          description: "テーマの更新に失敗しました",
          variant: "destructive",
        })
      }
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
            <Link href="/themes">テーマ一覧に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/themes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">テーマ編集</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>テーマの基本情報を編集します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">テーマ名</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>参加者設定</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setAddParticipantModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  新規参加者追加
                </Button>
              </CardTitle>
              <CardDescription>このテーマに参加する担当者を選択します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {allParticipants.length > 0 ? (
                <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {allParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`participant-${participant.id}`}
                          checked={selectedParticipants.includes(participant.id)}
                          onCheckedChange={() => toggleParticipant(participant.id)}
                        />
                        <Label htmlFor={`participant-${participant.id}`} className="font-normal cursor-pointer">
                          <div>
                            <span className="font-medium">{participant.name}</span>
                            <div className="text-xs text-muted-foreground">
                              {participant.position} - {participant.role}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">参加者が登録されていません。</p>
                  <Button type="button" onClick={() => setAddParticipantModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    最初の参加者を追加
                  </Button>
                </div>
              )}

              {selectedParticipants.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">選択された参加者: {selectedParticipants.length}名</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {allParticipants
                      .filter((p) => selectedParticipants.includes(p.id))
                      .map((p) => p.name)
                      .join(", ")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <CardFooter className="flex justify-between px-0">
            <Button variant="outline" asChild>
              <Link href="/themes">キャンセル</Link>
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              保存する
            </Button>
          </CardFooter>
        </div>
      </form>

      <AddParticipantModal
        open={addParticipantModalOpen}
        onOpenChange={setAddParticipantModalOpen}
        onParticipantAdded={handleParticipantAdded}
      />
    </div>
  )
}
