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
import { ArrowLeft, Wand2, Save, RefreshCw, ListTodo, ClipboardList, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { MinutesDraftEditor } from "./minutes-draft-editor"
import {
  getThemes,
  getParticipantsByTheme,
  getParticipants,
  type Theme,
  type Participant,
} from "@/lib/supabase-storage"
import { saveMinute as addMinute, extractKeywords } from "@/lib/supabase-minutes"
import { AIDraftModal } from "@/components/ai-draft-modal"
import { saveMinuteSentences } from "@/lib/supabase-sentences"
import { generateAndSaveEscalations } from "@/lib/supabase-escalations"
import { TodoManagementModal } from "@/components/todo-management-modal"
import { useAuth } from "@/lib/auth-context" // 認証コンテキストをインポート
import { generateSummaryFromContent, validateMinutesInput, saveMinutesWithAllRelatedData } from "@/lib/minutes-utils"

// LocalStorageのキー
const DRAFT_STORAGE_KEY = "minutes-draft"

// ドラフトデータの型
type DraftData = {
  date: string
  time: string
  selectedThemeId: string
  rawText: string
  selectedParticipants: string[]
  summary: {
    progress: string
    keyPoints: string
    decisions: string
    actions: string
  }
  parsedSentences: any[]
  activeTab: string
}

// 時間をデータベース形式に変換する関数
function formatTimeForDatabase(timeString: string): string {
  if (!timeString || timeString.trim() === "") {
    return "00:00:00" // デフォルト値
  }

  try {
    // HH:MM 形式の場合（標準的なHTML time inputの出力形式）
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      // 時間と分を抽出
      const [hours, minutes] = timeString.split(":").map((part) => part.padStart(2, "0"))
      return `${hours}:${minutes}:00` // 秒を00として追加
    }

    // HH:MM:SS 形式の場合（既にデータベース形式）
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) {
      // 時間、分、秒を抽出して正規化
      const [hours, minutes, seconds] = timeString.split(":").map((part) => part.padStart(2, "0"))
      return `${hours}:${minutes}:${seconds}`
    }

    // その他の形式の場合、パースを試みる
    if (timeString.includes(":")) {
      const parts = timeString.split(":").map((part) => part.trim().padStart(2, "0"))
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}:00`
      }
    }

    // パースに失敗した場合はデフォルト値
    console.warn(`不正な時間形式: ${timeString}、デフォルト値を使用します`)
    return "00:00:00"
  } catch (error) {
    console.error(`時間形式の変換中にエラーが発生しました: ${error}`)
    return "00:00:00"
  }
}

export default function NewMinutesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile } = useAuth() // 認証情報を取得
  const companyId = userProfile?.company_id // ユーザーのcompany_idを取得

  const [activeTab, setActiveTab] = useState("input")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [selectedThemeId, setSelectedThemeId] = useState("")
  const [rawText, setRawText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [parsedSentences, setParsedSentences] = useState<any[]>([])
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [todoModalOpen, setTodoModalOpen] = useState(false)
  const [newMinute, setNewMinute] = useState<any | null>(null)
  const [authError, setAuthError] = useState(false) // 認証エラー状態
  const [isSaving, setIsSaving] = useState(false)

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

  // ドラフトデータをLocalStorageに保存
  const saveDraft = () => {
    const draftData: DraftData = {
      date,
      time,
      selectedThemeId,
      rawText,
      selectedParticipants,
      summary,
      parsedSentences,
      activeTab,
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
  }

  // ドラフトデータをLocalStorageから読み込み
  const loadDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        const draftData: DraftData = JSON.parse(savedDraft)
        setDate(draftData.date || "")
        setTime(draftData.time || "")
        setSelectedThemeId(draftData.selectedThemeId || "")
        setRawText(draftData.rawText || "")
        setSelectedParticipants(draftData.selectedParticipants || [])
        setSummary(draftData.summary || { progress: "", keyPoints: "", decisions: "", actions: "" })
        setParsedSentences(draftData.parsedSentences || [])
        setActiveTab(draftData.activeTab || "input")
        return true
      }
    } catch (error) {
      console.error("Failed to load draft:", error)
    }
    return false
  }

  // ドラフトデータをクリア
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    setDate("")
    setTime("")
    setSelectedThemeId("")
    setRawText("")
    setSelectedParticipants([])
    setSummary({ progress: "", keyPoints: "", decisions: "", actions: "" })
    setParsedSentences([])
    setActiveTab("input")
    setNewMinute(null)
    toast({
      title: "新規議事録作成",
      description: "新しい議事録の作成を開始しました",
    })
  }

  // テーマと参加者データの取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // 認証情報がない場合はエラー状態を設定
        if (!companyId) {
          console.error("認証情報がありません。ログインしてください。")
          setAuthError(true)
          setLoading(false)
          return
        }

        // companyIdを渡してテーマと参加者を取得
        const storedThemes = await getThemes(companyId)
        const storedParticipants = await getParticipants(companyId)

        setThemes(storedThemes)
        setAllParticipants(storedParticipants)

        // ドラフトデータを読み込み
        loadDraft()
      } catch (error) {
        console.error("Failed to load themes and participants:", error)
        toast({
          title: "エラー",
          description: "テーマと参加者の読み込みに失敗しました",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast, companyId])

  // 入力値が変更されたときにドラフトを保存
  useEffect(() => {
    if (!loading) {
      saveDraft()
    }
  }, [date, time, selectedThemeId, rawText, selectedParticipants, summary, parsedSentences, activeTab, loading])

  // テーマが選択されたときに参加者を更新
  useEffect(() => {
    const loadThemeParticipants = async () => {
      if (selectedThemeId && companyId) {
        try {
          const participants = await getParticipantsByTheme(selectedThemeId, companyId)
          setThemeParticipants(participants)
          // デフォルトですべての参加者を選択
          setSelectedParticipants(participants.map((p) => p.id))
        } catch (error) {
          console.error("Failed to load theme participants:", error)
          setThemeParticipants([])
          setSelectedParticipants([])
        }
      } else {
        setThemeParticipants([])
        setSelectedParticipants([])
      }
    }

    loadThemeParticipants()
  }, [selectedThemeId, companyId])

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
  const handleDraftGenerated = (draft: string, sentences: any[]) => {
    setRawText(draft)
    // 型を明示的に正規化
    const normalized = (sentences || []).map((s, i) => ({
      id: s.id || String(i + 1),
      text: s.text || "",
      speaker: s.speaker || "",
      role: s.role || "",
      importance: s.importance || "中"
    }))
    setParsedSentences(normalized)
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
      await handleGenerateSummary()

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

  // サマリー生成処理
  const handleGenerateSummary = async () => {
    if (!rawText.trim()) return
    setIsGeneratingSummary(true)
    try {
      const newSummary = generateSummaryFromContent(rawText)
      setSummary(newSummary)
      toast({
        title: "サマリ生成完了",
        description: "議事録の内容に基づいてサマリが生成されました。",
      })
    } catch (error) {
      console.error("Failed to generate summary:", error)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // 議事録保存共通処理
  const handleSaveMinutesCommon = async (afterSave?: (savedMinute: any) => void) => {
    setIsSaving(true)
    try {
      const safeCompanyId = companyId || ""
      const errorMsg = validateMinutesInput({ selectedThemeId, date, time, rawText, selectedParticipants, companyId: safeCompanyId })
      if (errorMsg) {
        toast({ title: "入力エラー", description: errorMsg, variant: "destructive" })
        return
      }
      // サマリーが未生成なら生成
      let currentSummary = summary
      if (!summary.progress && !summary.keyPoints && !summary.decisions && !summary.actions) {
        currentSummary = generateSummaryFromContent(rawText)
        setSummary(currentSummary)
      }
      // --- ここからUUID変換 ---
      const sentencesWithUUID = parsedSentences.map((s) => {
        // speakerがUUIDならそのまま、そうでなければname→id変換
        const participant = themeParticipants.find((p) => p.id === s.speaker || p.name === s.speaker)
        return {
          ...s,
          participant_id: participant ? participant.id : s.speaker, // UUIDが見つかればid、なければ元値
        }
      })
      // 保存一括処理
      const savedMinute = await saveMinutesWithAllRelatedData({
        selectedThemeId,
        date,
        time: formatTimeForDatabase(time),
        rawText,
        summary: currentSummary,
        selectedParticipants,
        themes,
        parsedSentences: sentencesWithUUID, // ここでUUID化した配列を渡す
        companyId: safeCompanyId,
        author: "現在のユーザー",
      })
      if (!savedMinute) throw new Error("議事録の保存に失敗しました")
      setNewMinute(savedMinute)
      clearDraft()
      toast({
        title: "議事録を保存しました",
        description: `議事録${parsedSentences.length > 0 ? "と発言データ" : ""}が正常に保存されました。検索・履歴画面で確認できます。`,
      })
      if (afterSave) afterSave(savedMinute)
      router.push("/search")
    } catch (error) {
      console.error("Failed to save minutes:", error)
      toast({ title: "エラー", description: "議事録の保存に失敗しました", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // 旧handleSaveMinutes
  const handleSaveMinutes = () => handleSaveMinutesCommon()
  // 旧handleSaveMinutesForTodo
  const handleSaveMinutesForTodo = () => handleSaveMinutesCommon(() => setTodoModalOpen(true))

  // 認証エラーの場合はログインを促す
  if (authError) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center h-[50vh] gap-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>認証が必要です</CardTitle>
            <CardDescription>この機能を使用するにはログインが必要です。</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              ログインして会社情報を設定すると、議事録の作成や管理ができるようになります。
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">ログイン</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center h-[50vh]">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto relative pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight mt-[15px] ml-[15px]">議事録作成</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>会議基本情報</CardTitle>
          <CardDescription>会議の基本情報を入力してください。入力内容は自動的に保存されます。</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 1カラム: 会議日・時間・テーマ・参加者 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                会議日 <span className="text-red-500">*</span>
              </Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">
                会議時間 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value)
                  // 入力値をログに出力して確認
                  console.log("時間入力値:", e.target.value)
                  console.log("変換後:", formatTimeForDatabase(e.target.value))
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                形式: HH:MM (例: 14:30) - データベースには HH:MM:00 形式で保存されます
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">
                会議テーマ <span className="text-red-500">*</span>
              </Label>
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
          </div>
          {/* 2カラム: 議事録原稿ラベル以降 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* 左: 議事録原稿入力欄 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="minutes-text">
                  議事録原稿 <span className="text-red-500">*</span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={handleOpenAiModal}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  AIドラフト生成
                </Button>
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
            {/* 右: 発言分離＆タグ付け編集 */}
            <div className="space-y-2">
              <CardTitle className="text-lg">発言分離＆タグ付け情報</CardTitle>
              <MinutesDraftEditor
                sentences={parsedSentences}
                participants={themeParticipants}
                onSentencesChange={setParsedSentences}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveMinutes} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            議事録を保存
          </Button>
        </CardFooter>
      </Card>
      <AIDraftModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onDraftGenerated={handleDraftGenerated}
        selectedParticipants={selectedParticipants}
      />
      <TodoManagementModal
        open={todoModalOpen}
        onOpenChange={setTodoModalOpen}
        minuteId={newMinute?.id || ""}
        minuteContent={rawText}
        participants={themeParticipants}
        onTodosSaved={() => {
          toast({
            title: "ToDo登録完了",
            description: "アクションアイテムがToDo管理に登録されました",
          })
          setTodoModalOpen(false)
        }}
      />
    </div>
  )
}
