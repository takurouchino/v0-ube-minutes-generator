"use client"

import type React from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addParticipant } from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"

interface AddParticipantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onParticipantAdded?: () => void
}

export function AddParticipantModal({ open, onOpenChange, onParticipantAdded }: AddParticipantModalProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [position, setPosition] = useState("")
  const [role, setRole] = useState("")
  const [department, setDepartment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "氏名は必須です",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Adding participant:", { name, position, role, department })

      // 参加者を追加
      const newParticipant = await addParticipant({
        name,
        position,
        role,
        department,
      })

      if (!newParticipant) {
        throw new Error("参加者の追加に失敗しました")
      }

      console.log("Added new participant:", newParticipant)

      // フォームをリセット
      setName("")
      setPosition("")
      setRole("")
      setDepartment("")

      // 成功メッセージ
      toast({
        title: "参加者を追加しました",
        description: `${name}さんを参加者マスタに追加しました`,
      })

      // モーダルを閉じる
      onOpenChange(false)

      // 親コンポーネントに通知
      if (onParticipantAdded) {
        // 少し遅延させて確実にデータが保存された後に呼び出す
        setTimeout(() => {
          onParticipantAdded()
        }, 100)
      }
    } catch (error) {
      console.error("Failed to add participant:", error)
      setError(error instanceof Error ? error.message : "参加者の追加に失敗しました")
      toast({
        title: "エラー",
        description: "参加者の追加に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新規参加者追加</DialogTitle>
            <DialogDescription>新しい参加者の情報を入力してください。</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                氏名
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="例: 山田 太郎"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                役職
              </Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="col-span-3"
                placeholder="例: 工場長"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                部署
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="col-span-3"
                placeholder="例: 開発部"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "追加中..." : "追加する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
