// 月ごとの季節モチーフと配色。カレンダー周りの余白に「季節感のある背景イラスト」を描く。
// 12か月それぞれ違う絵柄・色で、心が和む淡いトーンにする。

export type MotifKey =
  | 'snow'
  | 'plum'
  | 'sakura'
  | 'tulip'
  | 'leaf'
  | 'hydrangea'
  | 'morningGlory'
  | 'sunflower'
  | 'moon'
  | 'maple'
  | 'ginkgo'
  | 'holly'

export interface Season {
  key: MotifKey
  label: string
  tint: string // 余白（背景）の淡い色
  accent: string // モチーフの主色
}

export function seasonForMonth(month: number): Season {
  switch (month) {
    case 1:
      return { key: 'snow', label: '雪', tint: '#EDF3F9', accent: '#9CC3DE' }
    case 2:
      return { key: 'plum', label: '梅', tint: '#FBEDF1', accent: '#E29AB4' }
    case 3:
      return { key: 'sakura', label: '桜', tint: '#FCEAF1', accent: '#F2A6C0' }
    case 4:
      return { key: 'tulip', label: '春', tint: '#FBEFEA', accent: '#F0997F' }
    case 5:
      return { key: 'leaf', label: '新緑', tint: '#EDF6E7', accent: '#8DC375' }
    case 6:
      return { key: 'hydrangea', label: '梅雨', tint: '#EEF0FA', accent: '#97A6DD' }
    case 7:
      return { key: 'morningGlory', label: '七夕', tint: '#EAF2FB', accent: '#7FA8E0' }
    case 8:
      return { key: 'sunflower', label: '夏', tint: '#FFF7E2', accent: '#EFB23A' }
    case 9:
      return { key: 'moon', label: '月見', tint: '#F5F1E6', accent: '#CDB67C' }
    case 10:
      return { key: 'maple', label: '紅葉', tint: '#FCEFE3', accent: '#E0894D' }
    case 11:
      return { key: 'ginkgo', label: '銀杏', tint: '#FBF4DC', accent: '#E3BB45' }
    default: // 12
      return { key: 'holly', label: '冬', tint: '#EDF4EE', accent: '#5BA86B' }
  }
}

// 余白に散らすモチーフ。中心(cx,cy)・半径 r。
export function drawSeasonMotif(
  ctx: CanvasRenderingContext2D,
  key: MotifKey,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.save()
  ctx.translate(cx, cy)
  switch (key) {
    case 'snow':
      snowflake(ctx, r, color)
      break
    case 'plum':
      petalFlower(ctx, r, 5, color, '#F4C24B', 0.42, 0.42)
      break
    case 'sakura':
      petalFlower(ctx, r, 5, color, '#F6D96B', 0.34, 0.52)
      break
    case 'tulip':
      tulip(ctx, r, color)
      break
    case 'leaf':
      leaf(ctx, r, color)
      break
    case 'hydrangea':
      hydrangea(ctx, r, color)
      break
    case 'morningGlory':
      morningGlory(ctx, r, color)
      break
    case 'sunflower':
      petalFlower(ctx, r, 12, color, '#7A5230', 0.16, 0.34)
      break
    case 'moon':
      moon(ctx, r, color)
      break
    case 'maple':
      maple(ctx, r, color)
      break
    case 'ginkgo':
      ginkgo(ctx, r, color)
      break
    case 'holly':
      holly(ctx, r, color)
      break
  }
  ctx.restore()
}

function petalFlower(
  ctx: CanvasRenderingContext2D,
  r: number,
  petals: number,
  color: string,
  centerColor: string,
  pw: number,
  ph: number,
): void {
  ctx.fillStyle = color
  for (let i = 0; i < petals; i++) {
    ctx.save()
    ctx.rotate((Math.PI * 2 * i) / petals)
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.62, r * pw, r * ph, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle = centerColor
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2)
  ctx.fill()
}

function snowflake(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.6, r * 0.08)
  ctx.lineCap = 'round'
  for (let i = 0; i < 6; i++) {
    ctx.save()
    ctx.rotate((Math.PI / 3) * i)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -r)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.58)
    ctx.lineTo(r * 0.24, -r * 0.78)
    ctx.moveTo(0, -r * 0.58)
    ctx.lineTo(-r * 0.24, -r * 0.78)
    ctx.stroke()
    ctx.restore()
  }
}

