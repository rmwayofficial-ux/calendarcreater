import { buildWeeks, WEEKDAY_LABELS } from './calendar'
import { drawSeasonMotif, seasonForMonth } from './season'
import { themeById, type Theme } from './theme'
import { MARK_SYMBOL, type CalendarData, type Mark } from './types'

// ◎=赤 / ○=緑 / △=青 / ×=濃グレー / −=グレー（意味なので全テーマ共通）。
// 彩度をやや抑え、生成りの背景になじむ落ち着いた色味に。
const MARK_INK: Record<Mark, string> = {
  none: '#AEA89E',
  double: '#CF4A3C',
  circle: '#3E9B63',
  triangle: '#3A6FB0',
  cross: '#5A5A5A',
}
const MARK_WORD: Record<Mark, string> = {
  none: '受付不可',
  double: '空き十分',
  circle: '空きあり',
  triangle: '残りわずか',
  cross: '満席',
}

const SUN = '#C75D5D'
const SAT = '#5476A6'

const FONT = `'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic','Meiryo',sans-serif`

// 現在のテーマ（描画中に参照。レンダリングは同期処理なのでモジュール変数で保持）
let T: Theme = themeById('soft')

// 文字間隔（対応ブラウザのみ適用。未対応でも無視されるだけで安全）
function tracking(ctx: CanvasRenderingContext2D, px: number): void {
  try {
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`
  } catch {
    // 無視
  }
}

// 文字色（淡いラベル用）。ink と背景の中間色。
function mutedInk(): string {
  return mixHex(T.ink, T.cardBg, 0.46)
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export interface RenderResult {
  width: number
  height: number
}

// レイアウト定数（論理px・幅1200）
const W = 1200
const SCALE = 2
const OUTER_X = 64
const OUTER_TOP = 60
const OUTER_BOTTOM = 60
const CARD_PAD = 34
const TITLE_H = 122
const GRID_TOP_GAP = 14
const WEEKDAY_H = 56
const ROW_BASE_H = 156
const ROW_NOTE_H = 32
const LEGEND_H = 90

// カレンダー本体（白いカード）の幅は常に一定。出力サイズは周囲の余白で調整する。
const CARD_W = W - OUTER_X * 2
// 縦横比を固定する出力で、カードの周りに最低限とる余白
const FIT_MARGIN = 80

// 出力サイズ（投稿先に合わせた縦横比）
export interface OutputFormat {
  id: string
  label: string
  hint: string
  fileTag: string // ダウンロードファイル名に付ける語
  ratio: number | null // 幅 / 高さ。null は内容に合わせた自然なサイズ
}

export const FORMATS: OutputFormat[] = [
  { id: 'blog', label: 'ブログ用', hint: '内容に合わせた標準サイズ（記事に貼りやすい）', fileTag: 'ブログ', ratio: null },
  { id: 'facebook', label: 'Facebook用', hint: '正方形 1:1（フィードで全体が表示されます）', fileTag: 'Facebook', ratio: 1 },
  { id: 'instagram', label: 'Instagram用', hint: '縦長 4:5（フィードで大きく表示されます）', fileTag: 'Instagram', ratio: 4 / 5 },
]

export function formatById(id: string | null | undefined): OutputFormat {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0]
}

interface Layout {
  canvasW: number
  canvasH: number
  cardX: number
  cardY: number
}

// カード（cardW×cardH）を、指定の縦横比に収まる canvas の中央へ配置する
function computeLayout(cardW: number, cardH: number, ratio: number | null): Layout {
  if (ratio == null) {
    return {
      canvasW: cardW + OUTER_X * 2,
      canvasH: OUTER_TOP + cardH + OUTER_BOTTOM,
      cardX: OUTER_X,
      cardY: OUTER_TOP,
    }
  }
  const needW = cardW + FIT_MARGIN * 2
  const needH = cardH + FIT_MARGIN * 2
  let canvasW: number
  let canvasH: number
  if (needW / needH >= ratio) {
    canvasW = needW
    canvasH = needW / ratio
  } else {
    canvasH = needH
    canvasW = needH * ratio
  }
  return { canvasW, canvasH, cardX: (canvasW - cardW) / 2, cardY: (canvasH - cardH) / 2 }
}

export function drawCalendar(
  canvas: HTMLCanvasElement,
  data: CalendarData,
  theme?: Theme,
  formatId?: string,
): RenderResult {
  T = theme ?? T
  const weeks = buildWeeks(data.year, data.month)

  const cardW = CARD_W
  const gridW = cardW - CARD_PAD * 2
  const colW = gridW / 7

  // ことばの行数（手動の改行を考慮）に応じて、その週の高さを広げる
  const rowHeights = weeks.map((week) => {
    let extra = 0
    for (const c of week) {
      if (c.day === 0) continue
      const ds = data.marks[c.day]
      if (!ds) continue
      const note = (ds.note ?? '').trim()
      if (!note) continue
      const hasMarks = ds.am !== 'none' || ds.pm !== 'none'
      if (hasMarks) {
        extra = Math.max(extra, ROW_NOTE_H)
      } else {
        const manualLines = Math.min(5, note.split('\n').length)
        extra = Math.max(extra, manualLines >= 2 ? (manualLines - 1) * 36 : 0)
      }
    }
    return ROW_BASE_H + extra
  })
  const bodyH = rowHeights.reduce((a, b) => a + b, 0)
  const gridH = WEEKDAY_H + bodyH

  const cardH = CARD_PAD + TITLE_H + GRID_TOP_GAP + gridH + 24 + LEGEND_H + CARD_PAD

  // 出力サイズ（投稿先）に応じて canvas 寸法とカード位置を決める
  const { canvasW, canvasH, cardX, cardY } = computeLayout(cardW, cardH, formatById(formatId).ratio)
  const gridX = cardX + CARD_PAD
  const cardCenterX = cardX + cardW / 2

  canvas.width = canvasW * SCALE
  canvas.height = canvasH * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.textBaseline = 'alphabetic'

  const season = seasonForMonth(data.month)

  // 背景（生成り＋季節のかすかな色）
  ctx.fillStyle = T.seasonTint ? season.tint : T.plainBg
  ctx.fillRect(0, 0, canvasW, canvasH)

  // 余白に季節モチーフ（薄く控えめに）。クール・シャープ等 motif=false は背景の色のみ。
  if (T.motif) {
    drawDecorations(ctx, season.key, season.accent, { x: cardX, y: cardY, w: cardW, h: cardH }, canvasW, canvasH)
  }

  // 白いカード（影は控えめに）
  ctx.save()
  if (T.shadowBlur > 0) {
    ctx.shadowColor = T.shadowColor
    ctx.shadowBlur = T.shadowBlur
    ctx.shadowOffsetY = 8
  }
  roundRect(ctx, cardX, cardY, cardW, cardH, T.cardRadius)
  ctx.fillStyle = T.cardBg
  ctx.fill()
  ctx.restore()

  // ===== カード内 =====
  const y0 = cardY + CARD_PAD
  const muted = mutedInk()

  // 見出しブロック：小さな年 → タイトル → 短いヘアライン
  ctx.textAlign = 'center'
  // 年（季節名は入れない）
  ctx.font = `600 20px ${FONT}`
  ctx.fillStyle = muted
  tracking(ctx, 6)
  ctx.fillText(`${data.year}`, cardCenterX, y0 + 24)
  tracking(ctx, 0)
  // タイトル
  ctx.font = `600 56px ${FONT}`
  ctx.fillStyle = T.ink
  tracking(ctx, 1.5)
  ctx.fillText(data.title || `${data.month}月の予約状況`, cardCenterX, y0 + 84)
  tracking(ctx, 0)
  // 短い区切り線
  ctx.strokeStyle = T.accent
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cardCenterX - 44, y0 + 106)
  ctx.lineTo(cardCenterX + 44, y0 + 106)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.lineCap = 'butt'

  let y = y0 + TITLE_H + GRID_TOP_GAP

  // カレンダー表
  const gX = gridX
  const gY = y
  const bodyTop = gY + WEEKDAY_H

  // 曜日（ベタ塗りせず、文字＋細い罫線で上品に）
  ctx.textAlign = 'center'
  ctx.font = `600 23px ${FONT}`
  tracking(ctx, 2)
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i === 0 ? SUN : i === 6 ? SAT : muted
    ctx.fillText(WEEKDAY_LABELS[i], gX + colW * i + colW / 2, gY + 37)
  }
  tracking(ctx, 0)

  // セル内容（罫線より先）
  let cy = bodyTop
  weeks.forEach((week, wi) => {
    const rowH = rowHeights[wi]
    week.forEach((cell, ci) => {
      drawCell(ctx, gX + colW * ci, cy, colW, rowH, cell, data)
    })
    cy += rowH
  })

  // 罫線（細いヘアライン）。曜日の下だけアクセント寄りの線で軽く区切る。
  ctx.save()
  roundRect(ctx, gX, gY, gridW, gridH, T.gridRadius)
  ctx.clip()
  ctx.strokeStyle = T.gridLine
  ctx.lineWidth = T.gridWidth
  for (let i = 1; i < 7; i++) {
    const lx = gX + colW * i
    ctx.beginPath()
    ctx.moveTo(lx, bodyTop)
    ctx.lineTo(lx, gY + gridH)
    ctx.stroke()
  }
  let hy = bodyTop
  for (let r = 0; r < weeks.length - 1; r++) {
    hy += rowHeights[r]
    ctx.beginPath()
    ctx.moveTo(gX, hy)
    ctx.lineTo(gX + gridW, hy)
    ctx.stroke()
  }
  // 曜日帯の下のライン（少しだけ強調）
  ctx.strokeStyle = mixHex(T.accent, T.cardBg, 0.5)
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(gX, bodyTop)
  ctx.lineTo(gX + gridW, bodyTop)
  ctx.stroke()
  ctx.restore()

  // 外枠（ヘアライン）
  roundRect(ctx, gX, gY, gridW, gridH, T.gridRadius)
  ctx.strokeStyle = T.frame
  ctx.lineWidth = T.frameWidth
  ctx.stroke()

  y = gY + gridH + 24

  drawLegend(ctx, gridX, gridW, y)

  return { width: canvas.width, height: canvas.height }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: ReturnType<typeof buildWeeks>[number][number],
  data: CalendarData,
): void {
  if (cell.day === 0) return

  const dateColor = cell.holidayName || cell.isSunday ? SUN : cell.isSaturday ? SAT : T.ink
  ctx.fillStyle = dateColor
  ctx.textAlign = 'left'
  ctx.font = `600 26px ${FONT}`
  ctx.fillText(String(cell.day), x + 14, y + 34)

  if (cell.holidayName) {
    ctx.fillStyle = SUN
    ctx.textAlign = 'right'
    ctx.font = `12px ${FONT}`
    ctx.fillText(cell.holidayName, x + w - 10, y + 22)
  }

  const ds = data.marks[cell.day] ?? { am: 'none' as Mark, pm: 'none' as Mark, note: '' }
  const note = (ds.note ?? '').trim()
  const hasMarks = ds.am !== 'none' || ds.pm !== 'none'

  if (note && !hasMarks) {
    drawNoteBig(ctx, note, x, y + 44, w, h - 52)
    return
  }

  drawSlot(ctx, 'AM', ds.am, x, y + 72, w)
  ctx.strokeStyle = T.divider
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + w * 0.32, y + 100)
  ctx.lineTo(x + w * 0.68, y + 100)
  ctx.stroke()
  drawSlot(ctx, 'PM', ds.pm, x, y + 128, w)

  if (note) drawNoteBand(ctx, note, x, y + h - 26, w)
}

function drawSlot(ctx: CanvasRenderingContext2D, label: string, mark: Mark, x: number, centerY: number, w: number): void {
  ctx.textBaseline = 'middle'

  // AM / PM（小さく・淡く・トラッキング）
  ctx.fillStyle = mutedInk()
  ctx.textAlign = 'left'
  ctx.font = `600 15px ${FONT}`
  tracking(ctx, 1)
  ctx.fillText(label, x + 14, centerY)
  tracking(ctx, 0)

  ctx.textAlign = 'center'
  if (mark === 'none') {
    // 何も入っていない日は横棒「−」（予約を受け付けない＝受付不可）
    drawSymbol(ctx, '−', x + w * 0.63, centerY, 38, MARK_INK.none)
  } else {
    drawSymbol(ctx, MARK_SYMBOL[mark], x + w * 0.63, centerY, 40, MARK_INK[mark])
  }

  ctx.textBaseline = 'alphabetic'
}

// マーク記号（塗り＋ごく細い縁取りで、にじまずクリアに）
function drawSymbol(ctx: CanvasRenderingContext2D, sym: string, x: number, y: number, size: number, color: string): void {
  ctx.font = `600 ${size}px ${FONT}`
  ctx.fillStyle = color
  ctx.fillText(sym, x, y)
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.02
  ctx.lineJoin = 'round'
  ctx.strokeText(sym, x, y)
}

function drawNoteBig(ctx: CanvasRenderingContext2D, text: string, x: number, top: number, w: number, areaH: number): void {
  const maxW = w - 26
  ctx.font = `600 14px ${FONT}`
  let chosen = 14
  let lines = layoutNoteLines(ctx, text, maxW)
  for (let s = 30; s >= 14; s--) {
    ctx.font = `600 ${s}px ${FONT}`
    const ls = layoutNoteLines(ctx, text, maxW)
    const lineH = s * 1.24
    if (ls.length * lineH <= areaH) {
      chosen = s
      lines = ls
      break
    }
  }
  ctx.font = `600 ${chosen}px ${FONT}`
  const lineH = chosen * 1.24
  const blockH = lines.length * lineH
  const startY = top + (areaH - blockH) / 2 + chosen * 0.86
  ctx.fillStyle = T.accent
  ctx.textAlign = 'center'
  lines.forEach((ln, i) => ctx.fillText(ln, x + w / 2, startY + i * lineH))
}

function layoutNoteLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    if (para === '') {
      out.push('')
      continue
    }
    out.push(...wrapText(ctx, para, maxW, 99))
  }
  return out
}

function drawNoteBand(ctx: CanvasRenderingContext2D, text: string, x: number, top: number, w: number): void {
  const maxW = w - 18
  ctx.font = `600 15px ${FONT}`
  ctx.fillStyle = T.accent
  ctx.textAlign = 'center'
  const oneLine = text.replace(/\s*\n\s*/g, ' ')
  const line = wrapText(ctx, oneLine, maxW, 1)[0] ?? ''
  ctx.fillText(line, x + w / 2, top + 16)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const chars = Array.from(text)
  const lines: string[] = []
  let cur = ''
  for (const ch of chars) {
    if (ctx.measureText(cur + ch).width <= maxW) {
      cur += ch
    } else {
      lines.push(cur)
      cur = ch
      if (lines.length === maxLines) break
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur)
  const consumed = lines.join('').length
  if (consumed < chars.length && lines.length > 0) {
    let last = lines[lines.length - 1]
    while (last.length > 0 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1)
    lines[lines.length - 1] = last + '…'
  }
  return lines
}

function drawLegend(ctx: CanvasRenderingContext2D, gridX: number, gridW: number, top: number): void {
  const items: Mark[] = ['double', 'circle', 'triangle', 'cross', 'none']
  const symW = 44
  const gap = 30
  ctx.font = `600 24px ${FONT}`
  const itemWs = items.map((m) => symW + ctx.measureText(MARK_WORD[m]).width)
  const totalW = itemWs.reduce((a, b) => a + b, 0) + gap * (items.length - 1)
  let x = gridX + (gridW - totalW) / 2
  const baseY = top + 46
  items.forEach((m, i) => {
    ctx.textAlign = 'left'
    drawSymbol(ctx, m === 'none' ? '−' : MARK_SYMBOL[m], x + 2, baseY, 36, MARK_INK[m])
    ctx.fillStyle = T.ink
    ctx.font = `600 24px ${FONT}`
    ctx.fillText(MARK_WORD[m], x + symW, baseY - 3)
    x += itemWs[i] + gap
  })
}

// 余白に季節モチーフを「薄く・控えめに」配置。カードの陰からのぞくように2点だけ。
function drawDecorations(
  ctx: CanvasRenderingContext2D,
  key: ReturnType<typeof seasonForMonth>['key'],
  accent: string,
  card: { x: number; y: number; w: number; h: number },
  w: number,
  h: number,
): void {
  const motifColor = mixHex(accent, T.decoBlend, T.decoBlendAmt)
  const cardR = card.x + card.w
  const cardB = card.y + card.h
  const rightM = w - cardR
  const bottomM = h - cardB
  const leftM = card.x
  const topM = card.y

  const spot = (cx: number, cy: number, r: number, a: number): void => {
    ctx.save()
    ctx.globalAlpha = a * T.decoAlpha
    drawSeasonMotif(ctx, key, cx, cy, r * T.decoScale, motifColor)
    ctx.restore()
  }

  // 主モチーフ：右下のコーナー（大きめ・うっすら）
  const r1 = clamp(Math.min(rightM, bottomM) * 1.15, 46, 116)
  spot(cardR + rightM * 0.35, cardB + bottomM * 0.35, r1, 0.13)

  // 補助モチーフ：左上のコーナー（小さめ・さらにうっすら）
  const r2 = clamp(Math.min(leftM, topM) * 1.0, 36, 84)
  spot(leftM * 0.5, topM * 0.55, r2, 0.1)
}

// 2色を amount(0..1) で混ぜる
function mixHex(a: string, b: string, amount: number): string {
  const pa = parseHex(a)
  const pb = parseHex(b)
  if (!pa || !pb) return a
  const m = (x: number, y: number) => Math.round(x + (y - x) * amount)
  return `rgb(${m(pa[0], pb[0])},${m(pa[1], pb[1])},${m(pa[2], pb[2])})`
}

function parseHex(hex: string): [number, number, number] | null {
  const r = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!r) return null
  const n = parseInt(r[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function toJpegDataUrl(canvas: HTMLCanvasElement, quality = 0.92): string {
  return canvas.toDataURL('image/jpeg', quality)
}
