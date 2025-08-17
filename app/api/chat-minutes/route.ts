import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// AIチャット用の軽量な議事録データ取得（キャッシュ付き）
const minutesCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分間キャッシュ

async function getMinutesForChat(companyId: string, limit: number = 20) {
  // キャッシュチェック
  const cacheKey = `${companyId}-${limit}`
  const cached = minutesCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("Using cached minutes data")
    return cached.data
  }

  try {
    // 必要最小限のデータのみ取得
    const { data, error } = await supabase
      .from("minutes")
      .select(`
        id,
        title,
        date,
        time,
        content,
        summary_progress,
        summary_key_points,
        summary_decisions,
        summary_actions,
        keywords,
        status,
        author,
        participant_details:minute_participants(
          participant:participants(name, position)
        )
      `)
      .eq("company_id", companyId)
      .order("date", { ascending: false })
      .limit(limit) // 最新のN件のみ取得

    if (error) throw error

    // データを軽量化
    const formattedData = (data || []).map((minute: any) => ({
      id: minute.id,
      title: minute.title || "無題の議事録",
      date: minute.date,
      time: minute.time,
      content: minute.content || "",
      summary_progress: minute.summary_progress || "",
      summary_key_points: minute.summary_key_points || "",
      summary_decisions: minute.summary_decisions || "",
      summary_actions: minute.summary_actions || "",
      keywords: minute.keywords || [],
      status: minute.status,
      author: minute.author,
      participant_details: minute.participant_details
        ?.filter((pd: any) => pd.participant)
        .map((pd: any) => ({
          name: pd.participant.name,
          position: pd.participant.position || "役職不明"
        })) || []
    }))

    // キャッシュに保存
    minutesCache.set(cacheKey, {
      data: formattedData,
      timestamp: Date.now()
    })

    return formattedData
  } catch (error) {
    console.error("Error fetching minutes for chat:", error)
    return []
  }
}

export async function POST(request: Request) {
  try {
    const { question, companyId } = await request.json()

    if (!question) {
      return NextResponse.json({ error: "質問は必須です" }, { status: 400 })
    }
    if (!companyId) {
      return NextResponse.json({ error: "会社IDは必須です" }, { status: 400 })
    }

    // APIキーを環境変数から取得
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI APIキーが設定されていません" }, { status: 500 })
    }

    // APIキーの形式を簡易チェック
    if (!apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "無効なAPIキー形式です。OpenAI APIキーは'sk-'で始まる必要があります" },
        { status: 400 },
      )
    }

    // 最適化された議事録データを取得（AIチャット用）
    const minutes = await getMinutesForChat(companyId)

    if (!minutes || minutes.length === 0) {
      return NextResponse.json({
        response: "申し訳ありません。現在、議事録データが見つかりません。議事録を作成してから再度お試しください。",
      })
    }

        // 議事録データを文字列形式に変換
    const minutesContext = minutes
      .map((minute: any) => {
        const participants =
          minute.participant_details?.map((p: any) => `${p.name}（${p.position || "役職不明"}）`).join("、") ||
          "参加者情報なし"

        return `
議事録ID: ${minute.id}
タイトル: ${minute.title}
日付: ${minute.date}
時間: ${minute.time}
参加者: ${participants}
内容: ${minute.content || "内容なし"}
進捗: ${minute.summary_progress || "進捗情報なし"}
重要ポイント: ${minute.summary_key_points || "重要ポイントなし"}
決定事項: ${minute.summary_decisions || "決定事項なし"}
アクションアイテム: ${minute.summary_actions || "アクションアイテムなし"}
キーワード: ${minute.keywords?.join("、") || "キーワードなし"}
ステータス: ${minute.status}
作成者: ${minute.author || "不明"}
承認者: ${minute.approver || "未承認"}
---`
      })
      .join("\n")

    // プロンプトの作成
    const prompt = `
あなたは議事録アシスタントです。以下の議事録データベースの情報を基に、ユーザーの質問に正確で有用な回答を提供してください。

## 議事録データベース:
${minutesContext}

## 回答ガイドライン:
1. 質問に最も関連する議事録情報を特定してください
2. 具体的な日付、参加者、内容を含めて回答してください
3. 複数の議事録が関連する場合は、最新のものを優先してください
4. 情報が見つからない場合は、その旨を明確に伝えてください
5. 回答は日本語で、丁寧で分かりやすい形式で提供してください
6. 議事録のタイトルや日付を【】で囲んで強調してください

## ユーザーの質問:
${question}

上記の議事録データを参照して、質問に対する適切な回答を提供してください。
`

    console.log("Sending request to OpenAI API for chat response...")

    // OpenAI APIをストリーミングで呼び出し
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // より高速なモデルを使用
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: question,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        stream: true,  // ストリーミングを有効化
      }),
    })

    if (!response.ok) {
      let errorMessage = "OpenAI API error"

      try {
        const errorData = await response.json()
        console.error("OpenAI API error details:", errorData)

        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message
        }
      } catch (e) {
        console.error("Failed to parse error response:", e)
      }

      // より具体的なエラーメッセージを返す
      if (response.status === 401) {
        return NextResponse.json({ error: "認証エラー: APIキーが無効です" }, { status: 401 })
      } else if (response.status === 429) {
        return NextResponse.json({ error: "レート制限エラー: APIリクエストの制限に達しました" }, { status: 429 })
      } else {
        return NextResponse.json({ error: `OpenAI APIエラー: ${errorMessage}` }, { status: response.status })
      }
    }

    // ストリーミングレスポンスを返す
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // JSON解析エラーは無視
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error("Error in chat-minutes route:", error)
    return NextResponse.json(
      {
        error: `サーバーエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      },
      { status: 500 },
    )
  }
}
