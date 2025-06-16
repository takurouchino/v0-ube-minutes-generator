import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { AuthProvider } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UBE Minutes Generator",
  description: "Generate meeting minutes with AI",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-[60px] w-full flex items-center border-b px-6 bg-background">
                  <span className="text-2xl font-bold">UBE Minutes</span>
                </header>
                <div className="flex flex-1 min-h-0">
                  <Sidebar />
                  <div className="flex flex-col flex-1">
                    <main className="flex-1">{children}</main>
                  </div>
                </div>
              </div>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
