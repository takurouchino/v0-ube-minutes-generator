"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertTriangle, CheckCircle, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { getEscalationsByCategory, confirmEscalation, type EscalationItem } from "@/lib/local-storage"

export default function EscalationPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("technical")
  const [technicalEscalations, setTechnicalEscalations] = useState<EscalationItem[]>([])
  const [businessEscalations, setBusinessEscalations] = useState<EscalationItem[]>([])
  const [personnelEscalations, setPersonnelEscalations] = useState<EscalationItem[]>([])
  const [loading, setLoading] = useState(true)

  // エスカレーション情報の取得
  useEffect(() => {
    const loadEscalations = () => {
      try {
        // 最新のエスカレーション情報を取得
        const technical = getEscalationsByCategory("technical")
        const business = getEscalationsByCategory("business")
        const personnel = getEscalationsByCategory("personnel")

        console.log("取得したエスカレーション情報:", { technical, business, personnel }) // デバッグ用

        setTechnicalEscalations(technical)
        setBusinessEscalations(business)
        setPersonnelEscalations(personnel)
      } catch (error) {
        console.error("Failed to load escalations:", error)
        toast({
          title: "エラー",
          description: "エスカレーション情報の読み込みに失敗しました",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadEscalations()
  }, [toast])

  // エスカレーション確認処理
  const handleConfirm = (id: string, category: "technical" | "business" | "personnel") => {
    try {
      confirmEscalation(id)
      toast({
        title: "確認完了",
        description: "エスカレーション項目を確認済みにしました",
      })

      // 状態を更新
      if (category === "technical") {
        setTechnicalEscalations(technicalEscalations.filter((e) => e.id !== id))
      } else if (category === "business") {
        setBusinessEscalations(businessEscalations.filter((e) => e.id !== id))
      } else if (category === "personnel") {
        setPersonnelEscalations(personnelEscalations.filter((e) => e.id !== id))
      }
    } catch (error) {
      console.error("Failed to confirm escalation:", error)
      toast({
        title: "エラー",
        description: "確認処理に失敗しました",
        variant: "destructive",
      })
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

  // カテゴリの日本語名を返す
  const getCategoryName = (category: string) => {
    switch (category) {
      case "technical":
        return "技術的リスク"
      case "business":
        return "事業的リスク"
      case "personnel":
        return "人事的リスク"
      default:
        return category
    }
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
                <Badge variant={getRiskBadgeVariant(escalation.riskScore) as any} className="font-medium">
                  {getRiskText(escalation.riskScore)}（{escalation.riskScore}）
                </Badge>
              </TableCell>
              <TableCell>{escalation.themeName}</TableCell>
              <TableCell>{escalation.date}</TableCell>
              <TableCell className="hidden md:table-cell max-w-xs truncate">{escalation.excerpt}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/minutes/summary/${escalation.minuteId}`}>
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
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">エスカレーション</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="technical">技術的リスク</TabsTrigger>
          <TabsTrigger value="business">事業的リスク</TabsTrigger>
          <TabsTrigger value="personnel">人事的リスク</TabsTrigger>
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
