import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { transcription, prompt, apiKey } = await request.json()

    if (!transcription || !prompt || !apiKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // APIキーの形式を簡易チェック
    if (!apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Invalid API key format. OpenAI API keys should start with 'sk-'" },
        { status: 400 },
      )
    }

    console.log("Sending request to OpenAI API with prompt:", prompt.substring(0, 50) + "...")

    // Call OpenAI API with improved error handling
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

      // Return more specific error messages
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
      return NextResponse.json({ error: "Invalid response format from OpenAI API" }, { status: 500 })
    }

    const summary = data.choices[0].message.content

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Error in generate-summary route:", error)
    return NextResponse.json(
      {
        error: `サーバーエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      },
      { status: 500 },
    )
  }
}
