import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== 文字起こしテストAPI ===")

    // 環境変数の確認
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        status: "error",
        message: "OpenAI APIキーが設定されていません",
        env: {
          NODE_ENV: process.env.NODE_ENV,
          hasApiKey: false,
        },
      })
    }

    // OpenAI APIへの簡単な接続テスト
    const testResponse = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    const isApiKeyValid = testResponse.ok

    return NextResponse.json({
      status: "success",
      message: "テスト完了",
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasApiKey: true,
        apiKeyValid: isApiKeyValid,
        apiStatus: testResponse.status,
      },
    })
  } catch (error: any) {
    console.error("テストAPIエラー:", error)
    return NextResponse.json({
      status: "error",
      message: error.message,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasApiKey: !!process.env.OPENAI_API_KEY,
      },
    })
  }
}
