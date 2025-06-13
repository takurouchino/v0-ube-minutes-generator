"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>("未確認")
  const [tableStatus, setTableStatus] = useState<string>("未確認")
  const [testing, setTesting] = useState(false)

  const testConnection = async () => {
    setTesting(true)

    try {
      // 1. 基本的な接続テスト
      console.log("Testing Supabase connection...")
      const { data: connectionTest, error: connectionError } = await supabase
        .from("participants")
        .select("count", { count: "exact", head: true })

      if (connectionError) {
        console.error("Connection error:", connectionError)
        setConnectionStatus(`エラー: ${connectionError.message}`)
        setTableStatus("テーブルアクセス不可")
      } else {
        setConnectionStatus("接続成功")
        setTableStatus(`テーブル確認済み (${connectionTest?.length || 0}件)`)
      }

      // 2. 環境変数の確認
      console.log("Environment variables check:")
      console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定")
      console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定")

      // 3. テーブル構造の確認
      const { data: tableInfo, error: tableError } = await supabase.from("participants").select("*").limit(1)

      console.log("Table structure test:", { tableInfo, tableError })
    } catch (error) {
      console.error("Test failed:", error)
      setConnectionStatus(`テストエラー: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Supabase接続テスト</CardTitle>
        <CardDescription>データベース接続の状態を確認します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>接続状態:</strong> {connectionStatus}
        </div>
        <div>
          <strong>テーブル状態:</strong> {tableStatus}
        </div>
        <Button onClick={testConnection} disabled={testing}>
          {testing ? "テスト中..." : "再テスト"}
        </Button>
      </CardContent>
    </Card>
  )
}
