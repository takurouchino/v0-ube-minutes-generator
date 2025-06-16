"use client"

// 参加者タイプの定義
export type Participant = {
  id: string
  name: string
  position: string
  role: string
  department: string
  themes: string[]
}

// テーマタイプの定義
export type Theme = {
  id: string
  name: string
  category: string
  description: string
  createdAt: string
  participants: string[] // 参加者IDの配列
}

// 議事録タイプの定義
export type Minute = {
  id: string
  themeId: string
  title: string
  date: string
  time: string
  participants: string[] // 参加者IDの配列
  content: string
  sentences?: {
    id: string
    text: string
    speaker: string
    role: string
  }[]
  summary?: {
    progress: string
    keyPoints: string
    decisions: string
    actions: string
  }
  status: "draft" | "review" | "approved"
  author: string
  approver?: string
  createdAt: string
  updatedAt: string
}

// エスカレーション項目の型定義
export type EscalationItem = {
  id: string
  minuteId: string
  themeId: string
  themeName: string
  date: string
  category: "technical" | "business" | "personnel"
  riskScore: number
  excerpt: string
  confirmed: boolean
  createdAt: string
}

// ローカルストレージキー
const PARTICIPANTS_KEY = "ube-minutes-participants"
const THEMES_KEY = "ube-minutes-themes"
const MINUTES_KEY = "ube-minutes-data"
const ESCALATIONS_KEY = "ube-minutes-escalations"
const ACCESS_CONTROL_KEY = "ube-minutes-access-control"

// 初期データ
const initialParticipants: Participant[] = [
  {
    id: "1",
    name: "山田 太郎",
    position: "工場長",
    role: "管理者",
    department: "製造部",
    themes: ["1", "2", "3"],
  },
  {
    id: "2",
    name: "佐藤 次郎",
    position: "品質管理責任者",
    role: "品質管理",
    department: "品質管理部",
    themes: ["1", "5"],
  },
  {
    id: "3",
    name: "鈴木 三郎",
    position: "生産管理者",
    role: "生産管理",
    department: "製造部",
    themes: ["2", "4"],
  },
  {
    id: "4",
    name: "高橋 四郎",
    position: "安全衛生責任者",
    role: "安全管理",
    department: "総務部",
    themes: ["3"],
  },
  {
    id: "5",
    name: "田中 五郎",
    position: "外部コンサルタント",
    role: "社外コンサル",
    department: "外部",
    themes: ["4", "5"],
  },
]

const initialThemes: Theme[] = [
  {
    id: "1",
    name: "月次品質管理会議",
    category: "品質管理会議",
    description: "毎月の品質指標の確認と改善策の検討を行う会議",
    createdAt: "2023-04-01",
    participants: ["1", "2"],
  },
  {
    id: "2",
    name: "週次進捗会議",
    category: "進捗会議",
    description: "週次の進捗状況の確認と課題の共有を行う会議",
    createdAt: "2023-04-05",
    participants: ["1", "3"],
  },
  {
    id: "3",
    name: "安全衛生委員会",
    category: "全体会議",
    description: "工場内の安全衛生に関する議題を検討する委員会",
    createdAt: "2023-04-10",
    participants: ["1", "4"],
  },
  {
    id: "4",
    name: "生産計画会議",
    category: "計画会議",
    description: "月次の生産計画を立案し、リソース配分を決定する会議",
    createdAt: "2023-04-15",
    participants: ["3", "5"],
  },
  {
    id: "5",
    name: "改善提案検討会",
    category: "改善会議",
    description: "現場からの改善提案を検討し、実施の可否を決定する会議",
    createdAt: "2023-04-20",
    participants: ["2", "5"],
  },
]

const initialMinutes: Minute[] = [
  {
    id: "1",
    themeId: "1",
    title: "月次品質管理会議",
    date: "2023-05-15",
    time: "10:00",
    participants: ["1", "2"],
    content: "前回の品質管理会議で議論した不良率低減策について、実施状況を確認したいと思います。...",
    sentences: [
      {
        id: "1",
        text: "前回の品質管理会議で議論した不良率低減策について、実施状況を確認したいと思います。",
        speaker: "1",
        role: "管理者",
      },
      {
        id: "2",
        text: "はい、前回決定した3つの対策のうち、検査工程の見直しと作業手順書の改訂は完了しました。",
        speaker: "2",
        role: "品質管理",
      },
    ],
    summary: {
      progress: "前回の品質管理会議で決定した不良率低減策のうち、検査工程の見直しと作業手順書の改訂が完了した。",
      keyPoints: "1. 検査工程の見直しと作業手順書の改訂により不良率15%減少\n2. 設備メンテナンス頻度の見直しは調整中",
      decisions: "月次でのフォローアップ体制を整えることが決定された。",
      actions: "1. 設備メンテナンス頻度の見直しを来週までに完了する（担当：生産管理）",
    },
    status: "draft",
    author: "山田 太郎",
    createdAt: "2023-05-15",
    updatedAt: "2023-05-15",
  },
]

