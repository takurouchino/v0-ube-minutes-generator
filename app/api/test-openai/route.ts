import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST() {
  try {
    // OpenAI APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY環境変数が設定されていません" }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // 簡単なテストリクエストを送信
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hello" }],
      model: "gpt-3.5-turbo",
      max_tokens: 5,
    })

    if (completion.choices && completion.choices.length > 0) {
      return NextResponse.json({
        success: true,
        message: "OpenAI APIとの接続に成功しました",
        model: completion.model,
        usage: completion.usage,
      })
    } else {
      return NextResponse.json({ error: "OpenAI APIからの応答が不正です" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("OpenAI API接続テストエラー:", error)

    if (error?.status === 401) {
      return NextResponse.json(
        { error: "OpenAI APIキーが無効です。正しいAPIキーを設定してください。" },
        { status: 401 },
      )
    }

    if (error?.status === 429) {
      return NextResponse.json({ error: "OpenAI APIの利用制限に達しています。" }, { status: 429 })
    }

    return NextResponse.json({ error: `OpenAI API接続エラー: ${error.message}` }, { status: 500 })
  }
}
