"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wand2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AIDraftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDraftGenerated: (draft: string) => void
  selectedParticipants: string[]
}

export function AIDraftModal({ open, onOpenChange, onDraftGenerated, selectedParticipants }: AIDraftModalProps) {
  const { toast } = useToast()
  const [transcription, setTranscription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGenerateDraft = async () => {
    if (!transcription.trim()) {
      toast({
        title: "エラー",
        description: "文字起こし情報を入力してください",
        variant: "destructive",
      })
      return
    }

    if (selectedParticipants.length === 0) {
      toast({
        title: "エラー",
        description: "参加者が選択されていません",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)

    try {
      // OpenAI APIを使用して議事録を生成
      const response = await fetch("/api/generate-minutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription,
          participantIds: selectedParticipants,
        }),
      })

      // レスポンスのテキストを取得
      const responseText = await response.text()
      console.log("Response status:", response.status)

      if (responseText.length > 0) {
        console.log("Response text preview:", responseText.substring(0, 100) + "...")
      }

      // レスポンスのステータスコードを確認
      if (!response.ok) {
        // JSONとして解析できるか試みる
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(errorData.error || "議事録の生成に失敗しました")
        } catch (jsonError) {
          // JSONとして解析できない場合
          throw new Error(`議事録の生成に失敗しました: ${responseText.substring(0, 100)}`)
        }
      }

      // レスポンスをJSONとして解析
      let data
      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError)
        throw new Error(`APIからの応答をJSONとして解析できませんでした: ${responseText.substring(0, 100)}`)
      }

      if (!data || !data.draft) {
        throw new Error("APIからの応答に議事録ドラフトが含まれていません")
      }

      // 生成された議事録を親コンポーネントに渡す
      onDraftGenerated(data.draft)

      // モーダルを閉じる
      onOpenChange(false)

      toast({
        title: "議事録ドラフトを生成しました",
        description: "生成された議事録を編集できます",
      })
    } catch (error: any) {
      console.error("Failed to generate minutes:", error)
      const errorMsg = error instanceof Error ? error.message : "議事録の生成に失敗しました"
      setErrorMessage(errorMsg)
      toast({
        title: "エラー",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI議事録ドラフト生成</DialogTitle>
          <DialogDescription>
            会議の文字起こし情報を入力してください。AIが議事録のドラフトを生成します。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="会議の文字起こし情報を入力してください..."
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            rows={12}
            className="resize-none"
          />

          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラーが発生しました</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            キャンセル
          </Button>
          <Button onClick={handleGenerateDraft} disabled={isGenerating}>
            {isGenerating ? (
              <>生成中...</>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                AIドラフト生成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
