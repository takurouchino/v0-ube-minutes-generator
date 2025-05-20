"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { FileText, Menu } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-4 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <nav className="flex flex-col gap-4 py-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold" onClick={() => setOpen(false)}>
                <FileText className="h-5 w-5" />
                議事録ツール
              </Link>
              <Link
                href="/themes"
                className={`px-3 py-2 rounded-md ${pathname === "/themes" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setOpen(false)}
              >
                テーマ管理
              </Link>
              <Link
                href="/participants"
                className={`px-3 py-2 rounded-md ${pathname === "/participants" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setOpen(false)}
              >
                参加者マスタ
              </Link>
              <Link
                href="/minutes/new"
                className={`px-3 py-2 rounded-md ${pathname === "/minutes/new" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setOpen(false)}
              >
                議事録作成
              </Link>
              <Link
                href="/minutes/approval"
                className={`px-3 py-2 rounded-md ${pathname === "/minutes/approval" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setOpen(false)}
              >
                承認フロー
              </Link>
              <Link
                href="/search"
                className={`px-3 py-2 rounded-md ${pathname === "/search" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setOpen(false)}
              >
                検索・履歴
              </Link>
              <Link
                href="/chat"
                className={`px-3 py-2 rounded-md ${pathname === "/chat" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setOpen(false)}
              >
                議事録チャット
              </Link>
              <Link
                href="/escalation"
                className={`px-3 py-2 rounded-md ${pathname === "/escalation" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setOpen(false)}
              >
                エスカレーション
              </Link>
              <Link
                href="/access-control"
                className={`px-3 py-2 rounded-md ${pathname === "/access-control" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setOpen(false)}
              >
                アクセス権管理
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5" />
          <span className="hidden md:inline">AI支援型工場現場議事録ツール</span>
          <span className="md:hidden">議事録ツール</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
