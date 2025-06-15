import { supabase } from "./supabase"

// ToDo項目の型定義
export type Todo = {
  id: string
  minute_id: string
  title: string
  description: string | null
  assignee_id: string | null
  assignee_name: string | null
  due_date: string | null
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  category: string | null
  extracted_from_text: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  completed_by: string | null
  // 関連データ
  minute_title?: string
  minute_date?: string
  assignee_details?: {
    name: string
    position: string | null
    role: string | null
  }
}

// 議事録からToDo項目を自動抽出
export async function extractTodosFromMinute(
  minuteId: string,
  content: string,
  participants: Array<{ id: string; name: string; position: string; role: string }>,
): Promise<
  Array<{
    title: string
    description: string
    assignee_name: string | null
    due_date: string | null
    priority: "low" | "medium" | "high" | "urgent"
    category: string
    extracted_from_text: string
  }>
> {
  try {
    // APIキーを環境変数から取得
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OpenAI APIキーが設定されていません")
    }

    // 参加者情報を文字列に変換
    const participantsInfo = participants.map((p) => `${p.name}（${p.position}・${p.role}）`).join("、")

    // プロンプトの作成
    const prompt = `
あなたは議事録からアクションアイテム（ToDo）を抽出する専門家です。
以下の議事録内容から、具体的なアクションアイテムを抽出し、JSON形式で出力してください。

議事録内容:
${content}

参加者情報:
${participantsInfo}

以下のJSON形式で結果を出力してください:
{
  "todos": [
    {
      "title": "アクションアイテムのタイトル（簡潔に）",
      "description": "詳細な説明",
      "assignee_name": "担当者名（参加者情報から推測、不明な場合はnull）",
      "due_date": "期日（YYYY-MM-DD形式、不明な場合はnull）",
      "priority": "優先度（low/medium/high/urgent）",
      "category": "カテゴリ（action_item/follow_up/decision_required/report）",
      "extracted_from_text": "元となった議事録の該当箇所"
    }
  ]
}

抽出ルール:
1. 「〜する」「〜を行う」「〜を確認する」「〜を報告する」などの動作を含む文を特定
2. 「次回まで」「来週まで」「月末まで」などの期限表現から期日を推測
3. 「緊急」「至急」「重要」などの表現から優先度を判定
4. 担当者が明示されている場合は参加者情報から正確な名前を特定
5. 曖昧な表現は含めず、具体的なアクションのみを抽出
6. 必ず有効なJSONのみで回答し、説明文は含めない
`

    // OpenAI APIを呼び出し
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "あなたは議事録からアクションアイテムを抽出する専門家です。必ず有効なJSONのみで回答してください。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content_response = data.choices[0].message.content

    let parsedContent
    try {
      parsedContent = JSON.parse(content_response)
    } catch (error) {
      console.error("Failed to parse JSON from OpenAI response:", content_response)
      throw new Error("OpenAI APIからの応答をJSONとして解析できませんでした")
    }

    return parsedContent.todos || []
  } catch (error) {
    console.error("Error extracting todos:", error)
    throw error
  }
}

