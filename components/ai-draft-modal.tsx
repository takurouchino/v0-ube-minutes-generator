"use client"

import type React from "react"

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
import { Upload, FileAudio, Loader2, TestTube } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

interface AIDraftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDraftGenerated: (draft: string, sentences: any[]) => void
  selectedParticipants: string[]
}

export function AIDraftModal({ open, onOpenChange, onDraftGenerated, selectedParticipants }: AIDraftModalProps) {
  const { toast } = useToast()
  const [transcription, setTranscription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [activeTab, setActiveTab] = useState("text")
  const [isTesting, setIsTesting] = useState(false)

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch("/api/test-transcribe")
      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "接続テスト成功",
          description: `OpenAI API接続: ${data.env.apiKeyValid ? "正常" : "エラー"}`,
        })
      } else {
        toast({
          title: "接続テストエラー",
          description: data.message,
          variant: "destructive",
        })
      }

      console.log("接続テスト結果:", data)
    } catch (error) {
      toast({
        title: "接続テストエラー",
        description: "テストAPIへの接続に失敗しました",
        variant: "destructive",
      })
      console.error("接続テストエラー:", error)
    } finally {
      setIsTesting(false)
    }
  }

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log("ファイルが選択されました:", file.name, file.type, file.size)

      // ファイル拡張子をチェック
      const allowedExtensions = [".mp3", ".mp4", ".wav", ".m4a"]
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

      if (!allowedExtensions.includes(fileExtension)) {
        toast({
          title: "エラー",
          description: "MP3、MP4、WAV、M4Aファイルのみサポートしています",
          variant: "destructive",
        })
        return
      }

      // ファイルサイズをチェック（25MB制限）
      const maxSize = 25 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: "エラー",
          description: "ファイルサイズは25MB以下にしてください",
          variant: "destructive",
        })
        return
      }

      setAudioFile(file)
      setErrorMessage(null) // エラーメッセージをクリア
    }
  }

  const handleTranscribeAudio = async () => {
    if (!audioFile) {
      toast({
        title: "エラー",
        description: "音声ファイルを選択してください",
        variant: "destructive",
      })
      return
    }

    setIsTranscribing(true)
    setErrorMessage(null)

    try {
      console.log("=== 文字起こし開始 ===")
      console.log("ファイル:", audioFile.name, audioFile.type, audioFile.size)

      const formData = new FormData()
      formData.append("audio", audioFile)

      console.log("APIリクエスト送信中...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2分でタイムアウト

      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("APIレスポンス受信:", response.status, response.statusText)

      const responseText = await response.text()
      console.log("レスポンステキスト長:", responseText.length)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage

          if (errorData.details && process.env.NODE_ENV === "development") {
            console.error("エラー詳細:", errorData.details)
          }
        } catch (parseError) {
          console.error("エラーレスポンスのJSON解析に失敗:", parseError)
          errorMessage = `${errorMessage}\n詳細: ${responseText.substring(0, 200)}`
        }

        throw new Error(errorMessage)
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("成功レスポンスのJSON解析に失敗:", parseError)
        console.error("レスポンステキスト:", responseText)
        throw new Error("サーバーからの応答を解析できませんでした")
      }

      if (!data.transcription) {
        throw new Error("文字起こし結果が取得できませんでした")
      }

      console.log("文字起こし成功:", data.transcription.length, "文字")

      setTranscription(data.transcription)
      setActiveTab("text") // テキストタブに切り替え

      toast({
        title: "文字起こし完了",
        description: `${data.transcription.length}文字の文字起こしが完了しました`,
      })
    } catch (error: any) {
      console.error("=== 文字起こしエラー ===")
      console.error("エラー:", error)

      let errorMsg = "音声の文字起こしに失敗しました"

      if (error.name === "AbortError") {
        errorMsg = "文字起こしがタイムアウトしました。ファイルサイズを小さくするか、時間を置いて再試行してください。"
      } else if (error instanceof Error) {
        errorMsg = error.message
      }

      setErrorMessage(errorMsg)

      toast({
        title: "文字起こしエラー",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsTranscribing(false)
    }
  }

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
      onDraftGenerated(data.draft, data.sentences)

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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">テキスト入力</TabsTrigger>
              <TabsTrigger value="audio">音声アップロード</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4">
              <Textarea
                placeholder="会議の文字起こし情報を入力してください..."
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                rows={12}
                className="resize-none"
              />
            </TabsContent>

            <TabsContent value="audio" className="mt-4">
              <div className="space-y-4">
                {/* 接続テストボタン */}
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTesting}>
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        テスト中...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        接続テスト
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileAudio className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      MP3、MP4、WAV、M4Aファイルをアップロードしてください（最大25MB）
                    </p>
                    <input
                      type="file"
                      accept=".mp3,.mp4,.wav,.m4a,audio/mp3,audio/mpeg,video/mp4,audio/mp4,audio/wav,audio/m4a"
                      onChange={handleAudioUpload}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          ファイルを選択
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {audioFile && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{audioFile.name}</p>
                        <p className="text-sm text-gray-600">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <Button onClick={handleTranscribeAudio} disabled={isTranscribing}>
                        {isTranscribing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            文字起こし中...
                          </>
                        ) : (
                          "文字起こし開始"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {transcription && (
                  <div className="mt-4">
                    <Label>文字起こし結果</Label>
                    <Textarea
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      rows={8}
                      className="mt-2"
                      placeholder="文字起こし結果がここに表示されます..."
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラーが発生しました</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating || isTranscribing}>
            キャンセル
          </Button>
          <Button onClick={handleGenerateDraft} disabled={isGenerating || isTranscribing || !transcription.trim()}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
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
