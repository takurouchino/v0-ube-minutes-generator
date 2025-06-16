"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { addParticipant } from "@/lib/supabase-storage"
import { useAuth } from "@/lib/auth-context" // useAuthをインポート

export default function NewParticipantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile } = useAuth() // useAuthを使用して会社IDを取得
  const [name, setName] = useState("")
  const [position, setPosition] = useState("")
  const [department, setDepartment] = useState("")
  const [role, setRole] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "入力エラー",
        description: "参加者名を入力してください。",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 会社IDを引数として渡す
      const participant = await addParticipant(
        {
          name: name.trim(),
          position: position.trim(),
          department: department.trim(),
          role: role.trim(),
        },
        userProfile?.company_id,
      )

      if (participant) {
        toast({
          title: "参加者登録完了",
          description: `参加者「${name}」を登録しました。`,
        })
        router.push(`/participants/${participant.id}`)
      } else {
        throw new Error("参加者の登録に失敗しました")
      }
    } catch (error) {
      console.error("Failed to create participant:", error)
      toast({
        title: "エラー",
        description: "参加者の登録に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">新規参加者登録</h1>

      <Card>
        <CardHeader>
          <CardTitle>参加者情報</CardTitle>
          <CardDescription>新しい参加者の情報を入力してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                名前 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 山田太郎"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">役職</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="例: マネージャー"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">部署</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="例: 開発部"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">役割</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="例: エンジニア" />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/participants")}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "登録中..." : "参加者を登録"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
