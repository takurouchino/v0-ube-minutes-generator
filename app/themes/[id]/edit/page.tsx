"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Plus, Upload, File, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import {
  getThemes,
  getParticipantsByTheme,
  getParticipants,
  updateTheme,
  addParticipantToTheme,
  removeParticipantFromTheme,
  type Theme,
  type Participant,
} from "@/lib/supabase-storage"
import { AddParticipantModal } from "@/components/add-participant-modal"
import { useAuth } from "@/lib/auth-context" // useAuthをインポート
import { supabase } from "@/lib/supabase"
import { ParticipantRoleModal } from "@/components/participant-role-modal"
import { use } from "react"

export default function ThemeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile } = useAuth() // userProfileを取得
  const [theme, setTheme] = useState<Theme | null>(null)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  // 新しいフィールド用のステート追加
  const [background, setBackground] = useState("")
  const [purpose, setPurpose] = useState("")
  const [reference, setReference] = useState("") // references → reference に変更
  const [themeParticipants, setThemeParticipants] = useState<Participant[]>([])
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [addParticipantModalOpen, setAddParticipantModalOpen] = useState(false)

  // ファイルアップロード関連の状態
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; path: string; url: string }>>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        if (!userProfile?.company_id) {
          setError("認証が必要です")
          return
        }

        const themes = await getThemes(userProfile.company_id)
        const foundTheme = themes.find((t) => t.id === id)

        if (foundTheme) {
          setTheme(foundTheme)
          setName(foundTheme.name)
          setCategory(foundTheme.category)
          setDescription(foundTheme.description)
          // 新しいフィールドの値をセット
          setBackground(foundTheme.background || "")
          setPurpose(foundTheme.purpose || "")
          setReference(foundTheme.reference || "") // references → reference に変更

          // 参考資料のJSONをパースしてファイル情報を設定
          if (foundTheme.reference) {
            // references → reference に変更
            try {
              const filesData = JSON.parse(foundTheme.reference) // references → reference に変更
              if (Array.isArray(filesData)) {
                setUploadedFiles(filesData)
              }
            } catch (e) {
              // 既存のテキスト形式の参照情報の場合はそのまま表示
              console.log("Reference is not in JSON format, keeping as text")
            }
          }

          // テーマに参加している参加者を取得
          const participants = await getParticipantsByTheme(foundTheme.id, userProfile.company_id)
          setThemeParticipants(participants)
          setSelectedParticipants(participants.map((p) => p.id))

          // 全参加者を取得
          const allParticipants = await getParticipants(userProfile.company_id)
          setAllParticipants(allParticipants)
        } else {
          setError("テーマが見つかりませんでした")
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
  }, [id, router, userProfile])

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    )
  }

  // 新規参加者が追加された後の処理
  const handleParticipantAdded = async () => {
    try {
      if (!userProfile?.company_id) return
      // 参加者リストを再読み込み
      const updatedParticipants = await getParticipants(userProfile.company_id)
      setAllParticipants(updatedParticipants)

      toast({
        title: "参加者を追加しました",
        description: "新しい参加者が参加者マスタに追加されました",
      })
    } catch (error) {
      console.error("Failed to reload participants:", error)
      toast({
        title: "警告",
        description: "参加者リストの更新に失敗しました。ページを再読み込みしてください。",
        variant: "destructive",
      })
    }
  }

  // ファイルアップロード処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !theme) {
      return
    }

    setUploading(true)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `themes/${theme.id}/reference/${fileName}` // references → reference に変更

      const { error: uploadError } = await supabase.storage.from("theme-reference").upload(filePath, file) // references → reference に変更

      if (uploadError) {
        throw uploadError
      }

      // 公開URLを取得
      const { data } = supabase.storage.from("theme-reference").getPublicUrl(filePath) // references → reference に変更

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
      const { error } = await supabase.storage.from("theme-reference").remove([fileToDelete.path]) // references → reference に変更

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "テーマ名は必須です",
        variant: "destructive",
      })
      return
    }

    if (theme && userProfile?.company_id) {
      try {
        // アップロードされたファイル情報をJSON文字列に変換
        const referenceJson = JSON.stringify(uploadedFiles)

        const updatedTheme: Theme = {
          ...theme,
          name,
          category,
          description,
          background: background || null,
          purpose: purpose || null,
          reference: referenceJson, // references → reference に変更
        }

        const success = await updateTheme(updatedTheme, userProfile.company_id)

        if (!success) {
          throw new Error("テーマの更新に失敗しました")
        }

        // 参加者の変更を反映
        const currentParticipantIds = themeParticipants.map((p) => p.id)

        // 削除された参加者を処理
        for (const participantId of currentParticipantIds) {
          if (!selectedParticipants.includes(participantId)) {
            await removeParticipantFromTheme(theme.id, participantId, userProfile.company_id)
          }
        }

        // 追加された参加者を処理
        for (const participantId of selectedParticipants) {
          if (!currentParticipantIds.includes(participantId)) {
            await addParticipantToTheme(theme.id, participantId, "一般参加者", userProfile.company_id)
          }
        }

        toast({
          title: "テーマを更新しました",
          description: "テーマ情報が正常に更新されました",
        })

        router.push("/themes")
      } catch (err) {
        console.error("Failed to update theme:", err)
        toast({
          title: "エラー",
          description: "テーマの更新に失敗しました",
          variant: "destructive",
        })
      }
    }
  }

  const handleOpenEditRoleModal = (participant: Participant) => {
    setSelectedParticipant(participant)
    setIsEditRoleModalOpen(true)
  }

  const handleUpdateRole = (participantId: string, newRole: string) => {
    setThemeParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          return {
            ...p,
            theme_roles: { ...p.theme_roles, [theme?.id ?? ""]: newRole },
          }
        }
        return p
      })
    )
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

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/themes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">テーマ編集</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>テーマの基本情報を編集します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">テーマ名</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* 新しいフィールド: 背景 */}
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

              {/* 新しいフィールド: 目的 */}
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

              {/* 新しいフィールド: 参考資料（ファイルアップロード形式に変更） */}
              <div className="space-y-2">
                <Label htmlFor="reference">参考資料</Label> {/* references → reference に変更 */}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>参加者設定</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setAddParticipantModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  新規参加者追加
                </Button>
              </CardTitle>
              <CardDescription>このテーマに参加する担当者を選択します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {allParticipants.length > 0 ? (
                <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {allParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`participant-${participant.id}`}
                          checked={selectedParticipants.includes(participant.id)}
                          onCheckedChange={() => toggleParticipant(participant.id)}
                        />
                        <Label htmlFor={`participant-${participant.id}`} className="font-normal cursor-pointer">
                          <div>
                            <span className="font-medium">{participant.name}</span>
                            <div className="text-xs text-muted-foreground">
                              {participant.position} - {themeParticipants.find((p) => p.id === participant.id)?.theme_roles?.[theme?.id ?? ""] || "一般参加者"}
                            </div>
                          </div>
                        </Label>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => handleOpenEditRoleModal(participant)}
                          className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          役割変更
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">参加者が登録されていません。</p>
                  <Button type="button" onClick={() => setAddParticipantModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    最初の参加者を追加
                  </Button>
                </div>
              )}

              {selectedParticipants.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">選択された参加者: {selectedParticipants.length}名</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {allParticipants
                      .filter((p) => selectedParticipants.includes(p.id))
                      .map((p) => p.name)
                      .join(", ")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <CardFooter className="flex justify-between px-0">
            <Button variant="outline" asChild>
              <Link href="/themes">キャンセル</Link>
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              保存する
            </Button>
          </CardFooter>
        </div>
      </form>

      <AddParticipantModal
        open={addParticipantModalOpen}
        onOpenChange={setAddParticipantModalOpen}
        onParticipantAdded={handleParticipantAdded}
      />

      {selectedParticipant && (
        <ParticipantRoleModal
          themeId={theme?.id ?? ""}
          participant={selectedParticipant}
          isOpen={isEditRoleModalOpen}
          onClose={() => setIsEditRoleModalOpen(false)}
          onUpdateRole={handleUpdateRole}
        />
      )}
    </div>
  )
}
