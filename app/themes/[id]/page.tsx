"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Plus, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import {
  getThemes,
  getParticipantsByTheme,
  removeParticipantFromTheme,
  type Theme,
  type Participant,
} from "@/lib/supabase-storage"
import { AddParticipantWithRoleModal } from "@/components/add-participant-with-role-modal"
import { ParticipantRoleModal } from "@/components/participant-role-modal"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"

export default function ThemeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const themeId = params.id as string

  const [theme, setTheme] = useState<Theme | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false)
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; path: string; url: string }>>([])

  useEffect(() => {
    const loadThemeAndParticipants = async () => {
      if (!userProfile?.company_id) {
        setError("認証が必要です")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // テーマ情報を取得
        const themes = await getThemes(userProfile.company_id)
        const currentTheme = themes.find((t) => t.id === themeId)

        if (!currentTheme) {
          setError("テーマが見つかりません")
          setLoading(false)
          return
        }

        setTheme(currentTheme)

        // 参考資料のJSONをパースしてファイル情報を設定
        if (currentTheme.reference) {
          // references → reference に変更
          try {
            const filesData = JSON.parse(currentTheme.reference) // references → reference に変更
            if (Array.isArray(filesData)) {
              setUploadedFiles(filesData)
            }
          } catch (e) {
            // 既存のテキスト形式の参照情報の場合はそのまま表示
            console.log("Reference is not in JSON format, keeping as text")
          }
        }

        // テーマの参加者を取得
        const themeParticipants = await getParticipantsByTheme(themeId, userProfile.company_id)
        setParticipants(themeParticipants)
        setError(null)
      } catch (error) {
        console.error("Failed to load theme details:", error)
        setError("テーマ情報の読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    if (themeId) {
      loadThemeAndParticipants()
    }
  }, [themeId, userProfile])

  const handleAddParticipant = (newParticipant: Participant) => {
    setParticipants((prev) => [...prev, newParticipant])
    toast({
      title: "参加者を追加しました",
      description: `${newParticipant.name}をテーマに追加しました。`,
    })
  }

  const handleUpdateRole = (participantId: string, newRole: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          return {
            ...p,
            theme_roles: { ...p.theme_roles, [themeId]: newRole },
          }
        }
        return p
      }),
    )
    toast({
      title: "役割を更新しました",
      description: "参加者の役割を更新しました。",
    })
  }

  const handleRemoveParticipant = async (participantId: string, participantName: string) => {
    if (!userProfile?.company_id) {
      toast({
        title: "エラー",
        description: "認証が必要です",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      const success = await removeParticipantFromTheme(themeId, participantId, userProfile.company_id)

      if (success) {
        setParticipants((prev) => prev.filter((p) => p.id !== participantId))
        toast({
          title: "参加者を削除しました",
          description: `${participantName}をテーマから削除しました。`,
        })
      } else {
        throw new Error("Failed to remove participant")
      }
    } catch (error) {
      console.error("Failed to remove participant:", error)
      toast({
        title: "エラー",
        description: "参加者の削除に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditRoleModal = (participant: Participant) => {
    setSelectedParticipant(participant)
    setIsEditRoleModalOpen(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !theme) {
    return (
      <div className="container mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || "テーマ情報の読み込みに失敗しました"}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/themes")}>
            テーマ一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/themes">
            <ArrowLeft className="h-4 w-4 mr-1" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex-grow">{theme.name}</h1>
        <Button variant="outline" size="sm" className="mr-2" asChild>
          <Link href={`/themes/${themeId}/edit`}>
            <Pencil className="h-4 w-4 mr-1" />
            編集
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>テーマ情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">カテゴリ</dt>
                <dd className="mt-1">{theme.category || "未設定"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">説明</dt>
                <dd className="mt-1 whitespace-pre-wrap">{theme.description || "説明はありません"}</dd>
              </div>
              {/* 新しいフィールドを表示 */}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">プロジェクトの背景</dt>
                <dd className="mt-1 whitespace-pre-wrap">{theme.background || "未設定"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">目的</dt>
                <dd className="mt-1 whitespace-pre-wrap">{theme.purpose || "未設定"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">参考資料</dt>
                {uploadedFiles.length > 0 ? (
                  <dd className="mt-2">
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center p-2 bg-muted rounded-md">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {file.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </dd>
                ) : (
                  <dd className="mt-1 whitespace-pre-wrap">{theme.reference || "未設定"}</dd> // references → reference に変更
                )}
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>参加者一覧</CardTitle>
              <CardDescription>このテーマに参加しているメンバーです</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddParticipantModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              参加者追加
            </Button>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                参加者がいません。「参加者追加」ボタンから追加してください。
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {participant.position && `${participant.position} | `}
                        {participant.theme_roles?.[themeId] || "一般参加者"}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditRoleModal(participant)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        役割変更
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            削除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>参加者を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              {participant.name}をこのテーマから削除します。この操作は取り消せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveParticipant(participant.id, participant.name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 参加者追加モーダル */}
      <AddParticipantWithRoleModal
        themeId={themeId}
        isOpen={isAddParticipantModalOpen}
        onClose={() => setIsAddParticipantModalOpen(false)}
        onAddParticipant={handleAddParticipant}
        existingParticipantIds={participants.map((p) => p.id)}
      />

      {/* 役割編集モーダル */}
      {selectedParticipant && (
        <ParticipantRoleModal
          themeId={themeId}
          participant={selectedParticipant}
          isOpen={isEditRoleModalOpen}
          onClose={() => setIsEditRoleModalOpen(false)}
          onUpdateRole={handleUpdateRole}
        />
      )}
    </div>
  )
}
