import { supabase } from "./supabase"

// エスカレーション項目の型定義
export type EscalationItem = {
  id: string
  minute_id: string
  theme_id: string | null
  category: "technical" | "business" | "personnel"
  risk_score: number
  excerpt: string
  detected_keywords: string[]
  confirmed: boolean
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
  theme_name?: string
  minute_date?: string
  minute_title?: string
}

// リスク検出パターンの定義
const RISK_PATTERNS = {
  technical: [
    { pattern: /不良率.*?(\d+)%.*?(上昇|増加|悪化)/i, score: 85, keywords: ["不良率", "上昇", "品質問題"] },
    { pattern: /故障|トラブル|停止|異常|エラー/i, score: 80, keywords: ["故障", "トラブル", "設備異常"] },
    { pattern: /品質.*?(低下|悪化|問題)/i, score: 75, keywords: ["品質低下", "品質問題"] },
    { pattern: /設備.*?(老朽化|メンテナンス|修理)/i, score: 70, keywords: ["設備", "メンテナンス"] },
    { pattern: /検査.*?(不合格|NG|リジェクト)/i, score: 75, keywords: ["検査不合格", "品質NG"] },
  ],
  business: [
    { pattern: /納期.*?(遅延|遅れ|間に合わない)/i, score: 85, keywords: ["納期遅延", "スケジュール"] },
    { pattern: /コスト.*?(超過|増加|予算オーバー)/i, score: 80, keywords: ["コスト超過", "予算"] },
    { pattern: /顧客.*?(クレーム|不満|問い合わせ)/i, score: 75, keywords: ["顧客クレーム", "顧客対応"] },
    { pattern: /売上.*?(減少|低下|目標未達)/i, score: 70, keywords: ["売上減少", "業績"] },
    { pattern: /契約.*?(解除|キャンセル|中止)/i, score: 80, keywords: ["契約解除", "取引停止"] },
  ],
  personnel: [
    { pattern: /人員.*?(不足|欠員|補充)/i, score: 80, keywords: ["人員不足", "人材確保"] },
    { pattern: /残業.*?(増加|多い|長時間)/i, score: 75, keywords: ["残業増加", "労働時間"] },
    { pattern: /スキル.*?(不足|教育|研修)/i, score: 70, keywords: ["スキル不足", "教育"] },
    { pattern: /労務.*?(問題|課題|改善)/i, score: 65, keywords: ["労務問題", "労働環境"] },
    { pattern: /退職|離職|辞職/i, score: 75, keywords: ["退職", "人材流出"] },
  ],
}

// 議事録からエスカレーション情報を自動生成
export async function generateAndSaveEscalations(minuteId: string, themeId: string, content: string): Promise<number> {
  try {
    const escalations: Array<{
      minute_id: string
      theme_id: string
      category: string
      risk_score: number
      excerpt: string
      detected_keywords: string[]
    }> = []

    // 各カテゴリでリスク検出
    for (const [category, patterns] of Object.entries(RISK_PATTERNS)) {
      for (const { pattern, score, keywords } of patterns) {
        const match = content.match(pattern)
        if (match) {
          // マッチした周辺のテキストを抽出（前後50文字）
          const matchIndex = match.index || 0
          const start = Math.max(0, matchIndex - 50)
          const end = Math.min(content.length, matchIndex + match[0].length + 50)
          const excerpt = content.substring(start, end).replace(/\n/g, " ").trim()

          escalations.push({
            minute_id: minuteId,
            theme_id: themeId,
            category,
            risk_score: score,
            excerpt,
            detected_keywords: keywords,
          })

          // 一つのカテゴリで複数のエスカレーションを検出しないようにbreak
          break
        }
      }
    }

    // エスカレーション情報をSupabaseに保存
    if (escalations.length > 0) {
      const { data, error } = await supabase.from("escalations").insert(escalations).select()

      if (error) {
        console.error("Failed to save escalations:", error)
        throw error
      }

      console.log("Saved escalations:", data)
      return escalations.length
    }

    return 0
  } catch (error) {
    console.error("Error generating escalations:", error)
    throw error
  }
}

// カテゴリ別のエスカレーション情報の取得
export async function getEscalationsByCategory(
  category: "technical" | "business" | "personnel",
): Promise<EscalationItem[]> {
  try {
    // ビューを使わずに直接結合クエリを実行
    const { data, error } = await supabase
      .from("escalations")
      .select(`
        *,
        themes:theme_id (name, category),
        minutes:minute_id (title, date, time)
      `)
      .eq("category", category)
      .eq("confirmed", false)
      .order("risk_score", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch escalations:", error)
      throw error
    }

    // 結果を整形
    return (data || []).map((item) => ({
      id: item.id,
      minute_id: item.minute_id,
      theme_id: item.theme_id,
      category: item.category,
      risk_score: item.risk_score,
      excerpt: item.excerpt,
      detected_keywords: item.detected_keywords,
      confirmed: item.confirmed,
      confirmed_by: item.confirmed_by,
      confirmed_at: item.confirmed_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      theme_name: item.themes?.name,
      minute_date: item.minutes?.date,
      minute_title: item.minutes?.title,
    }))
  } catch (error) {
    console.error("Error fetching escalations:", error)
    return []
  }
}

