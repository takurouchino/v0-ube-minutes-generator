"use client"

import { supabase } from "./supabase"

// 型定義
export type Minute = {
  id: string
  title: string
  date: string
  content: string
  summary_progress: string
  summary_key_points: string
  summary_decisions: string
  summary_actions: string
  theme_id: string | null
  participants: string[]
  participant_details?: Array<{ id: string; name: string; role?: string }>
  keywords?: string[]
  created_at?: string
  updated_at?: string
}

// 議事録の取得
export async function getMinutes(companyId?: string): Promise<Minute[]> {
  if (!companyId) {
    console.error("認証が必要です")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("minutes")
      .select(`
        *,
        participant_details:minute_participants(
          id,
          participant:participants(id, name)
        )
      `)
      .eq("company_id", companyId)
      .order("date", { ascending: false })

    if (error) throw error

    // データを整形
    const formattedData = (data || []).map((minute: any) => {
      // 参加者の詳細情報を整形
      const participantDetails = minute.participant_details
        ? minute.participant_details
            .filter((pd: any) => pd.participant) // nullチェック
            .map((pd: any) => ({
              id: pd.participant.id as string,
              name: pd.participant.name as string,
            }))
        : []

      // 参加者IDのリストを作成
      const participantIds = participantDetails.map((pd) => pd.id)

      return {
        id: minute.id as string,
        title: minute.title as string || "無題の議事録",
        date: minute.date as string || new Date().toISOString().split("T")[0],
        content: minute.content as string || "",
        summary_progress: minute.summary_progress as string || "",
        summary_key_points: minute.summary_key_points as string || "",
        summary_decisions: minute.summary_decisions as string || "",
        summary_actions: minute.summary_actions as string || "",
        theme_id: minute.theme_id as string | null,
        participants: participantIds,
        participant_details: participantDetails,
        keywords: (minute.keywords as string[]) || [],
        created_at: minute.created_at as string,
        updated_at: minute.updated_at as string,
      }
    })

    return formattedData
  } catch (error) {
    console.error("Error fetching minutes:", error)
    return []
  }
}

// 議事録の検索
export async function searchMinutes(keyword: string, companyId?: string): Promise<Minute[]> {
  if (!companyId) {
    console.error("認証が必要です")
    return []
  }

  try {
    // 全文検索クエリを構築
    const { data, error } = await supabase
      .from("minutes")
      .select(`
        *,
        participant_details:minute_participants(
          id,
          participant:participants(id, name)
        )
      `)
      .eq("company_id", companyId)
      .or(
        `title.ilike.%${keyword}%,content.ilike.%${keyword}%,summary_progress.ilike.%${keyword}%,summary_key_points.ilike.%${keyword}%,summary_decisions.ilike.%${keyword}%,summary_actions.ilike.%${keyword}%`,
      )
      .order("date", { ascending: false })

    if (error) throw error

    // データを整形
    const formattedData = data.map((minute: any) => {
      // 参加者の詳細情報を整形
      const participantDetails = minute.participant_details
        ? minute.participant_details
            .filter((pd: any) => pd.participant) // nullチェック
            .map((pd: any) => ({
              id: pd.participant.id,
              name: pd.participant.name,
            }))
        : []

      // 参加者IDのリストを作成
      const participantIds = participantDetails.map((pd: any) => pd.id)

      return {
        id: minute.id,
        title: minute.title || "無題の議事録",
        date: minute.date || new Date().toISOString().split("T")[0],
        content: minute.content || "",
        summary_progress: minute.summary_progress || "",
        summary_key_points: minute.summary_key_points || "",
        summary_decisions: minute.summary_decisions || "",
        summary_actions: minute.summary_actions || "",
        theme_id: minute.theme_id,
        participants: participantIds,
        participant_details: participantDetails,
        keywords: minute.keywords || [],
        created_at: minute.created_at,
        updated_at: minute.updated_at,
      }
    })

    return formattedData
  } catch (error) {
    console.error("Error searching minutes:", error)
    return []
  }
}

// 議事録の削除
export async function deleteMinute(id: string, companyId?: string): Promise<boolean> {
  if (!companyId) {
    console.error("認証が必要です")
    return false
  }

  try {
    // 関連する発言データを削除
    const { error: sentencesError } = await supabase
      .from("minute_sentences")
      .delete()
      .eq("minute_id", id)
      .eq("company_id", companyId)

    if (sentencesError) throw sentencesError

    // 関連するエスカレーションを削除
    const { error: escalationsError } = await supabase
      .from("escalations")
      .delete()
      .eq("minute_id", id)
      .eq("company_id", companyId)

    if (escalationsError) throw escalationsError

    // 関連するTODOを削除
    const { error: todosError } = await supabase.from("todos").delete().eq("minute_id", id).eq("company_id", companyId)

    if (todosError) throw todosError

    // 議事録を削除
    const { error } = await supabase.from("minutes").delete().eq("id", id).eq("company_id", companyId)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting minute:", error)
    return false
  }
}

