// 予約状況マーク。空き量を4段階で表す。
//  none     : 未設定（横棒「−」で表示。予約を受け付けない＝受付不可の日として扱う）
//  double   : ◎ 空き十分・ご予約可
//  circle   : ○ 空きあり
//  triangle : △ 残りわずか
//  cross    : × 満席・受付終了
export type Mark = 'none' | 'double' | 'circle' | 'triangle' | 'cross'

// クリックで循環する順序
export const MARK_CYCLE: Mark[] = ['none', 'double', 'circle', 'triangle', 'cross']

export const MARK_SYMBOL: Record<Mark, string> = {
  none: '',
  double: '◎',
  circle: '○',
  triangle: '△',
  cross: '×',
}

export const MARK_LABEL: Record<Mark, string> = {
  none: '受付不可',
  double: '空き十分',
  circle: '空きあり',
  triangle: '残りわずか',
  cross: '満席・受付終了',
}

// 1日分の状態（午前・午後 ＋ 任意のことば）
// note: 特別イベント・出張など、◎○△× では表せない内容を自由入力する欄
export interface DayState {
  am: Mark
  pm: Mark
  note?: string
}

// 月ごとの全状態。キーは日（1〜31）。
export type MonthMarks = Record<number, DayState>

// 1ヶ月ぶんの編集データ（localStorage 保存単位）
export interface CalendarData {
  year: number
  month: number // 1-12
  title: string
  marks: MonthMarks
}

export function emptyDay(): DayState {
  return { am: 'none', pm: 'none', note: '' }
}
