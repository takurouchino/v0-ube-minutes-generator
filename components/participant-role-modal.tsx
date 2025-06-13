"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input" // 追加
import { updateParticipantRoleInTheme, type Participant } from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

interface ParticipantRoleModalProps {
  themeId: string
  participant: Participant
  isOpen: boolean
  onClose: () => void
  onUpdateRole: (participantId: string, newRole: string) => void
}

// 役割の選択肢を定義
const ROLE_OPTIONS = [
  { value: "一般参加者", label: "一般参加者" },
  { value: "リーダー", label: "リーダー" },
  { value: "サブリーダー", label: "サブリーダー" },
  { value: "書記", label: "書記" },
  { value: "ファシリテーター", label: "ファシリテーター" }, // 追加
  { value: "レビュー担当", label: "レビュー担当" }, // 追加
  { value: "オブザーバー", label: "オブザーバー" },
  { value: "ゲスト", label: "ゲスト" },
  { value: "custom", label: "その他（カスタム）" }, // カスタム役割のオプション
]

export function ParticipantRoleModal({
  themeId,
  participant,
  isOpen,
  onClose,
  onUpdateRole,
}: ParticipantRoleModalProps) {
  const currentRole = participant.theme_roles?.[themeId] || "一般参加者"
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>(
    ROLE_OPTIONS.some((option) => option.value === currentRole) ? currentRole : "custom",
  )
  const [customRole, setCustomRole] = useState<string>(
    ROLE_OPTIONS.some((option) => option.value === currentRole) ? "" : currentRole,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { userProfile } = useAuth()

  const handleRoleChange = (value: string) => {
    setSelectedRoleOption(value)
    if (value !== "custom") {
      setCustomRole("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userProfile?.company_id) {
      toast({
        title: "エラー",
        description: "認証が必要です",
        variant: "destructive",
      })
      return
    }

    // 実際に適用する役割を決定
    const roleToApply = selectedRoleOption === "custom" ? customRole : selectedRoleOption

    if (!roleToApply) {
      toast({
        title: "エラー",
        description: "役割を入力してください",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const success = await updateParticipantRoleInTheme(themeId, participant.id, roleToApply, userProfile.company_id)

      if (success) {
        onUpdateRole(participant.id, roleToApply)
        onClose()
      } else {
        throw new Error("Failed to update participant role")
      }
    } catch (error) {
      console.error("Failed to update role:", error)
      toast({
        title: "エラー",
        description: "役割の更新に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>参加者の役割変更</DialogTitle>
          <DialogDescription>{participant.name}の役割を変更します。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">役割</Label>
              <Select value={selectedRoleOption} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="役割を選択" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* カスタム役割の入力フィールド */}
              {selectedRoleOption === "custom" && (
                <div className="mt-2">
                  <Label htmlFor="customRole">カスタム役割</Label>
                  <Input
                    id="customRole"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="役割名を入力"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (selectedRoleOption === currentRole && customRole === "") ||
                (selectedRoleOption === "custom" && !customRole)
              }
            >
              {isSubmitting ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
