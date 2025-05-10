"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { useMinutesStore } from "@/lib/store"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function MinutesDB() {
  const { minutes } = useMinutesStore()
  const [searchTerm, setSearchTerm] = useState("")

  // 検索フィルター
  const filteredMinutes = minutes.filter(
    (record) =>
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.factory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="flex h-screen">
      {/* Navigation Area */}
      <Navigation />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">議事録データベース</h1>

        {/* 検索バー */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="議事録を検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>

        {filteredMinutes.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            議事録がありません。議事録生成画面から議事録を作成してください。
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {filteredMinutes.map((record) => (
              <AccordionItem key={record.id} value={record.id} className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 data-[state=open]:bg-gray-50">
                  <div className="flex flex-1 justify-between items-center text-left">
                    <div className="font-medium">{record.title || "無題の議事録"}</div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div>
                        {record.factory} - {record.department}
                      </div>
                      <div>{formatDate(record.date)}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 bg-white">
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap">{record.content}</div>

                    {record.emails.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">送信先メールアドレス:</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.emails.map((email, index) => (
                            <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                              {email}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}
