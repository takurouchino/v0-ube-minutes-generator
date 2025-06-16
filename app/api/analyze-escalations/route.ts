import { NextResponse } from "next/server"
import OpenAI from "openai"
import { type EscalationItem } from "@/lib/supabase-escalations"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { content, minuteId, themeName, minuteDate, companyId } = await request.json()

    if (!minuteId) {
      return NextResponse.json({ escalations: [] })
    }

    // パターンマッチングによるリスク検知
    const patterns = [
      { pattern: /不良(率|品|が多い|が発生|が増加|が目立つ|が問題|の発生|の増加|の原因)?/i, summary: "品質不良に関するリスク", category: "technical" as const, score: 70 },
      { pattern: /品質.*?(低下|悪化|問題|不良|課題|懸念|障害)/i, summary: "品質に関するリスク", category: "technical" as const, score: 65 },
      { pattern: /停止|トラブル|異常|故障|エラー|バグ/i, summary: "設備・システムのリスク", category: "technical" as const, score: 80 },
      { pattern: /課題|問題|懸念|障害/i, summary: "課題・問題に関するリスク", category: "business" as const, score: 60 },
      { pattern: /出荷停止|納期遅延|遅れ/i, summary: "納期・出荷に関するリスク", category: "business" as const, score: 75 },
    ]

    const escalations: EscalationItem[] = []
    for (const { pattern, summary, category, score } of patterns) {
      const match = content.match(pattern)
      if (match) {
        // マッチした部分の前後50文字を抜粋
        const matchIndex = match.index || 0
        const start = Math.max(0, matchIndex - 50)
        const end = Math.min(content.length, matchIndex + match[0].length + 50)
        const excerpt = content.substring(start, end).replace(/\n/g, " ")
        
        escalations.push({
          id: crypto.randomUUID(),
          minute_id: minuteId,
          theme_name: themeName,
          minute_date: minuteDate,
          risk_score: score,
          content: excerpt,
          summary: summary,
          category,
          confirmed: false,
          created_at: new Date().toISOString(),
          company_id: companyId
        })
      }
    }

    return NextResponse.json({ escalations })
  } catch (error) {
    console.error("Error analyzing escalations:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze escalations" },
      { status: 500 }
    )
  }
}

function parseEscalationAnalysis(
  analysis: string,
  minuteId: string,
  themeName: string | null,
  minuteDate: string,
  companyId: string
): EscalationItem[] {
  const escalations: EscalationItem[] = []
  const sections = analysis.split("\n\n")

  for (const section of sections) {
    const categoryMatch = section.match(/カテゴリ: (technical|business|personnel)/i)
    const scoreMatch = section.match(/リスクスコア: (\d+)/i)
    const summaryMatch = section.match(/リスクの要約: (.+)/i)
    const contentMatch = section.match(/関連する議事録の内容: (.+)/i)

    if (categoryMatch && scoreMatch && summaryMatch && contentMatch) {
      const category = categoryMatch[1].toLowerCase() as "technical" | "business" | "personnel"
      const riskScore = parseInt(scoreMatch[1])
      const summary = summaryMatch[1].trim()
      const content = contentMatch[1].trim()

      escalations.push({
        minute_id: minuteId || "",
        theme_name: themeName,
        risk_score: riskScore,
        summary,
        content,
        excerpt: content,
        category,
        company_id: companyId,
      })
    }
  }

  return escalations
} 