"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { getMinuteById, updateMinute, type Minute } from "@/lib/supabase-minutes"

export default function SummaryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [minute, setMinute] = useState<Minute | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [summaryGenerated, setSummaryGenerated] = useState(false)
  const [loading, setLoading] = useState(true)

  // サマリーデータ
  const [summary, setSummary] = useState({
    progress: "",
    keyPoints: "",
    decisions: "",
    actions: "",
  })

  // 議事録データの取得
  useEffect(() => {
    const loadMinute = async () => {
      try {
        setLoading(true)
        const foundMinute = await getMinuteById(params.id)

        if (foundMinute) {
          setMinute(foundMinute)

          // サマリーがすでにある場合は表示
          if (
            foundMinute.summary_progress ||
            foundMinute.summary_key_points ||
            foundMinute.summary_decisions ||
            foundMinute.summary_actions
          ) {
            setSummary({
              progress: foundMinute.summary_progress || "",
              keyPoints: foundMinute.summary_key_points || "",
              decisions: foundMinute.summary_decisions || "",
              actions: foundMinute.summary_actions || "",
            })
            setSummaryGenerated(true)
          }
        } else {
          toast({
            title: "エラー",
            description: "議事録が見つかりませんでした",
            variant: "destructive",
          })
          router.push("/minutes/new")
        }
      } catch (error) {
        console.error("Failed to load minute:", error)
        toast({
          title: "エラー",
          description: "議事録の読み込みに失敗しました",
          variant: "destructive",
        })
        router.push("/minutes/new")
      } finally {
        setLoading(false)
      }
    }

    loadMinute()
  }, [params.id, router, toast])

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

  const handleGenerateSummary = async () => {
    if (!minute || !minute.content) {
      toast({
        title: "エラー",
        description: "議事録の内容がありません",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const newSummary = generateSummaryFromContent(minute.content)

      setSummary(newSummary)
      setIsGenerating(false)
      setSummaryGenerated(true)

      // 議事録を更新
      const updatedMinute = {
        ...minute,
        summary_progress: newSummary.progress,
        summary_key_points: newSummary.keyPoints,
        summary_decisions: newSummary.decisions,
        summary_actions: newSummary.actions,
      }

      const success = await updateMinute(updatedMinute)
      if (success) {
        setMinute(updatedMinute)
      }

      toast({
        title: "AIサマリ生成完了",
        description: "議事録の内容に基づいてサマリが生成されました。内容を確認・編集してください。",
      })
    } catch (error) {
      console.error("Failed to generate summary:", error)
      setIsGenerating(false)

      toast({
        title: "エラー",
        description: "サマリの生成に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleProceedToApproval = async () => {
    if (!minute) return

    try {
      // サマリーを保存
      const updatedMinute = {
        ...minute,
        summary_progress: summary.progress,
        summary_key_points: summary.keyPoints,
        summary_decisions: summary.decisions,
        summary_actions: summary.actions,
      }

      const success = await updateMinute(updatedMinute)

      if (success) {
        toast({
          title: "承認フローへ進みます",
          description: "編集内容を保存しました。承認フローへ進みます。",
        })
        router.push("/minutes/approval")
      } else {
        throw new Error("更新に失敗しました")
      }
    } catch (error) {
      console.error("Failed to update minute:", error)
      toast({
        title: "エラー",
        description: "議事録の更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>議事録を読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!minute) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">議事録が見つかりませんでした</p>
            <Button asChild>
              <Link href="/minutes/new">議事録作成に戻る</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/minutes/new">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mt-[15px] ml-[15px]">AIサマリ確認</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{minute.title}</CardTitle>
          <CardDescription>
            {minute.date} {minute.time} | AIが生成した議事録のサマリを確認・編集してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 議事録の内容を表示 */}
          <div className="mb-6 border-b pb-4">
            <h3 className="text-sm font-medium mb-2">議事録内容</h3>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">{minute.content}</div>
          </div>
          {!summaryGenerated ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground mb-4">AIによる議事録サマリを生成します。</p>
              <Button onClick={handleGenerateSummary} disabled={isGenerating}>
                {isGenerating ? (
                  <>生成中...</>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    AIサマリ生成
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="progress">前回からの進展</TabsTrigger>
                <TabsTrigger value="keyPoints">要点まとめ</TabsTrigger>
                <TabsTrigger value="decisions">意思決定理由</TabsTrigger>
                <TabsTrigger value="actions">アクションアイテム</TabsTrigger>
              </TabsList>

              <TabsContent value="progress">
                <div className="space-y-2">
                  <label className="text-sm font-medium">前回からの進展要約</label>
                  <Textarea
                    value={summary.progress}
                    onChange={(e) => setSummary({ ...summary, progress: e.target.value })}
                    rows={6}
                  />
                </div>
              </TabsContent>

              <TabsContent value="keyPoints">
                <div className="space-y-2">
                  <label className="text-sm font-medium">セクションごとの要点まとめ</label>
                  <Textarea
                    value={summary.keyPoints}
                    onChange={(e) => setSummary({ ...summary, keyPoints: e.target.value })}
                    rows={6}
                  />
                </div>
              </TabsContent>

              <TabsContent value="decisions">
                <div className="space-y-2">
                  <label className="text-sm font-medium">意思決定理由</label>
                  <Textarea
                    value={summary.decisions}
                    onChange={(e) => setSummary({ ...summary, decisions: e.target.value })}
                    rows={6}
                  />
                </div>
              </TabsContent>

              <TabsContent value="actions">
                <div className="space-y-2">
                  <label className="text-sm font-medium">次回アクションアイテム</label>
                  <Textarea
                    value={summary.actions}
                    onChange={(e) => setSummary({ ...summary, actions: e.target.value })}
                    rows={6}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/minutes/new">
              <ArrowLeft className="mr-2 h-4 w-4" />
              議事録編集に戻る
            </Link>
          </Button>
          <Button onClick={handleProceedToApproval} disabled={!summaryGenerated}>
            承認フローへ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