// 初期エスカレーションデータ
const initialEscalations: EscalationItem[] = [
  {
    id: "1",
    minuteId: "1",
    themeId: "1",
    themeName: "月次品質管理会議",
    date: "2023-05-15",
    category: "technical",
    riskScore: 85,
    excerpt: "不良率が15%上昇しており、早急な対応が必要です。",
    confirmed: false,
    createdAt: "2023-05-15",
  },
  {
    id: "2",
    minuteId: "1",
    themeId: "1",
    themeName: "月次品質管理会議",
    date: "2023-05-15",
    category: "business",
    riskScore: 70,
    excerpt: "納期遅延のリスクが高まっており、顧客への説明が必要です。",
    confirmed: false,
    createdAt: "2023-05-15",
  },
  {
    id: "3",
    minuteId: "1",
    themeId: "2",
    themeName: "週次進捗会議",
    date: "2023-05-10",
    category: "personnel",
    riskScore: 60,
    excerpt: "人員不足により、一部の工程で残業が増加しています。",
    confirmed: false,
    createdAt: "2023-05-10",
  },
]

// エスカレーション情報の取得
export function getEscalations(): EscalationItem[] {
  if (typeof window === "undefined") return []

  const storedData = localStorage.getItem(ESCALATIONS_KEY)
  if (!storedData) {
    // 初期データをセット
    localStorage.setItem(ESCALATIONS_KEY, JSON.stringify(initialEscalations))
    return initialEscalations
  }

  return JSON.parse(storedData)
}

// エスカレーション情報の保存
export function saveEscalations(escalations: EscalationItem[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ESCALATIONS_KEY, JSON.stringify(escalations))
}

// カテゴリ別のエスカレーション情報の取得
export function getEscalationsByCategory(category: "technical" | "business" | "personnel"): EscalationItem[] {
  const escalations = getEscalations()
  return escalations.filter((e) => e.category === category && !e.confirmed)
}

// エスカレーション情報の確認済み設定
export function confirmEscalation(id: string): void {
  const escalations = getEscalations()
  const index = escalations.findIndex((e) => e.id === id)

  if (index !== -1) {
    escalations[index].confirmed = true
    saveEscalations(escalations)
  }
}

// アクセス権の型定義
export type AccessControl = {
  themeId: string
  isPublic: boolean
  allowedGroups: string[] // "management", "admin", "user"
  allowedUsers: string[] // ユーザーID
}

// 初期アクセス権データ
const initialAccessControls: AccessControl[] = [
  {
    themeId: "1",
    isPublic: true,
    allowedGroups: [],
    allowedUsers: [],
  },
  {
    themeId: "2",
    isPublic: false,
    allowedGroups: ["management", "admin"],
    allowedUsers: ["1", "2"],
  },
  {
    themeId: "3",
    isPublic: true,
    allowedGroups: [],
    allowedUsers: [],
  },
  {
    themeId: "4",
    isPublic: false,
    allowedGroups: ["admin"],
    allowedUsers: ["3", "5"],
  },
  {
    themeId: "5",
    isPublic: true,
    allowedGroups: [],
    allowedUsers: [],
  },
]

// 参加者の取得
export function getParticipants(): Participant[] {
  if (typeof window === "undefined") return []

  const storedData = localStorage.getItem(PARTICIPANTS_KEY)
  if (!storedData) {
    // 初期データをセット
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(initialParticipants))
    return initialParticipants
  }

  return JSON.parse(storedData)
}

// 参加者の保存
export function saveParticipants(participants: Participant[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants))
}

// 参加者の追加
export function addParticipant(participant: Omit<Participant, "id">): Participant {
  const participants = getParticipants()
  const newParticipant = {
    ...participant,
    id: Date.now().toString(), // 一意のIDを生成
  }

  participants.push(newParticipant)
  saveParticipants(participants)

  return newParticipant
}

// 参加者の更新
export function updateParticipant(participant: Participant): void {
  const participants = getParticipants()
  const index = participants.findIndex((p) => p.id === participant.id)

  if (index !== -1) {
    participants[index] = participant
    saveParticipants(participants)
  }
}

