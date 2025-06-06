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
  participants: string[]
  participant_roles?: { [participantId: string]: string } // 参加者ごとの役割
  created_at?: string
  updated_at?: string
}

// 参加者関連の関数
export async function getParticipants(): Promise<Participant[]> {
  try {
    // 参加者とその参加テーマを取得
    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select("*")
      .order("name")

    if (participantsError) throw participantsError

    // 各参加者のテーマIDを取得
    const participantsWithThemes = await Promise.all(
      participants.map(async (participant) => {
        const { data: themeParticipants, error: themeError } = await supabase
          .from("theme_participants")
          .select("theme_id")
          .eq("participant_id", participant.id)

        if (themeError) throw themeError

        return {
          id: participant.id,
          name: participant.name,
          position: participant.position || "",
          role: participant.role || "",
          department: participant.department || "",
          themes: themeParticipants.map((tp) => tp.theme_id),
          theme_roles: {}, // 初期化
          created_at: participant.created_at,
          updated_at: participant.updated_at,
        }
      }),
    )

    return participantsWithThemes
  } catch (error) {
    console.error("Error fetching participants:", error)
    return []
  }
}

export async function addParticipant(
  participant: Omit<Participant, "id" | "themes" | "theme_roles">,
): Promise<Participant | null> {
  try {
    const { data, error } = await supabase
      .from("participants")
      .insert({
        name: participant.name,
        position: participant.position,
        role: participant.role,
        department: participant.department,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.name,
      position: data.position || "",
      role: data.role || "",
      department: data.department || "",
      themes: [],
      theme_roles: {}, // 初期化
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error("Error adding participant:", error)
    return null
  }
}

export async function updateParticipant(participant: Participant): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("participants")
      .update({
        name: participant.name,
        position: participant.position,
        role: participant.role,
        department: participant.department,
      })
      .eq("id", participant.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error updating participant:", error)
    return false
  }
}

export async function deleteParticipant(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("participants").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting participant:", error)
    return false
  }
}

// テーマ関連の関数
export async function getThemes(): Promise<Theme[]> {
  try {
    // テーマとその参加者を取得
    const { data: themes, error: themesError } = await supabase.from("themes").select("*").order("name")

    if (themesError) throw themesError

    // 各テーマの参加者IDと役割を取得
    const themesWithParticipants = await Promise.all(
      themes.map(async (theme) => {
        const { data: themeParticipants, error: participantError } = await supabase
          .from("theme_participants")
          .select("participant_id, role")
          .eq("theme_id", theme.id)

        if (participantError) throw participantError

        const participantRoles: { [participantId: string]: string } = {}
        themeParticipants.forEach((tp) => {
          participantRoles[tp.participant_id] = tp.role || "一般参加者"
        })

        return {
          id: theme.id,
          name: theme.name,
          category: theme.category || "",
          description: theme.description || "",
          participants: themeParticipants.map((tp) => tp.participant_id),
          participant_roles: participantRoles,
          created_at: theme.created_at,
          updated_at: theme.updated_at,
        }
      }),
    )

    return themesWithParticipants
  } catch (error) {
    console.error("Error fetching themes:", error)
    return []
  }
}

export async function addTheme(theme: Omit<Theme, "id" | "participants" | "participant_roles">): Promise<Theme | null> {
  try {
    console.log("Adding theme to Supabase:", theme)

    const { data, error } = await supabase
      .from("themes")
      .insert({
        name: theme.name,
        category: theme.category,
        description: theme.description,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error when adding theme:", error)
      throw error
    }

    if (!data) {
      throw new Error("No data returned from Supabase")
    }

    console.log("Theme added successfully:", data)

    return {
      id: data.id,
      name: data.name,
      category: data.category || "",
      description: data.description || "",
      participants: [],
      participant_roles: {}, // 初期化
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error("Error adding theme:", error)
    return null
  }
}

export async function updateTheme(theme: Theme): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("themes")
      .update({
        name: theme.name,
        category: theme.category,
        description: theme.description,
      })
      .eq("id", theme.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error updating theme:", error)
    return false
  }
}

export async function deleteTheme(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("themes").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting theme:", error)
    return false
  }
}

// テーマと参加者の関連付け
export async function addParticipantToTheme(
  themeId: string,
  participantId: string,
  role = "一般参加者",
): Promise<boolean> {
  try {
    console.log(`Adding participant ${participantId} to theme ${themeId} with role ${role}`)

    // 既に関連付けが存在するかチェック
    const { data: existing, error: checkError } = await supabase
      .from("theme_participants")
      .select("id")
      .eq("theme_id", themeId)
      .eq("participant_id", participantId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing relationship:", checkError)
      throw checkError
    }

    // 既に存在する場合は役割を更新
    if (existing) {
      const { error: updateError } = await supabase.from("theme_participants").update({ role }).eq("id", existing.id)

      if (updateError) {
        console.error("Error updating participant role:", updateError)
        throw updateError
      }

      console.log("Participant role updated successfully")
      return true
    }

    // 新しい関連付けを作成
    const { error } = await supabase.from("theme_participants").insert({
      theme_id: themeId,
      participant_id: participantId,
      role,
    })

    if (error) {
      console.error("Error creating theme-participant relationship:", error)
      throw error
    }

    console.log("Participant added to theme successfully")
    return true
  } catch (error) {
    console.error("Error adding participant to theme:", error)
    return false
  }
}

export async function removeParticipantFromTheme(themeId: string, participantId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("theme_participants")
      .delete()
      .eq("theme_id", themeId)
      .eq("participant_id", participantId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error removing participant from theme:", error)
    return false
  }
}

// getParticipantsByTheme関数を更新して役割情報も取得
export async function getParticipantsByTheme(themeId: string): Promise<Participant[]> {
  try {
    const { data, error } = await supabase
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

    if (error) throw error

    return data.map((item: any) => ({
      id: item.participants.id,
      name: item.participants.name,
      position: item.participants.position || "",
      role: item.participants.role || "",
      department: item.participants.department || "",
      themes: [themeId],
      theme_roles: { [themeId]: item.role || "一般参加者" },
      created_at: item.participants.created_at,
      updated_at: item.participants.updated_at,
    }))
  } catch (error) {
    console.error("Error fetching participants by theme:", error)
    return []
  }
}

export async function getParticipantsNotInTheme(themeId: string): Promise<Participant[]> {
  try {
    // まず、テーマに参加している参加者のIDを取得
    const { data: themeParticipants, error: themeError } = await supabase
      .from("theme_participants")
      .select("participant_id")
      .eq("theme_id", themeId)

    if (themeError) throw themeError

    const participantIdsInTheme = themeParticipants.map((tp) => tp.participant_id)

    // 全ての参加者を取得
    const { data: allParticipants, error: participantsError } = await supabase
      .from("participants")
      .select("*")
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
  } catch (error) {
    console.error("Error fetching participants not in theme:", error)
    return []
  }
}

// 新しい関数：テーマ内での参加者の役割を更新
export async function updateParticipantRoleInTheme(
  themeId: string,
  participantId: string,
  role: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("theme_participants")
      .update({ role })
      .eq("theme_id", themeId)
      .eq("participant_id", participantId)

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
  // 実際のアプリケーションでは、参加者データをコンテキストやストアで管理することを推奨します
  return `参加者${participantId.slice(-4)}`
}
