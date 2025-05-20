"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Edit, Lock, Unlock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import {
  getThemes,
  getAccessControls,
  updateThemeAccessControl,
  type Theme,
  type AccessControl,
} from "@/lib/local-storage"

export default function AccessControlPage() {
  const { toast } = useToast()
  const [themes, setThemes] = useState<Theme[]>([])
  const [accessControls, setAccessControls] = useState<AccessControl[]>([])
  const [loading, setLoading] = useState(true)

  // テーマとアクセス権情報の取得
  useEffect(() => {
    const loadData = () => {
      try {
        const storedThemes = getThemes()
        const storedAccessControls = getAccessControls()
        setThemes(storedThemes)
        setAccessControls(storedAccessControls)
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

  // テーマのアクセス権情報を取得
  const getThemeAccessControl = (themeId: string): AccessControl | null => {
    return accessControls.find((ac) => ac.themeId === themeId) || null
  }

  // 公開設定の切り替え
  const togglePublicAccess = (themeId: string) => {
    try {
      const accessControl = getThemeAccessControl(themeId)
      const theme = themes.find((t) => t.id === themeId)

      if (!theme) {
        toast({
          title: "エラー",
          description: "テーマが見つかりません",
          variant: "destructive",
        })
        return
      }

      if (accessControl) {
        // 既存のアクセス権情報を更新
        const updatedAccessControl: AccessControl = {
          ...accessControl,
          isPublic: !accessControl.isPublic,
        }
        updateThemeAccessControl(updatedAccessControl)

        // 状態を更新
        setAccessControls(accessControls.map((ac) => (ac.themeId === themeId ? updatedAccessControl : ac)))
      } else {
        // 新規アクセス権情報を作成
        const newAccessControl: AccessControl = {
          themeId,
          isPublic: true, // デフォルトは公開
          allowedGroups: [],
          allowedUsers: [],
        }
        updateThemeAccessControl(newAccessControl)

        // 状態を更新
        setAccessControls([...accessControls, newAccessControl])
      }

      toast({
        title: "公開設定を更新しました",
        description: `「${theme.name}」の公開設定を更新しました`,
      })
    } catch (error) {
      console.error("Failed to toggle public access:", error)
      toast({
        title: "エラー",
        description: "公開設定の更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  // 許可グループの表示
  const renderAllowedGroups = (accessControl: AccessControl | null) => {
    if (!accessControl || accessControl.isPublic || accessControl.allowedGroups.length === 0) {
      return "-"
    }

    return accessControl.allowedGroups.map((group) => {
      let label = group
      switch (group) {
        case "management":
          label = "経営層"
          break
        case "admin":
          label = "管理者"
          break
        case "user":
          label = "一般ユーザー"
          break
      }
      return (
        <Badge key={group} variant="outline" className="mr-1 mb-1">
          {label}
        </Badge>
      )
    })
  }

  // 許可ユーザーの表示
  const renderAllowedUsers = (accessControl: AccessControl | null) => {
    if (!accessControl || accessControl.isPublic || accessControl.allowedUsers.length === 0) {
      return "-"
    }

    return `${accessControl.allowedUsers.length}名`
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center h-[50vh]">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">アクセス権管理</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テーマ別アクセス権設定</CardTitle>
          <CardDescription>
            テーマごとに公開設定を行います。非公開テーマは指定したグループ・ユーザーのみがアクセスできます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テーマ名</TableHead>
                <TableHead>公開設定</TableHead>
                <TableHead>許可グループ</TableHead>
                <TableHead>許可ユーザー</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {themes.map((theme) => {
                const accessControl = getThemeAccessControl(theme.id)
                const isPublic = accessControl ? accessControl.isPublic : true

                return (
                  <TableRow key={theme.id}>
                    <TableCell className="font-medium">{theme.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch checked={isPublic} onCheckedChange={() => togglePublicAccess(theme.id)} />
                        <span>{isPublic ? "公開" : "非公開"}</span>
                        {isPublic ? (
                          <Unlock className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{renderAllowedGroups(accessControl)}</TableCell>
                    <TableCell>{renderAllowedUsers(accessControl)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/themes/${theme.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          詳細設定
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
