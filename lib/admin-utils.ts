// 管理者向けユーティリティ関数
import { supabase } from "./supabase"

/**
 * 特定のユーザーの会社IDを更新する
 * 注意: この関数は管理者のみが使用すべきです
 */
export async function updateUserCompany(email: string, companyId: string) {
  try {
    // 1. ユーザーIDを取得
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (userError) {
      console.error("ユーザー取得エラー:", userError)
      return { success: false, error: userError }
    }

    if (!userData) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    // 2. ユーザーの会社IDを更新
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ company_id: companyId })
      .eq("id", userData.id)

    if (updateError) {
      console.error("ユーザー更新エラー:", updateError)
      return { success: false, error: updateError }
    }

    return { success: true }
  } catch (error) {
    console.error("予期しないエラー:", error)
    return { success: false, error }
  }
}

/**
 * 会社一覧を取得する
 */
export async function getCompanies() {
  try {
    const { data, error } = await supabase.from("companies").select("*").order("name")

    if (error) {
      console.error("会社取得エラー:", error)
      return { success: false, error, companies: [] }
    }

    return { success: true, companies: data || [] }
  } catch (error) {
    console.error("予期しないエラー:", error)
    return { success: false, error, companies: [] }
  }
}

/**
 * 新しい会社を登録する
 */
export async function createCompany(name: string, slug: string, description?: string) {
  try {
    const { data, error } = await supabase
      .from("companies")
      .insert({
        name,
        slug,
        description: description || null,
      })
      .select()

    if (error) {
      console.error("会社作成エラー:", error)
      return { success: false, error }
    }

    return { success: true, company: data?.[0] }
  } catch (error) {
    console.error("予期しないエラー:", error)
    return { success: false, error }
  }
}
