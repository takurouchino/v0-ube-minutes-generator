"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Edit, UserPlus, RefreshCw, Plus } from "lucide-react"
import Link from "next/link"
import {
  getThemes,
  getParticipantsByTheme,
  getParticipantsNotInTheme,
  addParticipantToTheme,
  removeParticipantFromTheme,
  updateParticipantRoleInTheme,
  type Theme,
  type Participant,
} from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"
import { AddParticipantModal } from "@/components/add-participant-modal"
// ParticipantRoleModalをインポート
import { ParticipantRoleModal } from "@/components/participant-role-modal"
// AddParticipantWithRoleModalをインポート
import { AddParticipantWithRoleModal } from "@/components/add-participant-with-role-modal"

export default function ThemeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // 強制的に再レンダリングするためのキー
  const [activeTab, setActiveTab] = useState("current")
  const [addParticipantModalOpen, setAddParticipantModalOpen] = useState(false)

  // 状態を追加
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<{
    id: string
    name: string
    currentRole: string
  } | null>(null)
  // 状態を追加
  const [addWithRoleModalOpen, setAddWithRoleModalOpen] = useState(false)

  // データを再読み込みする関数
  const refreshData = () => {
    setLoading(true)
    setRefreshKey((prev) => prev + 1)
    toast({
      title: "データを更新しています",
      description: "最新の情報を取得しています...",
    })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const themes = await getThemes()
        const foundTheme = themes.find((t) => t.id === params.id)

        if (foundTheme) {
          setTheme(foundTheme)

          // テーマに参加している参加者を取得
          const themeParticipants = await getParticipantsByTheme(foundTheme.id)
          setParticipants(themeParticipants)

          // テーマに参加していない参加者を取得
          const notInTheme = await getParticipantsNotInTheme(foundTheme.id)
          setAvailableParticipants(notInTheme)
        } else {
          setError("テーマが見つかりませんでした")
          // 少し待ってからリダイレクト
          setTimeout(() => router.push("/themes"), 2000)
        }
      } catch (err) {
        console.error("Failed to load theme data:", err)
        setError("データの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id, router, refreshKey]) // refreshKeyを依存配列に追加

  // 参加者の選択状態を切り替え
  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    )
  }

  // 選択した参加者をテーマに追加
  const handleAddParticipants = async () => {
    if (!theme) return
    if (selectedParticipants.length === 0) {
      toast({
        title: "参加者が選択されていません",
        description: "追加する参加者を選択してください",
        variant: "destructive",
      })
      return
    }

    try {
      // 選択した参加者をテーマに追加
      for (const participantId of selectedParticipants) {
        await addParticipantToTheme(theme.id, participantId)
      }

      toast({
        title: "参加者を追加しました",
        description: `${selectedParticipants.length}名の参加者をテーマに追加しました`,
      })

      // 選択をリセット
      setSelectedParticipants([])
      // データを再読み込み
      refreshData()
    } catch (error) {
      console.error("Failed to add participants:", error)
      toast({
        title: "エラー",
        description: "参加者の追加に失敗しました",
        variant: "destructive",
      })
    }
  }

  // 参加者をテーマから削除
  const handleRemoveParticipant = async (participantId: string) => {
    if (!theme) return
    if (confirm("この参加者をテーマから削除してもよろしいですか？")) {
      try {
        await removeParticipantFromTheme(theme.id, participantId)
        toast({
          title: "参加者を削除しました",
          description: "参加者をテーマから削除しました",
        })
        // データを再読み込み
        refreshData()
      } catch (error) {
        console.error("Failed to remove participant:", error)
        toast({
          title: "エラー",
          description: "参加者の削除に失敗しました",
          variant: "destructive",
        })
      }
    }
  }

  // 新規参加者が追加された後の処理
  const handleParticipantAdded = () => {
    // データを再読み込み
    refreshData()
    // 参加者追加タブに切り替え
    setActiveTab("add")
  }

  // 役割編集ボタンのハンドラーを追加
  const handleEditRole = (participant: Participant) => {
    const currentRole = participant.theme_roles?.[params.id] || "一般参加者"
    setEditingParticipant({
      id: participant.id,
      name: participant.name,
      currentRole,
    })
    setRoleModalOpen(true)
  }

  // 役割更新のハンドラーを追加
  const handleRoleUpdate = async (newRole: string) => {
    if (!editingParticipant) return

    try {
      const success = await updateParticipantRoleInTheme(params.id, editingParticipant.id, newRole)

      if (success) {
        // データを再読み込み
        refreshData()
        setEditingParticipant(null)
      } else {
        throw new Error("役割の更新に失敗しました")
      }
    } catch (error) {
      console.error("Failed to update role:", error)
      toast({
        title: "エラー",
        description: "役割の更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  // 参加者追加のハンドラーを更新
  const handleAddParticipantWithRole = async (participantId: string, role: string) => {
    if (!theme) return

    try {
      const success = await addParticipantToTheme(theme.id, participantId, role)

      if (success) {
        toast({
          title: "参加者を追加しました",
          description: `参加者をテーマに追加し、役割を「${role}」に設定しました`,
        })
        // データを再読み込み
        refreshData()
      } else {
        throw new Error("参加者の追加に失敗しました")
      }
    } catch (error) {
      console.error("Failed to add participant:", error)
      toast({
        title: "エラー",
        description: "参加者の追加に失敗しました",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center h-[50vh]">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button asChild>
            <Link href="/themes">テーマ一覧に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!theme) {
    return null
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/themes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{theme.name}</h1>
        <Button variant="ghost" size="sm" onClick={refreshData} className="ml-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>テーマ情報</CardTitle>
              <CardDescription>テーマの基本情報です。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">テーマ名</h3>
                <p>{theme.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">カテゴリ</h3>
                <Badge variant="outline">{theme.category}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium">説明</h3>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">作成日</h3>
                <p className="text-sm">{theme.created_at ? new Date(theme.created_at).toLocaleDateString() : "不明"}</p>
              </div>

              <div className="pt-2">
                <Button asChild>
                  <Link href={`/themes/${theme.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    編集する
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>参加者管理</CardTitle>
                <CardDescription>このテーマの参加者を管理します。</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="current">現在の参加者</TabsTrigger>
                  <TabsTrigger value="add">参加者追加</TabsTrigger>
                </TabsList>

                <TabsContent value="current">
                  {participants.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">参加者がいません</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>氏名</TableHead>
                          <TableHead>基本役割</TableHead>
                          <TableHead>テーマ内役割</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell className="font-medium">
                              {participant.name}
                              <div className="text-xs text-muted-foreground">{participant.position}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{participant.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{participant.theme_roles?.[params.id] || "一般参加者"}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditRole(participant)}>
                                  役割編集
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveParticipant(participant.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  削除
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="add">
                  <div className="mb-4">
                    <Button onClick={() => setAddParticipantModalOpen(true)} className="w-full mb-2">
                      <Plus className="mr-2 h-4 w-4" />
                      新規参加者を追加
                    </Button>
                    <Button
                      onClick={() => setAddWithRoleModalOpen(true)}
                      className="w-full"
                      disabled={availableParticipants.length === 0}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      既存参加者を役割付きで追加
                    </Button>
                  </div>

                  {availableParticipants.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      追加できる参加者がいません。
                      <Button
                        variant="link"
                        onClick={() => setAddParticipantModalOpen(true)}
                        className="ml-2 p-0 h-auto"
                      >
                        新しい参加者を登録する
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                          {availableParticipants.map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center space-x-2 py-2 border-b last:border-0"
                            >
                              <Checkbox
                                id={`participant-${participant.id}`}
                                checked={selectedParticipants.includes(participant.id)}
                                onCheckedChange={() => toggleParticipant(participant.id)}
                              />
                              <div>
                                <label htmlFor={`participant-${participant.id}`} className="font-medium cursor-pointer">
                                  {participant.name}
                                </label>
                                <div className="text-xs text-muted-foreground">
                                  {participant.position} - {participant.role}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={handleAddParticipants}
                          disabled={selectedParticipants.length === 0}
                          className="w-full"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          選択した参加者を追加 ({selectedParticipants.length}名)
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddParticipantModal
        open={addParticipantModalOpen}
        onOpenChange={setAddParticipantModalOpen}
        onParticipantAdded={handleParticipantAdded}
      />
      {editingParticipant && (
        <ParticipantRoleModal
          open={roleModalOpen}
          onOpenChange={setRoleModalOpen}
          participantName={editingParticipant.name}
          currentRole={editingParticipant.currentRole}
          onRoleUpdate={handleRoleUpdate}
        />
      )}
      <AddParticipantWithRoleModal
        open={addWithRoleModalOpen}
        onOpenChange={setAddWithRoleModalOpen}
        availableParticipants={availableParticipants}
        onParticipantAdd={handleAddParticipantWithRole}
      />
    </div>
  )
}
