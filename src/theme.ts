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
    hint: '若葉を思わせる優しいミントクリーム背景。フレッシュで上品',
    accent: '#2E8F7E',
    ink: '#1F3D38',
    // 背景のミントクリームに合わせて、枠線・罫線・区切りも青緑寄りに揃える
    frame: '#7BC7B3',
    frameWidth: 1.8,
    gridLine: '#A8D8C8',
    gridWidth: 1.6,
    divider: '#CFE9DF',
    cardBg: '#FFFFFF',
    cardRadius: 14,
    gridRadius: 10,
    shadowBlur: 20,
    shadowColor: 'rgba(40,120,100,0.10)',
    // 落ち着いたミントクリーム（CSS mintcream より少し濃いめ）を常時背景に
    seasonTint: false,
    motif: true,
    plainBg: '#D6F2E4',
    // 季節モチーフは深めの若葉グリーンに寄せて、背景と馴染ませる
    decoBlend: '#2E8F7E',
    decoBlendAmt: 0.35,
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
    hint: 'ディープネイビー背景に白カードが浮かぶ、シャープでスタイリッシュな仕上がり',
    // カード内（白背景上）の文字・罫線はそのままダーク系で読みやすく。
    accent: '#1B2430',
    ink: '#0F1620',
    frame: '#1F2A37',
    frameWidth: 2.4,
    gridLine: '#33414F',
    gridWidth: 2,
    divider: '#5B6A78',
    cardBg: '#FFFFFF',
    cardRadius: 4,
    gridRadius: 2,
    // 白カードがネイビーに浮き立つよう、控えめな影を足す
    shadowBlur: 22,
    shadowColor: 'rgba(0,0,0,0.45)',
    seasonTint: false,
    motif: false,
    // ディープネイビー背景。白カードとのコントラストでパキッと締まる
    plainBg: '#142540',
    decoBlend: '#3A4654',
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
