"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Home,
  Tag,
  Users,
  PlusCircle,
  Search,
  MessageSquare,
  AlertTriangle,
  Lock,
  CheckSquare,
  BookOpen,
  LogOut,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  const pathname = usePathname()
  const { user, userProfile, signOut } = useAuth()

  const routes = [
    {
      href: "/",
      icon: Home,
      title: "ホーム",
    },
    {
      href: "/themes",
      icon: Tag,
      title: "テーマ",
    },
    {
      href: "/participants",
      icon: Users,
      title: "参加者",
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
      title: "議事チャット",
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
    {
      href: "/todos",
      icon: CheckSquare,
      title: "ToDo管理",
    },
    {
      href: "/dictionary",
      icon: BookOpen,
      title: "辞書",
    },
  ]

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <aside className="flex w-64 flex-col border-r bg-background sticky top-0 min-h-screen">
      <div className="flex flex-col overflow-auto flex-1">
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
        <div className="mt-auto border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{userProfile ? getInitials(userProfile.full_name) : "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.full_name || "ユーザー"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userProfile?.email || user?.email}
                        </p>
                        {userProfile?.company_name && (
                          <p className="text-xs leading-none text-muted-foreground">{userProfile.company_name}</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>プロフィール</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>ログアウト</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
