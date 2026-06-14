import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildWeeks, daysOfWeekday, WEEKDAY_LABELS } from './calendar'
import { drawCalendar, toJpegDataUrl } from './renderCanvas'
import { exportAll, importAll, loadMonth, loadPreviousMonth, loadThemeId, saveMonth, saveThemeId } from './storage'
import { THEMES, themeById } from './theme'
import {
  emptyDay,
  MARK_CYCLE,
  MARK_LABEL,
  MARK_SYMBOL,
  type CalendarData,
  type Mark,
  type MonthMarks,
} from './types'

const now = new Date()

function freshData(year: number, month: number): CalendarData {
  return {
    year,
    month,
    title: `${month}月の予約状況`,
    marks: {},
  }
}

function nextMark(m: Mark): Mark {
  const i = MARK_CYCLE.indexOf(m)
  return MARK_CYCLE[(i + 1) % MARK_CYCLE.length]
}

export default function App() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<CalendarData>(() => loadMonth(year, month) ?? freshData(year, month))
  const [themeId, setThemeId] = useState<string>(() => loadThemeId() ?? 'soft')
  const theme = useMemo(() => themeById(themeId), [themeId])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 年月切替時にその月のデータを読み込む（無ければ新規）
  useEffect(() => {
    setData(loadMonth(year, month) ?? freshData(year, month))
  }, [year, month])

  // 変更のたびに自動保存
  useEffect(() => {
    saveMonth(data)
  }, [data])

  // テーマの保存
  useEffect(() => {
    saveThemeId(themeId)
  }, [themeId])

  // プレビュー（=ダウンロード画像）を再描画
  useEffect(() => {
    if (canvasRef.current) drawCalendar(canvasRef.current, data, theme)
  }, [data, theme])

  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  const update = useCallback((patch: Partial<CalendarData>) => {
    setData((d) => ({ ...d, ...patch }))
  }, [])

  const cycleSlot = useCallback((day: number, slot: 'am' | 'pm') => {
    setData((d) => {
      const cur = d.marks[day] ?? emptyDay()
      const updated = { ...cur, [slot]: nextMark(cur[slot]) }
      return { ...d, marks: { ...d.marks, [day]: updated } }
    })
  }, [])

  const updateNote = useCallback((day: number, note: string) => {
    setData((d) => {
      const cur = d.marks[day] ?? emptyDay()
      return { ...d, marks: { ...d.marks, [day]: { ...cur, note } } }
    })
  }, [])

  const goMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setYear(y)
    setMonth(m)
  }

  const copyPrevMonth = () => {
    const prev = loadPreviousMonth(year, month)
    if (!prev) {
      alert('前の月の保存データが見つかりませんでした。')
      return
    }
    setData((d) => ({
      ...d,
      marks: structuredClone(prev.marks),
    }))
  }

  const clearAll = () => {
    if (confirm('この月のマークをすべて消去します。よろしいですか？')) {
      setData((d) => ({ ...d, marks: {} }))
    }
  }

  // 曜日まとめ設定
  const [bulkWeekday, setBulkWeekday] = useState(0) // 0=月..6=日
  const [bulkMark, setBulkMark] = useState<Mark>('none')
  const applyBulk = () => {
    const days = daysOfWeekday(year, month, bulkWeekday)
    setData((d) => {
      const marks: MonthMarks = { ...d.marks }
      for (const day of days) marks[day] = { ...(marks[day] ?? emptyDay()), am: bulkMark, pm: bulkMark }
      return { ...d, marks }
    })
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = toJpegDataUrl(canvas, 0.92)
    const a = document.createElement('a')
    a.href = url
    a.download = `予約状況_${year}-${String(month).padStart(2, '0')}.jpg`
    a.click()
  }

  // 全データをファイルに保存（バックアップ／別端末への移行・共有）
  const exportFile = () => {
    const d = new Date()
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    const blob = new Blob([exportAll(d.toISOString())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `カレンダー_バックアップ_${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ファイルから読み込み
  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const res = importAll(String(reader.result))
        if (res.themeId) setThemeId(res.themeId)
        setData(loadMonth(year, month) ?? freshData(year, month))
        alert(`${res.count}か月分のデータを読み込みました。`)
      } catch {
        alert('ファイルを読み込めませんでした。正しいバックアップファイル（.json）か確認してください。')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand-logo" aria-hidden>
          <svg width="44" height="44" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="cc-logo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#5ec8bd" />
                <stop offset="1" stopColor="#3f9f96" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#cc-logo)" />
            <rect x="22.5" y="11" width="4.5" height="11" rx="2.25" fill="#ffffff" />
            <rect x="37" y="11" width="4.5" height="11" rx="2.25" fill="#ffffff" />
            <rect x="15" y="18" width="34" height="31" rx="6" fill="#ffffff" />
            <rect x="15" y="27" width="34" height="2" fill="#d7efeb" />
            <path
              d="M23 37 l6 6 l12 -13"
              fill="none"
              stroke="#ff7a59"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="brand-text">
          <h1>カレンダークリエイター</h1>
          <p className="sub">午前・午後のマスをタップして ◎○△× を切り替え → JPEGでダウンロード</p>
        </div>
      </header>

      <div className="layout">
        {/* 左：編集パネル */}
        <section className="editor">
          <div className="monthnav">
            <button onClick={() => goMonth(-1)} aria-label="前の月">◀</button>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 1 + i).map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
            <button onClick={() => goMonth(1)} aria-label="次の月">▶</button>
          </div>

          <div className="fields">
            <label>
              タイトル
              <input value={data.title} onChange={(e) => update({ title: e.target.value })} placeholder="6月の予約状況" />
            </label>
          </div>

          <div className="theme-row">
            <span className="theme-label">デザイン</span>
            <div className="theme-options">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`theme-btn ${themeId === t.id ? 'active' : ''}`}
                  onClick={() => setThemeId(t.id)}
                  title={t.hint}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filebar">
            <button onClick={exportFile}>💾 ファイルに保存</button>
            <button onClick={() => fileInputRef.current?.click()}>📂 ファイルから読み込み</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={importFile}
              style={{ display: 'none' }}
            />
          </div>

          <div className="tools">
            <button onClick={copyPrevMonth}>前月をコピー</button>
            <button onClick={clearAll}>全部クリア</button>
            <div className="bulk">
              <select value={bulkWeekday} onChange={(e) => setBulkWeekday(Number(e.target.value))}>
                {WEEKDAY_LABELS.map((w, i) => (
                  <option key={i} value={i}>{w}曜</option>
                ))}
              </select>
              <select value={bulkMark} onChange={(e) => setBulkMark(e.target.value as Mark)}>
                {MARK_CYCLE.map((m) => (
                  <option key={m} value={m}>{m === 'none' ? '空白（定休）' : `${MARK_SYMBOL[m]} ${MARK_LABEL[m]}`}</option>
                ))}
              </select>
              <button onClick={applyBulk}>まとめて設定</button>
            </div>
          </div>

          <div className="grid">
            <div className="grid-head">
              {WEEKDAY_LABELS.map((w, i) => (
                <div key={i} className={`gh ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{w}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div className="grid-row" key={wi}>
                {week.map((cell, ci) => (
                  <div className={`cell ${cell.day === 0 ? 'empty' : ''}`} key={ci}>
                    {cell.day > 0 && (
                      <>
                        <div className={`daynum ${cell.holidayName || cell.isSunday ? 'sun' : cell.isSaturday ? 'sat' : ''}`}>
                          <span>{cell.day}</span>
                          {cell.holidayName && <em>{cell.holidayName}</em>}
                        </div>
                        {(['am', 'pm'] as const).map((slot) => {
                          const mk = (data.marks[cell.day]?.[slot] ?? 'none') as Mark
                          return (
                            <button
                              key={slot}
                              className={`slot mark-${mk}`}
                              onClick={() => cycleSlot(cell.day, slot)}
                              title={`${slot === 'am' ? '午前' : '午後'}：${MARK_LABEL[mk]}（クリックで切替）`}
                            >
                              <span className="slot-label">{slot === 'am' ? '午前' : '午後'}</span>
                              <span className="slot-mark">{MARK_SYMBOL[mk] || '−'}</span>
                            </button>
                          )
                        })}
                        <textarea
                          className="note-input"
                          rows={2}
                          value={data.marks[cell.day]?.note ?? ''}
                          onChange={(e) => updateNote(cell.day, e.target.value)}
                          placeholder="出張・イベント等（改行できます）"
                          title="特別なイベントや出張など、ことばで入力できます（Enterで改行）"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 右：プレビュー＆ダウンロード */}
        <section className="preview">
          <div className="preview-head">
            <h2>プレビュー</h2>
            <button className="download" onClick={download}>📥 JPEGをダウンロード</button>
          </div>
          <p className="hint">この画像がそのまま保存されます（ブログにアップしてください）。</p>
          <canvas ref={canvasRef} className="preview-canvas" />
          <div className="legend">
            {MARK_CYCLE.filter((m) => m !== 'none').map((m) => (
              <span key={m} className={`leg mark-${m}`}>
                <b>{MARK_SYMBOL[m]}</b> {MARK_LABEL[m]}
              </span>
            ))}
          </div>
        </section>
      </div>

      <footer className="foot">
        データはこのブラウザにのみ保存されます（サーバーには送信されません）。
      </footer>
    </div>
  )
}
