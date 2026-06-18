// カレンダー（出力JPEG）のデザインテーマ。4種類から選べる。
// マークの色（◎赤○緑△青×グレー）は意味なので全テーマ共通。テーマは見た目の質感を変える。
// 方針：ナチュラルで上品に。彩度を抑えた配色・細い罫線・余白多めで洗練された印象にする。

export interface Theme {
  id: string
  label: string
  hint: string
  accent: string // 見出し・季節ラベルなどの色
  ink: string // 日付・文字
  frame: string // 外枠の色（細いヘアライン）
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
  motif: boolean // 余白に季節モチーフを描くか（false なら背景の色のみ）
  plainBg: string // seasonTint=false のときの背景色
  // 季節モチーフ（背景）をテーマごとに調整する設定
  decoBlend: string // 季節色をこの色へ寄せる（彩度を落として上品に）
  decoBlendAmt: number // 0..1（寄せる割合）
  decoAlpha: number // 透明度の倍率
  decoScale: number // 大きさの倍率
}

export const THEMES: Theme[] = [
  {
    id: 'soft',
    label: 'やわらか',
    hint: 'ナチュラルで上品。温かみのあるオートミール生成り背景',
    accent: '#3E7C74',
    ink: '#3B3A35',
    frame: '#CFC6B4',
    frameWidth: 1.6,
    gridLine: '#D3CCBC',
    gridWidth: 1.6,
    divider: '#E2DCCE',
    cardBg: '#FFFFFF',
    cardRadius: 14,
    gridRadius: 10,
    shadowBlur: 22,
    shadowColor: 'rgba(60,55,45,0.10)',
    // 季節依存をやめ、テーマ固有の「やわらかい生成り（オートミール）」で常に統一
    seasonTint: false,
    motif: true,
    plainBg: '#F1E7D2',
    decoBlend: '#B8B0A2',
    decoBlendAmt: 0.45,
    decoAlpha: 1,
    decoScale: 1,
  },
  {
    id: 'sharp',
    label: 'クール',
    hint: 'すっきりモダン。爽やかなクールミスト背景（イラストなし）',
    accent: '#3C6E78',
    ink: '#2C353C',
    frame: '#C8CFD2',
    frameWidth: 1.6,
    gridLine: '#CFD5D8',
    gridWidth: 1.6,
    divider: '#DDE2E4',
    cardBg: '#FFFFFF',
    cardRadius: 6,
    gridRadius: 4,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    // 季節依存をやめ、テーマ固有の「クールミスト（淡い青みグレー）」で常に統一
    seasonTint: false,
    motif: false,
    plainBg: '#DDE9EE',
    decoBlend: '#AEB6B8',
    decoBlendAmt: 0.4,
    decoAlpha: 1,
    decoScale: 1,
  },
  {
    id: 'plain',
    label: 'シャープ',
    hint: 'シャープで明瞭。クリアなライトスレート背景（毎月同じ色）',
    accent: '#2F3A45',
    ink: '#26303A',
    frame: '#CACED3',
    frameWidth: 1.6,
    gridLine: '#D1D5DA',
    gridWidth: 1.6,
    divider: '#DEE1E5',
    cardBg: '#FFFFFF',
    cardRadius: 4,
    gridRadius: 2,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    seasonTint: false,
    motif: false,
    // ライトスレート（スレートグレー寄り）でシャープな明瞭感を出す
    plainBg: '#E1E5EB',
    decoBlend: '#9AA2AA',
    decoBlendAmt: 0.4,
    decoAlpha: 1,
    decoScale: 1,
  },
  {
    id: 'warm',
    label: 'あたたか',
    hint: '温かみ・ナチュラル・落ち着き',
    accent: '#9C6B45',
    ink: '#463C32',
    frame: '#D6C9AC',
    frameWidth: 1.6,
    gridLine: '#DCD0B6',
    gridWidth: 1.6,
    divider: '#E5DAC2',
    cardBg: '#FFFDF8',
    cardRadius: 14,
    gridRadius: 10,
    shadowBlur: 20,
    shadowColor: 'rgba(150,110,70,0.12)',
    seasonTint: true,
    motif: true,
    plainBg: '#FAF4E9',
    decoBlend: '#C2B49C',
    decoBlendAmt: 0.4,
    decoAlpha: 1,
    decoScale: 1,
  },
  {
    id: 'pop',
    label: 'ビタミン',
    hint: 'キリッとビビッド！原宿系ポップなビタミンカラー',
    // 主役は鮮烈なホットピンク、罫線にゴールデンレモン、背景は元気なビビッドレモン。
    // 影は無しでフラットに、枠線を太く取って「キリッとくっきりはっきり」を演出。
    accent: '#FF1F8F',
    ink: '#2A0E4A',
    frame: '#FF1F8F',
    frameWidth: 3,
    gridLine: '#FFC700',
    gridWidth: 2.4,
    divider: '#FFE145',
    cardBg: '#FFFFFF',
    cardRadius: 14,
    gridRadius: 8,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    // 背景は季節色ではなく「常時ビビッドレモン」で原宿系のポップ感を最優先
    seasonTint: false,
    motif: true,
    // 蛍光寄りのビビッドレモン。白カードが浮かぶ「ステッカー」感を狙う
    plainBg: '#FFE94F',
    // 季節モチーフはほぼ無加工で彩度MAXのまま見せる
    decoBlend: '#FF1F8F',
    decoBlendAmt: 0.08,
    decoAlpha: 1.35,
    decoScale: 1.1,
  },
]

export function themeById(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
