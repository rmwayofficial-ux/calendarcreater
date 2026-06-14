import type { CalendarData } from './types'

const PREFIX = 'calcreate:v1:'

function storageKey(year: number, month: number): string {
  return `${PREFIX}${year}-${String(month).padStart(2, '0')}`
}

export function saveMonth(data: CalendarData): void {
  try {
    localStorage.setItem(storageKey(data.year, data.month), JSON.stringify(data))
  } catch {
    // localStorage 不可（プライベートモード等）でも動作は継続
  }
}

export function loadMonth(year: number, month: number): CalendarData | null {
  try {
    const raw = localStorage.getItem(storageKey(year, month))
    if (!raw) return null
    return JSON.parse(raw) as CalendarData
  } catch {
    return null
  }
}

// 直近で保存済みの月のうち、指定月より前で最も新しいものを返す（前月コピー用）
export function loadPreviousMonth(year: number, month: number): CalendarData | null {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  return loadMonth(prevYear, prevMonth)
}

// ===== テーマの保存 =====
const THEME_KEY = 'calcreate:theme'

export function loadThemeId(): string | null {
  try {
    return localStorage.getItem(THEME_KEY)
  } catch {
    return null
  }
}

export function saveThemeId(id: string): void {
  try {
    localStorage.setItem(THEME_KEY, id)
  } catch {
    // 無視
  }
}

// ===== 出力サイズ（投稿先フォーマット）の保存 =====
const FORMAT_KEY = 'calcreate:format'

export function loadFormatId(): string | null {
  try {
    return localStorage.getItem(FORMAT_KEY)
  } catch {
    return null
  }
}

export function saveFormatId(id: string): void {
  try {
    localStorage.setItem(FORMAT_KEY, id)
  } catch {
    // 無視
  }
}

// ===== 初回ガイドの表示状態 =====
const INTRO_KEY = 'calcreate:introSeen'

export function loadIntroSeen(): boolean {
  try {
    return localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

export function saveIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    // 無視
  }
}

// ===== ファイル保存・読み込み（バックアップ／別端末への移行・共有）=====
interface BackupFile {
  app: 'calendarcreater'
  version: 1
  exportedAt: string
  themeId?: string
  months: CalendarData[]
}

// 保存済みの全月データを集めて JSON 文字列にする
export function exportAll(exportedAt: string): string {
  const months: CalendarData[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(PREFIX)) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        months.push(JSON.parse(raw) as CalendarData)
      } catch {
        // 壊れたエントリはスキップ
      }
    }
  } catch {
    // localStorage 不可
  }
  months.sort((a, b) => a.year - b.year || a.month - b.month)
  const data: BackupFile = {
    app: 'calendarcreater',
    version: 1,
    exportedAt,
    themeId: loadThemeId() ?? undefined,
    months,
  }
  return JSON.stringify(data, null, 2)
}

// バックアップ JSON を読み込んで localStorage に書き込む。読み込んだ月数を返す。
export function importAll(json: string): { count: number; themeId?: string } {
  const parsed = JSON.parse(json) as Partial<BackupFile>
  if (!parsed || parsed.app !== 'calendarcreater' || !Array.isArray(parsed.months)) {
    throw new Error('invalid backup file')
  }
  let count = 0
  for (const m of parsed.months) {
    if (typeof m?.year !== 'number' || typeof m?.month !== 'number') continue
    saveMonth({
      year: m.year,
      month: m.month,
      title: typeof m.title === 'string' ? m.title : `${m.month}月の予約状況`,
      marks: m.marks ?? {},
    })
    count++
  }
  if (typeof parsed.themeId === 'string') saveThemeId(parsed.themeId)
  return { count, themeId: parsed.themeId }
}
