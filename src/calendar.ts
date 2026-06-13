import { holidaysForYear } from './holidays'

// 日曜始まり
export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export interface DayCell {
  day: number // 1-31, 0 は空白セル
  weekday: number // 0=日 .. 6=土（day>0 のときのみ有効）
  isSaturday: boolean
  isSunday: boolean
  holidayName: string | null
}

// 日曜始まりの週配列を返す（各週は7要素、空白は day=0）
export function buildWeeks(year: number, month: number): DayCell[][] {
  const holidays = holidaysForYear(year)
  const total = daysInMonth(year, month)
  const firstWeekday = new Date(year, month - 1, 1).getDay() // 0=日

  const cells: DayCell[] = []
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: 0, weekday: i, isSaturday: false, isSunday: false, holidayName: null })
  }
  for (let d = 1; d <= total; d++) {
    const wd = new Date(year, month - 1, d).getDay()
    const hname = holidays[`${month}-${d}`] ?? null
    cells.push({
      day: d,
      weekday: wd,
      isSaturday: wd === 6,
      isSunday: wd === 0,
      holidayName: hname,
    })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, weekday: cells.length % 7, isSaturday: false, isSunday: false, holidayName: null })
  }

  const weeks: DayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// 指定月の「特定曜日」の日付一覧（定休日の一括設定用）。weekday: 0=日 .. 6=土
export function daysOfWeekday(year: number, month: number, weekday: number): number[] {
  const total = daysInMonth(year, month)
  const out: number[] = []
  for (let d = 1; d <= total; d++) {
    if (new Date(year, month - 1, d).getDay() === weekday) out.push(d)
  }
  return out
}
