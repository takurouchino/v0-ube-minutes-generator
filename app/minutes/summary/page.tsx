"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function SummaryPage() {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [summaryGenerated, setSummaryGenerated] = useState(false)

  // モックデータ
  const [summary, setSummary] = useState({
    progress: "",
    keyPoints: "",
    decisions: "",
    actions: "",
  })

  const handleGenerateSummary = () => {
    setIsGenerating(true)

    // モック：AIによるサマリ生成処理をシミュレート
    setTimeout(() => {
      setSummary({
        progress:
          "前回の品質管理会議で決定した不良率低減策のうち、検査工程の見直しと作業手順書の改訂が完了し、不良率が15%減少した。設備メンテナンス頻度の見直しは来週完了予定。",
        keyPoints:
          "1. 検査工程の見直しと作業手順書の改訂により不良率15%減少\n2. 設備メンテナンス頻度の見直しは調整中\n3. 新しい作業手順は安全チェックリストに基づいて確認済み\n4. 他社事例では定期的なフォローアップが重要",
        decisions:
          "月次でのフォローアップ体制を整えることが決定された。これは、社外コンサルタントからの他社事例に基づく提案を受けてのものである。",
        actions:
          "1. 設備メンテナンス頻度の見直しを来週までに完了する（担当：生産管理）\n2. 月次フォローアップ体制の詳細を検討する（担当：工場長）\n3. 次回会議で設備メンテナンスの完了報告と効果検証結果を共有する（担当：生産管理、品質管理）",
      })

      setIsGenerating(false)
      setSummaryGenerated(true)

      toast({
        title: "AIサマリ生成完了",
        description: "議事録のサマリが生成されました。内容を確認・編集してください。",
      })
    }, 2000)
  }

  const handleProceedToApproval = () => {
    // 次のステップ（承認フロー）へ進む
    toast({
      title: "承認フローへ進みます",
      description: "編集内容を保存しました。承認フローへ進みます。",
    })

    // 実際のアプリケーションでは、ここで承認フロー画面へ遷移
    window.location.href = "/minutes/approval"
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
        <h1 className="text-3xl font-bold tracking-tight">AIサマリ確認</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>議事録サマリ</CardTitle>
          <CardDescription>AIが生成した議事録のサマリを確認・編集してください。</CardDescription>
        </CardHeader>
        <CardContent>
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
