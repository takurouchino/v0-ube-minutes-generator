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
import { useAuth } from "@/lib/auth-context"

// メッセージの型定義
type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function ChatPage() {
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const companyId = userProfile?.company_id || ""
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "こんにちは！AI議事録アシスタントです。過去の議事録について何でもお聞きください。自然な言葉で質問していただけます。",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // メッセージ送信処理
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return
    if (!companyId) {
      toast({
        title: "会社IDが必要です",
        description: "会社IDが取得できません。ログイン状態を確認してください。",
        variant: "destructive",
      })
      return
    }

    // ユーザーメッセージの追加
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // AI APIを呼び出し
      const response = await fetch("/api/chat-minutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentInput,
          companyId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "APIエラーが発生しました")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to generate response:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "回答の生成に失敗しました",
        variant: "destructive",
      })

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "申し訳ありません。回答の生成中にエラーが発生しました。しばらく時間をおいて再度お試しください。",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // チャットをクリア
  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        content:
          "こんにちは！AI議事録アシスタントです。過去の議事録について何でもお聞きください。自然な言葉で質問していただけます。",
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight mt-[15px] ml-[15px]">AI議事録チャット</h1>
        <Button variant="ghost" size="sm" onClick={handleClearChat}>
          <RefreshCw className="mr-2 h-4 w-4" />
          チャットをクリア
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI議事録アシスタント</CardTitle>
          <CardDescription>
            AIが過去の議事録を分析して質問に回答します。自然な言葉で何でもお聞きください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendMessage} className="flex flex-col gap-2 mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="質問を入力..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
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
                    <div className="text-xs text-muted-foreground mt-1">AIが回答を生成中...</div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p className="mb-2">💡 質問例：</p>
        <ul className="list-disc list-inside space-y-1">
          <li>「最新の会議で決まったことは何ですか？」</li>
          <li>「品質改善に関する議論はありましたか？」</li>
          <li>「田中さんが参加した会議の内容を教えて」</li>
          <li>「来週までに完了すべきタスクはありますか？」</li>
          <li>「不良率について話し合われた内容は？」</li>
        </ul>
      </div>
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
