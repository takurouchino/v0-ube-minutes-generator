"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getParticipants, type Participant } from "@/lib/supabase-storage"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context" // useAuthをインポート

export function ParticipantTable() {
  const { toast } = useToast()
  const { userProfile } = useAuth() // useAuthを使用して会社IDを取得
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setLoading(true)
        // 会社IDを引数として渡す
        const data = await getParticipants(userProfile?.company_id)
        setParticipants(data)
      } catch (error) {
        console.error("Failed to load participants:", error)
        toast({
          title: "エラー",
          description: "参加者の読み込みに失敗しました。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    // userProfileが読み込まれたら実行
    if (userProfile?.company_id) {
      loadParticipants()
    }
  }, [toast, userProfile]) // userProfileを依存配列に追加

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (participants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">参加者が登録されていません。</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>役職</TableHead>
            <TableHead>部署</TableHead>
            <TableHead>参加テーマ数</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow key={participant.id}>
              <TableCell className="font-medium">
                <Link href={`/participants/${participant.id}`} className="hover:underline text-primary">
                  {participant.name}
                </Link>
              </TableCell>
              <TableCell>{participant.position}</TableCell>
              <TableCell>{participant.department}</TableCell>
              <TableCell>{participant.themes.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
