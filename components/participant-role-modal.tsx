"use client"

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
import { useToast } from "@/components/ui/use-toast"

interface ParticipantRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participantName: string
  currentRole: string
  onRoleUpdate: (newRole: string) => void
}

const PREDEFINED_ROLES = ["司会", "書記", "一般参加者", "オブザーバー", "専門家", "責任者", "アドバイザー", "ゲスト"]

export function ParticipantRoleModal({
  open,
  onOpenChange,
  participantName,
  currentRole,
  onRoleUpdate,
}: ParticipantRoleModalProps) {
  const { toast } = useToast()
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [customRole, setCustomRole] = useState("")
  const [isCustom, setIsCustom] = useState(!PREDEFINED_ROLES.includes(currentRole))

  const handleSave = () => {
    const finalRole = isCustom ? customRole.trim() : selectedRole

    if (!finalRole) {
      toast({
        title: "エラー",
        description: "役割を入力してください",
        variant: "destructive",
      })
      return
    }

    onRoleUpdate(finalRole)
    onOpenChange(false)

    toast({
      title: "役割を更新しました",
      description: `${participantName}さんの役割を「${finalRole}」に更新しました`,
    })
  }

  const handleRoleTypeChange = (value: string) => {
    if (value === "custom") {
      setIsCustom(true)
      setCustomRole(currentRole)
    } else {
      setIsCustom(false)
      setSelectedRole(value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>参加者の役割設定</DialogTitle>
          <DialogDescription>{participantName}さんのこのテーマでの役割を設定してください。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>役割</Label>
            <Select value={isCustom ? "custom" : selectedRole} onValueChange={handleRoleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="役割を選択" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
                <SelectItem value="custom">カスタム役割</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustom && (
            <div className="space-y-2">
              <Label htmlFor="custom-role">カスタム役割</Label>
              <Input
                id="custom-role"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="役割を入力してください"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
