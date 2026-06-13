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
