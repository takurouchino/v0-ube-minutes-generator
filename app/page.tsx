import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  ArrowRight,
  FileText,
  Users,
  Tag,
  Search,
  MessageSquare,
  AlertTriangle,
  Lock,
  CheckSquare,
  BookOpen,
} from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center space-y-6 text-center py-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">議事録ジェネレーター</h1>
        <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          会議テーマごとに議事録を構造化・データベース化し、発言分離・タグ付け・AIサマリ生成・承認フローまでをワンストップで行います。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
        <Card>
          <CardHeader>
            <Tag className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>テーマ管理</CardTitle>
            <CardDescription>会議テーママスタの一覧・新規登録・編集</CardDescription>
          </CardHeader>
          <CardContent>
            <p>テーマ名、カテゴリ、説明などを管理し、会議の目的を明確にします。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/themes">
                テーマ管理へ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>参加者マスタ</CardTitle>
            <CardDescription>参加者情報の登録・テーマ紐付け</CardDescription>
          </CardHeader>
          <CardContent>
            <p>氏名、役職、役割、所属部署などを管理し、テーマごとの定常参加者を設定します。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/participants">
                参加者マスタへ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>議事録作成</CardTitle>
            <CardDescription>AIドラフト＋人修正による議事録作成</CardDescription>
          </CardHeader>
          <CardContent>
            <p>AIが発言分離＆タグ付けを行い、効率的に議事録を作成できます。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/minutes/new">
                議事録作成へ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Search className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>検索・履歴</CardTitle>
            <CardDescription>過去議事録検索・関連議事録可視化</CardDescription>
          </CardHeader>
          <CardContent>
            <p>キーワード、テーマ、参加者、期間などで過去の議事録を検索できます。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/search">
                検索・履歴へ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <MessageSquare className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>議事録チャット</CardTitle>
            <CardDescription>AIを活用した議事録検索・質問応答</CardDescription>
          </CardHeader>
          <CardContent>
            <p>過去の議事録に基づいて質問に回答します。会議の決定事項やアクションアイテムを簡単に確認できます。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/chat">
                議事録チャットへ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <AlertTriangle className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>エスカレーション</CardTitle>
            <CardDescription>リスク検出・通知・対応管理</CardDescription>
          </CardHeader>
          <CardContent>
            <p>議事録から技術的・事業的・人事的リスクを自動検出し、適切な担当者に通知します。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/escalation">
                エスカレーションへ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Lock className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>アクセス権管理</CardTitle>
            <CardDescription>テーマ別公開設定・権限管理</CardDescription>
          </CardHeader>
          <CardContent>
            <p>テーマごとに公開/非公開を設定し、アクセス可能なグループやユーザーを管理します。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/access-control">
                アクセス権管理へ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CheckSquare className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>ToDo管理</CardTitle>
            <CardDescription>議事録から抽出されたアクションアイテムの管理</CardDescription>
          </CardHeader>
          <CardContent>
            <p>AIが議事録から自動抽出したアクションアイテムを担当者・期日付きで管理できます。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/todos">
                ToDo管理へ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>カスタム辞書</CardTitle>
            <CardDescription>専門用語・固有名詞の誤変換防止</CardDescription>
          </CardHeader>
          <CardContent>
            <p>社内の専門用語や固有名詞を登録し、文字起こし時の誤変換を防止します。</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dictionary">
                カスタム辞書へ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
