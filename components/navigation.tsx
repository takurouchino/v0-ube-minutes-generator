"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, Database, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div
      className={cn(
        "bg-gray-100 flex flex-col transition-all duration-300 border-r",
        isExpanded ? "w-[calc(1/7*100%)]" : "w-[60px]",
      )}
    >
      <div className="p-4 border-b flex justify-between items-center">
        {isExpanded && <h1 className="font-semibold text-sm">議事録システム</h1>}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-gray-200 active:scale-95 transition-transform"
          aria-label={isExpanded ? "サイドバーを折りたたむ" : "サイドバーを展開する"}
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1 p-2">
          <li>
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-gray-200 active:scale-95 transition-transform",
                pathname === "/dashboard" && "bg-gray-200 font-medium",
                !isExpanded && "justify-center",
              )}
            >
              <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
              {isExpanded && <span>議事録生成</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/minutes-db"
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-gray-200 active:scale-95 transition-transform",
                pathname === "/minutes-db" && "bg-gray-200 font-medium",
                !isExpanded && "justify-center",
              )}
            >
              <Database className="h-5 w-5 mr-2 flex-shrink-0" />
              {isExpanded && <span>議事録DB</span>}
            </Link>
          </li>
          <li>
            <button
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-gray-200 active:scale-95 transition-transform w-full text-left",
                !isExpanded && "justify-center",
              )}
              onClick={(e) => e.preventDefault()}
            >
              <Settings className="h-5 w-5 mr-2 flex-shrink-0" />
              {isExpanded && <span>管理者機能</span>}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
