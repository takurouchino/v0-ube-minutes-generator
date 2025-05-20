import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { ThemeTable } from "./theme-table"

export default function ThemesPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">テーマ管理</h1>
        <Button asChild>
          <Link href="/themes/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規テーマ登録
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>会議テーママスタ</CardTitle>
          <CardDescription>会議テーマの一覧です。テーマ名をクリックすると詳細を確認できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeTable />
        </CardContent>
      </Card>
    </div>
  )
}
