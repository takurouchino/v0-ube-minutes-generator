"use client"

import { supabase } from "./supabase"

// 議事録の型定義
export type Minute = {
  id: string
  theme_id: string | null
  title: string
  date: string
  time: string
  content: string | null
  summary_progress: string | null
  summary_key_points: string | null
  summary_decisions: string | null
  summary_actions: string | null
  keywords: string[] | null
  status: string
  author: string | null
  approver: string | null
  participants: string[] // 参加者IDの配列（結合データ）
  participant_details?: Array<{ id: string; name: string; position: string; role: string }> // 参加者の詳細情報
  created_at?: string
  updated_at?: string
}

// 議事録の取得（参加者の詳細情報も含む）
export async function getMinutes(): Promise<Minute[]> {
  try {
    // 議事録と参加者の関連を取得
    const { data: minutes, error: minutesError } = await supabase
      .from("minutes")
      .select("*")
      .order("date", { ascending: false })

    if (minutesError) throw minutesError

    // 各議事録の参加者IDと詳細情報を取得
    const minutesWithParticipants = await Promise.all(
      minutes.map(async (minute) => {
        const { data: minuteParticipants, error: participantError } = await supabase
          .from("minute_participants")
          .select(`
            participant_id,
            participants (
              id,
              name,
              position,
              role
            )
          `)
          .eq("minute_id", minute.id)

        if (participantError) throw participantError

        const participantIds = minuteParticipants.map((mp) => mp.participant_id)
        const participantDetails = minuteParticipants.map((mp: any) => ({
          id: mp.participants.id,
          name: mp.participants.name,
          position: mp.participants.position || "",
          role: mp.participants.role || "",
        }))

        return {
          id: minute.id,
          theme_id: minute.theme_id,
          title: minute.title,
          date: minute.date,
          time: minute.time,
          content: minute.content,
          summary_progress: minute.summary_progress,
          summary_key_points: minute.summary_key_points,
          summary_decisions: minute.summary_decisions,
          summary_actions: minute.summary_actions,
          keywords: minute.keywords,
          status: minute.status,
          author: minute.author,
          approver: minute.approver,
          participants: participantIds,
          participant_details: participantDetails,
          created_at: minute.created_at,
          updated_at: minute.updated_at,
        }
      }),
    )

    return minutesWithParticipants
  } catch (error) {
    console.error("Error fetching minutes:", error)
    return []
  }
}

// 議事録の追加
export async function addMinute(minute: {
  theme_id: string
  title: string
  date: string
  time: string
  content: string
  summary_progress?: string
  summary_key_points?: string
  summary_decisions?: string
  summary_actions?: string
  keywords?: string[]
  status?: string
  author?: string
  participants: string[]
}): Promise<Minute | null> {
  try {
    // 議事録を追加
    const { data: newMinute, error: minuteError } = await supabase
      .from("minutes")
      .insert({
        theme_id: minute.theme_id,
        title: minute.title,
        date: minute.date,
        time: minute.time,
        content: minute.content,
        summary_progress: minute.summary_progress,
        summary_key_points: minute.summary_key_points,
        summary_decisions: minute.summary_decisions,
        summary_actions: minute.summary_actions,
        keywords: minute.keywords || [],
        status: minute.status || "draft",
        author: minute.author,
      })
      .select()
      .single()

    if (minuteError) throw minuteError

    // 参加者との関連を追加
    if (minute.participants.length > 0) {
      const participantRelations = minute.participants.map((participantId) => ({
        minute_id: newMinute.id,
        participant_id: participantId,
      }))

      const { error: relationError } = await supabase.from("minute_participants").insert(participantRelations)

      if (relationError) throw relationError
    }

    // 参加者の詳細情報を取得
    const { data: participantDetails, error: detailsError } = await supabase
      .from("participants")
      .select("id, name, position, role")
      .in("id", minute.participants)

    if (detailsError) throw detailsError

    return {
      id: newMinute.id,
      theme_id: newMinute.theme_id,
      title: newMinute.title,
      date: newMinute.date,
      time: newMinute.time,
      content: newMinute.content,
      summary_progress: newMinute.summary_progress,
      summary_key_points: newMinute.summary_key_points,
      summary_decisions: newMinute.summary_decisions,
      summary_actions: newMinute.summary_actions,
      keywords: newMinute.keywords,
      status: newMinute.status,
      author: newMinute.author,
      approver: newMinute.approver,
      participants: minute.participants,
      participant_details: participantDetails.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position || "",
        role: p.role || "",
      })),
      created_at: newMinute.created_at,
      updated_at: newMinute.updated_at,
    }
  } catch (error) {
    console.error("Error adding minute:", error)
    return null
  }
}

