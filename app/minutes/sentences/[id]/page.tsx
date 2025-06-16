"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, Save, X, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  getMinuteSentences,
  updateMinuteSentence,
  reorderMinuteSentences,
  type MinuteSentence,
} from "@/lib/supabase-sentences"
import { getMinuteById, type Minute } from "@/lib/supabase-minutes"
import { getParticipants, type Participant } from "@/lib/supabase-storage"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function MinuteSentencesPage() {
  const params = useParams()
  const minuteId = params.id as string
  const { toast } = useToast()

  const [minute, setMinute] = useState<Minute | null>(null)
  const [sentences, setSentences] = useState<MinuteSentence[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<{
    sentence_text: string
    participant_id: string | null
    speech_type: string | null
    importance: string | null
  }>({
    sentence_text: "",
    participant_id: "",
    speech_type: "",
    importance: "",
  })

  const speechTypes = [
    "品質改善",
    "品質不良",
    "納期遅延",
    "生産異常",
    "クレーム対応",
    "生産条件改善",
    "ToDo"
  ]

  const importanceLevels = ["高", "中", "低"]

  // データの読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        console.log("Loading data for minute ID:", minuteId)

        const [minuteData, sentencesData, participantsData] = await Promise.all([
          getMinuteById(minuteId),
          getMinuteSentences(minuteId),
          getParticipants(),
        ])

        console.log("Loaded minute:", minuteData)
        console.log("Loaded sentences:", sentencesData)
        console.log("Loaded participants:", participantsData)

        setMinute(minuteData)
        setSentences(sentencesData)
        setParticipants(participantsData)
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "エラー",
          description: "データの読み込みに失敗しました",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (minuteId) {
      loadData()
    }
  }, [minuteId, toast])

  // データの再読み込み
  const handleRefresh = async () => {
    try {
      setLoading(true)
      const sentencesData = await getMinuteSentences(minuteId)
      setSentences(sentencesData)
      toast({
        title: "更新完了",
        description: "発言データを再読み込みしました",
      })
    } catch (error) {
      console.error("Failed to refresh data:", error)
      toast({
        title: "エラー",
        description: "データの再読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 編集開始
  const handleStartEdit = (sentence: MinuteSentence) => {
    setEditingId(sentence.id)
    setEditingData({
      sentence_text: sentence.sentence_text,
      participant_id: sentence.participant_id || "",
      speech_type: sentence.speech_type || "",
      importance: sentence.importance || "",
    })
  }

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData({
      sentence_text: "",
      participant_id: "",
      speech_type: "",
      importance: "",
    })
  }

  // 編集保存
  const handleSaveEdit = async (sentence: MinuteSentence) => {
    try {
      const updatedSentence: MinuteSentence = {
        ...sentence,
        sentence_text: editingData.sentence_text,
        participant_id: editingData.participant_id,
        speech_type: editingData.speech_type,
        importance: editingData.importance,
      }

      const success = await updateMinuteSentence(updatedSentence)

      if (success) {
        setSentences(
          sentences.map((s) =>
            s.id === sentence.id
              ? {
                  ...updatedSentence,
                  participant_name: participants.find((p) => p.id === editingData.participant_id)?.name,
                  participant_position: participants.find((p) => p.id === editingData.participant_id)?.position,
                  participant_role: participants.find((p) => p.id === editingData.participant_id)?.role,
                }
              : s,
          ),
        )
        setEditingId(null)
        toast({
          title: "更新完了",
          description: "発言データが更新されました",
        })
      } else {
        throw new Error("更新に失敗しました")
      }
    } catch (error) {
      console.error("Failed to update sentence:", error)
      toast({
        title: "エラー",
        description: "発言データの更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  // 順序の再整理
  const handleReorder = async () => {
    try {
      const success = await reorderMinuteSentences(minuteId)
      if (success) {
        // データを再読み込み
        const sentencesData = await getMinuteSentences(minuteId)
        setSentences(sentencesData)
        toast({
          title: "順序整理完了",
          description: "発言の順序が整理されました",
        })
      } else {
        throw new Error("順序整理に失敗しました")
      }
    } catch (error) {
      console.error("Failed to reorder sentences:", error)
      toast({
        title: "エラー",
        description: "順序整理に失敗しました",
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

  if (!minute) {
    return (
      <div className="container mx-auto">
        <div className="text-center py-8">
          <p className="text-muted-foreground">議事録が見つかりません</p>
          <Button asChild className="mt-4">
            <Link href="/search">検索・履歴に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight mt-[15px] ml-[15px]">発言一覧</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{minute.title}</CardTitle>
              <CardDescription>
                {minute.date} {minute.time} | 発言数: {sentences.length}件
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                更新
              </Button>
              <Button variant="outline" size="sm" onClick={handleReorder}>
                順序整理
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>発言一覧</CardTitle>
          <CardDescription>各発言の詳細情報と編集が可能です。</CardDescription>
        </CardHeader>
        <CardContent>
          {sentences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              この議事録には発言データがありません。
              <br />
              <Link href="/minutes/new" className="text-primary hover:underline">
                議事録作成ページ
              </Link>
              で発言分離＆タグ付けを行ってください。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">順序</TableHead>
                  <TableHead>発言者</TableHead>
                  <TableHead>発言種類</TableHead>
                  <TableHead>重要度</TableHead>
                  <TableHead>発言内容</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentences.map((sentence) => (
                  <TableRow key={sentence.id}>
                    <TableCell className="font-medium">{sentence.sentence_order}</TableCell>
                    <TableCell>
                      {editingId === sentence.id ? (
                        <Select
                          value={editingData.participant_id}
                          onValueChange={(value) => setEditingData({ ...editingData, participant_id: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="発言者を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">未設定</SelectItem>
                            {participants.map((participant) => (
                              <SelectItem key={participant.id} value={participant.id}>
                                {participant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          <div className="font-medium">{sentence.participant_name || "不明"}</div>
                          <div className="text-sm text-muted-foreground">{sentence.participant_position}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === sentence.id ? (
                        <Select
                          value={editingData.speech_type}
                          onValueChange={(value) => setEditingData({ ...editingData, speech_type: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="発言種類を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">未設定</SelectItem>
                            {speechTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        sentence.speech_type && <Badge variant="outline">{sentence.speech_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === sentence.id ? (
                        <Select
                          value={editingData.importance}
                          onValueChange={(value) => setEditingData({ ...editingData, importance: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="重要度を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">未設定</SelectItem>
                            {importanceLevels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        sentence.importance && <Badge variant="outline">{sentence.importance}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === sentence.id ? (
                        <Input
                          value={editingData.sentence_text}
                          onChange={(e) => setEditingData({ ...editingData, sentence_text: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        <div className="max-w-md">{sentence.sentence_text}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === sentence.id ? (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(sentence)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="icon" variant="ghost" onClick={() => handleStartEdit(sentence)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ToDoタグ付き発言一覧 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ToDoタグ付き発言一覧</CardTitle>
          <CardDescription>ToDoを登録・編集できます。</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ToDo登録・編集UI */}
          {sentences.filter(s => s.speech_type === 'ToDo').length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">ToDoタグ付き発言がありません。</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>発言内容</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead>重要度</TableHead>
                  <TableHead>ToDo登録</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentences.filter(s => s.speech_type === 'ToDo').map(sentence => (
                  <TableRow key={sentence.id}>
                    <TableCell>{sentence.sentence_text}</TableCell>
                    <TableCell>{sentence.participant_name || '不明'}</TableCell>
                    <TableCell>{sentence.importance || '-'}</TableCell>
                    <TableCell>
                      {/* ここにToDo登録・編集フォームを設置（例: タイトル・期日・優先度・保存ボタン） */}
                      {/* minute_sentence_id: sentence.id を渡して登録 */}
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
