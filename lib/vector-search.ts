// Vector検索による関連議事録の絞り込み
import { supabase } from "./supabase"

export interface SimilaritySearchResult {
  id: string
  title: string
  content: string
  similarity: number
}

// 将来的なVector検索実装のための準備
export async function searchSimilarMinutes(
  query: string, 
  companyId: string, 
  limit: number = 5
): Promise<SimilaritySearchResult[]> {
  try {
    // 現在はキーワードベースの検索を実装
    // 将来的にはembeddingを使用したベクトル検索に置き換え
    const { data, error } = await supabase
      .from("minutes")
      .select("id, title, content, summary_key_points, summary_decisions")
      .eq("company_id", companyId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary_key_points.ilike.%${query}%`)
      .limit(limit)
      .order("date", { ascending: false })

    if (error) throw error

    // 簡易的な類似度スコアを計算
    return (data || []).map((minute: any) => {
      const text = `${minute.title} ${minute.content} ${minute.summary_key_points}`.toLowerCase()
      const queryWords = query.toLowerCase().split(/\s+/)
      const matches = queryWords.filter(word => text.includes(word)).length
      const similarity = matches / queryWords.length

      return {
        id: minute.id,
        title: minute.title,
        content: minute.content,
        similarity
      }
    }).sort((a, b) => b.similarity - a.similarity)

  } catch (error) {
    console.error("Error in similarity search:", error)
    return []
  }
}

// Vector検索用のembedding生成（将来実装）
export async function generateEmbedding(text: string): Promise<number[]> {
  // TODO: OpenAI Embeddings APIを使用してembeddingを生成
  // const response = await openai.embeddings.create({
  //   model: "text-embedding-3-small",
  //   input: text
  // })
  // return response.data[0].embedding
  
  // 現在は空配列を返す
  return []
}

// Vector検索の実装（将来）
export async function vectorSearch(
  queryEmbedding: number[], 
  companyId: string, 
  limit: number = 5
): Promise<SimilaritySearchResult[]> {
  // TODO: Supabaseのpgvectorを使用したベクトル検索
  // SELECT id, title, content, 1 - (embedding <=> $1) as similarity
  // FROM minutes 
  // WHERE company_id = $2
  // ORDER BY embedding <=> $1
  // LIMIT $3
  
  return []
}

