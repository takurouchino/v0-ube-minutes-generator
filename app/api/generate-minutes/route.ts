import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { transcription, participantIds } = await request.json()

    if (!transcription || !participantIds) {
      return NextResponse.json({ error: "文字起こし情報と参加者IDは必須です" }, { status: 400 })
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

    // プロンプトの作成
    const prompt = `
あなたは会議の文字起こしから議事録を作成し、さらに重要な発言を抽出・タグ付けする専門家です。

# 1. 議事録ドラフトを作成してください。
- 参加者
- Agenda
- 議論内容
- Next Action
の構成でまとめてください。

# 2. 議事録ドラフト全文から、重要な発言（センテンス）をピックアップし、
- 担当者（参加者リストから最も適切な人物を推測）
- 重要度（高・中・低から推測）
- 発言種類（ToDo/報告/決定/課題/提案/その他から推測）
を付与してJSONで出力してください。

## 出力形式
{
  "draft": "...生成された議事録ドラフト...",
  "sentences": [
    {
      "id": "1",
      "text": "重要な発言内容",
      "speaker": "推測した担当者名（またはID）",
      "role": "発言種類（ToDo/報告/決定/課題/提案/その他）",
      "importance": "高|中|低"
    },
    ...
  ]
}

# 入力
- 文字起こし全文:
${transcription}
- 参加者リスト: ${participantIds.join(", ")}

# 注意事項
- 必ず有効なJSONのみで出力してください。
- センテンスは**最低5件以上**、できるだけ全体をまんべんなく分割して抽出してください。
- 担当者が不明な場合はnullまたは空文字でOKです。
`;

    console.log("Sending request to OpenAI API with prompt:", prompt.substring(0, 50) + "...")

    // OpenAI APIを直接呼び出し
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
            content: prompt,
          },
          {
            role: "user",
            content: transcription,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
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

    const data = await response.json()
    console.log("Received response from OpenAI API")

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json({ error: "OpenAI APIからの応答形式が無効です" }, { status: 500 })
    }

    console.log("AI raw response:", data.choices[0].message.content);
    let draft = ""
    let sentences: any[] = []
    try {
      const parsed = JSON.parse(data.choices[0].message.content)
      draft = parsed.draft || ""
      sentences = parsed.sentences || []
    } catch (e) {
      draft = data.choices[0].message.content || ""
      // draftを5文に分割して仮センテンス生成
      const split = draft.split(/\n|。|\.|\!|\?/).filter(s => s.trim()).slice(0, 5)
      sentences = split.map((text, i) => ({
        id: String(i + 1),
        text,
        speaker: "",
        role: "",
        importance: "中"
      }))
    }
    return NextResponse.json({ draft, sentences })
  } catch (error) {
    console.error("Error in generate-minutes route:", error)
    return NextResponse.json(
      {
        error: `サーバーエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      },
      { status: 500 },
    )
  }
}
