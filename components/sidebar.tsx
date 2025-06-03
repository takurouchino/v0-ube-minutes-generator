"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tag, Users, Search, PlusCircle, MessageSquare, AlertTriangle, Lock } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/themes",
      icon: Tag,
      title: "テーマ管理",
    },
    {
      href: "/participants",
      icon: Users,
      title: "参加者マスタ",
    },
    {
      href: "/minutes/new",
      icon: PlusCircle,
      title: "議事録作成",
    },
    {
      href: "/search",
      icon: Search,
      title: "検索・履歴",
    },
    {
      href: "/chat",
      icon: MessageSquare,
      title: "議事録チャット",
    },
    {
      href: "/escalation",
      icon: AlertTriangle,
      title: "エスカレーション",
    },
    {
      href: "/access-control",
      icon: Lock,
      title: "アクセス権管理",
    },
  ]

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background pt-16">
      <div className="flex flex-col gap-2 p-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              pathname === route.href
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.title}
          </Link>
        ))}
      </div>
    </aside>
  )
}
