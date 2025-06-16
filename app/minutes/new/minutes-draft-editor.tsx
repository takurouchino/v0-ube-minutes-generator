"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"
import type { Participant } from "@/lib/local-storage"

type Sentence = {
  id: string
  text: string
  speaker: string
  role: string
  importance: string
}

interface MinutesDraftEditorProps {
  sentences: Sentence[]
  participants: Participant[]
  onSentencesChange?: (sentences: Sentence[]) => void
}

export function MinutesDraftEditor({
  sentences: initialSentences,
  participants,
  onSentencesChange,
}: MinutesDraftEditorProps) {
  const [sentences, setSentences] = useState<Sentence[]>(initialSentences)

  // propsの変更を監視して内部stateを更新
  useEffect(() => {
    setSentences(initialSentences)
  }, [initialSentences])

  // 発言が変更されたら親コンポーネントに通知
  useEffect(() => {
    if (onSentencesChange) {
      onSentencesChange(sentences)
    }
  }, [sentences, onSentencesChange])

  const handleSpeakerChange = (id: string, speakerId: string) => {
    setSentences(
      sentences.map((sentence) => {
        if (sentence.id === id) {
          const participant = participants.find((p) => p.id === speakerId)
          return {
            ...sentence,
            speaker: speakerId,
            role: participant?.role || sentence.role,
            importance: sentence.importance,
          }
        }
        return sentence
      }),
    )
  }

  const handleRoleChange = (id: string, role: string) => {
    setSentences(
      sentences.map((sentence) => {
        if (sentence.id === id) {
          return { ...sentence, role }
        }
        return sentence
      }),
    )
  }

  const handleImportanceChange = (id: string, importance: string) => {
    setSentences(
      sentences.map((sentence) => {
        if (sentence.id === id) {
          return { ...sentence, importance }
        }
        return sentence
      }),
    )
  }

  const handleTextChange = (id: string, text: string) => {
    setSentences(
      sentences.map((sentence) => {
        if (sentence.id === id) {
          return { ...sentence, text }
        }
        return sentence
      }),
    )
  }

  const handleDeleteSentence = (id: string) => {
    setSentences(sentences.filter((sentence) => sentence.id !== id))
  }

  const handleAddSentence = (index: number) => {
    const newId = `new-${Date.now()}`
    const newSentence: Sentence = {
      id: newId,
      text: "",
      speaker: "",
      role: "",
      importance: "",
    }

    const newSentences = [...sentences]
    newSentences.splice(index + 1, 0, newSentence)
    setSentences(newSentences)
  }

  const speechTypes = [
    "品質改善",
    "品質不良",
    "納期遅延",
    "生産異常",
    "クレーム対応",
    "生産条件改善",
    "ToDo"
  ]

  const importanceLevels = ["高", "中", "低"]

  // 発言箱を必ず1つは表示する
  const displaySentences = sentences.length === 0
    ? [{ id: "dummy-1", text: "", speaker: "", role: "", importance: "" }]
    : sentences;

  return (
    <div className="space-y-4">
      {displaySentences.map((sentence, index) => (
        <Card key={sentence.id} className="relative">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">発言者</label>
                <Select value={sentence.speaker} onValueChange={(value) => handleSpeakerChange(sentence.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="発言者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="text-sm font-medium">発言種類</label>
                <Select value={sentence.role} onValueChange={(value) => handleRoleChange(sentence.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="発言種類を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {speechTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="text-sm font-medium">重要度</label>
                <Select value={sentence.importance} onValueChange={(value) => handleImportanceChange(sentence.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="重要度を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {importanceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">発言内容</label>
                <Input
                  value={sentence.text}
                  onChange={(e) => handleTextChange(sentence.id, e.target.value)}
                  className="h-20"
                />
              </div>
            </div>

            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" onClick={() => handleDeleteSentence(sentence.id)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">削除</span>
              </Button>
            </div>
          </CardContent>

          <div className="flex justify-center -mb-4">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleAddSentence(index)}>
              <Plus className="h-3 w-3 mr-1" />
              ここに発言を追加
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
