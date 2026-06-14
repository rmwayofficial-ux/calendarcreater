// カレンダー（出力JPEG）のデザインテーマ。4種類から選べる。
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
  motif: boolean // 余白に季節イラストを描くか（false なら背景の色のみ）
  plainBg: string // seasonTint=false のときの背景色
  // 季節イラスト（背景モチーフ）をテーマごとに変える設定
  decoBlend: string // 季節色をこの色へ寄せる
  decoBlendAmt: number // 0..1（寄せる割合）
  decoAlpha: number // 透明度の倍率
  decoScale: number // 大きさの倍率
}

export const THEMES: Theme[] = [
  {
    id: 'soft',
    label: 'やわらか',
    hint: '丸み・淡い色・やさしい雰囲気',
    accent: '#4AB4AA',
    ink: '#4A4A4A',
    frame: '#6E6E6E',
    frameWidth: 2.2,
    gridLine: '#9A9A9A',
    gridWidth: 1.7,
    divider: '#DCDCDC',
    cardBg: '#FFFFFF',
    cardRadius: 24,
    gridRadius: 14,
    shadowBlur: 18,
    shadowColor: 'rgba(60,60,60,0.14)',
    seasonTint: true,
    motif: true,
    plainBg: '#FFFFFF',
    decoBlend: '#4AB4AA',
    decoBlendAmt: 0.18,
    decoAlpha: 0.95,
    decoScale: 1.0,
  },
  {
    id: 'sharp',
    label: 'クール',
    hint: 'すっきり・モダン（背景は季節の色のみ／イラストなし）',
    accent: '#1F6F7A',
    ink: '#23303A',
    frame: '#3F3F3F',
    frameWidth: 2.6,
    gridLine: '#7E7E7E',
    gridWidth: 1.7,
    divider: '#C6C6C6',
    cardBg: '#FFFFFF',
    cardRadius: 0,
    gridRadius: 0,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    seasonTint: true,
    motif: false,
    plainBg: '#EEF1F4',
    decoBlend: '#1F6F7A',
    decoBlendAmt: 0.42,
    decoAlpha: 0.9,
    decoScale: 0.85,
  },
  {
    id: 'plain',
    label: 'シャープ',
    hint: '背景色は変わらない・無地でクリア（毎月、月日だけが変わる）',
    accent: '#33414F',
    ink: '#1F2A33',
    frame: '#33414F',
    frameWidth: 2.4,
    gridLine: '#9AA4AE',
    gridWidth: 1.6,
    divider: '#D2D7DD',
    cardBg: '#FFFFFF',
    cardRadius: 4,
    gridRadius: 4,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    seasonTint: false,
    motif: false,
    plainBg: '#EEF1F4',
    decoBlend: '#33414F',
    decoBlendAmt: 0.4,
    decoAlpha: 0.9,
    decoScale: 0.85,
  },
  {
    id: 'warm',
    label: 'あたたか',
    hint: '温かみ・ナチュラル・落ち着き',
    accent: '#7D9A5C',
    ink: '#574C3E',
    frame: '#8A6E45',
    frameWidth: 2.2,
    gridLine: '#B39A72',
    gridWidth: 1.7,
    divider: '#E3D9C8',
    cardBg: '#FFFDF7',
    cardRadius: 20,
    gridRadius: 12,
    shadowBlur: 16,
    shadowColor: 'rgba(150,120,80,0.16)',
    seasonTint: true,
    motif: true,
    plainBg: '#FBF6EC',
    decoBlend: '#9C7A4E',
    decoBlendAmt: 0.3,
    decoAlpha: 1.0,
    decoScale: 1.08,
  },
]

export function themeById(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
