import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// モックデータ
const themes = [
  { id: "1", name: "月次品質管理会議" },
  { id: "2", name: "週次進捗会議" },
  { id: "3", name: "安全衛生委員会" },
  { id: "4", name: "生産計画会議" },
  { id: "5", name: "改善提案検討会" },
]

export default function NewParticipantPage() {
  return (
    <div className="container mx-auto max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/participants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">新規参加者登録</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>参加者情報</CardTitle>
          <CardDescription>新しい会議参加者の情報を入力してください。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">氏名</Label>
            <Input id="name" placeholder="例: 山田 太郎" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">役職</Label>
            <Input id="position" placeholder="例: 工場長" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">役割</Label>
            <Select>
              <SelectTrigger id="role">
                <SelectValue placeholder="役割を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="管理者">管理者</SelectItem>
                <SelectItem value="品質管理">品質管理</SelectItem>
                <SelectItem value="生産管理">生産管理</SelectItem>
                <SelectItem value="安全管理">安全管理</SelectItem>
                <SelectItem value="社外コンサル">社外コンサル</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">所属部署</Label>
            <Input id="department" placeholder="例: 製造部" />
          </div>

          <div className="space-y-2 pt-4">
            <Label>参加テーマ</Label>
            <p className="text-sm text-muted-foreground mb-2">この参加者が定常的に参加するテーマを選択してください。</p>
            <div className="space-y-2">
              {themes.map((theme) => (
                <div key={theme.id} className="flex items-center space-x-2">
                  <Checkbox id={`theme-${theme.id}`} />
                  <Label htmlFor={`theme-${theme.id}`} className="font-normal">
                    {theme.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/participants">キャンセル</Link>
          </Button>
          <Button>登録する</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
