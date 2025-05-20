"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  getParticipants,
  addTheme,
  updateThemeAccessControl,
  type Participant,
  type AccessControl,
} from "@/lib/local-storage"

export default function NewThemePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPublic, setIsPublic] = useState(true)
  const [allowedGroups, setAllowedGroups] = useState<string[]>([])
  const [allowedUsers, setAllowedUsers] = useState<string[]>([])
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    const storedParticipants = getParticipants()
    setAllParticipants(storedParticipants)
  }, [])

  const toggleGroup = (group: string) => {
    setAllowedGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]))
  }

  const toggleUser = (userId: string) => {
    setAllowedUsers((prev) => (prev.includes(userId) ? prev.filter((u) => u !== userId) : [...prev, userId]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "テーマ名は必須です",
        variant: "destructive",
      })
      return
    }

    try {
      // テーマを追加
      const newTheme = addTheme({
        name,
        category,
        description,
        participants: [],
      })

      // アクセス権情報を追加
      const accessControl: AccessControl = {
        themeId: newTheme.id,
        isPublic,
        allowedGroups,
        allowedUsers,
      }
      updateThemeAccessControl(accessControl)

      toast({
        title: "テーマを登録しました",
        description: "新しいテーマが正常に登録されました",
      })

      router.push("/themes")
    } catch (error) {
      console.error("Failed to add theme:", error)
      toast({
        title: "エラー",
        description: "テーマの登録に失敗しました",
        variant: "destructive",
      })
    }
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
        <h1 className="text-3xl font-bold tracking-tight">新規テーマ登録</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>新しいテーマの基本情報を入力します。</CardDescription>
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
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>アクセス権設定</CardTitle>
              <CardDescription>このテーマの公開設定とアクセス権を管理します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="public-access" checked={isPublic} onCheckedChange={setIsPublic} />
                  <Label htmlFor="public-access">公開設定</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? "公開：すべてのユーザーがアクセスできます"
                    : "非公開：指定したグループ・ユーザーのみがアクセスできます"}
                </p>
              </div>

              {!isPublic && (
                <>
                  <div className="space-y-2 pt-4">
                    <Label>許可グループ</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="group-management"
                          checked={allowedGroups.includes("management")}
                          onCheckedChange={() => toggleGroup("management")}
                        />
                        <Label htmlFor="group-management" className="font-normal">
                          経営層
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="group-admin"
                          checked={allowedGroups.includes("admin")}
                          onCheckedChange={() => toggleGroup("admin")}
                        />
                        <Label htmlFor="group-admin" className="font-normal">
                          管理者
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="group-user"
                          checked={allowedGroups.includes("user")}
                          onCheckedChange={() => toggleGroup("user")}
                        />
                        <Label htmlFor="group-user" className="font-normal">
                          一般ユーザー
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label>許可ユーザー</Label>
                    <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                      {allParticipants.length > 0 ? (
                        <div className="space-y-2">
                          {allParticipants.map((participant) => (
                            <div key={participant.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`user-${participant.id}`}
                                checked={allowedUsers.includes(participant.id)}
                                onCheckedChange={() => toggleUser(participant.id)}
                              />
                              <Label htmlFor={`user-${participant.id}`} className="font-normal">
                                {participant.name}（{participant.position}）
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-muted-foreground">ユーザーが登録されていません</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <CardFooter className="flex justify-between px-0">
            <Button variant="outline" asChild>
              <Link href="/themes">キャンセル</Link>
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              登録する
            </Button>
          </CardFooter>
        </div>
      </form>
    </div>
  )
}