// 議事録の更新
export async function updateMinute(minute: Minute): Promise<boolean> {
  try {
    // 議事録を更新
    const { error: minuteError } = await supabase
      .from("minutes")
      .update({
        theme_id: minute.theme_id,
        title: minute.title,
        date: minute.date,
        time: minute.time,
        content: minute.content,
        summary_progress: minute.summary_progress,
        summary_key_points: minute.summary_key_points,
        summary_decisions: minute.summary_decisions,
        summary_actions: minute.summary_actions,
        keywords: minute.keywords,
        status: minute.status,
        author: minute.author,
        approver: minute.approver,
      })
      .eq("id", minute.id)

    if (minuteError) throw minuteError

    // 既存の参加者関連を削除
    const { error: deleteError } = await supabase.from("minute_participants").delete().eq("minute_id", minute.id)

    if (deleteError) throw deleteError

    // 新しい参加者関連を追加
    if (minute.participants.length > 0) {
      const participantRelations = minute.participants.map((participantId) => ({
        minute_id: minute.id,
        participant_id: participantId,
      }))

      const { error: relationError } = await supabase.from("minute_participants").insert(participantRelations)

      if (relationError) throw relationError
    }

    return true
  } catch (error) {
    console.error("Error updating minute:", error)
    return false
  }
}

// 議事録の削除
export async function deleteMinute(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("minutes").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting minute:", error)
    return false
  }
}

// IDで議事録を取得
export async function getMinuteById(id: string): Promise<Minute | null> {
  try {
    const { data: minute, error: minuteError } = await supabase.from("minutes").select("*").eq("id", id).single()

    if (minuteError) throw minuteError

    // 参加者IDと詳細情報を取得
    const { data: minuteParticipants, error: participantError } = await supabase
      .from("minute_participants")
      .select(`
        participant_id,
        participants (
          id,
          name,
          position,
          role
        )
      `)
      .eq("minute_id", minute.id)

    if (participantError) throw participantError

    const participantIds = minuteParticipants.map((mp) => mp.participant_id)
    const participantDetails = minuteParticipants.map((mp: any) => ({
      id: mp.participants.id,
      name: mp.participants.name,
      position: mp.participants.position || "",
      role: mp.participants.role || "",
    }))

    return {
      id: minute.id,
      theme_id: minute.theme_id,
      title: minute.title,
      date: minute.date,
      time: minute.time,
      content: minute.content,
      summary_progress: minute.summary_progress,
      summary_key_points: minute.summary_key_points,
      summary_decisions: minute.summary_decisions,
      summary_actions: minute.summary_actions,
      keywords: minute.keywords,
      status: minute.status,
      author: minute.author,
      approver: minute.approver,
      participants: participantIds,
      participant_details: participantDetails,
      created_at: minute.created_at,
      updated_at: minute.updated_at,
    }
  } catch (error) {
    console.error("Error fetching minute by id:", error)
    return null
  }
}

// テーマIDで議事録を取得
export async function getMinutesByTheme(themeId: string): Promise<Minute[]> {
  try {
    const { data: minutes, error: minutesError } = await supabase
      .from("minutes")
      .select("*")
      .eq("theme_id", themeId)
      .order("date", { ascending: false })

    if (minutesError) throw minutesError

    // 各議事録の参加者IDと詳細情報を取得
    const minutesWithParticipants = await Promise.all(
      minutes.map(async (minute) => {
        const { data: minuteParticipants, error: participantError } = await supabase
          .from("minute_participants")
          .select(`
            participant_id,
            participants (
              id,
              name,
              position,
              role
            )
          `)
          .eq("minute_id", minute.id)

        if (participantError) throw participantError

        const participantIds = minuteParticipants.map((mp) => mp.participant_id)
        const participantDetails = minuteParticipants.map((mp: any) => ({
          id: mp.participants.id,
          name: mp.participants.name,
          position: mp.participants.position || "",
          role: mp.participants.role || "",
        }))

        return {
          id: minute.id,
          theme_id: minute.theme_id,
          title: minute.title,
          date: minute.date,
          time: minute.time,
          content: minute.content,
          summary_progress: minute.summary_progress,
          summary_key_points: minute.summary_key_points,
          summary_decisions: minute.summary_decisions,
          summary_actions: minute.summary_actions,
          keywords: minute.keywords,
          status: minute.status,
          author: minute.author,
          approver: minute.approver,
          participants: participantIds,
          participant_details: participantDetails,
          created_at: minute.created_at,
          updated_at: minute.updated_at,
        }
      }),
    )

    return minutesWithParticipants
  } catch (error) {
    console.error("Error fetching minutes by theme:", error)
    return []
  }
}