// 議事録の詳細取得
export async function getMinuteById(id: string, companyId?: string): Promise<Minute | null> {
  if (!companyId) {
    console.error("認証が必要です")
    return null
  }

  try {
    const { data, error } = await supabase
      .from("minutes")
      .select(`
        *,
        participant_details:minute_participants(
          id,
          participant:participants(id, name)
        )
      `)
      .eq("id", id)
      .eq("company_id", companyId)
      .single()

    if (error) throw error

    if (!data) return null

    // 参加者の詳細情報を整形
    const participantDetails = ((data.participant_details as unknown) as any[])
      ? ((data.participant_details as unknown) as any[])
          .filter((pd: any) => pd.participant) // nullチェック
          .map((pd: any) => ({
            id: pd.participant.id as string,
            name: pd.participant.name as string,
          }))
      : []

    // 参加者IDのリストを作成
    const participantIds = participantDetails.map((pd: { id: string }) => pd.id)

    return {
      id: data.id as string,
      title: (data.title as string) || "無題の議事録",
      date: (data.date as string) || new Date().toISOString().split("T")[0],
      content: (data.content as string) || "",
      summary_progress: (data.summary_progress as string) || "",
      summary_key_points: (data.summary_key_points as string) || "",
      summary_decisions: (data.summary_decisions as string) || "",
      summary_actions: (data.summary_actions as string) || "",
      theme_id: (data.theme_id as string | null) || null,
      participants: participantIds,
      participant_details: participantDetails,
      keywords: (data.keywords as string[]) || [],
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    }
  } catch (error) {
    console.error("Error fetching minute by ID:", error)
    return null
  }
}

// 議事録の保存
export async function saveMinute(
  minute: Omit<Minute, "id" | "created_at" | "updated_at">,
  companyId?: string,
): Promise<string | null> {
  if (!companyId) {
    console.error("認証が必要です")
    return null
  }

  try {
    // 議事録を保存
    const { data, error } = await supabase
      .from("minutes")
      .insert({
        title: minute.title,
        date: minute.date,
        content: minute.content,
        summary_progress: minute.summary_progress,
        summary_key_points: minute.summary_key_points,
        summary_decisions: minute.summary_decisions,
        summary_actions: minute.summary_actions,
        theme_id: minute.theme_id,
        keywords: minute.keywords || [],
        company_id: companyId,
      })
      .select()
      .single()

    if (error) throw error

    // 参加者の関連付けを保存
    if (minute.participants && minute.participants.length > 0) {
      const participantInserts = minute.participants.map((participantId) => ({
        minute_id: data.id,
        participant_id: participantId,
        company_id: companyId,
      }))

      const { error: participantError } = await supabase.from("minute_participants").insert(participantInserts)

      if (participantError) throw participantError
    }

    return data.id
  } catch (error) {
    console.error("Error saving minute:", error)
    return null
  }
}

// addMinute関数を追加（saveMinuteのエイリアスとして）
export async function addMinute(
  minute: Omit<Minute, "id" | "created_at" | "updated_at">,
  companyId?: string,
): Promise<any> {
  try {
    // 現在のユーザーのcompany_idを取得
    let userCompanyId = companyId

    if (!userCompanyId) {
      // ユーザー認証情報からcompany_idを取得する試み
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

          if (profile) {
            userCompanyId = profile.company_id
          }
        }
      } catch (authError) {
        console.error("認証情報の取得に失敗しました:", authError)
      }
    }

    if (!userCompanyId) {
      console.error("会社IDが取得できません。議事録を保存できません。")
      return null
    }

    // saveMinute関数を使用して議事録を保存
    const minuteId = await saveMinute(minute, userCompanyId)

    if (!minuteId) {
      return null
    }

    // 保存された議事録の詳細を取得して返す
    return await getMinuteById(minuteId, userCompanyId)
  } catch (error) {
    console.error("Error in addMinute:", error)
    return null
  }
}

// 議事録の更新
export async function updateMinute(minute: Minute, companyId?: string): Promise<boolean> {
  if (!companyId) {
    console.error("認証が必要です")
    return false
  }

  try {
    // 議事録を更新
    const { error } = await supabase
      .from("minutes")
      .update({
        title: minute.title,
        date: minute.date,
        content: minute.content,
        summary_progress: minute.summary_progress,
        summary_key_points: minute.summary_key_points,
        summary_decisions: minute.summary_decisions,
        summary_actions: minute.summary_actions,
        theme_id: minute.theme_id,
        keywords: minute.keywords || [],
      })
      .eq("id", minute.id)
      .eq("company_id", companyId)

    if (error) throw error

    // 既存の参加者の関連付けを削除
    const { error: deleteError } = await supabase
      .from("minute_participants")
      .delete()
      .eq("minute_id", minute.id)
      .eq("company_id", companyId)

    if (deleteError) throw deleteError

    // 新しい参加者の関連付けを保存
    if (minute.participants && minute.participants.length > 0) {
      const participantInserts = minute.participants.map((participantId) => ({
        minute_id: minute.id,
        participant_id: participantId,
        company_id: companyId,
      }))

      const { error: participantError } = await supabase.from("minute_participants").insert(participantInserts)

      if (participantError) throw participantError
    }

    return true
  } catch (error) {
    console.error("Error updating minute:", error)
    return false
  }
}

// キーワード抽出関数
export function extractKeywords(
  content: string,
  summary: { progress: string; keyPoints: string; decisions: string; actions: string },
): string[] {
  // 議事録の内容と要約からキーワードを抽出するロジック
  const combinedText = `${content} ${summary.progress} ${summary.keyPoints} ${summary.decisions} ${summary.actions}`

  // 単語を分割し、重複を削除
  const words = combinedText
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 1)

  // 出現頻度をカウント
  const wordCount: Record<string, number> = {}
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  // 頻度順にソートして上位のキーワードを返す
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((entry) => entry[0])
}
