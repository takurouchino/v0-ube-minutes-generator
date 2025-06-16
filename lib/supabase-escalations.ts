import { supabase } from "@/lib/supabase"
import { analyzeEscalations } from "./openai-escalation"

export type EscalationItem = {
  id: string
  minute_id: string
  theme_name: string | null
  minute_date: string | null
  risk_score: number
  content: string
  summary: string
  category: "technical" | "business" | "personnel"
  confirmed: boolean
  created_at: string
  company_id?: string
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
  themeName: string | null,
  content: string,
  minuteDate: string | null,
  companyId?: string,
): Promise<number> {
  try {
    // OpenAIを使用してエスカレーションを分析
    const escalations = await analyzeEscalations(
      content,
      minuteId,
      themeName,
      minuteDate,
      companyId,
    )

    if (escalations.length === 0) {
      console.log("No escalations to save")
      return 0
    }

    // 既存のsupabaseクライアントを使用
    const { error } = await supabase.from("escalations").insert(
      escalations.map(e => ({
        id: e.id,
        minute_id: e.minute_id,
        theme_name: e.theme_name,
        minute_date: e.minute_date,
        risk_score: e.risk_score,
        content: e.content,
        summary: e.summary,
        category: e.category,
        confirmed: e.confirmed,
        created_at: e.created_at,
        company_id: e.company_id ?? null,
      }))
    )

    if (error) {
      console.error("Failed to save escalations:", error)
      throw new Error(`エスカレーション情報の保存に失敗しました: ${error.message}`)
    }

    return escalations.length
  } catch (error) {
    console.error("Error in generateAndSaveEscalations:", error)
    if (error instanceof Error) {
      throw new Error(`エスカレーションの生成と保存に失敗しました: ${error.message}`)
    }
    throw new Error("エスカレーションの生成と保存に失敗しました")
  }
}
