"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Navigation } from "@/components/navigation"
import { AddApiKeyModal } from "@/components/add-api-key-modal"
import { VisualizationModal } from "@/components/visualization-modal"
import { getPromptForFactoryAndDepartment } from "@/lib/prompts"
import { getDepartmentsForFactory } from "@/lib/department-mapping"
import { useMinutesStore } from "@/lib/store"
import { useApiKeyStore } from "@/lib/api-key-store"
import { X } from "lucide-react"

export default function Dashboard() {
  const router = useRouter()
  const { addMinutes } = useMinutesStore()
  const { apiKey, setApiKey } = useApiKeyStore()
  const [factory, setFactory] = useState("")
  const [department, setDepartment] = useState("")
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([])
  const [transcription, setTranscription] = useState("")
  const [summary, setSummary] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showVisualizationModal, setShowVisualizationModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // 環境変数からAPIキーを取得（サーバーサイドのみ）
  useEffect(() => {
    // クライアントサイドでは環境変数は使用できないため、
    // サーバーサイドAPIを使用して環境変数を取得する
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/check-api-key")
        const data = await response.json()

        if (data.hasApiKey && !apiKey) {
          setApiKey(data.apiKey)
        }
      } catch (error) {
        console.error("Failed to check API key:", error)
      }
    }

    checkApiKey()
  }, [apiKey, setApiKey])

  // 工場が変更されたときに利用可能な部署を更新
  useEffect(() => {
    if (factory) {
      const departments = getDepartmentsForFactory(factory)
      setAvailableDepartments(departments)

      // 現在選択されている部署が新しい工場で利用可能でない場合、リセット
      if (!departments.includes(department)) {
        setDepartment("")
      }
    } else {
      setAvailableDepartments([])
      setDepartment("")
    }
  }, [factory, department])

  const handleGenerateSummary = async () => {
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }

    if (!factory || !department || !transcription) {
      toast({
        title: "入力エラー",
        description: "工場、部署、議事録データをすべて入力してください。",
        variant: "destructive",
      })
      return
    }

    // Loading state
    setSummary("要約中...")
    setIsGenerating(true)

    try {
      // Get the prompt based on factory and department
      const prompt = getPromptForFactoryAndDepartment(factory, department)

      // Call OpenAI API
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription,
          prompt,
          apiKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "API request failed")
      }

      setSummary(data.summary)
      toast({
        title: "生成完了",
        description: "議事録が正常に生成されました。",
      })
    } catch (error) {
      console.error("Error generating summary:", error)
      setSummary("")
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "議事録の生成中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // メールアドレスを追加
  const handleAddEmail = () => {
    if (email && !emails.includes(email)) {
      setEmails([...emails, email])
      setEmail("")
    }
  }

  // メールアドレスを削除
  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove))
  }

  const handleSendEmail = () => {
    if (emails.length === 0 && email) {
      // 入力欄にメールアドレスがあれば追加
      handleAddEmail()
    }
    setShowEmailModal(true)
  }

  const confirmSendEmail = () => {
    setIsSending(true)

    // 議事録DBに保存
    const minutesId = addMinutes({
      title: `${factory} ${department} 会議議事録`,
      date: new Date().toISOString(),
      content: summary,
      factory,
      department,
      emails: [...emails],
    })

    // Simulate email sending with a timeout
    setTimeout(() => {
      toast({
        title: "メール送信完了",
        description: `${emails.length}件のメールアドレスに送信されました。`,
      })
      setShowEmailModal(false)
      setIsSending(false)

      // 議事録DBに遷移
      router.push("/minutes-db")
    }, 1000)
  }

  const handleSave = () => {
    setIsSaving(true)

    // 議事録DBに保存
    const minutesId = addMinutes({
      title: `${factory} ${department} 会議議事録`,
      date: new Date().toISOString(),
      content: summary,
      factory,
      department,
      emails: [...emails],
    })

    // Simulate saving with a timeout
    setTimeout(() => {
      toast({
        title: "保存完了",
        description: "議事録が保存されました。",
      })
      setIsSaving(false)

      // 議事録DBに遷移
      router.push("/minutes-db")
    }, 1000)
  }

  const toggleEdit = () => {
    setIsEditing(!isEditing)
  }

  return (
    <div className="flex h-screen">
      {/* Navigation Area (1/7 width) */}
      <Navigation />

      {/* Main Content Area (6/7 width) */}
      <div className="flex flex-1">
        {/* Input Area (3/7 of main content) */}
        <div className="w-[calc(3/6*100%)] border-r p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">議事録生成</h2>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">工場</label>
              <Select value={factory} onValueChange={setFactory}>
                <SelectTrigger>
                  <SelectValue placeholder="工場を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="大阪">大阪</SelectItem>
                  <SelectItem value="堺">堺</SelectItem>
                  <SelectItem value="吉富">吉富</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">部署</label>
              <Select
                value={department}
                onValueChange={setDepartment}
                disabled={!factory || availableDepartments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={factory ? "部署を選択" : "先に工場を選択してください"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium mb-1">会議の文字起こしデータ</label>
            <Textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="会議の文字起こしデータを入力してください"
              className="flex-1 resize-none mb-4"
            />

            <div className="flex justify-end">
              <Button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                className="active:scale-95 transition-transform"
              >
                {isGenerating ? "生成中..." : "議事録生成"}
              </Button>
            </div>
          </div>
        </div>

        {/* Output Area (3/7 of main content) */}
        <div className="w-[calc(3/6*100%)] p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">生成された議事録</h2>
            <Button
              variant="outline"
              onClick={() => setShowVisualizationModal(true)}
              className="active:scale-95 transition-transform"
            >
              発言量可視化
            </Button>
          </div>

          <div className="flex-1 flex flex-col">
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="生成された議事録がここに表示されます"
              className="flex-1 resize-none mb-4"
              readOnly={!isEditing}
            />

            <div className="space-y-4">
              <div className="flex items-center">
                <Button variant="outline" onClick={toggleEdit} className="mr-2 active:scale-95 transition-transform">
                  {isEditing ? "編集完了" : "編集"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving || !summary}
                  className="active:scale-95 transition-transform"
                >
                  {isSaving ? "保存中..." : "保存"}
                </Button>
              </div>

              <div className="flex items-center">
                <label className="block text-sm font-medium mr-2">メールアドレス:</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@example.com"
                  className="flex-1 mr-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddEmail()
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleAddEmail}
                  disabled={!email}
                  className="active:scale-95 transition-transform"
                >
                  追加
                </Button>
              </div>

              {/* メールアドレスリスト - メールアドレス入力欄の下に配置 */}
              {emails.length > 0 && (
                <div className="mb-4 max-h-[120px] overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {emails.map((emailItem, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                        {emailItem}
                        <button
                          onClick={() => handleRemoveEmail(emailItem)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending || !summary || (emails.length === 0 && !email)}
                  className="active:scale-95 transition-transform"
                >
                  メール送信
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Confirmation Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>メール送信の確認</DialogTitle>
            <DialogDescription>
              {emails.length > 0 ? (
                <>以下の{emails.length}件のメールアドレスに議事録を送信しますか？</>
              ) : (
                <>メールアドレス（{email}）に議事録を送信しますか？</>
              )}
            </DialogDescription>
          </DialogHeader>

          {emails.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto my-4">
              <ul className="space-y-1">
                {emails.map((emailItem, index) => (
                  <li key={index} className="text-sm">
                    {emailItem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(false)}
              className="active:scale-95 transition-transform"
            >
              戻る
            </Button>
            <Button onClick={confirmSendEmail} disabled={isSending} className="active:scale-95 transition-transform">
              {isSending ? "送信中..." : "送信"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Modal */}
      <AddApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={(key) => {
          setApiKey(key)
          setShowApiKeyModal(false)
        }}
      />

      {/* Visualization Modal */}
      <VisualizationModal
        isOpen={showVisualizationModal}
        onClose={() => setShowVisualizationModal(false)}
        transcription={transcription}
      />
    </div>
  )
}
