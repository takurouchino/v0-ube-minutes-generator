"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { getParticipants, getThemes, deleteParticipant, type Participant, type Theme } from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

export default function ParticipantDetailPage({ params }: { params: any }) {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = React.use(params) as { id: string }
  const { userProfile } = useAuth()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // テーマIDからテーマ名を取得
  const getThemeName = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId)
    return theme ? theme.name : "不明なテーマ"
  }

  // 参加者の削除
  const handleDelete = async () => {
    if (!participant) return

    if (confirm(`${participant.name}さんを削除してもよろしいですか？`)) {
      try {
        const success = await deleteParticipant(participant.id)

        if (success) {
          toast({
            title: "参加者を削除しました",
            description: `${participant.name}さんを参加者マスタから削除しました`,
          })
          router.push("/participants")
        } else {
          throw new Error("削除に失敗しました")
        }
      } catch (error) {
        console.error("Failed to delete participant:", error)
        toast({
          title: "エラー",
          description: "参加者の削除に失敗しました",
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
            <Link href="/participants">参加者一覧に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!participant) {
    return null
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/participants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{participant.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>参加者の基本情報です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">氏名</h3>
              <p>{participant.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium">役職</h3>
              <p>{participant.position || "未設定"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium">所属部署</h3>
              <p>{participant.department || "未設定"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium">作成日</h3>
              <p className="text-sm">
                {participant.created_at ? new Date(participant.created_at).toLocaleDateString() : "不明"}
              </p>
            </div>

            <div className="pt-4 flex gap-2">
              <Button asChild>
                <Link href={`/participants/${participant.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  編集する
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                削除する
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>参加テーマ</CardTitle>
            <CardDescription>この参加者が参加しているテーマ一覧です。</CardDescription>
          </CardHeader>
          <CardContent>
            {participant.themes.length > 0 ? (
              <div className="space-y-2">
                {participant.themes.map((themeId, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <Badge variant="secondary">{getThemeName(themeId)}</Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/themes/${themeId}`}>詳細</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">参加しているテーマがありません</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
