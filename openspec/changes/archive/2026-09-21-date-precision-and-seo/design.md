# Design

## Context

動機は proposal.md の Why を参照。要求は `specs/` の 4 つの delta を参照。

現状の関係する部分:

- `src/content/schemas.ts` に `yearMonth`（職歴の `from` / `to` 用）と `isoDate`（資格・実績の `date` 用）の 2 つの正規表現がすでにある。資格と実績は `datedItemSchema` を共有し、実績だけが `kind` を足している
- `src/lib/career.ts` の `sortByDateDesc` は `b.date.localeCompare(a.date)` の 1 行。`Array.prototype.sort` は安定なので、同じ値の項目は記述順を保つ
- `formatDate` は `Intl.DateTimeFormat` に `{ year, month: 'long', day: 'numeric' }` を渡す。`toLocalDate` は `YYYY-MM` と `YYYY-MM-DD` のどちらも受け、日が無ければ 1 日にする（職歴の期間で既に使っている）
- `<head>` は `src/layouts/BaseLayout.astro` の 1 か所。`hreflang` は `localeFromPath` が非 null のときだけ出している（404 では出さない）
- 出力するページは 12。うちロケール接頭辞を持つのが 10、残りは接頭辞直下の振り分けページと 404
- `src/pages/favicon.svg.ts` に、`APIRoute` で文字列を返す静的エンドポイントの前例がある

## Goals / Non-Goals

**Goals:**

- データに書いていない事実（丸めた「1 日」）が画面に出ない
- ページを足したときサイトマップに載せ忘れたら気づける
- 依存を増やさない

**Non-Goals:**

- ページごとに違う説明文（写真ページに写真の説明を出すなど）。全ページ `tagline` で統一する
- `<lastmod>` や `<priority>` の出力。正確な最終更新日を持っていないので出さない
- 職歴の期間（`formatPeriod`）の表記。今回は触らない
- OGP / Twitter Card。別の change

## Decisions

### D1: 日付は union ではなく 1 本の正規表現で受ける

`date` のスキーマを `z.union([yearMonth, isoDate])` にせず、日の部分を省略可能にした 1 本の正規表現にする:

```
/^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/
```

理由: union だと検証に落ちたとき zod が両方の枝のエラーを並べるため、`YYYY-MM または YYYY-MM-DD 形式で書く` という 1 行のメッセージを出せない。ビルドを落としたときに PO が読むのはこのメッセージである。

代替案: `yearMonth` と `isoDate` の union。エラーの読みにくさを受け入れるなら既存の定数を再利用できるが、資格 14 件を書き換える作業中に一番読むメッセージなので却下した。

### D2: 年月は「その月の 1 日」として並べる

`sortByDateDesc` の比較キーを、`YYYY-MM` のときだけ `-01` を補ってから比較する。

理由: 素の文字列比較では `2016-03` < `2016-03-01` となり、年月までの項目が同じ月の年月日項目より**古い**扱いになる。これは意図と違う。`-01` を補えば同着になり、安定ソートで記述順が保たれる。日英で同じ順に書くという既存の約束（CLAUDE.md）がそのまま効く。

代替案 1: 比較キーを先頭 7 文字に切り詰める。同じ月の中の日付の違いが無視されるので却下。
代替案 2: `Date` に変換して比較。`toLocalDate` を通す分だけ遅く、文字列比較で足りる。

### D3: 表示の粒度はセグメント数で決める

`formatDate(date, lang)` が `date.split('-').length` を見て、3 なら `{ year, month: 'long', day: 'numeric' }`、2 なら `{ year, month: 'long' }` を `Intl.DateTimeFormat` に渡す。

`toLocalDate` は今のまま使える（日が無ければ 1 日になるが、`day` を出力に含めないので表に出ない）。

### D4: サイトマップの URL は純関数で組み立て、エンドポイントは XML にするだけ

`src/lib/sitemap.ts` に `sitemapUrls(slugs, site, base)` を置き、写真の slug の配列からロケール接頭辞付きの 10 本（写真が n 枚なら 2×(3+n) 本）を、それぞれ言語代替 3 本付きで返す。`src/pages/sitemap.xml.ts` はコレクションから slug を読み、この関数の結果を XML 文字列にして `Response` を返す。

