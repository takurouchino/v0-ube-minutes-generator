"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Bot, User, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { getMinutes, type Minute } from "@/lib/local-storage"

// メッセージの型定義
type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function ChatPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "こんにちは！議事録アシスタントです。過去の議事録について質問があればお気軽にどうぞ。",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [minutes, setMinutes] = useState<Minute[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 議事録データの取得
  useEffect(() => {
    const storedMinutes = getMinutes()
    setMinutes(storedMinutes)
  }, [])

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // メッセージ送信処理
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // ユーザーメッセージの追加
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // 回答生成を遅延させてローディング効果を出す
    setTimeout(() => {
      try {
        const response = generateResponse(input, minutes)

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: "assistant",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Failed to generate response:", error)
        toast({
          title: "エラー",
          description: "回答の生成に失敗しました",
          variant: "destructive",
        })

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "申し訳ありません。回答の生成中にエラーが発生しました。",
          role: "assistant",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  // チャットをクリア
  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        content: "こんにちは！議事録アシスタントです。過去の議事録について質問があればお気軽にどうぞ。",
        role: "assistant",
        timestamp: new Date(),
      },
    ])
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
        <h1 className="text-3xl font-bold tracking-tight">議事録チャット</h1>
        <Button variant="ghost" size="sm" onClick={handleClearChat} className="ml-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          チャットをクリア
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>議事録アシスタント</CardTitle>
          <CardDescription>過去の議事録に基づいて質問に回答します。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 h-[60vh] overflow-y-auto p-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="flex items-start max-w-[80%]">
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src="/abstract-ai-network.png" />
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 ml-2">
                      <AvatarImage src="/abstract-geometric-shapes.png" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[80%]">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src="/abstract-ai-network.png" />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-75"></div>
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="質問を入力してください..."
              disabled={isLoading}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">送信</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

// 時間のフォーマット
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// モックの回答生成関数
function generateResponse(question: string, minutes: Minute[]): string {
  // 質問を小文字に変換して検索しやすくする
  const lowerQuestion = question.toLowerCase()

  // 特定の質問パターンに対する回答
  if (lowerQuestion.includes("直近") && lowerQuestion.includes("品質管理会議") && lowerQuestion.includes("決定")) {
    return "直近の品質管理会議では、検査工程の見直しと作業手順書の改訂が完了することが決定されました。また、月次でのフォローアップ体制を整えることも決定されました。これは社外コンサルタントからの他社事例に基づく提案を受けてのものです。"
  }

  if (
    lowerQuestion.includes("アクションアイテム") ||
    lowerQuestion.includes("次回") ||
    lowerQuestion.includes("タスク")
  ) {
    return "次回のアクションアイテムとして以下が設定されています：\n\n1. 設備メンテナンス頻度の見直しを来週までに完了する（担当：生産管理）\n2. 月次フォローアップ体制の詳細を検討する（担当：工場長）\n3. 次回会議で設備メンテナンスの完了報告と効果検証結果を共有する（担当：生産管理、品質管理）"
  }

  if (lowerQuestion.includes("不良率") || lowerQuestion.includes("改善") || lowerQuestion.includes("効果")) {
    return "検査工程の見直しと作業手順書の改訂により、不良率が15%減少したという効果が報告されています。設備メンテナンス頻度の見直しについては来週完了予定で、さらなる改善が期待されています。"
  }

  if (lowerQuestion.includes("参加者") || lowerQuestion.includes("出席者") || lowerQuestion.includes("誰")) {
    return "直近の品質管理会議の参加者は、工場長の山田太郎さんと品質管理責任者の佐藤次郎さんでした。"
  }

  if (lowerQuestion.includes("安全") || lowerQuestion.includes("衛生")) {
    return "安全衛生委員会では、新しい作業手順が安全チェックリストに基づいて確認済みであることが報告されています。具体的な安全対策については、次回の安全衛生委員会で詳細が議論される予定です。"
  }

  if (lowerQuestion.includes("他社") || lowerQuestion.includes("事例")) {
    return "社外コンサルタントから共有された他社事例では、品質改善施策において定期的なフォローアップが重要であることが強調されています。これを受けて、月次でのフォローアップ体制を整えることが決定されました。"
  }

  // 一般的な質問に対するフォールバック回答
  return "申し訳ありません。その質問に対する具体的な情報は見つかりませんでした。別の質問や、より具体的な内容について質問していただけますか？例えば「直近の品質管理会議で決定したことは？」「次回のアクションアイテムは？」などの質問に回答できます。"
}
