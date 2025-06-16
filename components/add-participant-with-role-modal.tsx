"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { getParticipantsNotInTheme, addParticipantToTheme, type Participant } from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

interface AddParticipantWithRoleModalProps {
  themeId: string
  isOpen: boolean
  onClose: () => void
  onAddParticipant: (participant: Participant) => void
  existingParticipantIds: string[]
  availableParticipants?: Participant[]
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

export function AddParticipantWithRoleModal({
  themeId,
  isOpen,
  onClose,
  onAddParticipant,
  existingParticipantIds,
  availableParticipants,
}: AddParticipantWithRoleModalProps) {
  const [internalAvailableParticipants, setInternalAvailableParticipants] = useState<Participant[]>([])
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("")
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>("一般参加者")
  const [customRole, setCustomRole] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { userProfile } = useAuth()

  useEffect(() => {
    const loadAvailableParticipants = async () => {
      if (!isOpen) return
      if (availableParticipants) {
        setInternalAvailableParticipants(
          availableParticipants.filter((p) => !existingParticipantIds.includes(p.id))
        )
        return
      }
      // fallback: 既存の自動取得（themeIdがuuidの場合のみ）
      if (!userProfile?.company_id || !themeId) return
      try {
        setLoading(true)
        const participants = await getParticipantsNotInTheme(themeId, userProfile.company_id)
        setInternalAvailableParticipants(participants)
      } catch (error) {
        console.error("Failed to load available participants:", error)
        toast({
          title: "エラー",
          description: "参加者の読み込みに失敗しました。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadAvailableParticipants()
    }
  }, [isOpen, themeId, toast, userProfile, availableParticipants, existingParticipantIds])

  const handleRoleChange = (value: string) => {
    setSelectedRoleOption(value)
    if (value !== "custom") {
      setCustomRole("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedParticipantId || !userProfile?.company_id) {
      toast({
        title: "エラー",
        description: "参加者を選択してください。",
        variant: "destructive",
      })
      return
    }

    // 実際に適用する役割を決定
    const roleToApply = selectedRoleOption === "custom" ? customRole : selectedRoleOption

    if (selectedRoleOption === "custom" && !customRole) {
      toast({
        title: "エラー",
        description: "カスタム役割を入力してください。",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // themeIdが未定義または空文字ならDB登録せずローカルstateのみ
      if (!themeId) {
        const addedParticipant = internalAvailableParticipants.find((p) => p.id === selectedParticipantId)
        if (addedParticipant) {
          const participantWithRole = {
            ...addedParticipant,
            themes: [...addedParticipant.themes],
            theme_roles: { ...addedParticipant.theme_roles, temp: roleToApply },
          }
          onAddParticipant(participantWithRole)
        }
        onClose()
        setSelectedParticipantId("")
        setSelectedRoleOption("一般参加者")
        setCustomRole("")
        return
      }

      // 既存のDB登録処理
      const success = await addParticipantToTheme(themeId, selectedParticipantId, roleToApply, userProfile.company_id)

      if (success) {
        const addedParticipant = internalAvailableParticipants.find((p) => p.id === selectedParticipantId)
        if (addedParticipant) {
          // テーマの役割情報を追加
          const participantWithRole = {
            ...addedParticipant,
            themes: [...addedParticipant.themes, themeId],
            theme_roles: { ...addedParticipant.theme_roles, [themeId]: roleToApply },
          }
          onAddParticipant(participantWithRole)
        }
        onClose()
        setSelectedParticipantId("")
        setSelectedRoleOption("一般参加者")
        setCustomRole("")
      } else {
        throw new Error("Failed to add participant to theme")
      }
    } catch (error) {
      console.error("Failed to add participant:", error)
      toast({
        title: "エラー",
        description: "参加者の追加に失敗しました。",
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
          <DialogTitle>参加者の追加</DialogTitle>
          <DialogDescription>テーマに新しい参加者を追加します。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="participant">参加者</Label>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">読み込み中...</span>
                </div>
              ) : internalAvailableParticipants.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  追加できる参加者がいません。新しい参加者を登録してください。
                </div>
              ) : (
                <Select value={selectedParticipantId} onValueChange={setSelectedParticipantId}>
                  <SelectTrigger id="participant">
                    <SelectValue placeholder="参加者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {internalAvailableParticipants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.name}
                        {participant.position && ` (${participant.position})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
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
              disabled={isSubmitting || !selectedParticipantId || (selectedRoleOption === "custom" && !customRole)}
            >
              {isSubmitting ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