理由: URL の組み立てには `src/lib/site.ts` の `homePath` / `photoPath` と `src/lib/i18n.ts` の `alternatePath` / `withBase` がすでにある。純関数に寄せれば、10 本の URL を単体テストで全部固定できる（`favicon.svg.ts` と同じ形）。

代替案: `@astrojs/sitemap`。依存が 1 つ増え、出力を自分のテストで押さえにくい。PO が 2026-09-21 に自前を選択。

### D5: ページ構成のハードコードは e2e で守る

D4 の関数はページ構成（トップ・経歴・写真一覧・写真個別）を知っている。将来ページを足したとき、ここを直し忘れるとサイトマップから静かに漏れる。単体テストは同じ思い込みを共有するので番人にならない。

そこで e2e（ビルド済みのサイトに対して走る）で次の 2 つを検査する:

1. サイトマップのすべての `<loc>` が 200 を返す
2. ビルド出力のうちロケール接頭辞を持つページの集合と、`<loc>` の集合が一致する

2 はビルド出力を直接数えるので、ページを足したら必ず落ちる。

### D6: `canonical` と `description` は `hreflang` と同じ条件で出す

`BaseLayout.astro` で `pathLocale` が非 null のときだけ出す。404 は既存の `hreflang` と同じく対象外。

`description` の文面はプロフィールの `tagline`。ページごとに変えることも考えたが、いま 2 ページ（写真個別）にしか良い素材がなく、残りは結局 `tagline` になる。分岐を持つ価値が無いので統一する。

### D7: `robots.txt` は作らない

GitHub Pages のプロジェクトサイトでは、クローラが読む `robots.txt` はドメイン直下（`https://joe-yama.github.io/robots.txt`）だけで、`/portfolio/robots.txt` は読まれない。置けば「効いているつもり」の飾りになる。独自ドメインは使わないと PO が決定済み（2026-09-21）なので、将来効くようになる見込みも無い。

代わりに、サイトマップは Google Search Console に URL を直接登録して知らせる。これは PO の手作業なので、`CLAUDE.md` に申し送りとして書く。

### D8: 日付を書き換える粒度の表

丸めた `-01` を機械的に消すのではなく、PO から実際に聞き取った粒度に従う。

| 対象 | 件数 | 変更後 |
|---|---|---|
| `certifications` 全件 | 14 | `YYYY-MM`（例: `2025-10-01` → `2025-10`） |
| AWS All Certifications Engineers | 1 | `2026-05` |
| NLP2018 発表 | 1 | `2018-03` |
| 特許出願 特開2017-151838 | 1 | `2017-08-31`（**変えない**。PO が 8/31 と明言） |
| COLING 2016 | 1 | `2016-12` |
| 言語処理学会 若手奨励賞 | 1 | `2016-03` |
| NLP2016 発表 | 1 | `2016-03` |

日英 2 ファイルとも同じ順・同じ日付にする。

## Risks / Trade-offs

- **ページを足したときサイトマップに載せ忘れる** → D5 の e2e 検査 2 で落とす。単体テストだけでは同じ思い込みを共有して番人にならない
- **`2016-03` の 2 件が同着になり、記述順に依存する** → 既存の「日英で同じ順に並べる」約束（`CLAUDE.md`「実データを触るときの注意」）がそのまま効く。仕様にも「同じ位置になる項目は記述順を保つ」と明記した
- **`description` が全ページ同じ** → 検索結果で同じ説明文が並ぶ。ページごとの文面は後続の提案に回す
- **サイトマップを誰も見つけない** → robots.txt が使えないので、PO が Search Console に登録するまでは実質的に効かない。D7 のとおり申し送りに書く
- **`YYYY-MM` を許したことで、年月日で書くべき項目が年月で書かれる** → 検証で防げない。実績のように日が意味を持つものは PO が判断する

## Migration Plan

公開 URL・ページ数・既存のリンクは変わらない。データの書き換えとスキーマの拡張は同じ change に入れるので、途中の状態で検証に落ちることはない（スキーマは広がる方向なので、古いデータもそのまま通る）。

巻き戻しは PR の revert で足りる。
