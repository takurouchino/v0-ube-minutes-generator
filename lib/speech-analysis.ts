// 発言者と発言内容を抽出する関数
interface SpeakerData {
  name: string
  characterCount: number
  messageCount: number
}

// 文字起こしデータから発言者と発言量を抽出する
export function analyzeSpeech(transcription: string): SpeakerData[] {
  if (!transcription || transcription.trim() === "") {
    return []
  }

  // 発言者パターンを検出するための正規表現
  // 「名前:」または「名前：」の形式を検出
  const speakerPattern = /^([^:：]+)[：:]/gm

  // 発言者ごとのデータを格納するオブジェクト
  const speakerMap = new Map<string, SpeakerData>()

  // 行ごとに処理
  const lines = transcription.split("\n")
  let currentSpeaker = ""

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine === "") continue

    // 発言者を検出
    const match = trimmedLine.match(/^([^:：]+)[：:]/)

    if (match) {
      // 新しい発言者を検出
      currentSpeaker = match[1].trim()
      // 発言内容（「名前:」の後の部分）
      const content = trimmedLine.substring(match[0].length).trim()

      // 発言者のデータを更新または作成
      if (speakerMap.has(currentSpeaker)) {
        const data = speakerMap.get(currentSpeaker)!
        data.characterCount += content.length
        data.messageCount += 1
      } else {
        speakerMap.set(currentSpeaker, {
          name: currentSpeaker,
          characterCount: content.length,
          messageCount: 1,
        })
      }
    } else if (currentSpeaker && trimmedLine) {
      // 前の発言者の続き
      if (speakerMap.has(currentSpeaker)) {
        const data = speakerMap.get(currentSpeaker)!
        data.characterCount += trimmedLine.length
      }
    }
  }

  // Map から配列に変換
  return Array.from(speakerMap.values())
}

// 発言量の合計を計算
export function getTotalCharacterCount(speakerData: SpeakerData[]): number {
  return speakerData.reduce((total, speaker) => total + speaker.characterCount, 0)
}

// 発言率を計算（パーセンテージ）
export function calculatePercentages(speakerData: SpeakerData[]): number[] {
  const total = getTotalCharacterCount(speakerData)
  if (total === 0) return []

  return speakerData.map((speaker) => Math.round((speaker.characterCount / total) * 100))
}
