"use client"

import { supabase } from "./supabase"

// カスタム辞書項目の型定義
export type DictionaryEntry = {
  id: string
  incorrect_term: string
  correct_term: string
  category: string
  pronunciation: string | null
  description: string | null
  usage_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  company_id?: string
}

// カスタム辞書の全項目を取得
export async function getDictionaryEntries(companyId?: string): Promise<DictionaryEntry[]> {
  try {
    let query = supabase
      .from("custom_dictionary")
      .select("*")
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false })

    // 会社IDが指定されている場合はフィルタリング
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch dictionary entries:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error fetching dictionary entries:", error)
    return []
  }
}

// カテゴリ別の辞書項目を取得
export async function getDictionaryEntriesByCategory(category: string, companyId?: string): Promise<DictionaryEntry[]> {
  try {
    let query = supabase
      .from("custom_dictionary")
      .select("*")
      .eq("category", category)
      .order("usage_count", { ascending: false })

    // 会社IDが指定されている場合はフィルタリング
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch dictionary entries by category:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error fetching dictionary entries by category:", error)
    return []
  }
}

// 辞書項目の追加
export async function addDictionaryEntry(
  entry: {
    incorrect_term: string
    correct_term: string
    category: string
    pronunciation?: string
    description?: string
  },
  companyId?: string,
): Promise<DictionaryEntry | null> {
  try {
    const insertData = {
      incorrect_term: entry.incorrect_term,
      correct_term: entry.correct_term,
      category: entry.category,
      pronunciation: entry.pronunciation || null,
      description: entry.description || null,
      created_by: "current_user", // 実際の実装では認証システムから取得
    }

    // 会社IDが指定されている場合は追加
    if (companyId) {
      insertData["company_id"] = companyId
    }

    const { data, error } = await supabase.from("custom_dictionary").insert(insertData).select().single()

    if (error) {
      console.error("Failed to add dictionary entry:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error adding dictionary entry:", error)
    return null
  }
}

// 辞書項目の更新
export async function updateDictionaryEntry(entry: DictionaryEntry): Promise<boolean> {
  try {
    let query = supabase
      .from("custom_dictionary")
      .update({
        incorrect_term: entry.incorrect_term,
        correct_term: entry.correct_term,
        category: entry.category,
        pronunciation: entry.pronunciation,
        description: entry.description,
      })
      .eq("id", entry.id)

    // 会社IDが指定されている場合はフィルタリング
    if (entry.company_id) {
      query = query.eq("company_id", entry.company_id)
    }

    const { error } = await query

    if (error) {
      console.error("Failed to update dictionary entry:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error updating dictionary entry:", error)
    return false
  }
}

// 辞書項目の削除
export async function deleteDictionaryEntry(entryId: string, companyId?: string): Promise<boolean> {
  try {
    let query = supabase.from("custom_dictionary").delete().eq("id", entryId)

    // 会社IDが指定されている場合はフィルタリング
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { error } = await query

    if (error) {
      console.error("Failed to delete dictionary entry:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error deleting dictionary entry:", error)
    return false
  }
}

// 使用回数の更新
export async function incrementUsageCount(entryId: string, companyId?: string): Promise<boolean> {
  try {
    // RPCパラメータを準備
    const params: { entry_id: string; company_id?: string } = { entry_id: entryId }
    if (companyId) {
      params.company_id = companyId
    }

    const { error } = await supabase.rpc("increment_usage_count", params)

    if (error) {
      console.error("Failed to increment usage count:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error incrementing usage count:", error)
    return false
  }
}

// テキストに辞書を適用して修正
export async function applyDictionaryCorrections(text: string, companyId?: string): Promise<string> {
  try {
    const entries = await getDictionaryEntries(companyId)
    let correctedText = text

    // 使用回数の多い順（重要度の高い順）で置換を実行
    for (const entry of entries) {
      const regex = new RegExp(entry.incorrect_term, "gi")
      if (regex.test(correctedText)) {
        correctedText = correctedText.replace(regex, entry.correct_term)
        // 使用回数を増加（非同期で実行、エラーは無視）
        incrementUsageCount(entry.id, companyId).catch(() => {})
      }
    }

    return correctedText
  } catch (error) {
    console.error("Error applying dictionary corrections:", error)
    return text // エラーの場合は元のテキストを返す
  }
}

// 辞書の統計情報を取得
export async function getDictionaryStats(companyId?: string): Promise<{
  total: number
  byCategory: Record<string, number>
  mostUsed: DictionaryEntry[]
}> {
  try {
    const entries = await getDictionaryEntries(companyId)

    const byCategory: Record<string, number> = {}
    entries.forEach((entry) => {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1
    })

    const mostUsed = entries.slice(0, 10) // 上位10件

    return {
      total: entries.length,
      byCategory,
      mostUsed,
    }
  } catch (error) {
    console.error("Error fetching dictionary stats:", error)
    return {
      total: 0,
      byCategory: {},
      mostUsed: [],
    }
  }
}
