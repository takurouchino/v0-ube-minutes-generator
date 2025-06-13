"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Clock, AlertTriangle, Edit, Save, X, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { getTodos, updateTodo, deleteTodo, getTodoStats, type Todo } from "@/lib/supabase-todos"
import { getParticipants, type Participant } from "@/lib/supabase-storage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"

export default function TodosPage() {
  const { toast } = useToast()
  const [todos, setTodos] = useState<Todo[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  })

  // 編集フォームの状態
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignee_id: "",
    assignee_name: "",
    due_date: "",
    priority: "medium" as const,
    status: "pending" as const,
    category: "",
  })

  const { userProfile } = useAuth()

  // データの読み込み
  const loadData = async () => {
    try {
      setLoading(true)

      if (!userProfile?.company_id) {
        toast({
          title: "エラー",
          description: "会社情報が取得できませんでした。再ログインしてください。",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const companyId = userProfile.company_id

      const [todosData, participantsData, statsData] = await Promise.all([
        getTodos(companyId),
        getParticipants(companyId), // companyId を渡す
        getTodoStats(companyId),
      ])

      setTodos(todosData)
      setParticipants(participantsData)
      setStats(statsData)
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

  useEffect(() => {
    loadData()
  }, [])

  // 編集開始
  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditForm({
      title: todo.title,
      description: todo.description || "",
      assignee_id: todo.assignee_id || "",
      assignee_name: todo.assignee_name || "",
      due_date: todo.due_date || "",
      priority: todo.priority,
      status: todo.status,
      category: todo.category || "",
    })
  }

  // 編集保存
  const handleSaveEdit = async () => {
    if (!editingId || !userProfile?.company_id) return

    try {
      const assignee = participants.find((p) => p.id === editForm.assignee_id)

      const updatedTodo = {
        id: editingId,
        title: editForm.title,
        description: editForm.description,
        assignee_id: editForm.assignee_id || null,
        assignee_name: assignee?.name || editForm.assignee_name || null,
        due_date: editForm.due_date || null,
        priority: editForm.priority,
        status: editForm.status,
        category: editForm.category,
      }

      const success = await updateTodo(updatedTodo, userProfile.company_id)

      if (success) {
        toast({
          title: "更新完了",
          description: "ToDoが更新されました",
        })
        setEditingId(null)
        loadData() // データを再読み込み
      } else {
        throw new Error("更新に失敗しました")
      }
    } catch (error) {
      console.error("Failed to update todo:", error)
      toast({
        title: "エラー",
        description: "ToDoの更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingId(null)
  }

  // ToDo削除
  const handleDeleteTodo = async (todoId: string, title: string) => {
    if (!userProfile?.company_id) return

    try {
      const success = await deleteTodo(todoId, userProfile.company_id)

      if (success) {
        toast({
          title: "削除完了",
          description: `「${title}」を削除しました`,
        })
        loadData() // データを再読み込み
      } else {
        throw new Error("削除に失敗しました")
      }
    } catch (error) {
      console.error("Failed to delete todo:", error)
      toast({
        title: "エラー",
        description: "ToDoの削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  // ステータス別のフィルタリング
  const getFilteredTodos = (status: string) => {
    const today = new Date().toISOString().split("T")[0]

    switch (status) {
      case "pending":
        return todos.filter((todo) => todo.status === "pending")
      case "in_progress":
        return todos.filter((todo) => todo.status === "in_progress")
      case "completed":
        return todos.filter((todo) => todo.status === "completed")
      case "overdue":
        return todos.filter((todo) => todo.status !== "completed" && todo.due_date && todo.due_date < today)
      default:
        return todos
    }
  }

  // 優先度のバッジ色を取得
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "warning"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  // ステータスのバッジ色を取得
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "in_progress":
        return "warning"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  // 優先度のテキストを取得
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "緊急"
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        return priority
    }
  }

  // ステータスのテキストを取得
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "未着手"
      case "in_progress":
        return "進行中"
      case "completed":
        return "完了"
      case "cancelled":
        return "キャンセル"
      default:
        return status
    }
  }

  // カテゴリのテキストを取得
  const getCategoryText = (category: string) => {
    switch (category) {
      case "action_item":
        return "アクション"
      case "follow_up":
        return "フォローアップ"
      case "decision_required":
        return "要決定"
      case "report":
        return "報告"
      default:
        return category
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ToDo管理</h1>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総数</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未着手</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">期限超過</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>アクションアイテム一覧</CardTitle>
          <CardDescription>議事録から抽出されたアクションアイテムを管理します。</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                未着手
                {stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                進行中
                {stats.in_progress > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.in_progress}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                完了
                {stats.completed > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.completed}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="overdue">
                期限超過
                {stats.overdue > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.overdue}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {["pending", "in_progress", "completed", "overdue"].map((status) => (
              <TabsContent key={status} value={status}>
                {getFilteredTodos(status).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">該当するアクションアイテムはありません</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>タイトル</TableHead>
                        <TableHead>担当者</TableHead>
                        <TableHead>期日</TableHead>
                        <TableHead>優先度</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead>議事録</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredTodos(status).map((todo) => (
                        <TableRow key={todo.id}>
                          <TableCell>
                            {editingId === todo.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editForm.title}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  placeholder="タイトル"
                                />
                                <Textarea
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  placeholder="詳細説明"
                                  rows={2}
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium">{todo.title}</div>
                                {todo.description && (
                                  <div className="text-sm text-muted-foreground mt-1">{todo.description}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === todo.id ? (
                              <Select
                                value={editForm.assignee_id}
                                onValueChange={(value) => setEditForm({ ...editForm, assignee_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="担当者を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">未設定</SelectItem>
                                  {participants.map((participant) => (
                                    <SelectItem key={participant.id} value={participant.id}>
                                      {participant.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div>
                                {todo.assignee_details ? (
                                  <div>
                                    <div className="font-medium">{todo.assignee_details.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {todo.assignee_details.position}
                                    </div>
                                  </div>
                                ) : (
                                  todo.assignee_name || "未設定"
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === todo.id ? (
                              <Input
                                type="date"
                                value={editForm.due_date}
                                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                              />
                            ) : (
                              todo.due_date || "未設定"
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === todo.id ? (
                              <Select
                                value={editForm.priority}
                                onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                                  setEditForm({ ...editForm, priority: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">低</SelectItem>
                                  <SelectItem value="medium">中</SelectItem>
                                  <SelectItem value="high">高</SelectItem>
                                  <SelectItem value="urgent">緊急</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={getPriorityBadgeVariant(todo.priority) as any}>
                                {getPriorityText(todo.priority)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === todo.id ? (
                              <Select
                                value={editForm.status}
                                onValueChange={(value: "pending" | "in_progress" | "completed" | "cancelled") =>
                                  setEditForm({ ...editForm, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">未着手</SelectItem>
                                  <SelectItem value="in_progress">進行中</SelectItem>
                                  <SelectItem value="completed">完了</SelectItem>
                                  <SelectItem value="cancelled">キャンセル</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={getStatusBadgeVariant(todo.status) as any}>
                                {getStatusText(todo.status)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {todo.minute_title && (
                              <Link
                                href={`/minutes/summary/${todo.minute_id}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {todo.minute_title}
                              </Link>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingId === todo.id ? (
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={() => handleStartEdit(todo)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>ToDoを削除しますか？</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        「{todo.title}」を削除します。この操作は取り消すことができません。
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteTodo(todo.id, todo.title)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        削除
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
