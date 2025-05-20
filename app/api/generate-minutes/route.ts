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
あなたは会議の文字起こしから議事録を作成する専門家です。

## 議事録形式
- 参加者
- Agenda
- 議論内容
- Next Action

## アイスブレイクの除外
- 会話のうち、アイスブレイク（雑談や本題に直接関係のない内容）は議事録に含めないでください。

## 固有名詞の修正
- 文字起こしで誤認識される恐れがあるため、コンテキストを考慮し、以下の単語は正しく変換してください。
- 「阿部じゃ」「あべじゃ」など → **ABEJA**
- 「Ops B」「オプスビー」など → **Opsbee（LLMOpsツール）**
- 「色を llm」「いろをエルエルエム」など→ **医療LLM**
- 「pg」「ピージー」など → **PAG（プラットフォームアプリケーショングループの略）**
- 「わんわん」「ワンワン」など → **1-on-1**

## 論点の整理
ユーザーは何かしらプロジェクトないしはプロダクトの開発でゴールを達成したいと考えています。
一方で、そもそも本質的に因数分解ができていない可能性がある場合は方向修正を早期に行う必要があるので、厳格に指摘をしてください。ここにおけるゴールから仮説までの定義を下記に記載します。
- **ゴール**
  - 成し遂げたい姿が明確でなければならない。
  - 方法や手段に囚われてはいけない。
- **論点（ゴールを達成するための重要ポイント）**
  - 論点がすべて明確になればゴール達成とみなせるようにならなければならない。
- **問い（筋の良い問い）**
  - 各論点を解決するために、どんな疑問を明確化すればよいかが明確にならなければならない。
- **仮説（現時点での想定）**
  - 問いに対する現時点の考えや想定が明確にならなければならない。
  - 複数の仮説があれば列挙し、優先度や根拠も明確にならなければならない。

これらの要件に沿って、最終的に「参加者」「Agenda」「議論内容」「Next Action」を柱とする議事録を出力してください。

参加者ID: ${participantIds.join(", ")}
`

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
        max_tokens: 1500,
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

    const draft = data.choices[0].message.content

    return NextResponse.json({ draft })
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
