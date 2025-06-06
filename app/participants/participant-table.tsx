"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { getParticipants, getThemes, deleteParticipant, type Participant, type Theme } from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"

export function ParticipantTable() {
  const { toast } = useToast()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Supabaseから参加者とテーマを取得
    const loadData = async () => {
      try {
        setLoading(true)
        const storedParticipants = await getParticipants()
        const storedThemes = await getThemes()
        setParticipants(storedParticipants)
        setThemes(storedThemes)
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "エラー",
          description: "データの読み込みに失敗しました",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // 参加者の削除
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`${name}さんを削除してもよろしいですか？`)) {
      try {
        const success = await deleteParticipant(id)

        if (success) {
          // 状態を更新
          setParticipants(participants.filter((p) => p.id !== id))

          toast({
            title: "参加者を削除しました",
            description: `${name}さんを参加者マスタから削除しました`,
          })
        } else {
          throw new Error("削除に失敗しました")
        }
      } catch (error) {
        console.error("Failed to delete participant:", error)
        toast({
          title: "エラー",
          description: "参加者の削除に失敗しました",
          variant: "destructive",
        })
      }
    }
  }

  // テーマIDからテーマ名を取得
  const getThemeName = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId)
    return theme ? theme.name : "不明なテーマ"
  }

  if (loading) {
    return <div className="text-center py-4">参加者を読み込み中...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>氏名</TableHead>
            <TableHead>役職</TableHead>
            <TableHead>役割</TableHead>
            <TableHead className="hidden md:table-cell">所属部署</TableHead>
            <TableHead className="hidden md:table-cell">参加テーマ</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                参加者が登録されていません
              </TableCell>
            </TableRow>
          ) : (
            participants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell className="font-medium">{participant.name}</TableCell>
                <TableCell>{participant.position}</TableCell>
                <TableCell>
                  <Badge variant="outline">{participant.role}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{participant.department}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {participant.themes.map((themeId, index) => (
                      <Badge key={index} variant="secondary" className="mr-1 mb-1">
                        {getThemeName(themeId)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/participants/${participant.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">編集</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(participant.id, participant.name)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">削除</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
