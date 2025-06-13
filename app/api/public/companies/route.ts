import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// 公開APIとして会社一覧を取得するエンドポイント
export async function GET() {
  try {
    // サービスロールを使用して会社データを取得（RLSをバイパス）
    const { data, error } = await supabase.from("companies").select("id, name, slug").order("name")

    if (error) {
      console.error("会社データ取得エラー:", error)
      return NextResponse.json({ error: "会社データの取得に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ companies: data })
  } catch (error) {
    console.error("予期しないエラー:", error)
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
