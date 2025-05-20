"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Calendar, Download, Eye, Send } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

// モックデータ
const minutes = [
  {
    id: "1",
    title: "月次品質管理会議",
    date: "2023-05-15",
    status: "draft",
    author: "山田 太郎",
    approver: "佐藤 次郎",
  },
  {
    id: "2",
    title: "週次進捗会議",
    date: "2023-05-10",
    status: "review",
    author: "鈴木 三郎",
    approver: "山田 太郎",
  },
  {
    id: "3",
    title: "安全衛生委員会",
    date: "2023-05-05",
    status: "approved",
    author: "高橋 四郎",
    approver: "山田 太郎",
  },
  {
    id: "4",
    title: "生産計画会議",
    date: "2023-04-28",
    status: "approved",
    author: "田中 五郎",
    approver: "佐藤 次郎",
  },
]

// 承認者リスト
const approvers = [
  { id: "1", name: "山田 太郎" },
  { id: "2", name: "佐藤 次郎" },
  { id: "3", name: "鈴木 三郎" },
]

export default function ApprovalPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("draft")
  const [selectedApprover, setSelectedApprover] = useState("")
  const [comment, setComment] = useState("")
  const [reminderDate, setReminderDate] = useState("")

  const handleSendForReview = () => {
    if (!selectedApprover) {
      toast({
        title: "エラー",
        description: "承認者を選択してください。",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "レビュー依頼を送信しました",
      description: `${approvers.find((a) => a.id === selectedApprover)?.name}さんにレビュー依頼を送信しました。`,
    })
  }

  const handleApprove = () => {
    toast({
      title: "議事録を承認しました",
      description: "議事録が正式に承認されました。",
    })
  }

  const handleReject = () => {
    toast({
      title: "議事録を差し戻しました",
      description: "修正依頼とともに議事録を差し戻しました。",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">ドラフト</Badge>
      case "review":
        return <Badge variant="secondary">レビュー中</Badge>
      case "approved":
        return (
          <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
            承認済
          </Badge>
        )
      default:
        return <Badge variant="outline">不明</Badge>
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">承認フロー</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="draft">ドラフト</TabsTrigger>
          <TabsTrigger value="review">レビュー中</TabsTrigger>
          <TabsTrigger value="approved">承認済</TabsTrigger>
        </TabsList>

        <TabsContent value="draft">
          <Card>
            <CardHeader>
              <CardTitle>ドラフト中の議事録</CardTitle>
              <CardDescription>作成中の議事録一覧です。レビュー依頼を送信できます。</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会議テーマ</TableHead>
                    <TableHead>日付</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>作成者</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {minutes
                    .filter((m) => m.status === "draft")
                    .map((minute) => (
                      <TableRow key={minute.id}>
                        <TableCell className="font-medium">{minute.title}</TableCell>
                        <TableCell>{minute.date}</TableCell>
                        <TableCell>{getStatusBadge(minute.status)}</TableCell>
                        <TableCell>{minute.author}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/minutes/${minute.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">詳細</span>
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/minutes/${minute.id}/download`}>
                                <Download className="h-4 w-4" />
                                <span className="sr-only">ダウンロード</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <div className="mt-6 border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">レビュー依頼</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="approver">承認者</Label>
                    <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                      <SelectTrigger id="approver">
                        <SelectValue placeholder="承認者を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {approvers.map((approver) => (
                          <SelectItem key={approver.id} value={approver.id}>
                            {approver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">コメント</Label>
                    <Textarea
                      id="comment"
                      placeholder="承認者へのコメントを入力してください"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder">リマインド設定</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          id="reminder"
                          type="date"
                          value={reminderDate}
                          onChange={(e) => setReminderDate(e.target.value)}
                        />
                      </div>
                      <Button variant="outline" size="icon">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleSendForReview} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    レビュー依頼を送信
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>レビュー中の議事録</CardTitle>
              <CardDescription>レビュー中の議事録一覧です。承認または差し戻しができます。</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会議テーマ</TableHead>
                    <TableHead>日付</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>作成者</TableHead>
                    <TableHead>承認者</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {minutes
                    .filter((m) => m.status === "review")
                    .map((minute) => (
                      <TableRow key={minute.id}>
                        <TableCell className="font-medium">{minute.title}</TableCell>
                        <TableCell>{minute.date}</TableCell>
                        <TableCell>{getStatusBadge(minute.status)}</TableCell>
                        <TableCell>{minute.author}</TableCell>
                        <TableCell>{minute.approver}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/minutes/${minute.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">詳細</span>
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/minutes/${minute.id}/download`}>
                                <Download className="h-4 w-4" />
                                <span className="sr-only">ダウンロード</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <div className="mt-6 border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">承認操作</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="approval-comment">コメント</Label>
                    <Textarea id="approval-comment" placeholder="承認または差し戻し理由を入力してください" />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReject} className="flex-1">
                      差し戻し
                    </Button>
                    <Button onClick={handleApprove} className="flex-1">
                      承認
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>承認済の議事録</CardTitle>
              <CardDescription>承認済の議事録一覧です。閲覧・ダウンロードができます。</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会議テーマ</TableHead>
                    <TableHead>日付</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>作成者</TableHead>
                    <TableHead>承認者</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {minutes
                    .filter((m) => m.status === "approved")
                    .map((minute) => (
                      <TableRow key={minute.id}>
                        <TableCell className="font-medium">{minute.title}</TableCell>
                        <TableCell>{minute.date}</TableCell>
                        <TableCell>{getStatusBadge(minute.status)}</TableCell>
                        <TableCell>{minute.author}</TableCell>
                        <TableCell>{minute.approver}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/minutes/${minute.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">詳細</span>
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/minutes/${minute.id}/download`}>
                                <Download className="h-4 w-4" />
                                <span className="sr-only">ダウンロード</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