// 参加者の削除
export function deleteParticipant(id: string): void {
  const participants = getParticipants()
  const filteredParticipants = participants.filter((p) => p.id !== id)
  saveParticipants(filteredParticipants)
}

// テーマの取得
export function getThemes(): Theme[] {
  if (typeof window === "undefined") return []

  const storedData = localStorage.getItem(THEMES_KEY)
  if (!storedData) {
    // 初期データをセット
    localStorage.setItem(THEMES_KEY, JSON.stringify(initialThemes))
    return initialThemes
  }

  return JSON.parse(storedData)
}

// テーマの保存
export function saveThemes(themes: Theme[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes))
}

// テーマの追加
export function addTheme(theme: Omit<Theme, "id" | "createdAt">): Theme {
  const themes = getThemes()
  const newTheme = {
    ...theme,
    id: Date.now().toString(), // 一意のIDを生成
    createdAt: new Date().toISOString().split("T")[0], // 現在の日付
  }

  themes.push(newTheme)
  saveThemes(themes)

  return newTheme
}

// テーマの更新
export function updateTheme(theme: Theme): void {
  const themes = getThemes()
  const index = themes.findIndex((t) => t.id === theme.id)

  if (index !== -1) {
    themes[index] = theme
    saveThemes(themes)
  }
}

// テーマの削除
export function deleteTheme(id: string): void {
  const themes = getThemes()
  const filteredThemes = themes.filter((t) => t.id !== id)
  saveThemes(filteredThemes)
}

// テーマに参加者を追加
export function addParticipantToTheme(themeId: string, participantId: string): void {
  try {
    const themes = getThemes()
    const theme = themes.find((t) => t.id === themeId)

    if (!theme) {
      console.error(`Theme with id ${themeId} not found`)
      return
    }

    // 既に追加されている場合は何もしない
    if (theme.participants.includes(participantId)) {
      return
    }

    // 参加者を追加
    theme.participants.push(participantId)

    // テーマ一覧を保存
    saveThemes(themes)

    // 参加者のテーマリストも更新
    const participants = getParticipants()
    const participant = participants.find((p) => p.id === participantId)

    if (participant) {
      // 既に追加されている場合は何もしない
      if (!participant.themes.includes(themeId)) {
        participant.themes.push(themeId)
        saveParticipants(participants)
      }
    }

    console.log(`Added participant ${participantId} to theme ${themeId}`, theme.participants)
  } catch (error) {
    console.error("Error adding participant to theme:", error)
  }
}

// テーマから参加者を削除
export function removeParticipantFromTheme(themeId: string, participantId: string): void {
  try {
    const themes = getThemes()
    const theme = themes.find((t) => t.id === themeId)

    if (!theme) {
      console.error(`Theme with id ${themeId} not found`)
      return
    }

    // 参加者を削除
    theme.participants = theme.participants.filter((id) => id !== participantId)

    // テーマ一覧を保存
    saveThemes(themes)

    // 参加者のテーマリストも更新
    const participants = getParticipants()
    const participant = participants.find((p) => p.id === participantId)

    if (participant) {
      participant.themes = participant.themes.filter((id) => id !== themeId)
      saveParticipants(participants)
    }

    console.log(`Removed participant ${participantId} from theme ${themeId}`, theme.participants)
  } catch (error) {
    console.error("Error removing participant from theme:", error)
  }
}

// テーマIDから参加者一覧を取得
export function getParticipantsByTheme(themeId: string): Participant[] {
  const themes = getThemes()
  const theme = themes.find((t) => t.id === themeId)

  if (!theme) return []

  const participants = getParticipants()
  return participants.filter((p) => theme.participants.includes(p.id))
}

// テーマに参加していない参加者一覧を取得
export function getParticipantsNotInTheme(themeId: string): Participant[] {
  const themes = getThemes()
  const theme = themes.find((t) => t.id === themeId)

  if (!theme) return []

  const participants = getParticipants()
  return participants.filter((p) => !theme.participants.includes(p.id))
}

// 議事録の取得
export function getMinutes(): Minute[] {
  if (typeof window === "undefined") return []

  const storedData = localStorage.getItem(MINUTES_KEY)
  if (!storedData) {
    // 初期データをセット
    localStorage.setItem(MINUTES_KEY, JSON.stringify(initialMinutes))
    return initialMinutes
  }

  return JSON.parse(storedData)
}

