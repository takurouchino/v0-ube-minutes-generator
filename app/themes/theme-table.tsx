"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, PlusCircle } from "lucide-react"
import Link from "next/link"
import { getThemes, type Theme } from "@/lib/supabase-storage"

export function ThemeTable() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Supabaseからテーマを取得
    const loadThemes = async () => {
      try {
        setLoading(true)
        const storedThemes = await getThemes()
        setThemes(storedThemes)
      } catch (error) {
        console.error("Failed to load themes:", error)
        setThemes([])
      } finally {
        setLoading(false)
      }
    }

    loadThemes()
  }, [])

  if (loading) {
    return <div className="text-center py-4">テーマを読み込み中...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>テーマ名</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead className="hidden md:table-cell">説明</TableHead>
            <TableHead className="hidden md:table-cell">作成日</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {themes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                テーマがありません。新しいテーマを登録してください。
                <div className="mt-2">
                  <Button asChild size="sm">
                    <Link href="/themes/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      新規テーマ登録
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            themes.map((theme) => (
              <TableRow key={theme.id}>
                <TableCell className="font-medium">
                  <Link href={`/themes/${theme.id}`} className="hover:underline">
                    {theme.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{theme.category}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate">{theme.description}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {theme.created_at ? new Date(theme.created_at).toLocaleDateString() : ""}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/themes/${theme.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">詳細</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/themes/${theme.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">編集</span>
                      </Link>
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
