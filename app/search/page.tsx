"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Eye, SearchIcon, Trash2 } from "lucide-react"
import Link from "next/link"
import { getMinutes, searchMinutes, deleteMinute, type Minute } from "@/lib/supabase-minutes"
import { getThemes, getParticipants, type Theme, type Participant } from "@/lib/supabase-storage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

export default function SearchPage() {
  const [keyword, setKeyword] = useState("")
  const [selectedTheme, setSelectedTheme] = useState("all")
  const [selectedParticipant, setSelectedParticipant] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchResults, setSearchResults] = useState<Minute[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // テーマと参加者のデータ
  const [themes, setThemes] = useState<Theme[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])

  const { toast } = useToast()

  // 初期データの取得 - 依存配列を空にして一度だけ実行
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [storedThemes, storedParticipants, storedMinutes] = await Promise.all([
          getThemes(),
          getParticipants(),
          getMinutes(),
        ])

        setThemes(storedThemes)
        setParticipants(storedParticipants)
        setSearchResults(storedMinutes)
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "エラー",
          description: "データの読み込みに失敗しました。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast]) // toastを依存配列に追加

  // 検索処理
  const handleSearch = async () => {
    try {
      setLoading(true)
      let results: Minute[] = []

      // キーワード検索がある場合
      if (keyword.trim()) {
        results = await searchMinutes(keyword.trim())
      } else {
        results = await getMinutes()
      }

      // テーマでフィルタリング
      if (selectedTheme !== "all") {
        results = results.filter((minute) => minute.theme_id === selectedTheme)
      }

      // 参加者でフィルタリング
      if (selectedParticipant !== "all") {
        results = results.filter((minute) => minute.participants.includes(selectedParticipant))
      }

      // 日付でフィルタリング
      if (startDate) {
        results = results.filter((minute) => minute.date >= startDate)
      }
      if (endDate) {
        results = results.filter((minute) => minute.date <= endDate)
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Failed to search minutes:", error)
      toast({
        title: "エラー",
        description: "検索に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 議事録削除処理
  const handleDeleteMinute = async (minuteId: string, title: string) => {
    try {
      setDeletingId(minuteId)

      const success = await deleteMinute(minuteId)

      if (success) {
        // 検索結果から削除された議事録を除外
        setSearchResults((prev) => prev.filter((minute) => minute.id !== minuteId))

        toast({
          title: "削除完了",
          description: `議事録「${title}」を削除しました。`,
        })
      } else {
        throw new Error("削除に失敗しました")
      }
    } catch (error) {
      console.error("Failed to delete minute:", error)
      toast({
        title: "エラー",
        description: "議事録の削除に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  // テーマIDからテーマ名を取得
  const getThemeName = (themeId: string | null) => {
    if (!themeId) return "テーマなし"
    const theme = themes.find((t) => t.id === themeId)
    return theme ? theme.name : "不明なテーマ"
  }

  // 議事録からキーワードを抽出
  const extractKeywords = (minute: Minute) => {
    // Supabaseに保存されているキーワードがあればそれを使用
    if (minute.keywords && minute.keywords.length > 0) {
      return minute.keywords.slice(0, 5)
    }

    // なければ動的に生成
    const keywords = new Set<string>()

    if (minute.content) {
      const contentWords = minute.content.split(/\s+|、|。/)
      contentWords.forEach((word) => {
        if (word.length >= 2 && !/^\d+$/.test(word)) {
          keywords.add(word.replace(/[.,;:!?]/g, ""))
        }
      })
    }

    const summaryText = [
      minute.summary_progress,
      minute.summary_key_points,
      minute.summary_decisions,
      minute.summary_actions,
    ]
      .filter(Boolean)
      .join(" ")

    if (summaryText) {
      const summaryWords = summaryText.split(/\s+|、|。|\n/)
      summaryWords.forEach((word) => {
        if (/\d+%|\d+[度円個台]/.test(word)) {
          keywords.add(word.replace(/[.,;:!?]/g, ""))
        } else if (word.length >= 2 && !/^\d+$/.test(word)) {
          keywords.add(word.replace(/[.,;:!?]/g, ""))
        }
      })
    }

    const priorityKeywords = Array.from(keywords).filter((keyword) =>
      /不良率|改善|検討|対策|実施|完了|決定|報告|確認/.test(keyword),
    )

    return [...priorityKeywords, ...Array.from(keywords).filter((k) => !priorityKeywords.includes(k))].slice(0, 5)
  }

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>データを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">検索・履歴</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>議事録検索</CardTitle>
          <CardDescription>キーワード、テーマ、参加者、期間などで過去の議事録を検索できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">キーワード</label>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="検索キーワード"
                  className="pl-8"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">テーマ</label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="テーマを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">参加者</label>
              <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                <SelectTrigger>
                  <SelectValue placeholder="参加者を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {participants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">期間</label>
              <div className="flex gap-2 items-center">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span>～</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={handleSearch} disabled={loading}>
            <SearchIcon className="mr-2 h-4 w-4" />
            {loading ? "検索中..." : "検索"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>検索結果</CardTitle>
          <CardDescription>検索条件に一致する議事録の一覧です。</CardDescription>
        </CardHeader>
        <CardContent>
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              議事録が見つかりません。新しい議事録を作成するか、検索条件を変更してください。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>会議テーマ</TableHead>
                  <TableHead>日付</TableHead>
                  <TableHead className="hidden md:table-cell">カテゴリ</TableHead>
                  <TableHead className="hidden md:table-cell">参加者</TableHead>
                  <TableHead className="hidden md:table-cell">キーワード</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      <Link href={`/minutes/summary/${result.id}`} className="hover:underline">
                        {result.title}
                      </Link>
                    </TableCell>
                    <TableCell>{result.date}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{getThemeName(result.theme_id)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {result.participant_details && result.participant_details.length > 0 ? (
                          <>
                            {result.participant_details.slice(0, 2).map((participant, index) => (
                              <span key={participant.id} className="text-xs">
                                {participant.name}
                                {index < Math.min(result.participant_details!.length, 2) - 1 ? ", " : ""}
                              </span>
                            ))}
                            {result.participant_details.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{result.participant_details.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">参加者情報なし</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {extractKeywords(result).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/minutes/summary/${result.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">詳細</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/minutes/sentences/${result.id}`}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">発言データ</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === result.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">削除</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>議事録を削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{result.title}」を削除します。この操作は取り消すことができません。
                                関連する発言データやエスカレーション情報も同時に削除されます。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMinute(result.id, result.title)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deletingId === result.id}
                              >
                                {deletingId === result.id ? "削除中..." : "削除"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
