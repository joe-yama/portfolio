# 特許調査の手順（2026-09-22）

取得スクリプトはリポジトリに残さない（design.md D10）。**次に同じ調査を手で回す人にとって、この文書が唯一の記録**になる。

## 1. 発明者クエリで起点公報を集める

エンドポイント（XHR。ブラウザが公報ページ内の検索ボックスから叩くのと同じ API）:

```
https://patents.google.com/xhr/query?url=q%3Din%3A"<名前>"%26num%3D100
```

`<名前>` は URL エンコードした発明者名。レスポンス JSON の `results.cluster[].result[].patent.publication_number` が公報番号の一覧。

PO の発明者としての表記は日本語表記とローマ字表記が両方公報に現れるため、**2 つの表記を両方投げる**。

| クエリ | 件数 |
|---|---|
| `山根丈亮` | 51 件（API の `total_num_results` は 52 だが `TWI923233B` が英語・中国語タイトルで 2 回返るため実体は 51） |
| `Josuke Yamane` | 66 件 |
| 和集合 | **117 件**（重複ゼロ。日本語表記の結果とローマ字表記の結果は 1 件も重ならない） |

重複がゼロなのは、日本語表記の結果がおおむね古い CN 出願（Google Patents が日本語の発明者名を保持している公報）、ローマ字表記の結果がおおむね新しい US/CN/JP 出願（英語で発明者名を登録した公報）に分かれているため。**新しい調査でも両方のクエリを必ず実行する**（片方だけでは取りこぼす）。

## 2. 公報ページから構造化データを取る

エンドポイント: `https://patents.google.com/patent/<公報番号>/<言語>`（`<言語>` は `ja` または `en`）。

**同じ公報でも、読んだページの表示言語によって発明の名称・請求項の文言が変わる。** 日本語が要るデータは `/ja` を、英語が要るデータは `/en` を取る（落とし穴 3、下記）。

### 読む `itemprop` と、それがどの表・セクションに属するか

| `itemprop` | 見出し（`<h2>`） | 内容 | 用途 |
|---|---|---|---|
| `inventor` | Info パネル（ページ冒頭） | 発明者一覧 | D2 の発明者照合 |
| `applications`（Family Applications） | `Family Applications (N)` | **その公報自身の出願 1 件だけ**（`applicationNumber` / `representativePublication` / `primaryLanguage` / `priorityDate` / `filingDate` / `title`） | 同族識別の補強（他ページの同じ表と `applicationNumber` が交わるかの確認） |
| `countryStatus`（Country Status） | `Country Status (N)` | 同族の**各国の代表公報**（`countryCode` と `representativePublication`） | D1 同族識別の主データ、D3 代表公報の選定 |
| `priorityApps`（Priority Applications） | `Priority Applications (N)` | 同族の**全メンバー**の `applicationNumber` / `representativePublication` / `priorityDate` / **その国の出願日** / **その国の原語の発明の名称** | D4 `countries` の並び替え、D5 `filedAt` の裏取り |
| `docdbFamily`（Also Published As） | `Also Published As` | 同族の別公報 | 同族識別の補強 |
| `pubs`（Publications） | `Publications` | 同族の別公報（`docdbFamily` の上位互換） | 同族識別の補強 |
| `claim-text`（class 属性。itemprop ではない） | `Claims` | 請求項の本文 | D12 見出しの根拠 |

### 落とし穴 1: `Family Applications` はその公報自身の出願 1 件しか持たない

design.md の当初案は「`applications`（Family Applications）の `applicationNumber` 集合が交わる公報を同族とする」だったが、実データでは **1 ページの `Family Applications` 表は自分自身の出願 1 行しか持たない**（例: `CN111238513B.html` の `applications` は CN 出願 1 行だけ）。同族の全体像（各国の代表公報）は `Country Status` にあり、各国の出願日と原語の名称は `Priority Applications` にある。この 2 つを読まずに `Family Applications` だけで同族や並び順を決めようとすると、同じ発明が複数の別同族に分裂したり（`countries` の並び順を `Family Applications` の `filingDate` から決めようとすると、そのページに個別ページを持たない国の出願日が取れず、順序が Google のデフォルト順にフォールバックして狂う。65 件中 9 件でこれが起きた）。

