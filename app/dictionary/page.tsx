"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getDictionaryEntries,
  getDictionaryStats,
  type DictionaryEntry,
  addDictionaryEntry,
  updateDictionaryEntry,
  deleteDictionaryEntry,
} from "@/lib/supabase-dictionary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, RefreshCw, Pencil, Trash2, X, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

const CATEGORIES = [
  { value: "person", label: "人名" },
  { value: "company", label: "企業名" },
  { value: "product", label: "製品名" },
  { value: "technical", label: "技術用語" },
  { value: "department", label: "部署名" },
  { value: "meeting", label: "会議用語" },
  { value: "other", label: "その他" },
]

export default function DictionaryPage() {
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const [entries, setEntries] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {} as Record<string, number>,
    mostUsed: [] as DictionaryEntry[],
  })

  // フォームの状態
  const [form, setForm] = useState({
    incorrect_term: "",
    correct_term: "",
    category: "",
    pronunciation: "",
    description: "",
  })

  // データの読み込み
  const loadData = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      console.log("Loading dictionary data from database with companyId:", userProfile?.company_id)

      // データベースから辞書エントリを取得
      const entriesData = await getDictionaryEntries(userProfile?.company_id)
      console.log(`Fetched ${entriesData.length} dictionary entries from database:`, entriesData)
      setEntries(entriesData)

      // データベースから統計情報を取得
      const statsData = await getDictionaryStats(userProfile?.company_id)
      console.log("Fetched dictionary stats from database:", statsData)
      setStats(statsData)
    } catch (error) {
      console.error("Failed to load data from database:", error)
      setLoadError(
        `データベースからの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      )
      toast({
        title: "データベース接続エラー",
        description: "辞書データの読み込みに失敗しました。ネットワーク接続を確認してください。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userProfile?.company_id) {
      loadData()
    } else {
      setLoading(false)
      setLoadError("ユーザープロファイルまたは会社IDが取得できません")
    }
  }, [userProfile])

  // フォームのリセット
  const resetForm = () => {
    setForm({
      incorrect_term: "",
      correct_term: "",
      category: "",
      pronunciation: "",
      description: "",
    })
  }

  // 新規追加開始
  const startAdding = () => {
    resetForm()
    setIsAdding(true)
  }

  // 編集開始
  const startEditing = (entry: DictionaryEntry) => {
    setForm({
      incorrect_term: entry.incorrect_term,
      correct_term: entry.correct_term,
      category: entry.category,
      pronunciation: entry.pronunciation || "",
      description: entry.description || "",
    })
    setEditingId(entry.id)
  }

  // 保存処理
  const handleSave = async () => {
    try {
      if (!form.incorrect_term || !form.correct_term || !form.category) {
        toast({
          title: "入力エラー",
          description: "誤表記、正表記、カテゴリは必須項目です",
          variant: "destructive",
        })
        return
      }

      if (editingId) {
        // 編集モード
        const success = await updateDictionaryEntry({
          ...form,
          id: editingId,
          usage_count: entries.find((e) => e.id === editingId)?.usage_count || 0,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          company_id: userProfile?.company_id,
        })

        if (success) {
          toast({
            title: "更新完了",
            description: "辞書項目をデータベースに更新しました",
          })
          setEditingId(null)
          loadData() // データベースから再読み込み
        }
      } else {
        // 新規追加モード
        const newEntry = await addDictionaryEntry(form, userProfile?.company_id)

        if (newEntry) {
          toast({
            title: "追加完了",
            description: "新しい辞書項目をデータベースに追加しました",
          })
          setIsAdding(false)
          loadData() // データベースから再読み込み
        }
      }
    } catch (error) {
      console.error("Failed to save to database:", error)
      toast({
        title: "データベース保存エラー",
        description: "辞書項目の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  // キャンセル処理
  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    resetForm()
  }

  // 削除処理
  const handleDelete = async (id: string) => {
    try {
      const success = await deleteDictionaryEntry(id, userProfile?.company_id)

      if (success) {
        toast({
          title: "削除完了",
          description: "辞書項目をデータベースから削除しました",
        })
        loadData() // データベースから再読み込み
      }
    } catch (error) {
      console.error("Failed to delete from database:", error)
      toast({
        title: "データベース削除エラー",
        description: "辞書項目の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  // フィルタリングされたエントリを取得
  const getFilteredEntries = () => {
    if (activeTab === "all") return entries
    return entries.filter((entry) => entry.category === activeTab)
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center h-[50vh]">
        <p>データベースから辞書データを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">カスタム辞書管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            データベースから更新
          </Button>
          <Button onClick={startAdding}>
            <Plus className="mr-2 h-4 w-4" />
            新規追加
          </Button>
        </div>
      </div>

      {/* エラー表示 */}
      {loadError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総登録数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">カテゴリ数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最多使用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.mostUsed[0] ? (
                <div>
                  <div className="font-medium">{stats.mostUsed[0].correct_term}</div>
                  <div className="text-muted-foreground">{stats.mostUsed[0].usage_count}回使用</div>
                </div>
              ) : (
                "データなし"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 新規追加フォーム */}
      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>新規辞書項目の追加</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incorrect_term">誤表記 *</Label>
                  <Input
                    id="incorrect_term"
                    value={form.incorrect_term}
                    onChange={(e) => setForm({ ...form, incorrect_term: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="correct_term">正表記 *</Label>
                  <Input
                    id="correct_term"
                    value={form.correct_term}
                    onChange={(e) => setForm({ ...form, correct_term: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">カテゴリ *</Label>
                  <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pronunciation">読み方</Label>
                  <Input
                    id="pronunciation"
                    value={form.pronunciation}
                    onChange={(e) => setForm({ ...form, pronunciation: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  キャンセル
                </Button>
                <Button onClick={handleSave}>データベースに保存</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* エントリが0件の場合のメッセージ */}
      {entries.length === 0 && !loading && !isAdding && (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">データベースに辞書データがまだ登録されていません</p>
            <Button onClick={startAdding}>
              <Plus className="mr-2 h-4 w-4" />
              新規追加
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 辞書項目一覧 */}
      {entries.length > 0 && !isAdding && (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all">すべて</TabsTrigger>
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <TabsTrigger key={category} value={category}>
                  {CATEGORIES.find((c) => c.value === category)?.label || category} ({count})
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={activeTab}>
              <div className="space-y-4">
                {getFilteredEntries().map((entry) => (
                  <Card key={entry.id} className={editingId === entry.id ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      {editingId === entry.id ? (
                        <div className="grid gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit_incorrect_${entry.id}`}>誤表記 *</Label>
                              <Input
                                id={`edit_incorrect_${entry.id}`}
                                value={form.incorrect_term}
                                onChange={(e) => setForm({ ...form, incorrect_term: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit_correct_${entry.id}`}>正表記 *</Label>
                              <Input
                                id={`edit_correct_${entry.id}`}
                                value={form.correct_term}
                                onChange={(e) => setForm({ ...form, correct_term: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit_category_${entry.id}`}>カテゴリ *</Label>
                              <Select
                                value={form.category}
                                onValueChange={(value) => setForm({ ...form, category: value })}
                              >
                                <SelectTrigger id={`edit_category_${entry.id}`}>
                                  <SelectValue placeholder="カテゴリを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
                                      {category.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`edit_pronunciation_${entry.id}`}>読み方</Label>
                              <Input
                                id={`edit_pronunciation_${entry.id}`}
                                value={form.pronunciation}
                                onChange={(e) => setForm({ ...form, pronunciation: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`edit_description_${entry.id}`}>説明</Label>
                            <Textarea
                              id={`edit_description_${entry.id}`}
                              value={form.description}
                              onChange={(e) => setForm({ ...form, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={handleCancel}>
                              <X className="mr-1 h-4 w-4" />
                              キャンセル
                            </Button>
                            <Button size="sm" onClick={handleSave}>
                              <Check className="mr-1 h-4 w-4" />
                              保存
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">
                                <span className="text-red-500">{entry.incorrect_term}</span>
                                {" → "}
                                <span className="text-green-600">{entry.correct_term}</span>
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {CATEGORIES.find((c) => c.value === entry.category)?.label || entry.category}
                                {entry.pronunciation && ` ・ 読み: ${entry.pronunciation}`}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => startEditing(entry)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {entry.description && <p className="text-sm mt-2">{entry.description}</p>}
                          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                            <span>使用回数: {entry.usage_count}回</span>
                            <span>{new Date(entry.created_at).toLocaleDateString()}作成</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
