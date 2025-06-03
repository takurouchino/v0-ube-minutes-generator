"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { getParticipants, addTheme, addParticipantToTheme, type Participant } from "@/lib/supabase-storage"
import { AddParticipantModal } from "@/components/add-participant-modal"

export default function NewThemePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [addParticipantModalOpen, setAddParticipantModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const storedParticipants = await getParticipants()
        setAllParticipants(storedParticipants || [])
      } catch (error) {
        console.error("Failed to load participants:", error)
        setAllParticipants([])
      }
    }

    loadParticipants()
  }, [])

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    )
  }

  // 新規参加者が追加された後の処理
  const handleParticipantAdded = async () => {
    // 参加者リストを再読み込み
    const updatedParticipants = await getParticipants()
    setAllParticipants(updatedParticipants)

    toast({
      title: "参加者を追加しました",
      description: "新しい参加者が参加者マスタに追加されました",
    })
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

    try {
      setLoading(true)
      console.log("Creating theme with data:", { name, category, description })

      // テーマを追加
      const newTheme = await addTheme({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
      })

      if (!newTheme) {
        throw new Error("テーマの追加に失敗しました")
      }

      console.log("Theme created successfully:", newTheme)

      // 選択された参加者をテーマに追加
      if (selectedParticipants.length > 0) {
        console.log("Adding participants to theme:", selectedParticipants)
        for (const participantId of selectedParticipants) {
          const success = await addParticipantToTheme(newTheme.id, participantId)
          if (!success) {
            console.warn(`Failed to add participant ${participantId} to theme`)
          }
        }
      }

      toast({
        title: "テーマを登録しました",
        description: `新しいテーマ「${name}」が正常に登録されました`,
      })

      router.push("/themes")
    } catch (error) {
      console.error("Failed to add theme:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "テーマの登録に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold tracking-tight">新規テーマ登録</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>新しいテーマの基本情報を入力します。</CardDescription>
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
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "登録中..." : "登録する"}
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
