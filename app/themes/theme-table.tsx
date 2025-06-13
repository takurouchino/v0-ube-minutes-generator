"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { deleteTheme, type Theme } from "@/lib/supabase-storage"
import { useAuth } from "@/lib/auth-context" // useAuthをインポート

interface ThemeTableProps {
  themes: Theme[]
}

export function ThemeTable({ themes }: ThemeTableProps) {
  const { toast } = useToast()
  const { userProfile } = useAuth() // useAuthを使用して会社IDを取得
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`テーマ「${name}」を削除してもよろしいですか？`)) {
      setIsDeleting(id)
      try {
        // 会社IDを引数として渡す
        const success = await deleteTheme(id, userProfile?.company_id)
        if (success) {
          toast({
            title: "削除完了",
            description: `テーマ「${name}」を削除しました。`,
          })
          // ページをリロードして最新のデータを表示
          window.location.reload()
        } else {
          throw new Error("削除に失敗しました")
        }
      } catch (error) {
        console.error("Failed to delete theme:", error)
        toast({
          title: "エラー",
          description: "テーマの削除に失敗しました。",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(null)
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>テーマ名</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>説明</TableHead>
            <TableHead>参加者数</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {themes.map((theme) => (
            <TableRow key={theme.id}>
              <TableCell className="font-medium">
                <Link href={`/themes/${theme.id}`} className="hover:underline text-primary">
                  {theme.name}
                </Link>
              </TableCell>
              <TableCell>{theme.category}</TableCell>
              <TableCell className="max-w-xs truncate">{theme.description}</TableCell>
              <TableCell>{theme.participants.length}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/themes/${theme.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">編集</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(theme.id, theme.name)}
                  disabled={isDeleting === theme.id}
                >
                  {isDeleting === theme.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">削除</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
