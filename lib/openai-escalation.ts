import { type EscalationItem } from "./supabase-escalations"

export async function analyzeEscalations(
  content: string,
  minuteId: string,
  themeName: string | null,
  minuteDate: string | null,
  companyId?: string
): Promise<EscalationItem[]> {
  try {
    const response = await fetch("/api/analyze-escalations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        minuteId,
        themeName,
        minuteDate: minuteDate || new Date().toISOString().split('T')[0],
        companyId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to analyze escalations")
    }

    const data = await response.json()
    return data.escalations
  } catch (error) {
    console.error("Error in analyzeEscalations:", error)
    if (error instanceof Error) {
      throw new Error(`エスカレーション分析に失敗しました: ${error.message}`)
    }
    throw new Error("エスカレーション分析に失敗しました")
  }
} 