### 落とし穴 2: `representativePublication` / `publicationNumber` は他のセクションにも現れる

公報ページの後半にある「Similar Documents」「Families Citing this family」にも `representativePublication` や `publicationNumber` らしき値が現れる。**同族識別・並び替えに使う値は、対象の見出し（`<h2>Country Status`, `<h2>Priority Applications` など）でブロックを切り出してから、その中の `itemprop` 行だけを拾う。** ページ全体を単純に正規表現で検索すると、1 件の公報が無関係な 60 件以上の「同族」を持つ結果になる。

### 落とし穴 3: 名称・請求項は「読んだページの表示言語」で出る（原語固定ではない）

`Priority Applications` の `title` 列や `Family Applications` の `title` 列は、**その公報の原語ではなく、読んだページの言語**で出る。`/en` で読めば全公報が英語の名称になり（日本語も中国語も英語化される）、`/ja` で読めば日本語の名称になる。したがって:

- 日本語の名称・請求項が要るときは、対象の**代表公報のページを `/ja` で取得**する
- 英語の名称・請求項が要るときは、対象の**代表公報のページを `/en` で取得**する
- 複数ページを跨いで `applicationNumber` で重複排除する処理を書く場合、`/ja` のページと `/en` のページを両方読み込むなら、**`/ja` を先に読み込む順序にする**（後から読んだページの値で上書きされる実装だと、英語版の値が「勝者」になり日本語の名称が英語のまま残る誤りが起きる。今回の実装で実際にこれが起き、`titleJa` の食い違いとして 27 件誤検出した）

### 落とし穴 4: 要約（abstract）の欄は無い。請求項は `class="claim-text"`

Google Patents の公報ページに abstract 専用の欄は無い。発明の内容を machine-readable に取るなら、`<h2>Claims</h2>` 以下の `class="claim-text"` を読む。

**請求項のマークアップは公報の種類によって 3 通りある**（D12 の見出し作成で判明）:

1. JP スタイル（`/ja` の大半）: `<div num="1" class="claim"><div class="claim-text">…単一のブロック…</div></div>`
2. US（USPTO 全文）スタイル: `<div id="CLM-00001" num="00001" class="claim"><div class="claim-text">…入れ子の `claim-text` が複数…</div></div>`
3. Google 機械翻訳スタイル（`/en` で読んだ WO など）: `<claim num="1"><claim-text><span class="google-src-text">原語</span>訳文</claim-text></claim>`（原語と訳文が同居する）

`num="…" class="claim"` と `<claim num="…">` のどちらでも請求項の開始位置を検出できるので、**入れ子構造を追わず「請求項 1 の開始位置」から「次の請求項の開始位置（無ければ `</ol>`/`</claims>`）」までを生テキストごと切り出し、最後にタグを剥がす**のが頑丈。3 番目のスタイルは `google-src-text` の原語部分を先に取り除いてから訳文を使う。

## 3. 発明者の照合規則（design.md D2）

発明者クエリは筆頭発明者しか結果に出さないため、公報ページ側の `inventor` で PO 本人が含まれるかを機械で確かめる。

1. `itemprop="inventor"` の値それぞれから**空白と中黒（・）を除き、小文字化**する
2. 次の 4 文字列のいずれかに一致すれば「PO を含む」と判定する: `山根丈亮` / `丈亮山根` / `josukeyamane` / `yamanejosuke`
3. 同族の中に 1 つでも一致する公報があれば、その同族全体を採用する（各国の公報で発明者の表記や順序が違うため。例: `Josuke YAMANE` と `山根丈亮` が同じ同族の別公報に分かれて現れる）
4. 一致が 0 件の同族は除外し、公報番号・名称・発明者一覧・理由を記録に残す