// 議事録の保存
export function saveMinutes(minutes: Minute[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(MINUTES_KEY, JSON.stringify(minutes))
}

// 議事録の追加
export function addMinute(minute: Omit<Minute, "id" | "createdAt" | "updatedAt">): Minute {
  const minutes = getMinutes()
  const now = new Date().toISOString()
  const newMinute = {
    ...minute,
    id: Date.now().toString(), // 一意のIDを生成
    createdAt: now.split("T")[0],
    updatedAt: now.split("T")[0],
  }

  minutes.push(newMinute)
  saveMinutes(minutes)

  return newMinute
}

// 議事録の更新
export function updateMinute(minute: Minute): void {
  const minutes = getMinutes()
  const index = minutes.findIndex((m) => m.id === minute.id)

  if (index !== -1) {
    minutes[index] = {
      ...minute,
      updatedAt: new Date().toISOString().split("T")[0],
    }
    saveMinutes(minutes)
  }
}

// 議事録の削除
export function deleteMinute(id: string): void {
  const minutes = getMinutes()
  const filteredMinutes = minutes.filter((m) => m.id !== id)
  saveMinutes(filteredMinutes)
}

// テーマIDから議事録一覧を取得
export function getMinutesByTheme(themeId: string): Minute[] {
  const minutes = getMinutes()
  return minutes.filter((m) => m.themeId === themeId)
}

// 参加者IDから議事録一覧を取得
export function getMinutesByParticipant(participantId: string): Minute[] {
  const minutes = getMinutes()
  return minutes.filter((m) => m.participants.includes(participantId))
}

// ステータスから議事録一覧を取得
export function getMinutesByStatus(status: "draft" | "review" | "approved"): Minute[] {
  const minutes = getMinutes()
  return minutes.filter((m) => m.status === status)
}

// キーワード検索
export function searchMinutes(keyword: string): Minute[] {
  if (!keyword.trim()) return getMinutes()

  const minutes = getMinutes()
  const lowerKeyword = keyword.toLowerCase()

  return minutes.filter((minute) => {
    // タイトル、内容、サマリーなどを検索
    return (
      minute.title.toLowerCase().includes(lowerKeyword) ||
      minute.content.toLowerCase().includes(lowerKeyword) ||
      minute.summary?.progress.toLowerCase().includes(lowerKeyword) ||
      minute.summary?.keyPoints.toLowerCase().includes(lowerKeyword) ||
      minute.summary?.decisions.toLowerCase().includes(lowerKeyword) ||
      minute.summary?.actions.toLowerCase().includes(lowerKeyword) ||
      minute.sentences?.some((s) => s.text.toLowerCase().includes(lowerKeyword))
    )
  })
}

// generateEscalationsFromMinute 関数を以下のように改善します
// 議事録からエスカレーション情報を自動生成
export function generateEscalationsFromMinute(minute: Minute): EscalationItem[] {
  const escalations: EscalationItem[] = []
  const theme = getThemes().find((t) => t.id === minute.themeId)
  const themeName = theme ? theme.name : "不明なテーマ"

  // 議事録の内容を取得
  const content = minute.content || ""

  // 技術的リスクの検出
  const technicalRiskPatterns = [
    { pattern: /不良(率|品|が多い|が発生|が増加|が目立つ|が問題|の発生|の増加|の原因)?/i, score: 60 },
    { pattern: /品質.*?(低下|悪化|問題|不良|課題|懸念|障害)/i, score: 60 },
    { pattern: /停止|トラブル|異常|故障|エラー|バグ/i, score: 60 },
    { pattern: /課題|問題|懸念|障害/i, score: 60 },
    { pattern: /出荷停止|納期遅延|遅れ/i, score: 60 },
  ]

  for (const { pattern, score } of technicalRiskPatterns) {
    const match = content.match(pattern)
    if (match) {
      // マッチした周辺のテキストを抽出（前後50文字）
      const matchIndex = match.index || 0
      const start = Math.max(0, matchIndex - 50)
      const end = Math.min(content.length, matchIndex + match[0].length + 50)
      const excerpt = content.substring(start, end).replace(/\n/g, " ")

      escalations.push({
        minuteId: minute.id,
        themeId: minute.themeId,
        themeName,
        date: minute.date,
        category: "technical",
        riskScore: score,
        excerpt: `${excerpt}`,
        confirmed: false,
        createdAt: new Date().toISOString().split("T")[0],
      })

      // 一つのカテゴリで複数のエスカレーションを検出しないようにbreak
      break
    }
  }

  // 事業的リスクの検出
  const businessRiskPatterns = [
    { pattern: /納期.*?(遅延|遅れ|間に合わない)/i, score: 85 },
    { pattern: /コスト.*?(超過|増加|予算オーバー)/i, score: 80 },
    { pattern: /顧客.*?(クレーム|不満|問い合わせ)/i, score: 75 },
    { pattern: /売上.*?(減少|低下|目標未達)/i, score: 70 },
  ]

  for (const { pattern, score } of businessRiskPatterns) {
    const match = content.match(pattern)
    if (match) {
      const matchIndex = match.index || 0
      const start = Math.max(0, matchIndex - 50)
      const end = Math.min(content.length, matchIndex + match[0].length + 50)
      const excerpt = content.substring(start, end).replace(/\n/g, " ")

      escalations.push({
        minuteId: minute.id,
        themeId: minute.themeId,
        themeName,
        date: minute.date,
        category: "business",
        riskScore: score,
        excerpt: `${excerpt}`,
        confirmed: false,
        createdAt: new Date().toISOString().split("T")[0],
      })

      break
    }
  }

  // 人事的リスクの検出
  const personnelRiskPatterns = [
    { pattern: /人員.*?(不足|欠員|補充)/i, score: 80 },
    { pattern: /残業.*?(増加|多い|長時間)/i, score: 75 },
    { pattern: /スキル.*?(不足|教育|研修)/i, score: 70 },
    { pattern: /労務.*?(問題|課題|改善)/i, score: 65 },
  ]

  for (const { pattern, score } of personnelRiskPatterns) {
    const match = content.match(pattern)
    if (match) {
      const matchIndex = match.index || 0
      const start = Math.max(0, matchIndex - 50)
      const end = Math.min(content.length, matchIndex + match[0].length + 50)
      const excerpt = content.substring(start, end).replace(/\n/g, " ")

      escalations.push({
        minuteId: minute.id,
        themeId: minute.themeId,
        themeName,
        date: minute.date,
        category: "personnel",
        riskScore: score,
        excerpt: `${excerpt}`,
        confirmed: false,
        createdAt: new Date().toISOString().split("T")[0],
      })

      break
    }
  }

  return escalations
}

// アクセス権情報の取得
export function getAccessControls(): AccessControl[] {
  if (typeof window === "undefined") return []

  const storedData = localStorage.getItem(ACCESS_CONTROL_KEY)
  if (!storedData) {
    // 初期データをセット
    localStorage.setItem(ACCESS_CONTROL_KEY, JSON.stringify(initialAccessControls))
    return initialAccessControls
  }

  return JSON.parse(storedData)
}

// アクセス権情報の保存
export function saveAccessControls(accessControls: AccessControl[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCESS_CONTROL_KEY, JSON.stringify(accessControls))
}

// テーマのアクセス権情報の取得
export function getThemeAccessControl(themeId: string): AccessControl | null {
  const accessControls = getAccessControls()
  return accessControls.find((ac) => ac.themeId === themeId) || null
}

// テーマのアクセス権情報の更新
export function updateThemeAccessControl(accessControl: AccessControl): void {
  const accessControls = getAccessControls()
  const index = accessControls.findIndex((ac) => ac.themeId === accessControl.themeId)

  if (index !== -1) {
    accessControls[index] = accessControl
  } else {
    accessControls.push(accessControl)
  }

  saveAccessControls(accessControls)
}

// テーマのアクセス権情報の削除
export function deleteThemeAccessControl(themeId: string): void {
  const accessControls = getAccessControls()
  const filteredAccessControls = accessControls.filter((ac) => ac.themeId !== themeId)
  saveAccessControls(filteredAccessControls)
}

// ユーザーがテーマにアクセスできるかチェック
export function canUserAccessTheme(themeId: string, userId: string, userGroups: string[]): boolean {
  const accessControl = getThemeAccessControl(themeId)

  // アクセス権情報がない場合はアクセス可能
  if (!accessControl) return true

  // 公開テーマの場合はアクセス可能
  if (accessControl.isPublic) return true

  // ユーザーIDが許可リストに含まれている場合はアクセス可能
  if (accessControl.allowedUsers.includes(userId)) return true

  // ユーザーのグループが許可リストに含まれている場合はアクセス可能
  for (const group of userGroups) {
    if (accessControl.allowedGroups.includes(group)) return true
  }

  // それ以外はアクセス不可
  return false
}

// 現在のユーザー情報（モック）
export const currentUser = {
  id: "1",
  name: "山田 太郎",
  groups: ["admin"], // "management", "admin", "user"
}
