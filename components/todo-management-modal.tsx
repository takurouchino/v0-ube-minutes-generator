"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wand2, Plus, Edit, Trash2, Save, CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Label } from "@/components/ui/label"

interface TodoManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  minuteId: string
  minuteContent: string
  participants: Array<{ id: string; name: string; position: string; role: string }>
  onTodosSaved: () => void
}

type ExtractedTodo = {
  title: string
  description: string
  assignee_name: string | null
  due_date: string | null
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  extracted_from_text: string
}

export function TodoManagementModal({
  open,
  onOpenChange,
  minuteId,
  minuteContent,
  participants,
  onTodosSaved,
}: TodoManagementModalProps) {
  const { toast } = useToast()
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [extractedTodos, setExtractedTodos] = useState<ExtractedTodo[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("extract")
  const [manualTodo, setManualTodo] = useState<ExtractedTodo>({
    title: "",
    description: "",
    assignee_name: null,
    due_date: null,
    priority: "medium",
    category: "action_item",
    extracted_from_text: "",
  })

  // 編集用の状態
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignee_name: "",
    due_date: "",
    priority: "medium" as const,
    category: "",
  })

  // モーダルが開かれたときに自動的にToDo抽出を開始
  useEffect(() => {
    if (open && minuteId && minuteContent && extractedTodos.length === 0) {
      handleExtractTodos()
    }
  }, [open, minuteId, minuteContent])

  // AIによるToDo抽出
  const handleExtractTodos = async () => {
    if (!minuteContent.trim()) {
      toast({
        title: "エラー",
        description: "議事録の内容がありません",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/extract-todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minuteId,
          minuteContent,
          participants,
          action: "extract",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "ToDo抽出に失敗しました")
      }

      const data = await response.json()
      setExtractedTodos(data.todos || [])

      if (data.todos.length === 0) {
        toast({
          title: "抽出完了",
          description: "この議事録からはアクションアイテムが見つかりませんでした。手動で追加してください。",
        })
        setActiveTab("manual")
      } else {
        toast({
          title: "抽出完了",
          description: `${data.todos.length}件のアクションアイテムを抽出しました。内容を確認・編集してください。`,
        })
      }
    } catch (error) {
      console.error("Failed to extract todos:", error)
      const errorMsg = error instanceof Error ? error.message : "ToDo抽出に失敗しました"
      setErrorMessage(errorMsg)
      toast({
        title: "エラー",
        description: errorMsg,
        variant: "destructive",
      })
      setActiveTab("manual")
    } finally {
      setIsExtracting(false)
    }
  }

  // 新しいToDoを追加
  const handleAddTodo = () => {
    const newTodo: ExtractedTodo = {
      title: "新しいアクションアイテム",
      description: "",
      assignee_name: null,
      due_date: null,
      priority: "medium",
      category: "action_item",
      extracted_from_text: "",
    }
    setExtractedTodos([...extractedTodos, newTodo])
    setEditingIndex(extractedTodos.length)
    setEditForm({
      title: newTodo.title,
      description: newTodo.description,
      assignee_name: newTodo.assignee_name || "",
      due_date: newTodo.due_date || "",
      priority: newTodo.priority,
      category: newTodo.category,
    })
  }

  // 編集開始
  const handleStartEdit = (index: number) => {
    const todo = extractedTodos[index]
    setEditingIndex(index)
    setEditForm({
      title: todo.title,
      description: todo.description,
      assignee_name: todo.assignee_name || "",
      due_date: todo.due_date || "",
      priority: todo.priority,
      category: todo.category,
    })
  }

  // 編集保存
  const handleSaveEdit = () => {
    if (editingIndex === null) return

    const updatedTodos = [...extractedTodos]
    updatedTodos[editingIndex] = {
      ...updatedTodos[editingIndex],
      title: editForm.title,
      description: editForm.description,
      assignee_name: editForm.assignee_name || null,
      due_date: editForm.due_date || null,
      priority: editForm.priority,
      category: editForm.category,
    }

    setExtractedTodos(updatedTodos)
    setEditingIndex(null)
  }

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  // ToDoを削除
  const handleDeleteTodo = (index: number) => {
    const updatedTodos = extractedTodos.filter((_, i) => i !== index)
    setExtractedTodos(updatedTodos)
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  // 手動でToDoを追加
  const handleAddManualTodo = () => {
    if (!manualTodo.title.trim()) {
      toast({
        title: "入力エラー",
        description: "タイトルは必須です",
        variant: "destructive",
      })
      return
    }

    setExtractedTodos([...extractedTodos, { ...manualTodo }])
    setManualTodo({
      title: "",
      description: "",
      assignee_name: null,
      due_date: null,
      priority: "medium",
      category: "action_item",
      extracted_from_text: "",
    })
    setActiveTab("extract")

    toast({
      title: "ToDo追加",
      description: "手動でToDoを追加しました",
    })
  }

  // ToDoを保存
  const handleSaveTodos = async () => {
    if (extractedTodos.length === 0) {
      toast({
        title: "エラー",
        description: "保存するアクションアイテムがありません",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/extract-todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minuteId,
          minuteContent,
          participants,
          todos: extractedTodos,
          action: "save",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "保存に失敗しました")
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "保存完了",
          description: `${extractedTodos.length}件のアクションアイテムを保存しました`,
        })
        onTodosSaved()
        onOpenChange(false)
      } else {
        throw new Error("保存に失敗しました")
      }
    } catch (error) {
      console.error("Failed to save todos:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "アクションアイテムの保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ToDo管理</DialogTitle>
          <DialogDescription>
            議事録からアクションアイテムを抽出し、担当者や期日を設定してToDo管理に登録します。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="extract">AI抽出</TabsTrigger>
            <TabsTrigger value="manual">手動登録</TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="space-y-4 mt-4">
            {isExtracting ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">AIがアクションアイテムを抽出中...</p>
              </div>
            ) : extractedTodos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">AIが議事録からアクションアイテムを自動抽出します。</p>
                <Button onClick={handleExtractTodos}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  アクションアイテムを抽出
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">抽出されたアクションアイテム ({extractedTodos.length}件)</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleAddTodo}>
                      <Plus className="mr-2 h-4 w-4" />
                      追加
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExtractTodos} disabled={isExtracting}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      再抽出
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>タイトル</TableHead>
                        <TableHead>担当者</TableHead>
                        <TableHead>期日</TableHead>
                        <TableHead>優先度</TableHead>
                        <TableHead>カテゴリ</TableHead>
                        <TableHead className="w-24">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedTodos.map((todo, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {editingIndex === index ? (
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
                            {editingIndex === index ? (
                              <Select
                                value={editForm.assignee_name}
                                onValueChange={(value) => setEditForm({ ...editForm, assignee_name: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="担当者を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">未設定</SelectItem>
                                  {participants.map((participant) => (
                                    <SelectItem key={participant.id} value={participant.name}>
                                      {participant.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              todo.assignee_name || "未設定"
                            )}
                          </TableCell>
                          <TableCell>
                            {editingIndex === index ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editForm.due_date
                                      ? format(new Date(editForm.due_date), "yyyy/MM/dd")
                                      : "期日を選択"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={editForm.due_date ? new Date(editForm.due_date) : undefined}
                                    onSelect={(date) =>
                                      setEditForm({
                                        ...editForm,
                                        due_date: date ? format(date, "yyyy-MM-dd") : "",
                                      })
                                    }
                                    initialFocus
                                    locale={ja}
                                  />
                                </PopoverContent>
                              </Popover>
                            ) : todo.due_date ? (
                              format(new Date(todo.due_date), "yyyy/MM/dd")
                            ) : (
                              "未設定"
                            )}
                          </TableCell>
                          <TableCell>
                            {editingIndex === index ? (
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
                            {editingIndex === index ? (
                              <Select
                                value={editForm.category}
                                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="action_item">アクション</SelectItem>
                                  <SelectItem value="follow_up">フォローアップ</SelectItem>
                                  <SelectItem value="decision_required">要決定</SelectItem>
                                  <SelectItem value="report">報告</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline">{getCategoryText(todo.category)}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingIndex === index ? (
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => handleStartEdit(index)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteTodo(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラーが発生しました</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="todo-title">タイトル</Label>
                <Input
                  id="todo-title"
                  value={manualTodo.title}
                  onChange={(e) => setManualTodo({ ...manualTodo, title: e.target.value })}
                  placeholder="例: 次回会議までに資料を作成する"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="todo-description">詳細説明</Label>
                <Textarea
                  id="todo-description"
                  value={manualTodo.description}
                  onChange={(e) => setManualTodo({ ...manualTodo, description: e.target.value })}
                  placeholder="例: 前回の会議で議論された内容をまとめ、次回会議で発表する資料を作成する"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="todo-assignee">担当者</Label>
                  <Select
                    value={manualTodo.assignee_name || "none"}
                    onValueChange={(value) => setManualTodo({ ...manualTodo, assignee_name: value || null })}
                  >
                    <SelectTrigger id="todo-assignee">
                      <SelectValue placeholder="担当者を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未設定</SelectItem>
                      {participants.map((participant) => (
                        <SelectItem key={participant.id} value={participant.name}>
                          {participant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="todo-due-date">期日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="todo-due-date"
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {manualTodo.due_date ? format(new Date(manualTodo.due_date), "yyyy/MM/dd") : "期日を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={manualTodo.due_date ? new Date(manualTodo.due_date) : undefined}
                        onSelect={(date) =>
                          setManualTodo({
                            ...manualTodo,
                            due_date: date ? format(date, "yyyy-MM-dd") : null,
                          })
                        }
                        initialFocus
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="todo-priority">優先度</Label>
                  <Select
                    value={manualTodo.priority}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                      setManualTodo({ ...manualTodo, priority: value })
                    }
                  >
                    <SelectTrigger id="todo-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="urgent">緊急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="todo-category">カテゴリ</Label>
                  <Select
                    value={manualTodo.category}
                    onValueChange={(value) => setManualTodo({ ...manualTodo, category: value })}
                  >
                    <SelectTrigger id="todo-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="action_item">アクション</SelectItem>
                      <SelectItem value="follow_up">フォローアップ</SelectItem>
                      <SelectItem value="decision_required">要決定</SelectItem>
                      <SelectItem value="report">報告</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAddManualTodo} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                ToDoを追加
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            キャンセル
          </Button>
          <Button onClick={handleSaveTodos} disabled={extractedTodos.length === 0 || isSaving}>
            {isSaving ? (
              <>保存中...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                ToDo管理に保存 ({extractedTodos.length}件)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