## 4. 同族のまとめ方（design.md D1）

1. 各公報ページから、同族識別の手がかりになる 4 種類の集合を集める: `Country Status` の `representativePublication` 集合（主）、`Family Applications` の `applicationNumber`/`representativePublication`、`Publications`（`pubs`）の `publicationNumber`、`Also Published As`（`docdbFamily`）
2. これらの集合が 1 つでも交わる公報同士を、**Union-Find で推移的に 1 つの同族にまとめる**（A-B が交わり B-C が交われば A-B-C を 1 つにする）
3. `Country Status` も `Family Applications` も持たないページ（今回は TW の 2 件）は、`Also Published As`（`docdbFamily`）と出願番号の一致だけで突き合わせる。発明者情報 (`inventor`) 自体を持たないこともあるため、D2 の発明者照合は「同族の中に 1 件でも一致すればよい」で救う
4. 117 件の起点公報は 66 の同族に分かれ、うち 65 を採用・1（2 公報）を除外した

## 5. 代表公報・`countries` の並び・`filedAt`・名称の決め方

決定の中身は `openspec/changes/patents-full-retrieval/design.md` の D3〜D6・D12・D13 を参照（同じ内容をここに重複させない）。

実際に取得して分かったこと（design.md には無い実測）: **英語の見出しの根拠は件ごとに違う**。design.md D6 の「US → EP → WO の優先順位で代表公報の請求項から起こす」は機械的にはそのとおりだが、実際には英語の請求項が発明の内容を的確に表していない、あるいは日本語版のほうが適切と判断した同族が一定数あった。65 件の内訳は、US 代表の請求項 1 を根拠にしたもの **47 件**、JP 代表の請求項 1（日本語版と同じ請求項）を根拠にしたもの **17 件**、WO 代表の請求項 1 を根拠にしたもの **1 件**（EP 代表を根拠にした件は 0 件）。どの公報のどの言語を根拠にしたかは `patents.json` の `titleEnSource` に残しており、全 65 件の内訳は `research/publications.md` の「見出しの根拠言語について」と各ブロックに明記している。

## 6. 遮断を避ける条件

2026-09-21 の 1 回目の取得では、日本語表記の発明者クエリの 6 回目あたりから **自動クエリと判断され `503`（`Sorry...` ページ）で遮断された**。15 分間隔 × 6 回の再試行でも回復せず、後日に持ち越した。

2026-09-22 の再取得では、次の条件で**合計 296 ページを遮断ゼロで取得**できた。内訳は 3 回に分かれる: 起点 117 公報を `/en` で 117 ページ、同じ 117 公報を `/ja` で 117 ページ（名称がページの表示言語で出ることが分かったため。落とし穴 3）、D6 の名称取得に必要な代表公報を 62 ページ（JP 代表 43 件を `/ja`、US / EP / WO 代表 19 件を `/en`）。結果として `pages/`（`/en`）136 件・`pages-ja/`（`/ja`）160 件、合計 296 ファイルが揃った。

- **1 件ずつ取得し、間に 5〜9 秒のランダムな間隔を空ける**（一定間隔ではなく揺らす）
- **ブラウザの User-Agent を付ける**（デフォルトの HTTP クライアントの User-Agent のままだと自動化されたクライアントとして扱われやすい）
- `403` / `429` / `503` を受けたら**指数バックオフで待って再試行する**（即座にリトライしない）
- 117 公報の取得で約 15 分かかった

途中で遮断されたら、**取得済みのページはそのまま使い、残りは時間を空けて再開する**（スクリプト側で取得済みファイルの存在を見て飛ばす）。**部分的なデータで同族を確定させてはいけない**（同族が欠けると `countries` が不完全になり、並び順も狂う。design.md の Risk 参照）。