function tulip(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.strokeStyle = '#7FB069'
  ctx.lineWidth = Math.max(2, r * 0.08)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, r * 1.15)
  ctx.stroke()
  ctx.fillStyle = '#7FB069'
  ctx.save()
  ctx.rotate(Math.PI / 5)
  ctx.beginPath()
  ctx.ellipse(0, r * 0.7, r * 0.14, r * 0.36, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  // 花
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-r * 0.6, -r * 0.05)
  ctx.quadraticCurveTo(-r * 0.62, -r * 0.78, 0, -r * 0.58)
  ctx.quadraticCurveTo(r * 0.62, -r * 0.78, r * 0.6, -r * 0.05)
  ctx.quadraticCurveTo(0, r * 0.2, -r * 0.6, -r * 0.05)
  ctx.closePath()
  ctx.fill()
}

function leaf(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.quadraticCurveTo(r * 0.85, -r * 0.15, 0, r)
  ctx.quadraticCurveTo(-r * 0.85, -r * 0.15, 0, -r)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = Math.max(1.5, r * 0.06)
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.78)
  ctx.lineTo(0, r * 0.78)
  ctx.stroke()
}

function hydrangea(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  const groups: [number, number][] = [
    [0, -r * 0.1],
    [-r * 0.5, -r * 0.35],
    [r * 0.5, -r * 0.35],
    [-r * 0.42, r * 0.42],
    [r * 0.42, r * 0.42],
  ]
  groups.forEach(([gx, gy], i) => {
    ctx.fillStyle = i % 2 === 0 ? color : '#B9C3E6'
    const s = r * 0.2
    for (let k = 0; k < 4; k++) {
      const a = (Math.PI / 2) * k + Math.PI / 4
      ctx.beginPath()
      ctx.ellipse(gx + Math.cos(a) * s, gy + Math.sin(a) * s, s * 0.78, s * 0.78, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

function morningGlory(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = Math.max(1, r * 0.05)
  for (let i = 0; i < 5; i++) {
    ctx.save()
    ctx.rotate((Math.PI * 2 * i) / 5)
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.34)
    ctx.lineTo(0, -r)
    ctx.stroke()
    ctx.restore()
  }
}

function moon(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, -r * 0.15, r * 0.82, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.6, r * 0.07)
  ctx.lineCap = 'round'
  for (const bx of [-0.55, -0.25, 0.05, 0.35, 0.62]) {
    ctx.beginPath()
    ctx.moveTo(bx * r, r * 1.25)
    ctx.quadraticCurveTo(bx * r * 1.3, r * 0.3, bx * r * 1.6 + r * 0.1, -r * 0.45)
    ctx.stroke()
  }
}

function maple(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / 5
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    const a2 = a + Math.PI / 5
    ctx.lineTo(Math.cos(a2) * r * 0.42, Math.sin(a2) * r * 0.42)
  }
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.5, r * 0.07)
  ctx.beginPath()
  ctx.moveTo(0, r * 0.42)
  ctx.lineTo(0, r * 1.15)
  ctx.stroke()
}

function ginkgo(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, r * 0.85)
  ctx.quadraticCurveTo(-r * 1.0, r * 0.1, -r * 0.7, -r * 0.6)
  ctx.quadraticCurveTo(-r * 0.25, -r * 0.95, 0, -r * 0.78)
  ctx.quadraticCurveTo(r * 0.25, -r * 0.95, r * 0.7, -r * 0.6)
  ctx.quadraticCurveTo(r * 1.0, r * 0.1, 0, r * 0.85)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.5, r * 0.06)
  ctx.beginPath()
  ctx.moveTo(0, r * 0.85)
  ctx.lineTo(0, r * 1.25)
  ctx.stroke()
}

function holly(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.fillStyle = color
  for (const dir of [-1, 1]) {
    ctx.save()
    ctx.scale(dir, 1)
    ctx.beginPath()
    ctx.moveTo(0, -r)
    ctx.quadraticCurveTo(r * 0.55, -r * 0.5, r * 0.85, 0)
    ctx.quadraticCurveTo(r * 0.45, r * 0.15, r * 0.7, r * 0.7)
    ctx.quadraticCurveTo(r * 0.2, r * 0.45, 0, r)
    ctx.quadraticCurveTo(-r * 0.05, 0, 0, -r)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle = '#E0453C'
  for (const [bx, by] of [
    [0, -r * 0.05],
    [-r * 0.22, r * 0.2],
    [r * 0.22, r * 0.2],
  ] as [number, number][]) {
    ctx.beginPath()
    ctx.arc(bx, by, r * 0.16, 0, Math.PI * 2)
    ctx.fill()
  }
}
