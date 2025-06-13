"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestOpenAIPage() {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const testOpenAIConnection = async () => {
    setIsTestingConnection(true)
    setConnectionResult(null)

    try {
      const response = await fetch("/api/test-openai", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setConnectionResult({
          success: true,
          message: data.message || "OpenAI APIとの接続に成功しました",
        })
      } else {
        setConnectionResult({
          success: false,
          message: data.error || "OpenAI APIとの接続に失敗しました",
        })
      }
    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: `接続テストエラー: ${error.message}`,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>OpenAI API接続テスト</CardTitle>
            <CardDescription>OpenAI APIとの接続状況を確認します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testOpenAIConnection} disabled={isTestingConnection} className="w-full">
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  接続テスト中...
                </>
              ) : (
                "OpenAI API接続テスト"
              )}
            </Button>

            {connectionResult && (
              <Alert variant={connectionResult.success ? "default" : "destructive"}>
                {connectionResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>{connectionResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>確認項目:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>OPENAI_API_KEY環境変数の設定</li>
                <li>OpenAI APIへの接続可能性</li>
                <li>APIキーの有効性</li>
                <li>利用制限の確認</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
