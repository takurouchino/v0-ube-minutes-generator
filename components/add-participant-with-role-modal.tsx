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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import type { Participant } from "@/lib/supabase-storage"

interface AddParticipantWithRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableParticipants: Participant[]
  onParticipantAdd: (participantId: string, role: string) => void
}

const PREDEFINED_ROLES = ["司会", "書記", "一般参加者", "オブザーバー", "専門家", "責任者", "アドバイザー", "ゲスト"]

export function AddParticipantWithRoleModal({
  open,
  onOpenChange,
  availableParticipants,
  onParticipantAdd,
}: AddParticipantWithRoleModalProps) {
  const { toast } = useToast()
  const [selectedParticipant, setSelectedParticipant] = useState("")
  const [selectedRole, setSelectedRole] = useState("一般参加者")
  const [customRole, setCustomRole] = useState("")
  const [isCustom, setIsCustom] = useState(false)

  const handleAdd = () => {
    if (!selectedParticipant) {
      toast({
        title: "エラー",
        description: "参加者を選択してください",
        variant: "destructive",
      })
      return
    }

    const finalRole = isCustom ? customRole.trim() : selectedRole

    if (!finalRole) {
      toast({
        title: "エラー",
        description: "役割を入力してください",
        variant: "destructive",
      })
      return
    }

    onParticipantAdd(selectedParticipant, finalRole)

    // リセット
    setSelectedParticipant("")
    setSelectedRole("一般参加者")
    setCustomRole("")
    setIsCustom(false)
    onOpenChange(false)
  }

  const handleRoleTypeChange = (value: string) => {
    if (value === "custom") {
      setIsCustom(true)
      setCustomRole("")
    } else {
      setIsCustom(false)
      setSelectedRole(value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>参加者を追加</DialogTitle>
          <DialogDescription>テーマに参加者を追加し、役割を設定してください。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>参加者</Label>
            <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
              <SelectTrigger>
                <SelectValue placeholder="参加者を選択" />
              </SelectTrigger>
              <SelectContent>
                {availableParticipants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name} ({participant.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          <Button onClick={handleAdd}>追加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
