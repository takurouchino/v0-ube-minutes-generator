// 議事録の内容からサマリーを生成
export function generateSummaryFromContent(content: string) {
  const lines = content.split("\n").filter((line) => line.trim().length > 0)
  const progressLines = lines.filter(
    (line) =>
      line.includes("進展") ||
      line.includes("進捗") ||
      line.includes("完了") ||
      line.includes("達成") ||
      line.includes("減少") ||
      line.includes("増加"),
  )
  const keyPointLines = lines.filter(
    (line) =>
      line.includes("重要") ||
      line.includes("ポイント") ||
      line.includes("確認") ||
      line.includes("検査") ||
      line.includes("見直し"),
  )
  const decisionLines = lines.filter(
    (line) => line.includes("決定") || line.includes("決議") || line.includes("合意") || line.includes("体制"),
  )
  const actionLines = lines.filter(
    (line) =>
      line.includes("アクション") ||
      line.includes("タスク") ||
      line.includes("担当") ||
      line.includes("次回") ||
      line.includes("完了する") ||
      line.includes("実施する"),
  )
  const progress =
    progressLines.length > 0
      ? progressLines.join("\n")
      : content.includes("不良率")
        ? "検査工程の見直しと作業手順書の改訂により、不良率が改善されました。"
        : "前回からの進展について議論されました。"
  const keyPoints =
    keyPointLines.length > 0
      ? keyPointLines.map((line, index) => `${index + 1}. ${line.trim()}`).join("\n")
      : content
          .split(".")
          .slice(0, 3)
          .map((sentence, index) => `${index + 1}. ${sentence.trim()}`)
          .join("\n")
  const decisions =
    decisionLines.length > 0
      ? decisionLines.join("\n")
      : content.includes("決定")
        ? "会議で議論された内容に基づいて、必要な対応策を実施することが決定されました。"
        : "特に決定事項はありませんでした。"
  const actions =
    actionLines.length > 0
      ? actionLines.map((line, index) => `${index + 1}. ${line.trim()}`).join("\n")
      : content.includes("次回")
        ? "1. 次回会議で進捗を報告する\n2. 必要な対応策を検討する"
        : "1. 議事録を共有する\n2. 次回会議の準備を行う"
  return {
    progress,
    keyPoints,
    decisions,
    actions,
  }
}

// 入力バリデーション
export function validateMinutesInput({ selectedThemeId, date, time, rawText, selectedParticipants, companyId }: {
  selectedThemeId: string,
  date: string,
  time: string,
  rawText: string,
  selectedParticipants: string[],
  companyId?: string,
}) {
  if (!selectedThemeId) return "テーマを選択してください。"
  if (!date) return "会議日を入力してください。"
  if (!time || time.trim() === "") return "会議時間を入力してください。"
  if (!rawText.trim()) return "議事録内容を入力してください。"
  if (!selectedParticipants || selectedParticipants.length === 0) return "参加者を選択してください。"
  if (!companyId) return "ログインしてください。"
  return null
}

// 議事録保存＋発言分離＋エスカレーション一括処理
import { extractKeywords, saveMinute as addMinute } from "./supabase-minutes"
import { saveMinuteSentences } from "./supabase-sentences"
import { generateAndSaveEscalations } from "./supabase-escalations"
import { saveTodos } from "./supabase-todos"

export async function saveMinutesWithAllRelatedData({
  selectedThemeId,
  date,
  time,
  rawText,
  summary,
  selectedParticipants,
  themes,
  parsedSentences,
  companyId,
  author = "現在のユーザー",
}: {
  selectedThemeId: string,
  date: string,
  time: string,
  rawText: string,
  summary: { progress: string; keyPoints: string; decisions: string; actions: string },
  selectedParticipants: string[],
  themes: any[],
  parsedSentences: any[],
  companyId: string,
  author?: string,
}) {
  const selectedTheme = themes.find((t) => t.id === selectedThemeId)
  const keywords = extractKeywords(rawText, summary)
  const savedMinute = await addMinute(
    {
      theme_id: selectedThemeId,
      title: selectedTheme?.name || "無題の会議",
      date,
      time,
      content: rawText,
      summary_progress: summary.progress || "特記事項なし",
      summary_key_points: summary.keyPoints || "特記事項なし",
      summary_decisions: summary.decisions || "特記事項なし",
      summary_actions: summary.actions || "特記事項なし",
      keywords,
      status: "draft",
      author,
      participants: selectedParticipants,
    },
    companyId,
  )
  let minuteId: string | null = null
  if (typeof savedMinute === "string") {
    minuteId = savedMinute
  } else if (savedMinute && typeof savedMinute === "object" && "id" in savedMinute && typeof savedMinute.id === "string") {
    minuteId = savedMinute.id
  }
  // 発言分離データ保存
  if (parsedSentences.length > 0 && minuteId) {
    const sentencesToSave = parsedSentences.map((sentence: any, index: number) => ({
      participant_id: /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(sentence.speaker) ? sentence.speaker : null,
      sentence_text: sentence.text,
      role_tag: sentence.role || null,
      sentence_order: index + 1,
    }))
    await saveMinuteSentences(minuteId, sentencesToSave, companyId)

    // ToDoカテゴリ付きセンテンスのみtodosに登録
    const todoSentences = parsedSentences.filter((s: any) => s.role === "ToDo")
    if (todoSentences.length > 0) {
      const todosToSave = todoSentences.map((s: any) => ({
        minute_sentence_id: /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(s.id) ? s.id : null,
        title: s.text.substring(0, 30), // 仮: 先頭30文字をタイトルに
        description: s.text,
        assignee_name: null, // 必要に応じてs.speakerから取得
        due_date: null, // 必要に応じて拡張
        priority: "medium",
        category: "ToDo",
        extracted_from_text: s.text,
      }))
      await saveTodos(minuteId, todosToSave, [], companyId)
    }
  }
  // エスカレーション保存
  if (minuteId) {
    await generateAndSaveEscalations(
      minuteId,
      selectedTheme?.name || null,
      rawText,
      date,
      companyId,
    )
  }
  return savedMinute
} 