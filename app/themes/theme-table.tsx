"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye } from "lucide-react"
import Link from "next/link"
import { getThemes, type Theme } from "@/lib/local-storage"

export function ThemeTable() {
  const [themes, setThemes] = useState<Theme[]>([])

  useEffect(() => {
    // ローカルストレージからテーマを取得
    const loadThemes = () => {
      try {
        const storedThemes = getThemes()
        setThemes(storedThemes)
      } catch (error) {
        console.error("Failed to load themes:", error)
        setThemes([])
      }
    }

    loadThemes()
  }, [])

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
                <TableCell className="hidden md:table-cell">{theme.createdAt}</TableCell>
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