// エスカレーション情報の確認済み設定
export async function confirmEscalation(escalationId: string): Promise<boolean> {
  try {
    // 現在のユーザーIDを取得（実際の実装では認証システムから取得）
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    // RPCを使わずに直接更新
    const { error } = await supabase
      .from("escalations")
      .update({
        confirmed: true,
        confirmed_by: userId || null,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", escalationId)

    if (error) {
      console.error("Failed to confirm escalation:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error confirming escalation:", error)
    return false
  }
}

// 全エスカレーション情報の取得
export async function getAllEscalations(): Promise<EscalationItem[]> {
  try {
    // ビューを使わずに直接結合クエリを実行
    const { data, error } = await supabase
      .from("escalations")
      .select(`
        *,
        themes:theme_id (name, category),
        minutes:minute_id (title, date, time)
      `)
      .order("risk_score", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch all escalations:", error)
      throw error
    }

    // 結果を整形
    return (data || []).map((item) => ({
      id: item.id,
      minute_id: item.minute_id,
      theme_id: item.theme_id,
      category: item.category,
      risk_score: item.risk_score,
      excerpt: item.excerpt,
      detected_keywords: item.detected_keywords,
      confirmed: item.confirmed,
      confirmed_by: item.confirmed_by,
      confirmed_at: item.confirmed_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      theme_name: item.themes?.name,
      minute_date: item.minutes?.date,
      minute_title: item.minutes?.title,
    }))
  } catch (error) {
    console.error("Error fetching all escalations:", error)
    return []
  }
}

// 確認済みエスカレーション情報の取得
export async function getConfirmedEscalations(): Promise<EscalationItem[]> {
  try {
    // ビューを使わずに直接結合クエリを実行
    const { data, error } = await supabase
      .from("escalations")
      .select(`
        *,
        themes:theme_id (name, category),
        minutes:minute_id (title, date, time)
      `)
      .eq("confirmed", true)
      .order("confirmed_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch confirmed escalations:", error)
      throw error
    }

    // 結果を整形
    return (data || []).map((item) => ({
      id: item.id,
      minute_id: item.minute_id,
      theme_id: item.theme_id,
      category: item.category,
      risk_score: item.risk_score,
      excerpt: item.excerpt,
      detected_keywords: item.detected_keywords,
      confirmed: item.confirmed,
      confirmed_by: item.confirmed_by,
      confirmed_at: item.confirmed_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      theme_name: item.themes?.name,
      minute_date: item.minutes?.date,
      minute_title: item.minutes?.title,
    }))
  } catch (error) {
    console.error("Error fetching confirmed escalations:", error)
    return []
  }
}

// 特定の議事録のエスカレーション情報を取得
export async function getEscalationsByMinute(minuteId: string): Promise<EscalationItem[]> {
  try {
    // ビューを使わずに直接結合クエリを実行
    const { data, error } = await supabase
      .from("escalations")
      .select(`
        *,
        themes:theme_id (name, category),
        minutes:minute_id (title, date, time)
      `)
      .eq("minute_id", minuteId)
      .order("risk_score", { ascending: false })

    if (error) {
      console.error("Failed to fetch escalations by minute:", error)
      throw error
    }

    // 結果を整形
    return (data || []).map((item) => ({
      id: item.id,
      minute_id: item.minute_id,
      theme_id: item.theme_id,
      category: item.category,
      risk_score: item.risk_score,
      excerpt: item.excerpt,
      detected_keywords: item.detected_keywords,
      confirmed: item.confirmed,
      confirmed_by: item.confirmed_by,
      confirmed_at: item.confirmed_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      theme_name: item.themes?.name,
      minute_date: item.minutes?.date,
      minute_title: item.minutes?.title,
    }))
  } catch (error) {
    console.error("Error fetching escalations by minute:", error)
    return []
  }
}

// エスカレーション統計情報の取得
export async function getEscalationStats(): Promise<{
  total: number
  technical: number
  business: number
  personnel: number
  confirmed: number
  unconfirmed: number
}> {
  try {
    const { data, error } = await supabase.from("escalations").select("category, confirmed")

    if (error) {
      console.error("Failed to fetch escalation stats:", error)
      throw error
    }

    const stats = {
      total: data?.length || 0,
      technical: data?.filter((e) => e.category === "technical").length || 0,
      business: data?.filter((e) => e.category === "business").length || 0,
      personnel: data?.filter((e) => e.category === "personnel").length || 0,
      confirmed: data?.filter((e) => e.confirmed).length || 0,
      unconfirmed: data?.filter((e) => !e.confirmed).length || 0,
    }

    return stats
  } catch (error) {
    console.error("Error fetching escalation stats:", error)
    return {
      total: 0,
      technical: 0,
      business: 0,
      personnel: 0,
      confirmed: 0,
      unconfirmed: 0,
    }
  }
}
