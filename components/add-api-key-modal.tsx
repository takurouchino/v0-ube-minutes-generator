"use client"

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
import { Input } from "@/components/ui/input"
import { useApiKeyStore } from "@/lib/api-key-store"

interface AddApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (apiKey: string) => void
}

export function AddApiKeyModal({ isOpen, onClose, onSave }: AddApiKeyModalProps) {
  const { apiKey: savedApiKey } = useApiKeyStore()
  const [apiKey, setApiKey] = useState("")

  // 保存されたAPIキーがある場合は、それを表示する
  useEffect(() => {
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [savedApiKey])

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim())
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>OpenAI APIキーの設定</DialogTitle>
          <DialogDescription>
            議事録生成機能を使用するには、OpenAI APIキーが必要です。 APIキーを入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="w-full" />
          <p className="text-xs text-muted-foreground mt-2">
            APIキーは安全に保存され、OpenAI APIの呼び出しにのみ使用されます。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="active:scale-95 transition-transform">
            キャンセル
          </Button>
          <Button onClick={handleSave} className="active:scale-95 transition-transform">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
