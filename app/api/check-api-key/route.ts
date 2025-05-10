import { NextResponse } from "next/server"

export async function GET() {
  // 環境変数からAPIキーを取得
  const apiKey = process.env.OPENAI_API_KEY

  // APIキーが存在するかどうかを確認
  const hasApiKey = !!apiKey

  // APIキーが存在する場合は、そのキーを返す
  // 存在しない場合は、空の文字列を返す
  return NextResponse.json({
    hasApiKey,
    apiKey: hasApiKey ? apiKey : "",
  })
}