// ToDo項目をSupabaseに保存
export async function saveTodos(
  minuteId: string,
  todos: Array<{
    title: string
    description: string
    assignee_name: string | null
    due_date: string | null
    priority: "low" | "medium" | "high" | "urgent"
    category: string
    extracted_from_text: string
  }>,
  participants: Array<{ id: string; name: string }>,
  companyId: string, // company_id を引数として追加
): Promise<boolean> {
  try {
    if (!companyId) {
      console.error("Company ID is missing.")
      return false
    }

    // 担当者名からIDを解決
    const todosWithAssigneeId = todos.map((todo) => {
      let assignee_id = null
      if (todo.assignee_name) {
        const assignee = participants.find((p) => p.name === todo.assignee_name)
        assignee_id = assignee?.id || null
      }

      return {
        minute_id: minuteId,
        title: todo.title,
        description: todo.description,
        assignee_id,
        assignee_name: todo.assignee_name,
        due_date: todo.due_date,
        priority: todo.priority,
        status: "pending" as const,
        category: todo.category,
        extracted_from_text: todo.extracted_from_text,
        company_id: companyId, // company_id を追加
      }
    })

    const { error } = await supabase.from("todos").insert(todosWithAssigneeId)

    if (error) {
      console.error("Failed to save todos:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error saving todos:", error)
    return false
  }
}

// ToDo一覧の取得
export async function getTodos(companyId: string): Promise<Todo[]> {
  try {
    if (!companyId) {
      console.error("Company ID is missing.")
      return []
    }

    const { data, error } = await supabase
      .from("todos")
      .select(`
        *,
        minutes:minute_id (title, date),
        participants:assignee_id (name, position, role)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch todos:", error)
      throw error
    }

    return (data || []).map((item: any) => ({
      id: item.id as string,
      minute_id: item.minute_id as string,
      title: item.title as string,
      description: item.description as string | null,
      assignee_id: item.assignee_id as string | null,
      assignee_name: item.assignee_name as string | null,
      due_date: item.due_date as string | null,
      priority: item.priority as "low" | "medium" | "high" | "urgent",
      status: item.status as "pending" | "in_progress" | "completed" | "cancelled",
      category: item.category as string | null,
      extracted_from_text: item.extracted_from_text as string | null,
      created_at: item.created_at as string,
      updated_at: item.updated_at as string,
      completed_at: item.completed_at as string | null,
      completed_by: item.completed_by as string | null,
      minute_title: item.minutes?.title as string | undefined,
      minute_date: item.minutes?.date as string | undefined,
      assignee_details: item.participants
        ? {
            name: item.participants.name as string,
            position: item.participants.position as string | null,
            role: item.participants.role as string | null,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Error fetching todos:", error)
    return []
  }
}

// 特定の議事録のToDo一覧を取得
export async function getTodosByMinute(minuteId: string, companyId: string): Promise<Todo[]> {
  try {
    if (!companyId) {
      console.error("Company ID is missing.")
      return []
    }

    const { data, error } = await supabase
      .from("todos")
      .select(`
        *,
        minutes:minute_id (title, date),
        participants:assignee_id (name, position, role)
      `)
      .eq("minute_id", minuteId)
      .eq("company_id", companyId) // company_idでフィルタリング
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch todos by minute:", error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      minute_id: item.minute_id,
      title: item.title,
      description: item.description,
      assignee_id: item.assignee_id,
      assignee_name: item.assignee_name,
      due_date: item.due_date,
      priority: item.priority,
      status: item.status,
      category: item.category,
      extracted_from_text: item.extracted_from_text,
      created_at: item.created_at,
      updated_at: item.updated_at,
      completed_at: item.completed_at,
      completed_by: item.completed_by,
      minute_title: item.minutes?.title,
      minute_date: item.minutes?.date,
      assignee_details: item.participants
        ? {
            name: item.participants.name,
            position: item.participants.position,
            role: item.participants.role,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Error fetching todos by minute:", error)
    return []
  }
}

// ToDo項目の更新
export async function updateTodo(todo: Partial<Todo> & { id: string }, companyId: string): Promise<boolean> {
  try {
    if (!companyId) {
      console.error("Company ID is missing.")
      return false
    }

    const { error } = await supabase
      .from("todos")
      .update({
        title: todo.title,
        description: todo.description,
        assignee_id: todo.assignee_id,
        assignee_name: todo.assignee_name,
        due_date: todo.due_date,
        priority: todo.priority,
        status: todo.status,
        category: todo.category,
        completed_at: todo.status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", todo.id)
      .eq("company_id", companyId) // company_idでフィルタリング

    if (error) {
      console.error("Failed to update todo:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error updating todo:", error)
    return false
  }
}

// ToDo項目の削除
export async function deleteTodo(todoId: string, companyId: string): Promise<boolean> {
  try {
    if (!companyId) {
      console.error("Company ID is missing.")
      return false
    }

    const { error } = await supabase.from("todos").delete().eq("id", todoId).eq("company_id", companyId) // company_idでフィルタリング

    if (error) {
      console.error("Failed to delete todo:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error deleting todo:", error)
    return false
  }
}

// ステータス別のToDo統計を取得
export async function getTodoStats(companyId: string): Promise<{
  total: number
  pending: number
  in_progress: number
  completed: number
  overdue: number
}> {
  try {
    if (!companyId) {
      console.error("Company ID is missing.")
      return {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0,
      }
    }

    const { data, error } = await supabase.from("todos").select("status, due_date").eq("company_id", companyId) // company_idでフィルタリング

    if (error) {
      console.error("Failed to fetch todo stats:", error)
      throw error
    }

    const today = new Date().toISOString().split("T")[0]
    const stats = {
      total: data?.length || 0,
      pending: data?.filter((t) => t.status === "pending").length || 0,
      in_progress: data?.filter((t) => t.status === "in_progress").length || 0,
      completed: data?.filter((t) => t.status === "completed").length || 0,
      overdue: data?.filter((t) => t.status !== "completed" && t.due_date && t.due_date < today).length || 0,
    }

    return stats
  } catch (error) {
    console.error("Error fetching todo stats:", error)
    return {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    }
  }
}
