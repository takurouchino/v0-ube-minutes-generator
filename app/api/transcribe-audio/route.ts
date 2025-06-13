import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("=== 音声文字起こしAPI開始 ===")

  try {
    // OpenAI APIキーの確認
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OpenAI APIキーが設定されていません")
      return NextResponse.json(
        { error: "OpenAI APIキーが設定されていません。環境変数OPENAI_API_KEYを確認してください。" },
        { status: 500 },
      )
    }

    console.log("OpenAI APIキーが設定されています")

    // フォームデータを取得
    let formData: FormData
    try {
      formData = await request.formData()
      console.log("フォームデータを取得しました")
    } catch (error) {
      console.error("フォームデータの取得に失敗:", error)
      return NextResponse.json({ error: "フォームデータの取得に失敗しました" }, { status: 400 })
    }

    const file = formData.get("audio") as File | null

    if (!file) {
      console.error("音声ファイルが提供されていません")
      return NextResponse.json({ error: "音声ファイルが提供されていません。" }, { status: 400 })
    }

    console.log(`受信したファイル: ${file.name}, サイズ: ${file.size} bytes, タイプ: ${file.type}`)

    // ファイル形式をチェック
    const allowedExtensions = [".mp3", ".mp4", ".wav", ".m4a"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!allowedExtensions.includes(fileExtension)) {
      console.error(`サポートされていないファイル形式: ${fileExtension}`)
      return NextResponse.json({ error: "MP3、MP4、WAV、M4Aファイルのみサポートしています" }, { status: 400 })
    }

    // ファイルサイズをチェック（25MB制限）
    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      console.error(`ファイルサイズが制限を超えています: ${file.size} bytes`)
      return NextResponse.json({ error: "ファイルサイズは25MB以下にしてください" }, { status: 400 })
    }

    console.log("ファイル検証完了")

    // OpenAI Whisper APIに送信するFormDataを作成
    const whisperFormData = new FormData()
    whisperFormData.append("file", file)
    whisperFormData.append("model", "whisper-1")
    whisperFormData.append("language", "ja")
    whisperFormData.append("response_format", "text")
    whisperFormData.append("temperature", "0.0")

    console.log("OpenAI Whisper APIにリクエスト送信中...")

    // OpenAI Whisper APIにリクエスト
    let whisperResponse: Response
    try {
      whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperFormData,
      })

      console.log(`Whisper APIレスポンス: ${whisperResponse.status} ${whisperResponse.statusText}`)
    } catch (fetchError: any) {
      console.error("Whisper APIへのリクエストに失敗:", fetchError)
      return NextResponse.json({ error: `OpenAI APIへの接続に失敗しました: ${fetchError.message}` }, { status: 500 })
    }

    // レスポンスを処理
    let transcriptionText: string
    try {
      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text()
        console.error("Whisper APIエラー:", whisperResponse.status, errorText)

        if (whisperResponse.status === 401) {
          return NextResponse.json({ error: "OpenAI APIキーが無効です。設定を確認してください。" }, { status: 401 })
        }

        if (whisperResponse.status === 429) {
          return NextResponse.json(
            { error: "OpenAI APIの利用制限に達しました。しばらく待ってから再試行してください。" },
            { status: 429 },
          )
        }

        return NextResponse.json(
          { error: `OpenAI APIエラー (${whisperResponse.status}): ${errorText}` },
          { status: whisperResponse.status },
        )
      }

      transcriptionText = await whisperResponse.text()
      console.log("Whisper APIから文字起こし結果を受信しました")
    } catch (responseError: any) {
      console.error("Whisper APIレスポンスの処理に失敗:", responseError)
      return NextResponse.json(
        { error: `OpenAI APIレスポンスの処理に失敗しました: ${responseError.message}` },
        { status: 500 },
      )
    }

    // 文字起こし結果を検証
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      console.error("文字起こし結果が空です")
      return NextResponse.json(
        { error: "音声ファイルから文字起こしを生成できませんでした。音声が明瞭でない可能性があります。" },
        { status: 400 },
      )
    }

    const cleanedTranscription = transcriptionText.trim()
    console.log(`文字起こし完了: ${cleanedTranscription.length} 文字`)

    return NextResponse.json({
      transcription: cleanedTranscription,
      originalLength: cleanedTranscription.length,
      success: true,
    })
  } catch (error: any) {
    console.error("=== 予期しないエラーが発生 ===")
    console.error("エラーの詳細:", error)
    console.error("エラーメッセージ:", error?.message)
    console.error("エラースタック:", error?.stack)

    return NextResponse.json(
      {
        error: `文字起こし処理中に予期しないエラーが発生しました: ${error?.message || "不明なエラー"}`,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 },
    )
  }
}