// キーワード検索
export async function searchMinutes(keyword: string): Promise<Minute[]> {
  if (!keyword.trim()) return getMinutes()

  try {
    const { data: minutes, error: minutesError } = await supabase
      .from("minutes")
      .select("*")
      .or(
        `title.ilike.%${keyword}%,content.ilike.%${keyword}%,summary_progress.ilike.%${keyword}%,summary_key_points.ilike.%${keyword}%,summary_decisions.ilike.%${keyword}%,summary_actions.ilike.%${keyword}%`,
      )
      .order("date", { ascending: false })

    if (minutesError) throw minutesError

    // 各議事録の参加者IDと詳細情報を取得
    const minutesWithParticipants = await Promise.all(
      minutes.map(async (minute) => {
        const { data: minuteParticipants, error: participantError } = await supabase
          .from("minute_participants")
          .select(`
            participant_id,
            participants (
              id,
              name,
              position,
              role
            )
          `)
          .eq("minute_id", minute.id)

        if (participantError) throw participantError

        const participantIds = minuteParticipants.map((mp) => mp.participant_id)
        const participantDetails = minuteParticipants.map((mp: any) => ({
          id: mp.participants.id,
          name: mp.participants.name,
          position: mp.participants.position || "",
          role: mp.participants.role || "",
        }))

        return {
          id: minute.id,
          theme_id: minute.theme_id,
          title: minute.title,
          date: minute.date,
          time: minute.time,
          content: minute.content,
          summary_progress: minute.summary_progress,
          summary_key_points: minute.summary_key_points,
          summary_decisions: minute.summary_decisions,
          summary_actions: minute.summary_actions,
          keywords: minute.keywords,
          status: minute.status,
          author: minute.author,
          approver: minute.approver,
          participants: participantIds,
          participant_details: participantDetails,
          created_at: minute.created_at,
          updated_at: minute.updated_at,
        }
      }),
    )

    return minutesWithParticipants
  } catch (error) {
    console.error("Error searching minutes:", error)
    return []
  }
}

// キーワードを抽出する関数
export function extractKeywords(
  content: string,
  summary?: {
    progress?: string | null
    keyPoints?: string | null
    decisions?: string | null
    actions?: string | null
  },
): string[] {
  const keywords = new Set<string>()

  // 議事録の内容からキーワードを抽出
  if (content) {
    const contentWords = content.split(/\s+|、|。/)
    contentWords.forEach((word) => {
      if (word.length >= 2 && !/^\d+$/.test(word)) {
        keywords.add(word.replace(/[.,;:!?]/g, ""))
      }
    })
  }

  // サマリーからキーワードを抽出
  if (summary) {
    const summaryText = [summary.progress, summary.keyPoints, summary.decisions, summary.actions]
      .filter(Boolean)
      .join(" ")

    const summaryWords = summaryText.split(/\s+|、|。|\n/)
    summaryWords.forEach((word) => {
      if (/\d+%|\d+[度円個台]/.test(word)) {
        keywords.add(word.replace(/[.,;:!?]/g, ""))
      } else if (word.length >= 2 && !/^\d+$/.test(word)) {
        keywords.add(word.replace(/[.,;:!?]/g, ""))
      }
    })
  }

  // 重要そうなキーワードを優先
  const priorityKeywords = Array.from(keywords).filter((keyword) =>
    /不良率|改善|検討|対策|実施|完了|決定|報告|確認/.test(keyword),
  )

  return [...priorityKeywords, ...Array.from(keywords).filter((k) => !priorityKeywords.includes(k))].slice(0, 10)
}
