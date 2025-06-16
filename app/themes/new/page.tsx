"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { addTheme, addParticipantToTheme, getParticipants } from "@/lib/supabase-storage"
import { supabase } from "@/lib/supabase"
import { Upload, File, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { AddParticipantWithRoleModal } from "@/components/add-participant-with-role-modal"
import { Participant } from "@/lib/supabase-storage"

export default function NewThemePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<{ company_id: string } | null>(null)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [background, setBackground] = useState("")
  const [purpose, setPurpose] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // ファイルアップロード関連の状態
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; path: string; url: string }>>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 参加者関連の状態
  const [participantsWithRole, setParticipantsWithRole] = useState<{
    id: string
    name: string
    position: string
    role: string
    department: string
    themes: string[]
    theme_roles: { [themeId: string]: string }
    created_at?: string
    updated_at?: string
    selectedRole: string
  }[]>([])
  const [addParticipantModalOpen, setAddParticipantModalOpen] = useState(false)
  const [editRoleIndex, setEditRoleIndex] = useState<number | null>(null)
  const [editRoleValue, setEditRoleValue] = useState<string>("")

  const [allParticipants, setAllParticipants] = useState<Participant[]>([])

  // ユーザープロファイルを取得
  useEffect(() => {
    async function getUserProfileAndParticipants() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // ユーザープロファイルを取得
          const { data, error } = await supabase
            .from("user_profiles")
            .select("company_id")
            .eq("id", session.user.id)
            .single()

          if (error) {
            console.error("Error fetching user profile:", error)
            throw error
          }

          if (data) {
            console.log("User profile loaded:", data)
            setUserProfile(data)
            // 会社IDが取得できたら参加者一覧も取得
            const participants = await getParticipants(data.company_id)
            setAllParticipants(participants)
          } else {
            console.error("No user profile found")
            toast({
              title: "エラー",
              description: "ユーザープロファイルが見つかりません。",
              variant: "destructive",
            })
          }
        } else {
          console.error("No active session")
          toast({
            title: "認証エラー",
            description: "ログインが必要です。",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error in getUserProfile:", error)
        toast({
          title: "エラー",
          description: "ユーザー情報の取得に失敗しました。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    getUserProfileAndParticipants()
  }, [toast])

  // ファイルアップロード処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userProfile?.company_id) {
      return
    }

    setUploading(true)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      // 一時的なテーマIDを生成（実際のテーマIDはまだ存在しないため）
      const tempThemeId = uuidv4()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `themes/${tempThemeId}/reference/${fileName}`

      const { error: uploadError } = await supabase.storage.from("theme-reference").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // 公開URLを取得
      const { data } = supabase.storage.from("theme-reference").getPublicUrl(filePath)

      const newFile = {
        name: file.name,
        path: filePath,
        url: data.publicUrl,
      }

      setUploadedFiles((prev) => [...prev, newFile])

      toast({
        title: "ファイルをアップロードしました",
        description: `${file.name} が正常にアップロードされました`,
      })
    } catch (error) {
      console.error("Failed to upload file:", error)
      toast({
        title: "エラー",
        description: "ファイルのアップロードに失敗しました",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // ファイル削除処理
  const handleFileDelete = async (index: number) => {
    try {
      const fileToDelete = uploadedFiles[index]

      // Supabaseストレージからファイルを削除
      const { error } = await supabase.storage.from("theme-reference").remove([fileToDelete.path])

      if (error) {
        throw error
      }

      // 状態からファイルを削除
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index))

      toast({
        title: "ファイルを削除しました",
        description: `${fileToDelete.name} が正常に削除されました`,
      })
    } catch (error) {
      console.error("Failed to delete file:", error)
      toast({
        title: "エラー",
        description: "ファイルの削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  // 参加者追加モーダルのコールバック
  const handleAddParticipant = (participant: Participant) => {
    setParticipantsWithRole((prev) => [
      ...prev,
      {
        ...participant,
        selectedRole: participant.theme_roles["new"] || Object.values(participant.theme_roles)[0] || "一般参加者",
      },
    ])
  }

  // 参加者削除
  const handleRemoveParticipant = (index: number) => {
    setParticipantsWithRole((prev) => prev.filter((_, i) => i !== index))
  }

  // 役割編集
  const handleEditRole = (index: number) => {
    setEditRoleIndex(index)
    setEditRoleValue(participantsWithRole[index].selectedRole)
  }
  const handleSaveRole = () => {
    if (editRoleIndex !== null) {
      setParticipantsWithRole((prev) =>
        prev.map((p, i) => (i === editRoleIndex ? { ...p, selectedRole: editRoleValue } : p)),
      )
      setEditRoleIndex(null)
      setEditRoleValue("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "入力エラー",
        description: "テーマ名を入力してください。",
        variant: "destructive",
      })
      return
    }

    if (!userProfile?.company_id) {
      toast({
        title: "エラー",
        description: "会社情報が取得できませんでした。再度ログインしてください。",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Creating theme with company_id:", userProfile.company_id)

      // アップロードされたファイル情報をJSON文字列に変換
      const referenceJson = uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null

      const themeData = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        background: background.trim() || null,
        purpose: purpose.trim() || null,
        reference: referenceJson, // ファイル情報をJSON形式で保存
      }

      console.log("Theme data:", themeData)

      const theme = await addTheme(themeData, userProfile.company_id)

      if (theme) {
        console.log("Theme created successfully:", theme)

        // 参加者＋役割をDBに保存
        for (const p of participantsWithRole) {
          await addParticipantToTheme(theme.id, p.id, p.selectedRole, userProfile.company_id)
        }

        // 明示的な成功メッセージを表示
        toast({
          title: "テーマ作成完了",
          description: `テーマ「${name}」を作成しました。テーマ一覧に移動します。`,
          duration: 5000, // 5秒間表示
        })

        // 少し遅延してからリダイレクト（トーストメッセージを見せるため）
        setTimeout(() => {
          router.push("/themes")
        }, 1000)
      } else {
        throw new Error("テーマの作成に失敗しました")
      }
    } catch (error) {
      console.error("Failed to create theme:", error)
      toast({
        title: "エラー",
        description: "テーマの作成に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">新規テーマ登録</h1>

      <Card>
        <CardHeader>
          <CardTitle>テーマ情報</CardTitle>
          <CardDescription>新しいテーマの情報を入力してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                テーマ名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 週次進捗会議"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例: プロジェクト会議"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="テーマの説明や目的などを入力してください"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">プロジェクトの背景</Label>
              <Textarea
                id="background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="このプロジェクト/テーマが始まった背景や経緯を入力してください"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">目的</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="このテーマの目的や達成したい成果を入力してください"
                rows={3}
              />
            </div>

            {/* 参考資料（ファイルアップロード形式に変更） */}
            <div className="space-y-2">
              <Label htmlFor="reference">参考資料</Label>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    id="file-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "アップロード中..." : "ファイルをアップロード"}
                  </Button>
                </div>

                {/* アップロードされたファイル一覧 */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">アップロードされたファイル:</p>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center">
                            <File className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDelete(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">削除</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 参加者設定セクション */}
            <div className="space-y-2">
              <Label>参加者設定</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setAddParticipantModalOpen(true)}>
                参加者追加
              </Button>
              {participantsWithRole.length > 0 && (
                <div className="mt-2 border rounded-md p-2">
                  {participantsWithRole.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{p.position}</span>
                        <span className="ml-2 text-xs text-muted-foreground">役割: {editRoleIndex === i ? (
                          <>
                            <Input
                              value={editRoleValue}
                              onChange={e => setEditRoleValue(e.target.value)}
                              className="w-32 inline-block mx-2"
                            />
                            <Button type="button" size="xs" onClick={handleSaveRole} className="ml-1">保存</Button>
                            <Button type="button" size="xs" variant="outline" onClick={() => setEditRoleIndex(null)} className="ml-1">キャンセル</Button>
                          </>
                        ) : (
                          <>
                            {p.selectedRole}
                            <Button type="button" size="xs" variant="ghost" onClick={() => handleEditRole(i)} className="ml-2">役割編集</Button>
                          </>
                        )}</span>
                      </div>
                      <Button type="button" size="xs" variant="ghost" onClick={() => handleRemoveParticipant(i)} className="text-red-500">削除</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.push("/themes")} disabled={isSubmitting}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "作成中..." : "テーマを作成"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <AddParticipantWithRoleModal
        themeId={undefined}
        isOpen={addParticipantModalOpen}
        onClose={() => setAddParticipantModalOpen(false)}
        onAddParticipant={handleAddParticipant}
        existingParticipantIds={participantsWithRole.map((p) => p.id)}
        availableParticipants={allParticipants}
      />
    </div>
  )
}
