// カレンダー（出力JPEG）のデザインテーマ。3種類から選べる。
// マークの色（◎赤○緑△青×グレー）は意味なので全テーマ共通。テーマは見た目の質感を変える。

export interface Theme {
  id: string
  label: string
  hint: string
  accent: string // 見出し・曜日帯の色
  ink: string // 日付・文字
  frame: string // 外枠の色
  frameWidth: number
  gridLine: string // 内部の罫線
  gridWidth: number
  divider: string // AM/PM の区切り
  cardBg: string
  cardRadius: number
  gridRadius: number
  shadowBlur: number // 0 で影なし
  shadowColor: string
  seasonTint: boolean // 背景に季節の淡い色を使うか
  plainBg: string // seasonTint=false のときの背景色
}

export const THEMES: Theme[] = [
  {
    id: 'soft',
    label: 'やわらか',
    hint: '丸み・淡い色・やさしい雰囲気',
    accent: '#4AB4AA',
    ink: '#4A4A4A',
    frame: '#B9B9B9',
    frameWidth: 1.6,
    gridLine: '#D9D9D9',
    gridWidth: 1.2,
    divider: '#DCDCDC',
    cardBg: '#FFFFFF',
    cardRadius: 24,
    gridRadius: 14,
    shadowBlur: 18,
    shadowColor: 'rgba(60,60,60,0.14)',
    seasonTint: true,
    plainBg: '#FFFFFF',
  },
  {
    id: 'sharp',
    label: 'シャープ',
    hint: '直線・くっきり・モダン',
    accent: '#1F6F7A',
    ink: '#23303A',
    frame: '#3F3F3F',
    frameWidth: 2.6,
    gridLine: '#8C8C8C',
    gridWidth: 1.6,
    divider: '#C6C6C6',
    cardBg: '#FFFFFF',
    cardRadius: 0,
    gridRadius: 0,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    seasonTint: false,
    plainBg: '#EEF1F4',
  },
  {
    id: 'warm',
    label: 'あたたか',
    hint: '温かみ・ナチュラル・落ち着き',
    accent: '#7D9A5C',
    ink: '#574C3E',
    frame: '#CBBA9F',
    frameWidth: 1.8,
    gridLine: '#E4D9C5',
    gridWidth: 1.2,
    divider: '#E3D9C8',
    cardBg: '#FFFDF7',
    cardRadius: 20,
    gridRadius: 12,
    shadowBlur: 16,
    shadowColor: 'rgba(150,120,80,0.16)',
    seasonTint: true,
    plainBg: '#FBF6EC',
  },
]

export function themeById(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
