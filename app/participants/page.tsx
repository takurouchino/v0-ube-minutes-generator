import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { ParticipantTable } from "./participant-table"

export default function ParticipantsPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight mt-[15px] ml-[15px]">参加者マスタ</h1>
        <Button asChild>
          <Link href="/participants/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規参加者登録
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>参加者一覧</CardTitle>
          <CardDescription>会議参加者の一覧です。参加者名をクリックすると詳細を確認できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <ParticipantTable />
        </CardContent>
      </Card>
    </div>
  )
}
