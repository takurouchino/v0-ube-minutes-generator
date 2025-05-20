"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wand2, Edit, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DocumentSuggestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentText: string
  onApplySuggestions: (text: string) => void
}

type Suggestion = {
  id: string
  original: string
  suggested: string
  reason: string
}

export function DocumentSuggestionModal({
  open,
  onOpenChange,
  documentText,
  onApplySuggestions,
}: DocumentSuggestionModalProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [editedText, setEditedText] = useState(documentText)
  const [isEditing, setIsEditing] = useState(false)

  // ランダムな修正提案を生成する関数
  const generateRandomSuggestions = (text: string): Suggestion[] => {
    // テキストを行に分割
    const lines = text.split(/\n+/).filter((line) => line.trim().length > 0)
    if (lines.length === 0) return []

    // 修正候補となるパターン
    const suggestionPatterns = [
      {
        pattern: /(\d+)%/,
        replace: (match: string, p1: string) => {
          const num = Number.parseInt(p1, 10)
          const newNum = Math.min(99, num + Math.floor(Math.random() * 10) + 5)
          return `${newNum}%`
        },
        reason: "より正確な数値に更新しました",
      },
      {
        pattern: /(検討|確認|実施)する/,
        replace: (match: string, p1: string) => {
          const date = new Date()
          date.setDate(date.getDate() + Math.floor(Math.random() * 14) + 1)
          const month = date.getMonth() + 1
          const day = date.getDate()
          return `${p1}する（${month}/${day}までに）`
        },
        reason: "期限を明確にすることで、アクションの実行確度が高まります",
      },
      {
        pattern: /(会議|打ち合わせ)/,
        replace: (match: string) => `${match}（全関係者必須）`,
        reason: "参加者の範囲を明確にすることで、必要なステークホルダーの参加を確保します",
      },
      {
        pattern: /(報告|連絡)/,
        replace: (match: string, p1: string) => `${p1}（メールおよび口頭で）`,
        reason: "連絡手段を明確にすることで、情報伝達の確実性が高まります",
      },
      {
        pattern: /(課題|問題)/,
        replace: (match: string) => `重要${match}`,
        reason: "優先度を明確にすることで、対応の緊急性が伝わります",
      },
    ]

    const suggestions: Suggestion[] = []

    // ランダムに2〜4行を選んで修正
    const numModifications = Math.min(lines.length, Math.floor(Math.random() * 3) + 2)
    const lineIndices = new Set<number>()

    while (lineIndices.size < numModifications) {
      lineIndices.add(Math.floor(Math.random() * lines.length))
    }

    lineIndices.forEach((index) => {
      const line = lines[index]

      // ランダムにパターンを選択
      const patternIndex = Math.floor(Math.random() * suggestionPatterns.length)
      const { pattern, replace, reason } = suggestionPatterns[patternIndex]

      if (pattern.test(line)) {
        const original = line
        const suggested = line.replace(pattern, replace as any)

        if (original !== suggested) {
          suggestions.push({
            id: `${index}-${Date.now()}`,
            original,
            suggested,
            reason,
          })
        }
      }
    })

    // 特定のパターンが見つからない場合のフォールバック
    if (suggestions.length === 0) {
      const randomLineIndex = Math.floor(Math.random() * lines.length)
      const line = lines[randomLineIndex]

      if (line.length > 10) {
        const original = line
        const suggested = `${line}（優先対応）`

        suggestions.push({
          id: `fallback-${Date.now()}`,
          original,
          suggested,
          reason: "優先度を明確にすることで、対応の緊急性が伝わります",
        })
      }
    }

    return suggestions
  }

  // 修正提案を生成
  const handleGenerateSuggestions = async () => {
    if (!documentText.trim()) {
      toast({
        title: "エラー",
        description: "議事録原稿が空です",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)

    try {
      // 実際のアプリケーションではOpenAI APIを呼び出す
      // ここではランダムな修正提案を生成
      setTimeout(() => {
        // ランダムな修正提案を生成
        const randomSuggestions = generateRandomSuggestions(documentText)

        // 固定の修正提案（ドキュメント内に該当する文字列があれば使用）
        const fixedSuggestions: Suggestion[] = [
          {
            id: "1",
            original: "不良率が上昇傾向にある",
            suggested: "不良率が15%上昇している",
            reason: "具体的な数値を入れることで状況の深刻さが明確になります",
          },
          {
            id: "2",
            original: "設備メンテナンス頻度の見直し",
            suggested: "設備メンテナンス頻度を週1回から日次に変更",
            reason: "具体的な変更内容を明記することで、アクションが明確になります",
          },
          {
            id: "3",
            original: "次回会議で報告する",
            suggested: "次回会議（6/15）で生産管理部が報告する",
            reason: "日付と担当部署を明記することで、責任の所在が明確になります",
          },
          {
            id: "4",
            original: "品質改善策を検討する",
            suggested: "検査工程の見直しと作業手順書の改訂による品質改善策を検討する",
            reason: "具体的な改善策を明記することで、アクションが明確になります",
          },
        ]

        // ドキュメント内に該当する文字列があるものだけをフィルタリング
        const filteredFixedSuggestions = fixedSuggestions.filter((suggestion) =>
          documentText.includes(suggestion.original),
        )

        // ランダム生成と固定の提案を組み合わせる
        const allSuggestions = [...randomSuggestions, ...filteredFixedSuggestions]

        // 提案がない場合はランダムな提案を追加
        if (allSuggestions.length === 0) {
          allSuggestions.push({
            id: "random-1",
            original: "報告",
            suggested: "詳細な報告書を提出",
            reason: "報告内容の形式を明確にすることで、情報の質が向上します",
          })
        }

        setSuggestions(allSuggestions)

        // 修正提案を適用した文章を生成
        let newText = documentText
        allSuggestions.forEach((suggestion) => {
          newText = newText.replace(suggestion.original, suggestion.suggested)
        })
        setEditedText(newText)

        setIsGenerating(false)
      }, 1500)
    } catch (error) {
      console.error("Failed to generate suggestions:", error)
      setErrorMessage("修正提案の生成に失敗しました")
      setIsGenerating(false)
    }
  }

  // 修正を適用
  const handleApplySuggestions = () => {
    onApplySuggestions(editedText)
    onOpenChange(false)
    toast({
      title: "修正を適用しました",
      description: "議事録原稿に修正が反映されました",
    })
  }

  // 編集モードの切り替え
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  // 修正提案をハイライト表示するための関数
  const highlightSuggestions = (text: string) => {
    if (suggestions.length === 0) return text

    let highlightedText = text
    suggestions.forEach((suggestion) => {
      highlightedText = highlightedText.replace(
        suggestion.suggested,
        `<span class="text-red-600 font-bold">${suggestion.suggested}</span>`,
      )
    })

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ドキュメント修正提案</DialogTitle>
          <DialogDescription>
            AIが議事録原稿の改善点を提案します。修正箇所は赤字でハイライトされます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">元の議事録原稿</h3>
            <div className="border rounded-md p-4 h-[650px] overflow-y-auto whitespace-pre-wrap">{documentText}</div>
            <Button onClick={handleGenerateSuggestions} disabled={isGenerating} className="w-full h-10">
              {isGenerating ? (
                <>生成中...</>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  修正提案を生成
                </>
              )}
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">修正後の議事録原稿</h3>
              <Button variant="outline" size="sm" onClick={toggleEditMode}>
                {isEditing ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    編集完了
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    編集する
                  </>
                )}
              </Button>
            </div>
            {isEditing ? (
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="h-[650px] resize-none"
              />
            ) : (
              <div className="border rounded-md p-4 h-[650px] overflow-y-auto whitespace-pre-wrap">
                {suggestions.length > 0 ? highlightSuggestions(editedText) : editedText}
              </div>
            )}
            <Button
              onClick={handleApplySuggestions}
              disabled={suggestions.length === 0 && !isEditing}
              className="w-full h-10"
            >
              修正完了＆FB
            </Button>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラーが発生しました</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {suggestions.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">修正提案一覧</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>元のテキスト</TableHead>
                  <TableHead>修正提案</TableHead>
                  <TableHead>理由</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((suggestion) => (
                  <TableRow key={suggestion.id}>
                    <TableCell>{suggestion.original}</TableCell>
                    <TableCell className="text-red-600 font-bold">{suggestion.suggested}</TableCell>
                    <TableCell>{suggestion.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
