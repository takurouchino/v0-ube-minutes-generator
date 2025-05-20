"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Wand2, Save, CheckSquare, Edit } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { MinutesDraftEditor } from "./minutes-draft-editor"
import {
  getThemes,
  getParticipantsByTheme,
  getParticipants,
  addMinute,
  type Theme,
  type Participant,
  getEscalations,
  saveEscalations,
  generateEscalationsFromMinute,
} from "@/lib/local-storage"
import { AIDraftModal } from "@/components/ai-draft-modal"
import { DocumentSuggestionModal } from "@/components/document-suggestion-modal"

export default function NewMinutesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("input")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [selectedThemeId, setSelectedThemeId] = useState("")
  const [rawText, setRawText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [parsedSentences, setParsedSentences] = useState<any[]>([])
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [documentSuggestionOpen, setDocumentSuggestionOpen] = useState(false)

  // 要約情報
  const [summary, setSummary] = useState({
    progress: "",
    keyPoints: "",
    decisions: "",
    actions: "",
  })

  // テーマと参加者のデータ
  const [themes, setThemes] = useState<Theme[]>([])
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [themeParticipants, setThemeParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  // テーマと参加者データの取得
  useEffect(() => {
    const storedThemes = getThemes()
    const storedParticipants = getParticipants()
    setThemes(storedThemes)
    setAllParticipants(storedParticipants)
  }, [])

  // テーマが選択されたときに参加者を更新
  useEffect(() => {
    if (selectedThemeId) {
      const participants = getParticipantsByTheme(selectedThemeId)
      setThemeParticipants(participants)
      // デフォルトですべての参加者を選択
      setSelectedParticipants(participants.map((p) => p.id))
    } else {
      setThemeParticipants([])
      setSelectedParticipants([])
    }
  }, [selectedThemeId])

  // 参加者の選択状態を切り替え
  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    )
  }

  // AIドラフトモーダルを開く
  const handleOpenAiModal = () => {
    if (!selectedThemeId || !date || !time || selectedParticipants.length === 0) {
      toast({
        title: "入力エラー",
        description: "テーマ、日時、参加者を選択してください。",
        variant: "destructive",
      })
      return
    }
    setAiModalOpen(true)
  }

  // AIドラフト生成後の処理
  const handleDraftGenerated = (draft: string) => {
    setRawText(draft)
  }

  // 発言分離＆タグ付け処理
  const handleGenerateDraft = async () => {
    if (!selectedThemeId || !date || !time || !rawText.trim() || selectedParticipants.length === 0) {
      toast({
        title: "入力エラー",
        description: "すべての必須項目を入力してください。",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // 選択された参加者の情報を取得
      const participantDetails = themeParticipants.filter((p) => selectedParticipants.includes(p.id))

      // APIを使用して発言分離＆タグ付けを行う
      const response = await fetch("/api/parse-minutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawText,
          participants: participantDetails,
        }),
      })

      // レスポンスのステータスコードを確認
      if (!response.ok) {
        // レスポンスのテキストを取得
        const errorText = await response.text()
        console.error("API Error Response:", errorText)

        // JSONとして解析できるか試みる
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || "発言分離＆タグ付けに失敗しました")
        } catch (jsonError) {
          // JSONとして解析できない場合
          throw new Error(`発言分離＆タグ付けに失敗しました: ${errorText.substring(0, 100)}`)
        }
      }

      // レスポンスをJSONとして解析
      const data = await response.json()
      setParsedSentences(data.sentences)
      setActiveTab("edit")

      // 発言分離が完了したら自動的に要約も生成
      await generateSummary()

      toast({
        title: "発言分離＆タグ付け完了",
        description: "発言分離とタグ付けが完了しました。内容を確認・編集してください。",
      })
    } catch (error) {
      console.error("Failed to parse minutes:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "発言分離＆タグ付けに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 議事録の内容から適切なサマリーを生成する関数
  const generateSummaryFromContent = (content: string) => {
    // 議事録の内容を行に分割
    const lines = content.split("\n").filter((line) => line.trim().length > 0)

    // 進展に関する情報を抽出
    const progressLines = lines.filter(
      (line) =>
        line.includes("進展") ||
        line.includes("進捗") ||
        line.includes("完了") ||
        line.includes("達成") ||
        line.includes("減少") ||
        line.includes("増加"),
    )

    // 要点に関する情報を抽出
    const keyPointLines = lines.filter(
      (line) =>
        line.includes("重要") ||
        line.includes("ポイント") ||
        line.includes("確認") ||
        line.includes("検査") ||
        line.includes("見直し"),
    )

    // 決定に関する情報を抽出
    const decisionLines = lines.filter(
      (line) => line.includes("決定") || line.includes("決議") || line.includes("合意") || line.includes("体制"),
    )

    // アクションに関する情報を抽出
    const actionLines = lines.filter(
      (line) =>
        line.includes("アクション") ||
        line.includes("タスク") ||
        line.includes("担当") ||
        line.includes("次回") ||
        line.includes("完了する") ||
        line.includes("実施する"),
    )

    // 抽出した情報がない場合は、内容から推測
    const progress =
      progressLines.length > 0
        ? progressLines.join("\n")
        : content.includes("不良率")
          ? "検査工程の見直しと作業手順書の改訂により、不良率が改善されました。"
          : "前回からの進展について議論されました。"

    const keyPoints =
      keyPointLines.length > 0
        ? keyPointLines.map((line, index) => `${index + 1}. ${line.trim()}`).join("\n")
        : content
            .split(".")
            .slice(0, 3)
            .map((sentence, index) => `${index + 1}. ${sentence.trim()}`)
            .join("\n")

    const decisions =
      decisionLines.length > 0
        ? decisionLines.join("\n")
        : content.includes("決定")
          ? "会議で議論された内容に基づいて、必要な対応策を実施することが決定されました。"
          : "特に決定事項はありませんでした。"

    const actions =
      actionLines.length > 0
        ? actionLines.map((line, index) => `${index + 1}. ${line.trim()}`).join("\n")
        : content.includes("次回")
          ? "1. 次回会議で進捗を報告する\n2. 必要な対応策を検討する"
          : "1. 議事録を共有する\n2. 次回会議の準備を行う"

    return {
      progress,
      keyPoints,
      decisions,
      actions,
    }
  }

  // 要約生成処理
  const generateSummary = async () => {
    if (!rawText.trim()) return

    setIsGeneratingSummary(true)

    try {
      // 議事録の内容から適切なサマリーを生成
      const newSummary = generateSummaryFromContent(rawText)

      setSummary(newSummary)
      setIsGeneratingSummary(false)

      toast({
        title: "サマリ生成完了",
        description: "議事録の内容に基づいてサマリが生成されました。",
      })
    } catch (error) {
      console.error("Failed to generate summary:", error)
      setIsGeneratingSummary(false)
    }
  }

  // 議事録を保存する処理
  const handleSaveMinutes = () => {
    if (!selectedThemeId || !date || !time || !rawText.trim()) {
      toast({
        title: "入力エラー",
        description: "テーマ、日時、議事録内容は必須項目です。",
        variant: "destructive",
      })
      return
    }

    try {
      // 議事録を保存
      const selectedTheme = themes.find((t) => t.id === selectedThemeId)

      // サマリーが生成されていない場合は生成
      if (!summary.progress && !summary.keyPoints && !summary.decisions && !summary.actions) {
        const generatedSummary = generateSummaryFromContent(rawText)
        setSummary(generatedSummary)
      }

      const newMinute = addMinute({
        themeId: selectedThemeId,
        title: selectedTheme?.name || "無題の会議",
        date,
        time,
        participants: selectedParticipants,
        content: rawText, // 議事録の内容
        sentences: parsedSentences.length > 0 ? parsedSentences : undefined,
        summary: {
          progress: summary.progress || "特記事項なし",
          keyPoints: summary.keyPoints || "特記事項なし",
          decisions: summary.decisions || "特記事項なし",
          actions: summary.actions || "特記事項なし",
        },
        status: "draft",
        author: "現在のユーザー", // 実際のアプリでは認証済みユーザー情報を使用
      })

      console.log("保存された議事録:", newMinute) // デバッグ用
      console.log("保存された議事録の内容:", rawText) // デバッグ用

      // エスカレーション情報を自動生成
      const escalations = generateEscalationsFromMinute(newMinute)
      if (escalations.length > 0) {
        // 既存のエスカレーション情報を取得
        const existingEscalations = getEscalations()

        // 新しいエスカレーション情報を追加
        const newEscalations = escalations.map((escalation) => ({
          ...escalation,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString().split("T")[0],
        }))

        // エスカレーション情報を保存
        saveEscalations([...existingEscalations, ...newEscalations])

        console.log("生成されたエスカレーション:", newEscalations) // デバッグ用

        // エスカレーションが検出された場合は通知
        toast({
          title: "エスカレーション検出",
          description: `${escalations.length}件のリスク項目が検出されました。エスカレーション画面で確認してください。`,
          variant: "warning",
        })
      }

      toast({
        title: "議事録を保存しました",
        description: "議事録が正常に保存されました。検索・履歴画面で確認できます。",
      })

      // 検索・履歴画面へ遷移
      router.push("/search")
    } catch (error) {
      console.error("Failed to save minutes:", error)
      toast({
        title: "エラー",
        description: "議事録の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  // 議事録を承認フローに送る処理
  const handleSubmitForApproval = () => {
    if (!selectedThemeId || !date || !time || !rawText.trim()) {
      toast({
        title: "入力エラー",
        description: "テーマ、日時、議事録内容は必須項目です。",
        variant: "destructive",
      })
      return
    }

    try {
      // 議事録を保存
      const selectedTheme = themes.find((t) => t.id === selectedThemeId)

      // サマリーが生成されていない場合は生成
      if (!summary.progress && !summary.keyPoints && !summary.decisions && !summary.actions) {
        const generatedSummary = generateSummaryFromContent(rawText)
        setSummary(generatedSummary)
      }

      const newMinute = addMinute({
        themeId: selectedThemeId,
        title: selectedTheme?.name || "無題の会議",
        date,
        time,
        participants: selectedParticipants,
        content: rawText,
        sentences: parsedSentences.length > 0 ? parsedSentences : undefined,
        summary: {
          progress: summary.progress || "特記事項なし",
          keyPoints: summary.keyPoints || "特記事項なし",
          decisions: summary.decisions || "特記事項なし",
          actions: summary.actions || "特記事項なし",
        },
        status: "review", // 承認フロー用にステータスを「レビュー中」に設定
        author: "現在のユーザー", // 実際のアプリでは認証済みユーザー情報を使用
      })

      // エスカレーション情報を自動生成
      const escalations = generateEscalationsFromMinute(newMinute)
      if (escalations.length > 0) {
        // 既存のエスカレーション情報を取得
        const existingEscalations = getEscalations()

        // 新しいエスカレーション情報を追加
        const newEscalations = escalations.map((escalation) => ({
          ...escalation,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString().split("T")[0],
        }))

        // エスカレーション情報を保存
        saveEscalations([...existingEscalations, ...newEscalations])

        // エスカレーションが検出された場合は通知
        toast({
          title: "エスカレーション検出",
          description: `${escalations.length}件のリスク項目が検出されました。エスカレーション画面で確認してください。`,
          variant: "warning",
        })
      }

      toast({
        title: "承認フローに送信しました",
        description: "議事録が承認フローに送信されました。",
      })

      // 承認フロー画面へ遷移
      router.push("/minutes/approval")
    } catch (error) {
      console.error("Failed to submit minutes for approval:", error)
      toast({
        title: "エラー",
        description: "議事録の承認フローへの送信に失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">議事録作成</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">基本情報入力</TabsTrigger>
          <TabsTrigger value="edit" disabled={parsedSentences.length === 0}>
            発言編集
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>会議基本情報</CardTitle>
              <CardDescription>会議の基本情報を入力してください。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">会議日</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">会議時間</Label>
                  <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">会議テーマ</Label>
                <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="テーマを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>参加者</Label>
                <div className="border rounded-md p-4">
                  {selectedThemeId ? (
                    themeParticipants.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {themeParticipants.map((participant) => (
                          <div key={participant.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`participant-${participant.id}`}
                              checked={selectedParticipants.includes(participant.id)}
                              onCheckedChange={() => toggleParticipant(participant.id)}
                            />
                            <Label htmlFor={`participant-${participant.id}`} className="font-normal">
                              {participant.name}（{participant.position}）
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-muted-foreground">
                        このテーマに登録されている参加者がいません。
                        <Link href={`/themes/${selectedThemeId}/edit`} className="ml-2 text-primary hover:underline">
                          参加者を追加する
                        </Link>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-2 text-muted-foreground">
                      テーマを選択すると、そのテーマに登録されている参加者が表示されます。
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="minutes-text">議事録原稿</Label>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDocumentSuggestionOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      ドキュメント修正提案
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleOpenAiModal}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      AIドラフト生成
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="minutes-text"
                  placeholder="議事録の原稿を入力してください。AIが発言者と役割を自動で識別します。"
                  rows={20}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  required
                  className="min-h-[calc(20*1.5rem+150px)]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                onClick={handleGenerateDraft}
                disabled={isGenerating || !rawText.trim() || !selectedThemeId || selectedParticipants.length === 0}
              >
                {isGenerating ? (
                  <>生成中...</>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    発言分離＆タグ付け
                  </>
                )}
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleSaveMinutes}>
                  <Save className="mr-2 h-4 w-4" />
                  議事録を保存
                </Button>
                <Button onClick={handleSubmitForApproval}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  議事録の承認
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>発言分離＆タグ付け編集</CardTitle>
              <CardDescription>AIが生成した発言分離とタグ付けを確認・編集してください。</CardDescription>
            </CardHeader>
            <CardContent>
              <MinutesDraftEditor
                sentences={parsedSentences}
                participants={themeParticipants}
                onSentencesChange={setParsedSentences}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("input")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                基本情報に戻る
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleSaveMinutes}>
                  <Save className="mr-2 h-4 w-4" />
                  議事録を保存
                </Button>
                <Button onClick={handleSubmitForApproval}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  議事録の承認
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <AIDraftModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onDraftGenerated={handleDraftGenerated}
        selectedParticipants={selectedParticipants}
      />

      <DocumentSuggestionModal
        open={documentSuggestionOpen}
        onOpenChange={setDocumentSuggestionOpen}
        documentText={rawText}
        onApplySuggestions={(text) => setRawText(text)}
      />
    </div>
  )
}
