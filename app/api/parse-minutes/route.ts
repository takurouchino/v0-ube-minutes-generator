import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { rawText, participants } = await request.json()

    if (!rawText || !participants || participants.length === 0) {
      return NextResponse.json({ error: "議事録原稿と参加者情報は必須です" }, { status: 400 })
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

    // 参加者情報を文字列に変換
    const participantsInfo = participants
      .map((p) => `ID: ${p.id}, 名前: ${p.name}, 役職: ${p.position}, 役割: ${p.role}`)
      .join("\n")

    // プロンプトの作成
    const prompt = `
あなたは会議の議事録から発言を分離し、発言者と役割を特定する専門家です。
以下の議事録原稿から、発言を分離し、最も適切な発言者と役割を特定してください。

議事録原稿:
${rawText}

参加者情報:
${participantsInfo}

以下のJSON形式で結果を出力してください:
{
"sentences": [
  {
    "id": "1",
    "text": "発言内容",
    "speaker": "参加者ID",
    "role": "参加者の役割"
  },
  {
    "id": "2", 
    "text": "発言内容",
    "speaker": "参加者ID",
    "role": "参加者の役割"
  }
]
}

注意事項:
1. 各発言には必ず参加者IDと役割を割り当ててください
2. 発言内容は原文のニュアンスを保持してください
3. 発言が明確に区切れない場合は、適切な単位で分割してください
4. 参加者情報に基づいて、最も適切な発言者を推測してください
5. 役割は参加者情報の「役割」を使用してください
6. 必ず上記のJSON形式で出力してください
7. JSON以外の文字は一切含めないでください
`

    console.log("Sending request to OpenAI API for parsing minutes")

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
            content:
              "あなたは会議の議事録から発言を分離し、発言者と役割を特定する専門家です。必ず有効なJSONのみで回答してください。説明文や追加のテキストは一切含めないでください。",
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
      let errorMessage = "OpenAI API error"

      try {
        const errorData = await response.json()
        console.error("OpenAI API error details:", errorData)

        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message
        }
      } catch (e) {
        console.error("Failed to parse error response:", e)
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }

      // より具体的なエラーメッセージを返す
      if (response.status === 401) {
        return NextResponse.json({ error: "認証エラー: APIキーが無効です" }, { status: 401 })
      } else if (response.status === 429) {
        return NextResponse.json({ error: "レート制限エラー: APIリクエストの制限に達しました" }, { status: 429 })
      } else if (response.status === 400) {
        return NextResponse.json({ error: "リクエストエラー: 入力内容を確認してください" }, { status: 400 })
      } else {
        return NextResponse.json({ error: `OpenAI APIエラー: ${errorMessage}` }, { status: response.status })
      }
    }

    // レスポンスをテキストとして取得
    const responseText = await response.text()
    console.log("Raw response from OpenAI:", responseText.substring(0, 200) + "...")

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", responseText)
      return NextResponse.json(
        {
          error: "OpenAI APIからの応答をJSONとして解析できませんでした。APIの応答形式が予期しない形式です。",
        },
        { status: 500 },
      )
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid OpenAI response structure:", data)
      return NextResponse.json({ error: "OpenAI APIからの応答形式が無効です" }, { status: 500 })
    }

    // レスポンスからJSONを抽出
    const content = data.choices[0].message.content
    console.log("Response content:", content.substring(0, 200) + "...")

    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch (jsonError) {
      console.error("Failed to parse JSON from OpenAI response:", content)

      // JSONの修復を試みる
      try {
        // 一般的なJSON修復パターン
        let cleanedContent = content.trim()

        // マークダウンのコードブロックを削除
        cleanedContent = cleanedContent.replace(/```json\s*/g, "").replace(/```\s*/g, "")

        // 先頭と末尾の不要な文字を削除
        cleanedContent = cleanedContent.replace(/^[^{]*/, "").replace(/[^}]*$/, "")

        parsedContent = JSON.parse(cleanedContent)
        console.log("Successfully repaired JSON")
      } catch (repairError) {
        console.error("Failed to repair JSON:", repairError)
        return NextResponse.json(
          {
            error: "OpenAI APIからの応答をJSONとして解析できませんでした。応答内容を確認してください。",
          },
          { status: 500 },
        )
      }
    }

    // sentences配列が存在するか確認
    if (!parsedContent.sentences || !Array.isArray(parsedContent.sentences)) {
      console.error("Invalid sentences structure:", parsedContent)
      return NextResponse.json(
        {
          error: "OpenAI APIからの応答に有効な発言データが含まれていません",
        },
        { status: 500 },
      )
    }

    const sentences = parsedContent.sentences

    // 各発言にIDが設定されていない場合は自動生成
    const processedSentences = sentences.map((sentence, index) => ({
      id: sentence.id || (index + 1).toString(),
      text: sentence.text || "",
      speaker: sentence.speaker || null,
      role: sentence.role || "一般参加者",
    }))

    console.log(`Successfully parsed ${processedSentences.length} sentences`)

    return NextResponse.json({ sentences: processedSentences })
  } catch (error) {
    console.error("Error in parse-minutes route:", error)
    return NextResponse.json(
      {
        error: `サーバーエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      },
      { status: 500 },
    )
  }
}
