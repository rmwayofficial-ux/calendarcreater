// 日本の祝日計算（1980〜2099 年で有効）。
// 固定祝日・ハッピーマンデー・春分/秋分・振替休日・国民の休日に対応。

type Holiday = { month: number; day: number; name: string }

function nthMonday(year: number, month: number, nth: number): number {
  // month: 1-12
  const first = new Date(year, month - 1, 1).getDay() // 0=Sun
  const firstMonday = 1 + ((8 - first) % 7)
  return firstMonday + (nth - 1) * 7
}

// 春分の日（近似式・1980〜2099）
function springEquinox(year: number): number {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

// 秋分の日（近似式・1980〜2099）
function autumnEquinox(year: number): number {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

function baseHolidays(year: number): Holiday[] {
  const list: Holiday[] = [
    { month: 1, day: 1, name: '元日' },
    { month: 1, day: nthMonday(year, 1, 2), name: '成人の日' },
    { month: 2, day: 11, name: '建国記念の日' },
    { month: 2, day: 23, name: '天皇誕生日' }, // 2020年以降
    { month: 3, day: springEquinox(year), name: '春分の日' },
    { month: 4, day: 29, name: '昭和の日' },
    { month: 5, day: 3, name: '憲法記念日' },
    { month: 5, day: 4, name: 'みどりの日' },
    { month: 5, day: 5, name: 'こどもの日' },
    { month: 7, day: nthMonday(year, 7, 3), name: '海の日' },
    { month: 8, day: 11, name: '山の日' },
    { month: 9, day: nthMonday(year, 9, 3), name: '敬老の日' },
    { month: 9, day: autumnEquinox(year), name: '秋分の日' },
    { month: 10, day: nthMonday(year, 10, 2), name: 'スポーツの日' },
    { month: 11, day: 3, name: '文化の日' },
    { month: 11, day: 23, name: '勤労感謝の日' },
  ]
  return list
}

function key(month: number, day: number): string {
  return `${month}-${day}`
}

// 指定年の全祝日を { "M-D": 祝日名 } で返す。振替休日・国民の休日を含む。
export function holidaysForYear(year: number): Record<string, string> {
  const result: Record<string, string> = {}
  const base = baseHolidays(year)
  for (const h of base) result[key(h.month, h.day)] = h.name

  // 国民の休日: 祝日に挟まれた平日（前後とも祝日で本人は祝日でない日）
  // 主に敬老の日と秋分の日に挟まれる火曜などが該当。
  const isHoliday = (d: Date) => !!result[key(d.getMonth() + 1, d.getDate())]
  for (const h of base) {
    const d = new Date(year, h.month - 1, h.day)
    const next = new Date(year, h.month - 1, h.day + 2) // 1日空けた先
    const between = new Date(year, h.month - 1, h.day + 1)
    if (isHoliday(d) && isHoliday(next) && !isHoliday(between) && between.getDay() !== 0) {
      result[key(between.getMonth() + 1, between.getDate())] = '国民の休日'
    }
  }

  // 振替休日: 祝日が日曜なら、その後の最初の非祝日を振替休日に。
  for (const h of base) {
    const d = new Date(year, h.month - 1, h.day)
    if (d.getDay() === 0) {
      const sub = new Date(d)
      do {
        sub.setDate(sub.getDate() + 1)
      } while (result[key(sub.getMonth() + 1, sub.getDate())])
      result[key(sub.getMonth() + 1, sub.getDate())] = '振替休日'
    }
  }

  return result
}
