import { buildWeeks, WEEKDAY_LABELS } from './calendar'
import { drawSeasonMotif, seasonForMonth } from './season'
import { themeById, type Theme } from './theme'
import { MARK_SYMBOL, type CalendarData, type Mark } from './types'

// ◎=赤 / ○=緑 / △=青 / ×=濃グレー / 休=グレー（意味なので全テーマ共通）
const MARK_INK: Record<Mark, string> = {
  none: '#9A9A9A',
  double: '#E23B2E',
  circle: '#2FA24C',
  triangle: '#2C6FD6',
  cross: '#555555',
}
const MARK_WORD: Record<Mark, string> = {
  none: '休み',
  double: '空き十分',
  circle: '空きあり',
  triangle: '残りわずか',
  cross: '満席',
}

const SUN = '#D85151'
const SAT = '#3F77B0'

const FONT = `'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic','Meiryo',sans-serif`

// 現在のテーマ（描画中に参照。レンダリングは同期処理なのでモジュール変数で保持）
let T: Theme = themeById('soft')

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
const CARD_PAD = 26
const TITLE_H = 96
const GRID_TOP_GAP = 8
const WEEKDAY_H = 52
const ROW_BASE_H = 156
const ROW_NOTE_H = 32
const LEGEND_H = 96

export function drawCalendar(canvas: HTMLCanvasElement, data: CalendarData, theme?: Theme): RenderResult {
  T = theme ?? T
  const weeks = buildWeeks(data.year, data.month)

  const cardX = OUTER_X
  const cardW = W - OUTER_X * 2
  const gridX = cardX + CARD_PAD
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

  const cardH = CARD_PAD + TITLE_H + GRID_TOP_GAP + gridH + 22 + LEGEND_H + CARD_PAD
  const cardY = OUTER_TOP
  const H = OUTER_TOP + cardH + OUTER_BOTTOM

  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.textBaseline = 'alphabetic'

  const season = seasonForMonth(data.month)

  // 背景
  ctx.fillStyle = T.seasonTint ? season.tint : T.plainBg
  ctx.fillRect(0, 0, W, H)

  // 余白に季節モチーフ（毎月ちがう絵柄・色）
  drawDecorations(ctx, season.key, season.accent, { x: cardX, y: cardY, w: cardW, h: cardH }, W, H)

  // 白いカード
  ctx.save()
  if (T.shadowBlur > 0) {
    ctx.shadowColor = T.shadowColor
    ctx.shadowBlur = T.shadowBlur
    ctx.shadowOffsetY = 6
  }
  roundRect(ctx, cardX, cardY, cardW, cardH, T.cardRadius)
  ctx.fillStyle = T.cardBg
  ctx.fill()
  ctx.restore()

  // ===== カード内 =====
  let y = cardY + CARD_PAD

  // 見出し（1.5倍）
  ctx.fillStyle = T.accent
  ctx.textAlign = 'center'
  ctx.font = `bold 69px ${FONT}`
  ctx.fillText(data.title || `${data.month}月の予約状況`, W / 2, y + 66)
  y += TITLE_H + GRID_TOP_GAP

  // カレンダー表
  const gX = gridX
  const gY = y
  const bodyTop = gY + WEEKDAY_H

  ctx.save()
  roundRect(ctx, gX, gY, gridW, gridH, T.gridRadius)
  ctx.clip()
  ctx.fillStyle = T.accent
  ctx.fillRect(gX, gY, gridW, WEEKDAY_H)
  ctx.font = `bold 24px ${FONT}`
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  for (let i = 0; i < 7; i++) {
    ctx.fillText(WEEKDAY_LABELS[i], gX + colW * i + colW / 2, gY + 33)
  }
  ctx.restore()

  // セル内容（罫線より先）
  let cy = bodyTop
  weeks.forEach((week, wi) => {
    const rowH = rowHeights[wi]
    week.forEach((cell, ci) => {
      drawCell(ctx, gX + colW * ci, cy, colW, rowH, cell, data)
    })
    cy += rowH
  })

  // 罫線＋外枠（内容の上に描いて枠を必ず残す）
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
  ctx.restore()
  roundRect(ctx, gX, gY, gridW, gridH, T.gridRadius)
  ctx.strokeStyle = T.frame
  ctx.lineWidth = T.frameWidth
  ctx.stroke()

  y = gY + gridH + 22

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
  ctx.font = `bold 30px ${FONT}`
  ctx.fillText(String(cell.day), x + 12, y + 33)

  if (cell.holidayName) {
    ctx.fillStyle = SUN
    ctx.textAlign = 'right'
    ctx.font = `12px ${FONT}`
    ctx.fillText(cell.holidayName, x + w - 9, y + 21)
  }

  const ds = data.marks[cell.day] ?? { am: 'none' as Mark, pm: 'none' as Mark, note: '' }
  const note = (ds.note ?? '').trim()
  const hasMarks = ds.am !== 'none' || ds.pm !== 'none'

  if (note && !hasMarks) {
    drawNoteBig(ctx, note, x, y + 44, w, h - 52)
    return
  }

  drawSlot(ctx, 'AM', ds.am, x, y + 70, w)
  ctx.strokeStyle = T.divider
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x + w * 0.3, y + 98)
  ctx.lineTo(x + w * 0.7, y + 98)
  ctx.stroke()
  drawSlot(ctx, 'PM', ds.pm, x, y + 126, w)

  if (note) drawNoteBand(ctx, note, x, y + h - 26, w)
}

