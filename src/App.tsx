import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildWeeks, daysOfWeekday, WEEKDAY_LABELS } from './calendar'
import Guide from './Guide'
import Help from './Help'
import { drawCalendar, FORMATS, formatById, toJpegDataUrl } from './renderCanvas'
import {
  exportAll,
  importAll,
  loadFormatId,
  loadInstallNoticeSeen,
  loadIntroSeen,
  loadMonth,
  loadPreviousMonth,
  loadThemeId,
  saveFormatId,
  saveInstallNoticeSeen,
  saveIntroSeen,
  saveMonth,
  saveThemeId,
} from './storage'
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

// 端末・閲覧環境の簡易判定。手順の出し分けと、アプリ内ブラウザ警告の強調に使う。
type Platform = 'ios' | 'android' | 'pc' | 'unknown'
function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Windows|Macintosh|Linux/.test(ua)) return 'pc'
  return 'unknown'
}
// LINE/Instagram/Facebook 等のアプリ内ブラウザ（WebView）かどうか。
// これらは保存領域が一時的で、終了時にデータが消えることがあるため強く警告する。
function detectInApp(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Line|FBAN|FBAV|Instagram|TikTok|Twitter|KAKAOTALK|MicroMessenger/i.test(ua)
}
// すでにホーム画面から開かれている（スタンドアロン表示）か。
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS Safari
  // @ts-expect-error: 非標準プロパティ
  if (window.navigator.standalone) return true
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

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

  // 出力サイズ（投稿先：ブログ／Facebook／Instagram）
  const [formatId, setFormatId] = useState<string>(() => loadFormatId() ?? 'blog')

  // 前回の「ファイルに保存」以降に編集があるか（未バックアップ＝終了時に警告）
  const [unsavedToFile, setUnsavedToFile] = useState(false)

  // 初回ガイド（はじめて使う人向けの説明。閉じると次回から出ない）
  const [showIntro, setShowIntro] = useState(() => !loadIntroSeen())
  const dismissIntro = () => {
    setShowIntro(false)
    saveIntroSeen()
  }

  // 初回「ブラウザで開く／ホーム画面に追加」お知らせ
  // 既にホーム画面から起動済みなら出さない。
  const [platform] = useState<Platform>(() => detectPlatform())
  const [inApp] = useState<boolean>(() => detectInApp())
  const [showInstall, setShowInstall] = useState(
    () => !loadInstallNoticeSeen() && !isStandalone(),
  )
  const dismissInstall = () => {
    setShowInstall(false)
    saveInstallNoticeSeen()
  }

  // スマホ・小画面用：編集／プレビューを切り替えるタブ（上下スクロールの行き来を減らす）
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')

  // ページ切り替え（カレンダー作成／使い方／ヘルプ）
  const [page, setPage] = useState<'app' | 'guide' | 'help'>('app')
  const goPage = (p: 'app' | 'guide' | 'help') => {
    setPage(p)
    window.scrollTo(0, 0)
  }

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

  // 出力サイズの保存
  useEffect(() => {
    saveFormatId(formatId)
  }, [formatId])

  // プレビュー（=ダウンロード画像）を再描画
  useEffect(() => {
    if (canvasRef.current) drawCalendar(canvasRef.current, data, theme, formatId)
  }, [data, theme, formatId])

  // 終了（ブラウザ／タブを閉じる・再読み込み）時、ファイル未保存の編集があれば警告する
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!unsavedToFile) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [unsavedToFile])

  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  // 年の選択肢。端末の「今年」を基準に毎年自動で前へ進む（去年〜5年先）。
  // ◀▶ でそれ以上先へ進んだ場合も、その年を必ず含めて未来永劫使えるようにする。
  const yearOptions = useMemo(() => {
    const cy = now.getFullYear()
    const start = Math.min(cy - 1, year)
    const end = Math.max(cy + 5, year)
    const arr: number[] = []
    for (let y = start; y <= end; y++) arr.push(y)
    return arr
  }, [year])

  const update = useCallback((patch: Partial<CalendarData>) => {
    setData((d) => ({ ...d, ...patch }))
    setUnsavedToFile(true)
  }, [])

  const cycleSlot = useCallback((day: number, slot: 'am' | 'pm') => {
    setData((d) => {
      const cur = d.marks[day] ?? emptyDay()
      const updated = { ...cur, [slot]: nextMark(cur[slot]) }
      return { ...d, marks: { ...d.marks, [day]: updated } }
    })
    setUnsavedToFile(true)
  }, [])

  const updateNote = useCallback((day: number, note: string) => {
    setData((d) => {
      const cur = d.marks[day] ?? emptyDay()
      return { ...d, marks: { ...d.marks, [day]: { ...cur, note } } }
    })
    setUnsavedToFile(true)
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
    setUnsavedToFile(true)
  }

  const clearAll = () => {
    if (confirm('この月のマークをすべて消去します。よろしいですか？')) {
      setData((d) => ({ ...d, marks: {} }))
      setUnsavedToFile(true)
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
    setUnsavedToFile(true)
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = toJpegDataUrl(canvas, 0.92)
    const a = document.createElement('a')
    a.href = url
    a.download = `予約状況_${year}-${String(month).padStart(2, '0')}_${formatById(formatId).fileTag}.jpg`
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
    setUnsavedToFile(false)
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
        setUnsavedToFile(false)
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
        <nav className="topnav">
          <button className={page === 'app' ? 'active' : ''} onClick={() => goPage('app')}>カレンダー作成</button>
          <button className={page === 'guide' ? 'active' : ''} onClick={() => goPage('guide')}>使い方</button>
          <button className={page === 'help' ? 'active' : ''} onClick={() => goPage('help')}>ヘルプ</button>
        </nav>
      </header>

      {page === 'guide' && <Guide onBack={() => goPage('app')} />}
      {page === 'help' && <Help onBack={() => goPage('app')} />}

      {showInstall && (
        <div className="install-overlay" role="dialog" aria-modal="true" aria-labelledby="install-title">
          <div className="install-modal">
            <button className="install-close" onClick={dismissInstall} aria-label="このお知らせを閉じる">×</button>
            <h2 id="install-title">⚠️ はじめにお読みください</h2>
            <p className="install-lead">
              入力したカレンダーは <strong>この端末のブラウザに保存</strong> されます。<br />
              {inApp ? (
                <>
                  いま <strong>アプリ内ブラウザ（LINE・Instagram など）</strong> で開いています。
                  このままだと <strong>アプリを閉じたときに入力が消えてしまうことがあります</strong>。
                  必ず下のどちらかをしてから使ってください。
                </>
              ) : (
                <>
                  <strong>そのままページを閉じたり、別のアプリから開き直したりすると、入力した内容が消えてしまうことがあります。</strong>
                  消えないようにするため、下のどちらかをしてから使ってください。
                </>
              )}
            </p>

            <div className="install-cards">
              <div className="install-card">
                <h3>🏠 ホーム画面に追加する（おすすめ）</h3>
                <p className="install-card-lead">アプリのように開けて、入力したデータが消えにくくなります。</p>
                {platform === 'ios' && (
                  <ol>
                    <li>画面下の <b>共有ボタン（□から↑が出ているマーク）</b> を押す</li>
                    <li>メニューを少し下にスクロールして <b>「ホーム画面に追加」</b> を押す</li>
                    <li>右上の <b>「追加」</b> を押す</li>
                    <li>ホーム画面にできた <b>アイコンから開き直す</b></li>
                  </ol>
                )}
                {platform === 'android' && (
                  <ol>
                    <li>画面右上の <b>「︙」メニュー</b> を押す</li>
                    <li><b>「ホーム画面に追加」</b>（または「アプリをインストール」）を押す</li>
                    <li>確認画面で <b>「追加」</b> を押す</li>
                    <li>ホーム画面にできた <b>アイコンから開き直す</b></li>
                  </ol>
                )}
                {(platform === 'pc' || platform === 'unknown') && (
                  <ol>
                    <li>ブラウザの <b>アドレスバー右側のアイコン</b>（インストール/＋）を押す</li>
                    <li><b>「インストール」</b> を押す</li>
                    <li>パソコンのアプリ一覧やデスクトップから開き直す</li>
                  </ol>
                )}
              </div>

              <div className="install-card">
                <h3>🌐 ブラウザで開き直す</h3>
                <p className="install-card-lead">
                  {inApp
                    ? 'LINE / Instagram 内ではなく、Safari や Chrome で開いてください。'
                    : 'Safari や Chrome など、ふだん使っているブラウザで開いてください。'}
                </p>
                {platform === 'ios' && (
                  <ol>
                    <li>右下（または右上）の <b>「…」や共有ボタン</b> を押す</li>
                    <li><b>「Safariで開く」</b> を選ぶ</li>
                    <li>開いたページを <b>お気に入り／ブックマーク</b> に追加</li>
                  </ol>
                )}
                {platform === 'android' && (
                  <ol>
                    <li>右上の <b>「︙」メニュー</b> を押す</li>
                    <li><b>「ブラウザで開く」</b> または <b>「Chromeで開く」</b> を選ぶ</li>
                    <li>開いたページを <b>ブックマーク</b> に追加</li>
                  </ol>
                )}
                {(platform === 'pc' || platform === 'unknown') && (
                  <ol>
                    <li>このページの <b>URL をコピー</b></li>
                    <li>Chrome や Safari などのブラウザに <b>貼り付けて開く</b></li>
                    <li>開いたページを <b>ブックマーク</b> に追加</li>
                  </ol>
                )}
              </div>
            </div>

            <p className="install-note">
              ※ 万一に備えて、<b>「💾 ファイルに保存」</b> でバックアップも取っておくと安心です。
            </p>

            <div className="install-actions">
              <button className="install-ok" onClick={dismissInstall}>
                わかりました（次回から表示しない）
              </button>
            </div>
          </div>
        </div>
      )}

      {page === 'app' && showIntro && (
        <div className="intro" role="note">
          <button className="intro-close" onClick={dismissIntro} aria-label="この説明を閉じる">×</button>
          <h2>はじめての方へ</h2>
          <p>
            これは<strong>「お店の予約状況」をひと目で伝える画像をつくるアプリ</strong>です。
            日にちごとに <b>午前／午後</b> の空き具合を <b>◎○△×</b> でポチポチ選ぶと、
            きれいなカレンダー画像ができあがります。
          </p>
          <p className="intro-steps">
            <span>① 月とタイトルを選ぶ</span>
            <span>② 各日の午前・午後をタップ</span>
            <span>③ 「📥 JPEGをダウンロード」</span>
            <span>④ ブログやSNSに貼るだけ</span>
          </p>
          <button className="intro-ok" onClick={dismissIntro}>はじめる</button>
        </div>
      )}

      {page === 'app' && (
        <>
      {/* スマホ・小画面：編集とプレビューをタブで切り替え（行き来のスクロールを減らす） */}
      <div className="viewtabs" role="tablist">
        <button
          role="tab"
          aria-selected={mobileView === 'edit'}
          className={mobileView === 'edit' ? 'active' : ''}
          onClick={() => setMobileView('edit')}
        >
          ✏️ 編集
        </button>
        <button
          role="tab"
          aria-selected={mobileView === 'preview'}
          className={mobileView === 'preview' ? 'active' : ''}
          onClick={() => setMobileView('preview')}
        >
          👁 プレビュー
        </button>
      </div>

      <div className="layout" data-view={mobileView}>
        {/* 左：編集パネル */}
        <section className="editor">
          <div className="monthnav">
            <button onClick={() => goMonth(-1)} aria-label="前の月">◀</button>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
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

          <div className="filebar">
            <button className={`save-file ${unsavedToFile ? 'attention' : ''}`} onClick={exportFile}>
              💾 ファイルに保存{unsavedToFile ? '（未保存）' : ''}
            </button>
            <button onClick={() => fileInputRef.current?.click()}>📂 ファイルから読み込み</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={importFile}
              style={{ display: 'none' }}
            />
          </div>
          {unsavedToFile && (
            <p className="save-reminder">
              ⚠️ 前回のファイル保存から変更があります。終了する前に「💾 ファイルに保存」でバックアップしておくと安心です。
              <br />
              <small>※ 入力内容はこの端末にも自動保存されています。ファイル保存は別端末への移行・万一の消失に備えたバックアップです。</small>
            </p>
          )}

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
                  <option key={m} value={m}>{m === 'none' ? '− 受付不可（空白）' : `${MARK_SYMBOL[m]} ${MARK_LABEL[m]}`}</option>
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

          <div className="design-row">
            <span className="design-label">サイズ</span>
            {FORMATS.map((f) => (
              <button
                key={f.id}
                className={`design-btn ${formatId === f.id ? 'active' : ''}`}
                onClick={() => setFormatId(f.id)}
                title={f.hint}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="design-row">
            <span className="design-label">デザイン</span>
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`design-btn ${themeId === t.id ? 'active' : ''}`}
                onClick={() => setThemeId(t.id)}
                title={t.hint}
              >
                {t.label}
              </button>
            ))}
          </div>

          <canvas ref={canvasRef} className="preview-canvas" />
          <div className="legend">
            {(['double', 'circle', 'triangle', 'cross', 'none'] as Mark[]).map((m) => (
              <span key={m} className={`leg mark-${m}`}>
                <b>{MARK_SYMBOL[m] || '−'}</b> {MARK_LABEL[m]}
              </span>
            ))}
          </div>
        </section>
      </div>
        </>
      )}

      <footer className="foot">
        <nav className="footnav">
          <button onClick={() => goPage('guide')}>使い方</button>
          <span aria-hidden>・</span>
          <button onClick={() => goPage('help')}>ヘルプ</button>
        </nav>
        データはこのブラウザにのみ保存されます（サーバーには送信されません）。
      </footer>
    </div>
  )
}
