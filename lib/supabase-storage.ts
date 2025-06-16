"use client"

import { supabase } from "./supabase"

// 型定義
export type Participant = {
  id: string
  name: string
  position: string
  role: string
  department: string
  themes: string[]
  theme_roles?: { [themeId: string]: string } // テーマごとの役割
  created_at?: string
  updated_at?: string
}

// Theme型にparticipant_rolesフィールドを追加
export type Theme = {
  id: string
  name: string
  category: string
  description: string
  background?: string | null // 追加
  purpose?: string | null // 追加
  reference?: string | null // references → reference に変更
  participants: string[]
  participant_roles?: { [participantId: string]: string } // 参加者ごとの役割
  created_at?: string
  updated_at?: string
}

// 参加者関連の関数
export async function getParticipants(companyId?: string): Promise<Participant[]> {
  try {
    let query = supabase.from("participants").select("*").order("name")
    if (companyId) {
      query = query.eq("company_id", companyId)
    }
    const { data, error } = await query
    if (error) throw error

    // 参加テーマ数を正確に取得
    let themeParticipants: { participant_id: string; theme_id: string }[] = []
    if (companyId) {
      const { data: tpData, error: tpError } = await supabase
        .from("theme_participants")
        .select("participant_id, theme_id")
        .eq("company_id", companyId)
      if (tpError) throw tpError
      themeParticipants = (tpData || []).map((tp: any) => ({
        participant_id: String(tp.participant_id),
        theme_id: String(tp.theme_id),
      }))
    }

    return (data || []).map((participant: any) => {
      const themes = themeParticipants
        .filter((tp) => tp.participant_id === String(participant.id))
        .map((tp) => tp.theme_id)
      return {
        id: String(participant.id),
        name: String(participant.name),
        position: String(participant.position || ""),
        role: String(participant.role || ""),
        department: String(participant.department || ""),
        themes,
        theme_roles: {},
        created_at: String(participant.created_at),
        updated_at: String(participant.updated_at),
      }
    })
  } catch (error) {
    console.error("Error fetching participants:", error)
    return []
  }
}

export async function addParticipant(
  participant: Omit<Participant, "id" | "themes" | "theme_roles">,
  companyId?: string,
): Promise<Participant | null> {
  try {
    const insertData: any = {
      name: participant.name,
      position: participant.position,
      role: participant.role,
      department: participant.department,
    }
    if (companyId) insertData.company_id = companyId
    const { data, error } = await supabase
      .from("participants")
      .insert(insertData)
      .select()
      .single()
    if (error) throw error
    const result: Participant = {
      id: data.id as string,
      name: data.name as string,
      position: data.position as string || "",
      role: data.role as string || "",
      department: data.department as string || "",
      themes: [],
      theme_roles: {},
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    }
    return result
  } catch (error) {
    console.error("Error adding participant:", error)
    return null
  }
}

export async function updateParticipant(participant: Participant, companyId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from("participants")
      .update({
        name: participant.name,
        position: participant.position,
        role: participant.role,
        department: participant.department,
      })
      .eq("id", participant.id)
    if (companyId) query = query.eq("company_id", companyId)
    const { error } = await query
    if (error) throw error
    return true
  } catch (error) {
    console.error("Error updating participant:", error)
    return false
  }
}

export async function deleteParticipant(id: string, companyId?: string): Promise<boolean> {
  try {
    let query = supabase.from("participants").delete().eq("id", id)
    if (companyId) query = query.eq("company_id", companyId)
    const { error } = await query
    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting participant:", error)
    return false
  }
}

// テーマ関連の関数
export async function getThemes(companyId?: string): Promise<Theme[]> {
  if (!companyId) {
    console.error("認証が必要です")
    return []
  }

  try {
    // テーマとその参加者を取得
    const { data: themes, error: themesError } = await supabase
      .from("themes")
      .select("*")
      .eq("company_id", companyId)
      .order("name")

    if (themesError) throw themesError

    // 各テーマの参加者IDと役割を取得
    const themesWithParticipants = await Promise.all(
      (themes || []).map(async (theme: any) => {
        const { data: themeParticipants, error: participantError } = await supabase
          .from("theme_participants")
          .select("participant_id, role")
          .eq("theme_id", theme.id)
          .eq("company_id", companyId)

        if (participantError) throw participantError

        const participantRoles: { [participantId: string]: string } = {}
        themeParticipants.forEach((tp: any) => {
          participantRoles[tp.participant_id] = tp.role || "一般参加者"
        })

        return {
          id: theme.id as string,
          name: theme.name as string,
          category: theme.category as string || "",
          description: theme.description as string || "",
          background: theme.background as string | null || null,
          purpose: theme.purpose as string | null || null,
          reference: theme.reference as string | null || null,
          participants: themeParticipants.map((tp: any) => tp.participant_id as string),
          participant_roles: participantRoles,
          created_at: theme.created_at as string,
          updated_at: theme.updated_at as string,
        }
      }),
    )

    return themesWithParticipants
  } catch (error: any) {
    console.error("Error fetching themes:", error?.message || String(error))
    return []
  }
}