function drawSlot(ctx: CanvasRenderingContext2D, label: string, mark: Mark, x: number, centerY: number, w: number): void {
  ctx.textBaseline = 'middle'

  ctx.fillStyle = T.ink
  ctx.textAlign = 'left'
  ctx.font = `bold 22px ${FONT}`
  ctx.fillText(label, x + 12, centerY)

  ctx.textAlign = 'center'
  if (mark === 'none') {
    ctx.fillStyle = MARK_INK.none
    ctx.font = `28px ${FONT}`
    ctx.fillText('休', x + w * 0.64, centerY)
  } else {
    drawBoldSymbol(ctx, MARK_SYMBOL[mark], x + w * 0.64, centerY, 42, MARK_INK[mark])
  }

  ctx.textBaseline = 'alphabetic'
}

function drawBoldSymbol(ctx: CanvasRenderingContext2D, sym: string, x: number, y: number, size: number, color: string): void {
  ctx.font = `bold ${size}px ${FONT}`
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.05
  ctx.lineJoin = 'round'
  ctx.fillText(sym, x, y)
  ctx.strokeText(sym, x, y)
}

function drawNoteBig(ctx: CanvasRenderingContext2D, text: string, x: number, top: number, w: number, areaH: number): void {
  const maxW = w - 26
  ctx.font = `bold 14px ${FONT}`
  let chosen = 14
  let lines = layoutNoteLines(ctx, text, maxW)
  for (let s = 30; s >= 14; s--) {
    ctx.font = `bold ${s}px ${FONT}`
    const ls = layoutNoteLines(ctx, text, maxW)
    const lineH = s * 1.22
    if (ls.length * lineH <= areaH) {
      chosen = s
      lines = ls
      break
    }
  }
  ctx.font = `bold ${chosen}px ${FONT}`
  const lineH = chosen * 1.22
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
  ctx.font = `bold 15px ${FONT}`
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
  const items: Mark[] = ['double', 'circle', 'triangle', 'cross']
  const symW = 50
  const gap = 34
  ctx.font = `bold 28px ${FONT}`
  const itemWs = items.map((m) => symW + ctx.measureText(MARK_WORD[m]).width)
  const totalW = itemWs.reduce((a, b) => a + b, 0) + gap * (items.length - 1)
  let x = gridX + (gridW - totalW) / 2
  const baseY = top + 50
  items.forEach((m, i) => {
    ctx.textAlign = 'left'
    drawBoldSymbol(ctx, MARK_SYMBOL[m], x + 4, baseY, 42, MARK_INK[m])
    ctx.fillStyle = T.ink
    ctx.font = `bold 28px ${FONT}`
    ctx.fillText(MARK_WORD[m], x + symW, baseY - 4)
    x += itemWs[i] + gap
  })
}

function drawDecorations(
  ctx: CanvasRenderingContext2D,
  key: ReturnType<typeof seasonForMonth>['key'],
  accent: string,
  card: { x: number; y: number; w: number; h: number },
  w: number,
  h: number,
): void {
  const cardBottom = card.y + card.h
  const topMid = card.y / 2
  const botMid = (cardBottom + h) / 2
  const leftMid = card.x / 2
  const rightMid = (card.x + card.w + w) / 2

  const spots: [number, number, number, number][] = [
    [leftMid + 6, topMid, 26, 0.85],
    [w * 0.3, topMid - 6, 16, 0.5],
    [w * 0.7, topMid + 4, 17, 0.5],
    [rightMid - 6, topMid, 26, 0.85],
    [leftMid + 6, botMid, 26, 0.85],
    [w * 0.34, botMid + 4, 16, 0.5],
    [w * 0.66, botMid - 4, 18, 0.5],
    [rightMid - 6, botMid, 26, 0.85],
    [leftMid, h * 0.4, 20, 0.6],
    [rightMid, h * 0.46, 20, 0.6],
    [leftMid, h * 0.62, 16, 0.45],
    [rightMid, h * 0.66, 16, 0.45],
  ]

  // テーマに合わせて季節イラストの色・濃さ・大きさを変える
  const motifColor = mixHex(accent, T.decoBlend, T.decoBlendAmt)

  spots.forEach(([cx, cy, r, a]) => {
    ctx.save()
    ctx.globalAlpha = a * T.decoAlpha
    drawSeasonMotif(ctx, key, cx, cy, r * T.decoScale, motifColor)
    ctx.restore()
  })
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
