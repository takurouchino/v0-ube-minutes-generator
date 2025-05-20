"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, UserPlus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { getThemes, getParticipantsByTheme, type Theme, type Participant } from "@/lib/local-storage"
import { useToast } from "@/components/ui/use-toast"

export default function ThemeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // 強制的に再レンダリングするためのキー

  // データを再読み込みする関数
  const refreshData = () => {
    setLoading(true)
    setRefreshKey((prev) => prev + 1)
    toast({
      title: "データを更新しています",
      description: "最新の情報を取得しています...",
    })
  }

  useEffect(() => {
    const loadData = () => {
      try {
        const themes = getThemes()
        const foundTheme = themes.find((t) => t.id === params.id)

        if (foundTheme) {
          setTheme(foundTheme)

          // テーマに参加している参加者を取得
          const themeParticipants = getParticipantsByTheme(foundTheme.id)
          setParticipants(themeParticipants)
        } else {
          setError("テーマが見つかりませんでした")
          // 少し待ってからリダイレクト
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
  }, [params.id, router, refreshKey]) // refreshKeyを依存配列に追加

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

  if (!theme) {
    return null
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/themes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{theme.name}</h1>
        <Button variant="ghost" size="sm" onClick={refreshData} className="ml-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>テーマ情報</CardTitle>
              <CardDescription>テーマの基本情報です。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">テーマ名</h3>
                <p>{theme.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">カテゴリ</h3>
                <Badge variant="outline">{theme.category}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium">説明</h3>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">作成日</h3>
                <p className="text-sm">{theme.createdAt}</p>
              </div>

              <div className="pt-2">
                <Button asChild>
                  <Link href={`/themes/${theme.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    編集する
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>参加者 ({participants.length}人)</CardTitle>
                <CardDescription>このテーマの参加者一覧です。</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/themes/${theme.id}/edit`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  追加
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">参加者がいません</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>氏名</TableHead>
                      <TableHead>役割</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">
                          <Link href={`/participants/${participant.id}`} className="hover:underline">
                            {participant.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">{participant.position}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{participant.role}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
