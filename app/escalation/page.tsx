"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertTriangle, CheckCircle, Eye, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { getEscalationsByCategory, confirmEscalation, type EscalationItem } from "@/lib/supabase-escalations"
import { useAuth } from "@/lib/auth-context"

export default function EscalationPage() {
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("technical")
  const [technicalEscalations, setTechnicalEscalations] = useState<EscalationItem[]>([])
  const [businessEscalations, setBusinessEscalations] = useState<EscalationItem[]>([])
  const [personnelEscalations, setPersonnelEscalations] = useState<EscalationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // エスカレーション情報の取得
  const loadEscalations = async () => {
    try {
      setRefreshing(true)
      setError(null)

      const companyId = userProfile?.company_id

      // 各カテゴリのエスカレーション情報を並列取得
      const [technical, business, personnel] = await Promise.all([
        getEscalationsByCategory("technical", companyId),
        getEscalationsByCategory("business", companyId),
        getEscalationsByCategory("personnel", companyId),
      ])

      console.log("取得したエスカレーション情報:", { technical, business, personnel })

      setTechnicalEscalations(technical)
      setBusinessEscalations(business)
      setPersonnelEscalations(personnel)
    } catch (error) {
      console.error("Failed to load escalations:", error)
      setError("エスカレーション情報の読み込みに失敗しました")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // エラーがある場合にトーストを表示
  useEffect(() => {
    if (error) {
      toast({
        title: "エラー",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  useEffect(() => {
    loadEscalations()
  }, [userProfile])

  // エスカレーション確認処理
  const handleConfirm = async (id: string, category: "technical" | "business" | "personnel") => {
    try {
      const companyId = userProfile?.company_id
      const success = await confirmEscalation(id, companyId)

      if (success) {
        toast({
          title: "確認完了",
          description: "エスカレーション項目を確認済みにしました",
        })

        // 状態を更新（確認済みのアイテムを削除）
        if (category === "technical") {
          setTechnicalEscalations(technicalEscalations.filter((e) => e.id !== id))
        } else if (category === "business") {
          setBusinessEscalations(businessEscalations.filter((e) => e.id !== id))
        } else if (category === "personnel") {
          setPersonnelEscalations(personnelEscalations.filter((e) => e.id !== id))
        }
      } else {
        setError("確認処理に失敗しました")
      }
    } catch (error) {
      console.error("Failed to confirm escalation:", error)
      setError("確認処理に失敗しました")
    }
  }

  // リスクスコアに応じたバッジの色を返す
  const getRiskBadgeVariant = (score: number) => {
    if (score >= 80) return "destructive"
    if (score >= 60) return "warning"
    return "outline"
  }

  // リスクスコアのテキストを返す
  const getRiskText = (score: number) => {
    if (score >= 80) return "高"
    if (score >= 60) return "中"
    return "低"
  }

  // エスカレーションテーブルのレンダリング
  const renderEscalationTable = (
    escalations: EscalationItem[],
    category: "technical" | "business" | "personnel",
    limit = 3,
  ) => {
    const displayEscalations = escalations.slice(0, limit)

    if (displayEscalations.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">該当するエスカレーション項目はありません</div>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>リスク</TableHead>
            <TableHead>テーマ</TableHead>
            <TableHead>日付</TableHead>
            <TableHead className="hidden md:table-cell">発言抜粋</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEscalations.map((escalation) => (
            <TableRow key={escalation.id}>
              <TableCell>
                <Badge variant={getRiskBadgeVariant(escalation.risk_score) as any} className="font-medium">
                  {getRiskText(escalation.risk_score)}（{escalation.risk_score}）
                </Badge>
              </TableCell>
              <TableCell>{escalation.theme_name || "不明なテーマ"}</TableCell>
              <TableCell>{escalation.minute_date || "不明な日付"}</TableCell>
              <TableCell className="hidden md:table-cell max-w-xs truncate">{escalation.excerpt}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/minutes/summary/${escalation.minute_id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">詳細</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleConfirm(escalation.id, category)}>
                    <CheckCircle className="h-4 w-4" />
                    <span className="sr-only">確認</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
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
        <h1 className="text-3xl font-bold tracking-tight">エスカレーション</h1>
        <Button variant="outline" onClick={loadEscalations} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          更新
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="technical">
            技術的リスク
            {technicalEscalations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {technicalEscalations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="business">
            事業的リスク
            {businessEscalations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {businessEscalations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="personnel">
            人事的リスク
            {personnelEscalations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {personnelEscalations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                技術的リスク
              </CardTitle>
              <CardDescription>製造工程、設備、品質などに関する技術的なリスク項目です。</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="mb-4">
                <AccordionItem value="top3">
                  <AccordionTrigger>リスク上位3件</AccordionTrigger>
                  <AccordionContent>{renderEscalationTable(technicalEscalations, "technical", 3)}</AccordionContent>
                </AccordionItem>
                {technicalEscalations.length > 3 && (
                  <AccordionItem value="all">
                    <AccordionTrigger>すべてのリスク（{technicalEscalations.length}件）</AccordionTrigger>
                    <AccordionContent>{renderEscalationTable(technicalEscalations, "technical", 10)}</AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                事業的リスク
              </CardTitle>
              <CardDescription>納期、コスト、顧客対応などに関する事業的なリスク項目です。</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="mb-4">
                <AccordionItem value="top3">
                  <AccordionTrigger>リスク上位3件</AccordionTrigger>
                  <AccordionContent>{renderEscalationTable(businessEscalations, "business", 3)}</AccordionContent>
                </AccordionItem>
                {businessEscalations.length > 3 && (
                  <AccordionItem value="all">
                    <AccordionTrigger>すべてのリスク（{businessEscalations.length}件）</AccordionTrigger>
                    <AccordionContent>{renderEscalationTable(businessEscalations, "business", 10)}</AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personnel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                人事的リスク
              </CardTitle>
              <CardDescription>人員配置、スキル、労務管理などに関する人事的なリスク項目です。</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="mb-4">
                <AccordionItem value="top3">
                  <AccordionTrigger>リスク上位3件</AccordionTrigger>
                  <AccordionContent>{renderEscalationTable(personnelEscalations, "personnel", 3)}</AccordionContent>
                </AccordionItem>
                {personnelEscalations.length > 3 && (
                  <AccordionItem value="all">
                    <AccordionTrigger>すべてのリスク（{personnelEscalations.length}件）</AccordionTrigger>
                    <AccordionContent>{renderEscalationTable(personnelEscalations, "personnel", 10)}</AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
