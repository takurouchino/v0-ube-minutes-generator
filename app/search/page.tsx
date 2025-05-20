"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Eye, SearchIcon } from "lucide-react"
import Link from "next/link"
import { getMinutes, getThemes, getParticipants, type Minute, type Theme, type Participant } from "@/lib/local-storage"

export default function SearchPage() {
  const [keyword, setKeyword] = useState("")
  const [selectedTheme, setSelectedTheme] = useState("all")
  const [selectedParticipant, setSelectedParticipant] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchResults, setSearchResults] = useState<Minute[]>([])

  // テーマと参加者のデータ
  const [themes, setThemes] = useState<Theme[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])

  // 初期データの取得
  useEffect(() => {
    const storedThemes = getThemes()
    const storedParticipants = getParticipants()
    const storedMinutes = getMinutes()

    setThemes(storedThemes)
    setParticipants(storedParticipants)
    setSearchResults(storedMinutes)
  }, [])

  // 検索処理
  const handleSearch = () => {
    // 検索条件がない場合は全件表示
    if (!keyword && selectedTheme === "all" && selectedParticipant === "all" && !startDate && !endDate) {
      setSearchResults(getMinutes())
      return
    }

    let results = getMinutes()

    // キーワード検索
    if (keyword) {
      results = results.filter((minute) => {
        // タイトル、内容、サマリーなどを検索
        return (
          minute.title.toLowerCase().includes(keyword.toLowerCase()) ||
          minute.content.toLowerCase().includes(keyword.toLowerCase()) ||
          (minute.summary?.progress && minute.summary.progress.toLowerCase().includes(keyword.toLowerCase())) ||
          (minute.summary?.keyPoints && minute.summary.keyPoints.toLowerCase().includes(keyword.toLowerCase())) ||
          (minute.summary?.decisions && minute.summary.decisions.toLowerCase().includes(keyword.toLowerCase())) ||
          (minute.summary?.actions && minute.summary.actions.toLowerCase().includes(keyword.toLowerCase())) ||
          (minute.sentences && minute.sentences.some((s) => s.text.toLowerCase().includes(keyword.toLowerCase())))
        )
      })
    }

    // テーマでフィルタリング
    if (selectedTheme !== "all") {
      results = results.filter((minute) => minute.themeId === selectedTheme)
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
  }

  // テーマIDからテーマ名を取得
  const getThemeName = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId)
    return theme ? theme.name : "不明なテーマ"
  }

  // 参加者IDから参加者名を取得
  const getParticipantName = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId)
    return participant ? participant.name : "不明な参加者"
  }

  // 議事録からキーワードを抽出
  const extractKeywords = (minute: Minute) => {
    const keywords = new Set<string>()

    // 議事録の内容からキーワードを抽出
    if (minute.content) {
      // 重要そうな単語を抽出（例：名詞、数字を含む単語など）
      const contentWords = minute.content.split(/\s+|、|。/)
      contentWords.forEach((word) => {
        // 2文字以上の単語を抽出（数字のみは除外）
        if (word.length >= 2 && !/^\d+$/.test(word)) {
          keywords.add(word.replace(/[.,;:!?]/g, ""))
        }
      })
    }

    // サマリーからキーワードを抽出
    if (minute.summary) {
      // 特に要点まとめからキーワードを優先的に抽出
      const keyPointsWords = minute.summary.keyPoints.split(/\s+|、|。|\n/)
      keyPointsWords.forEach((word) => {
        // 数字の後に%や単位がある場合は特に重要
        if (/\d+%|\d+[度円個台]/.test(word)) {
          keywords.add(word.replace(/[.,;:!?]/g, ""))
        }
        // 2文字以上の単語を抽出（数字のみは除外）
        else if (word.length >= 2 && !/^\d+$/.test(word)) {
          keywords.add(word.replace(/[.,;:!?]/g, ""))
        }
      })

      // 決定事項からもキーワードを抽出
      const decisionsWords = minute.summary.decisions.split(/\s+|、|。/)
      decisionsWords.forEach((word) => {
        if (word.length >= 2 && !/^\d+$/.test(word)) {
          keywords.add(word.replace(/[.,;:!?]/g, ""))
        }
      })

      // アクションアイテムからもキーワードを抽出
      const actionsWords = minute.summary.actions.split(/\s+|、|。|\n/)
      actionsWords.forEach((word) => {
        if (word.length >= 2 && !/^\d+$/.test(word)) {
          keywords.add(word.replace(/[.,;:!?]/g, ""))
        }
      })
    }

    // 重要そうなキーワードを優先（例：「不良率」「改善」「検討」など）
    const priorityKeywords = Array.from(keywords).filter((keyword) =>
      /不良率|改善|検討|対策|実施|完了|決定|報告|確認/.test(keyword),
    )

    // 優先キーワードと他のキーワードを組み合わせて返す
    return [...priorityKeywords, ...Array.from(keywords).filter((k) => !priorityKeywords.includes(k))].slice(0, 5)
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

          <Button className="w-full" onClick={handleSearch}>
            <SearchIcon className="mr-2 h-4 w-4" />
            検索
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
                      <Badge variant="outline">{getThemeName(result.themeId)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {result.participants.slice(0, 2).map((participantId, index) => (
                          <span key={index} className="text-xs">
                            {getParticipantName(participantId)}
                            {index < Math.min(result.participants.length, 2) - 1 ? ", " : ""}
                          </span>
                        ))}
                        {result.participants.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{result.participants.length - 2}</span>
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
                          <Link href={`/minutes/${result.id}/download`}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">ダウンロード</span>
                          </Link>
                        </Button>
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
