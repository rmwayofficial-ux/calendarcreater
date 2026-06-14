// 使い方ページ。はじめての人でも順番にたどれるように、操作の流れを説明する。

export default function Guide({ onBack }: { onBack: () => void }) {
  return (
    <article className="page">
      <div className="page-head">
        <button className="page-back" onClick={onBack}>← カレンダー作成にもどる</button>
        <h1>使い方</h1>
      </div>

      <p className="page-lead">
        このアプリは、<strong>お店の予約状況をひと目で伝える画像（カレンダー）</strong>をつくるためのものです。
        日にちごとに午前・午後の空き具合を選ぶだけで、ブログやSNSにそのまま貼れる画像ができあがります。
        入力した内容はお使いの端末の中だけに保存され、インターネットには送信されません。
      </p>

      <section className="page-sec">
        <h2>かんたん4ステップ</h2>
        <ol className="page-steps">
          <li><b>月とタイトルを選ぶ</b><br />画面左上の ◀ ▶ やプルダウンで年月を選び、タイトル（例：「6月の予約状況」）を入力します。年は今年から5年先まで選べ、来年以降も自動で増えていきます（◀▶ でさらに先の月へも進めます）。</li>
          <li><b>各日の午前・午後をタップ</b><br />日にちのマスにある「午前」「午後」を押すたびに <span className="nowrap">空白（−）→ ◎ → ○ → △ → ×</span> と切り替わります（空白は横棒「−」＝受付不可で表示されます）。</li>
          <li><b>「📥 JPEGをダウンロード」を押す</b><br />右側（スマホでは「👁 プレビュー」タブ）に出ている画像が、そのまま保存されます。</li>
          <li><b>ブログやSNSに貼る</b><br />ダウンロードした画像をいつもの記事や投稿にアップするだけです。</li>
        </ol>
      </section>

      <section className="page-sec">
        <h2>マークの意味</h2>
        <table className="page-table">
          <thead>
            <tr><th>マーク</th><th>意味</th></tr>
          </thead>
          <tbody>
            <tr><td className="m-double">◎</td><td>空き十分</td></tr>
            <tr><td className="m-circle">○</td><td>空きあり</td></tr>
            <tr><td className="m-triangle">△</td><td>残りわずか</td></tr>
            <tr><td className="m-cross">×</td><td>満席</td></tr>
            <tr><td className="m-none">−</td><td>受付不可（予約を入れられない日）。マークを空白にすると横棒「−」が表示されます</td></tr>
          </tbody>
        </table>
      </section>

      <section className="page-sec">
        <h2>ことばで入力（特別な日）</h2>
        <p>各マスの下にある入力欄に、◎○△× では表せない予定をことばで書けます。</p>
        <ul className="page-list">
          <li><b>ことばだけ（マークは空白）</b> → その日はことばが大きく中央に表示されます（例：「大阪へ出張のため終日お休み」）。</li>
          <li><b>マーク＋ことば</b> → ◎○△× の下に小さくことばが表示されます（例：午前○・午後× ＋「夕方ヨガイベント」）。</li>
          <li>長い文は自動で折り返し、入りきらない分は「…」で省略されます。</li>
        </ul>
      </section>

      <section className="page-sec">
        <h2>らくに入力するために</h2>
        <ul className="page-list">
          <li><b>まとめて設定</b>：「日曜」「月曜」など曜日を選び、まとめて同じマークにできます（定休日の一括設定に便利）。</li>
          <li><b>前月をコピー</b>：先月つくったカレンダーの内容を引き継いで、変わったところだけ直せます。</li>
          <li><b>全部クリア</b>：その月のマークをすべて消します。</li>
          <li>入力した内容は<b>自動で保存</b>されます。画面を閉じても、同じ端末・同じブラウザならまた開けます。</li>
        </ul>
      </section>

      <section className="page-sec">
        <h2>画像のサイズを選ぶ（投稿先に合わせる）</h2>
        <p>プレビューのすぐ上にある「サイズ」ボタンで、貼り付け先に合った画像サイズを選べます。選んだサイズはそのまま保存され、次回も同じサイズで作れます。</p>
        <ul className="page-list">
          <li><b>ブログ用</b>：内容に合わせた標準サイズ。記事に貼りやすい形です。</li>
          <li><b>Facebook用</b>：正方形（1:1）。フィードで全体がきれいに表示されます。</li>
          <li><b>Instagram用</b>：縦長（4:5）。フィードで大きく表示されます。</li>
        </ul>
        <p>サイズを切り替えるとプレビューも変わるので、確認してから「📥 JPEGをダウンロード」を押してください。投稿先ごとに切り替えて、それぞれの画像を作れます。</p>
      </section>

      <section className="page-sec">
        <h2>デザインを選ぶ</h2>
        <p>プレビューのすぐ上にある小さな「デザイン」ボタンで、見た目を選べます（記号の色は共通です）。</p>
        <ul className="page-list">
          <li><b>やわらか</b>：ナチュラルで上品。生成りの背景に季節の色と、ひかえめな季節のあしらい。</li>
          <li><b>クール</b>：すっきりモダン。背景は季節の色に変わりますが、季節のあしらいは付きません。</li>
          <li><b>シャープ</b>：背景色は変わらない無地でクリアな印象。毎月、月日だけが変わります。</li>
          <li><b>あたたか</b>：温かみのあるクリーム色。季節の色とひかえめなあしらい入り。</li>
        </ul>
      </section>

      <section className="page-sec">
        <h2>バックアップ・別の端末への移行</h2>
        <ul className="page-list">
          <li><b>💾 ファイルに保存</b>：保存済みの全月データを1つの <code>.json</code> ファイルにまとめてダウンロードします。</li>
          <li><b>📂 ファイルから読み込み</b>：その <code>.json</code> を読み込むと、別の端末やブラウザでも内容を復元できます。</li>
        </ul>
      </section>

      <section className="page-sec">
        <h2>スマホでの使い方</h2>
        <p>
          画面が小さいときは、上部の <b>「✏️ 編集 / 👁 プレビュー」</b> タブで表示を切り替えられます。
          編集しながら画像を確認したいときは、タブを押すだけ。上下に長くスクロールする必要はありません。
        </p>
      </section>

      <div className="page-foot">
        <button className="page-back" onClick={onBack}>← カレンダー作成にもどる</button>
      </div>
    </article>
  )
}
