import { type NextRequest, NextResponse } from "next/server"
import { extractTodosFromMinute, saveTodos } from "@/lib/supabase-todos"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { minuteId, minuteContent, participants, action } = body

    if (!minuteId || !minuteContent || !participants) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 })
    }

    if (action === "extract") {
      // ToDo抽出のみ
      const todos = await extractTodosFromMinute(minuteId, minuteContent, participants)
      return NextResponse.json({ todos })
    } else if (action === "save") {
      // ToDo保存
      const { todos } = body
      if (!todos || !Array.isArray(todos)) {
        return NextResponse.json({ error: "保存するToDoデータが不正です" }, { status: 400 })
      }

      const success = await saveTodos(minuteId, todos, participants)
      return NextResponse.json({ success })
    } else {
      return NextResponse.json({ error: "無効なアクションです" }, { status: 400 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "サーバーエラーが発生しました" },
      { status: 500 },
    )
  }
}
