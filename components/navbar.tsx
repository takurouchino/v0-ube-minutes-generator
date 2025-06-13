"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { LogOut, User } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { user, userProfile, signOut } = useAuth()

  const routes = [
    {
      href: "/",
      label: "ホーム",
      active: pathname === "/",
    },
    {
      href: "/themes",
      label: "テーマ",
      active: pathname === "/themes",
    },
    {
      href: "/participants",
      label: "参加者",
      active: pathname === "/participants",
    },
    {
      href: "/minutes/new",
      label: "議事録作成",
      active: pathname === "/minutes/new",
    },
    {
      href: "/todos",
      label: "ToDo",
      active: pathname === "/todos",
    },
    {
      href: "/dictionary",
      label: "辞書",
      active: pathname === "/dictionary",
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
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="text-xl font-bold">
          UBE Minutes Generator
        </Link>
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-black dark:text-white" : "text-muted-foreground",
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
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
                    <p className="text-xs leading-none text-muted-foreground">{userProfile?.email || user.email}</p>
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
        </div>
      </div>
    </div>
  )
}