export async function addTheme(
  theme: Omit<Theme, "id" | "participants" | "participant_roles">,
  companyId?: string,
): Promise<Theme | null> {
  if (!companyId) {
    console.error("認証が必要です")
    return null
  }

  try {
    console.log("Adding theme to Supabase:", theme)

    const { data, error } = await supabase
      .from("themes")
      .insert({
        name: theme.name,
        category: theme.category,
        description: theme.description,
        background: theme.background, // 追加
        purpose: theme.purpose, // 追加
        reference: theme.reference, // references → reference に変更
        company_id: companyId,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error when adding theme:", (error as Error).message || String(error))
      throw error
    }

    if (!data) {
      throw new Error("No data returned from Supabase")
    }

    console.log("Theme added successfully:", data)

    return {
      id: String(data.id),
      name: String(data.name),
      category: data.category ? String(data.category) : "",
      description: data.description ? String(data.description) : "",
      background: data.background ? String(data.background) : null, // 追加
      purpose: data.purpose ? String(data.purpose) : null, // 追加
      reference: data.reference ? String(data.reference) : null, // references → reference に変更
      participants: [],
      participant_roles: {}, // 初期化
      created_at: data.created_at ? String(data.created_at) : undefined,
      updated_at: data.updated_at ? String(data.updated_at) : undefined,
    }
  } catch (error: any) {
    console.error("Error adding theme:", error?.message || String(error))
    return null
  }
}

export async function updateTheme(theme: Theme, companyId?: string): Promise<boolean> {
  if (!companyId) {
    console.error("認証が必要です")
    return false
  }

  try {
    const { error } = await supabase
      .from("themes")
      .update({
        name: theme.name,
        category: theme.category,
        description: theme.description,
        background: theme.background, // 追加
        purpose: theme.purpose, // 追加
        reference: theme.reference, // references → reference に変更
      })
      .eq("id", theme.id)
      .eq("company_id", companyId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error updating theme:", error)
    return false
  }
}

export async function deleteTheme(id: string, companyId?: string): Promise<boolean> {
  if (!companyId) {
    console.error("認証が必要です")
    return false
  }

  try {
    let query = supabase.from("themes").delete().eq("id", id)
    if (companyId) query = query.eq("company_id", companyId)
    const { error } = await query

    if (error) throw error
    return true
  } catch (error: any) {
    console.error("Error deleting theme:", error?.message || String(error))
    return false
  }
}

// テーマと参加者の関連付け
export async function addParticipantToTheme(
  themeId: string,
  participantId: string,
  role = "一般参加者",
  companyId?: string,
): Promise<boolean> {
  try {
    console.log(`Adding participant ${participantId} to theme ${themeId} with role ${role}`)

    // 既に関連付けが存在するかチェック
    let query = supabase
      .from("theme_participants")
      .select("id")
      .eq("theme_id", themeId)
      .eq("participant_id", participantId)
    if (companyId) query = query.eq("company_id", companyId)
    const { data: existing, error: checkError } = await query.maybeSingle()

    if (checkError) {
      console.error("Error checking existing relationship:", checkError)
      throw checkError
    }

    // 既に存在する場合は役割を更新
    let updateQuery = supabase
      .from("theme_participants")
      .update({ role })
      .eq("id", existing?.id)
    if (companyId && existing) updateQuery = updateQuery.eq("company_id", companyId)
    if (existing) {
      const { error: updateError } = await updateQuery
      if (updateError) {
        console.error("Error updating participant role:", updateError)
        throw updateError
      }
      console.log("Participant role updated successfully")
      return true
    }

    // 新しい関連付けを作成
    const insertData: any = {
      theme_id: themeId,
      participant_id: participantId,
      role,
    }
    if (companyId) insertData.company_id = companyId
    const { error } = await supabase.from("theme_participants").insert(insertData)

    if (error) {
      console.error("Error creating theme-participant relationship:", error)
      throw error
    }

    console.log("Participant added to theme successfully")
    return true
  } catch (error: any) {
    console.error("Error adding participant to theme:", error?.message || String(error))
    return false
  }
}

export async function removeParticipantFromTheme(
  themeId: string,
  participantId: string,
  companyId?: string,
): Promise<boolean> {
  try {
    let query = supabase
      .from("theme_participants")
      .delete()
      .eq("theme_id", themeId)
      .eq("participant_id", participantId)
    if (companyId) query = query.eq("company_id", companyId)
    const { error } = await query

    if (error) throw error
    return true
  } catch (error: any) {
    console.error("Error removing participant from theme:", error?.message || String(error))
    return false
  }
}

// getParticipantsByTheme関数を更新して役割情報も取得
export async function getParticipantsByTheme(themeId: string, companyId?: string): Promise<Participant[]> {
  try {
    let query = supabase
      .from("theme_participants")
      .select(`
        participant_id,
        role,
        participants (
          id,
          name,
          position,
          role,
          department,
          created_at,
          updated_at
        )
      `)
      .eq("theme_id", themeId)
    if (companyId) query = query.eq("company_id", companyId)
    const { data, error } = await query

    if (error) throw error

    return (data || [])
      .filter((row: any) => row.participants && typeof row.participants.id === 'string')
      .map((row: any) => ({
        id: row.participants.id as string,
        name: row.participants.name as string,
        position: (row.participants.position ?? "") as string,
        role: (row.participants.role ?? "") as string,
        department: (row.participants.department ?? "") as string,
        themes: [],
        theme_roles: { [themeId]: row.role ? String(row.role) : "" },
        created_at: row.participants.created_at ? (row.participants.created_at as string) : undefined,
        updated_at: row.participants.updated_at ? (row.participants.updated_at as string) : undefined,
      }))
  } catch (error: any) {
    console.error("Error fetching participants by theme:", error?.message || String(error))
    return []
  }
}

export async function getParticipantsNotInTheme(themeId: string, companyId?: string): Promise<Participant[]> {
  if (!companyId) {
    console.error("認証が必要です")
    return []
  }

  try {
    // まず、テーマに参加している参加者のIDを取得
    const { data: themeParticipants, error: themeError } = await supabase
      .from("theme_participants")
      .select("participant_id")
      .eq("theme_id", themeId)
      .eq("company_id", companyId) // company_idでフィルタリング

    if (themeError) throw themeError

    const participantIdsInTheme = themeParticipants.map((tp) => tp.participant_id)

    // 全ての参加者を取得
    const { data: allParticipants, error: participantsError } = await supabase
      .from("participants")
      .select("*")
      .eq("company_id", companyId)
      .order("name")

    if (participantsError) throw participantsError

    // テーマに参加していない参加者をフィルタリング
    const participantsNotInTheme = allParticipants.filter(
      (participant) => !participantIdsInTheme.includes(participant.id),
    )

    return participantsNotInTheme.map((participant) => ({
      id: participant.id,
      name: participant.name,
      position: participant.position || "",
      role: participant.role || "",
      department: participant.department || "",
      themes: [],
      theme_roles: {}, // 初期化
      created_at: participant.created_at,
      updated_at: participant.updated_at,
    }))
  } catch (error: any) {
    console.error("Error fetching participants not in theme:", error?.message || String(error))
    return []
  }
}

// 新しい関数：テーマ内での参加者の役割を更新
export async function updateParticipantRoleInTheme(
  themeId: string,
  participantId: string,
  role: string,
  companyId?: string,
): Promise<boolean> {
  if (!companyId) {
    console.error("認証が必要です")
    return false
  }

  try {
    const { error } = await supabase
      .from("theme_participants")
      .update({ role })
      .eq("theme_id", themeId)
      .eq("participant_id", participantId)
      .eq("company_id", companyId) // company_idでフィルタリング

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error updating participant role in theme:", error)
    return false
  }
}

// 参加者名を取得するヘルパー関数
export function getParticipantName(participantId: string): string {
  // この関数は同期的に呼ばれるため、キャッシュされたデータを使用する必要があります
  // 実際のアプリケーションでは、グローバルなキャッシュから参加者名を取得する必要があります
  return "Unknown Participant" // デフォルト値
}
