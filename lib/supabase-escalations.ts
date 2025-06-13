import { supabase } from "@/lib/supabase"

export type EscalationItem = {
  id: string
  minute_id: string
  theme_name: string | null
  minute_date: string | null
  risk_score: number
  excerpt: string
  category: "technical" | "business" | "personnel"
  confirmed: boolean
  created_at: string
}

// エスカレーション情報をカテゴリ別に取得
export async function getEscalationsByCategory(
  category: "technical" | "business" | "personnel",
  companyId?: string,
): Promise<EscalationItem[]> {
  try {
    // 既存のsupabaseクライアントを使用
    let query = supabase
      .from("escalations")
      .select("*")
      .eq("category", category)
      .eq("confirmed", false)
      .order("risk_score", { ascending: false })

    // 会社IDが指定されている場合は、その会社のエスカレーションのみを取得
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch escalations:", error)
      throw new Error(`エスカレーション情報の取得に失敗しました: ${error.message}`)
    }

    return data as EscalationItem[]
  } catch (error) {
    console.error("Error in getEscalationsByCategory:", error)
    throw error
  }
}

// エスカレーション項目を確認済みにする
export async function confirmEscalation(id: string, companyId?: string): Promise<boolean> {
  try {
    // 既存のsupabaseクライアントを使用
    let query = supabase.from("escalations").update({ confirmed: true }).eq("id", id)

    // 会社IDが指定されている場合は、その会社のエスカレーションのみを更新
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { error } = await query

    if (error) {
      console.error("Failed to confirm escalation:", error)
      throw new Error(`エスカレーション項目の確認に失敗しました: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error("Error in confirmEscalation:", error)
    throw error
  }
}

// すべてのエスカレーション情報を取得
export async function getAllEscalations(companyId?: string): Promise<EscalationItem[]> {
  try {
    // 既存のsupabaseクライアントを使用
    let query = supabase.from("escalations").select("*").order("created_at", { ascending: false })

    // 会社IDが指定されている場合は、その会社のエスカレーションのみを取得
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch all escalations:", error)
      throw new Error(`すべてのエスカレーション情報の取得に失敗しました: ${error.message}`)
    }

    return data as EscalationItem[]
  } catch (error) {
    console.error("Error in getAllEscalations:", error)
    throw error
  }
}

// 確認済みのエスカレーション情報を取得
export async function getConfirmedEscalations(companyId?: string): Promise<EscalationItem[]> {
  try {
    // 既存のsupabaseクライアントを使用
    let query = supabase.from("escalations").select("*").eq("confirmed", true).order("created_at", { ascending: false })

    // 会社IDが指定されている場合は、その会社のエスカレーションのみを取得
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch confirmed escalations:", error)
      throw new Error(`確認済みエスカレーション情報の取得に失敗しました: ${error.message}`)
    }

    return data as EscalationItem[]
  } catch (error) {
    console.error("Error in getConfirmedEscalations:", error)
    throw error
  }
}

// 議事録IDに基づくエスカレーション情報を取得
export async function getEscalationsByMinute(minuteId: string, companyId?: string): Promise<EscalationItem[]> {
  try {
    // 既存のsupabaseクライアントを使用
    let query = supabase
      .from("escalations")
      .select("*")
      .eq("minute_id", minuteId)
      .order("risk_score", { ascending: false })

    // 会社IDが指定されている場合は、その会社のエスカレーションのみを取得
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch escalations by minute:", error)
      throw new Error(`議事録に関連するエスカレーション情報の取得に失敗しました: ${error.message}`)
    }

    return data as EscalationItem[]
  } catch (error) {
    console.error("Error in getEscalationsByMinute:", error)
    throw error
  }
}

// エスカレーション統計情報を取得
export async function getEscalationStats(companyId?: string) {
  try {
    // 既存のsupabaseクライアントを使用
    let query = supabase.rpc("get_escalation_stats")

    // 会社IDが指定されている場合は、その会社のエスカレーションのみを集計
    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch escalation stats:", error)
      throw new Error(`エスカレーション統計情報の取得に失敗しました: ${error.message}`)
    }

    return (
      data || {
        technical_count: 0,
        business_count: 0,
        personnel_count: 0,
        total_count: 0,
      }
    )
  } catch (error) {
    console.error("Error in getEscalationStats:", error)
    throw error
  }
}

// AIによるエスカレーション生成と保存
export async function generateAndSaveEscalations(
  minuteId: string,
  sentences: any[],
  companyId?: string,
): Promise<boolean> {
  try {
    // AIによるエスカレーション分析のシミュレーション
    // 実際のプロダクションでは、OpenAIなどのAPIを使用して分析を行う
    const escalations = sentences
      .filter((s) => s.importance_score > 0.7) // 重要度が高い文章のみ抽出
      .map((sentence) => {
        // カテゴリをランダムに決定（実際はAIが判断）
        const categories = ["technical", "business", "personnel"] as const
        const randomCategory = categories[Math.floor(Math.random() * categories.length)]

        // リスクスコアを計算（実際はAIが判断）
        const riskScore = Math.min(Math.round(sentence.importance_score * 100), 100)

        return {
          minute_id: minuteId,
          theme_name: sentence.theme_name || "不明なテーマ",
          risk_score: riskScore,
          excerpt: sentence.content,
          category: randomCategory,
          confirmed: false,
          company_id: companyId, // 会社IDを設定
        }
      })

    if (escalations.length === 0) {
      console.log("No escalations to save")
      return true
    }

    // 既存のsupabaseクライアントを使用
    const { error } = await supabase.from("escalations").insert(escalations)

    if (error) {
      console.error("Failed to save escalations:", error)
      throw new Error(`エスカレーション情報の保存に失敗しました: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error("Error in generateAndSaveEscalations:", error)
    throw error
  }
}
