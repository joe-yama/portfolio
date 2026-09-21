# Proposal

## Why

実データを入れた結果、経歴ページの資格 14 件のうち 10 件が `2025年10月1日` と同じ日付で並ぶ。PO が知っているのは取得年月までなのに、スキーマが `YYYY-MM-DD` を必須にしているため日を `-01` に丸めて書いたからである。表示が揃いすぎて未記入のプレースホルダに見えるうえ、データに「1 日」という事実でない値が残っている。実績にも同じ丸めが 5 件ある。

あわせて、公開から検索エンジンに渡している情報が `<title>` と `hreflang` だけである。サイトマップ・正規 URL・説明文のいずれも無いため、10 ページのうちどれが正本なのかを検索エンジンが判断する材料が無い。

## What Changes

- 資格と実績の日付に `YYYY-MM`（年月まで）を許し、`YYYY-MM-DD`（年月日まで）と併用できるようにする。表示は書かれた粒度のままにする（`2025-10` → `2025年10月` / `October 2025`、`2017-08-31` → `2017年8月31日` / `August 31, 2017`）
- 実データの日付を実際に分かっている粒度に直す。資格 14 件すべてと実績 5 件を `YYYY-MM` にし、日まで確かな特許出願（`2017-08-31`）だけ年月日のまま残す
- `sitemap.xml` を出力する。日英 10 ページの絶対 URL を持ち、各 URL に言語代替（`xhtml:link`）を添える
- 全ページの `<head>` に `<link rel="canonical">` と `<meta name="description">` を加える
- `robots.txt` は**作らない**。GitHub Pages のプロジェクトサイトではクローラが `https://joe-yama.github.io/robots.txt` しか読まず、`/portfolio/robots.txt` は無視されるため、置いても効かない（PO 決定 2026-09-21）

## Capabilities

### New Capabilities

- `sitemap`: 検索エンジンに渡すサイトマップ（出力先・含めるページ・各 URL の言語代替）

### Modified Capabilities

- `content-schema`: 資格と実績の `date` が受け付ける形式に `YYYY-MM` を加える
- `profile-and-career`: 資格と実績の日付を、書かれた粒度のまま表示する。並び順の規則に粒度が混ざったときの扱いを加える
- `layout-shell`: ページのメタデータに正規 URL（`canonical`）と説明文（`description`）を加える

## Impact

- スキーマ: `src/content/schemas.ts` の日付付き項目（資格・実績の共通部分）
- 表示: `src/lib/career.ts` の `formatDate` と `sortByDateDesc`、`src/layouts/BaseLayout.astro`
- データ: `src/content/career/{ja,en}.yaml` の `certifications` 14 件 × 2 言語と `achievements` 5 件 × 2 言語
- 新規: `src/pages/sitemap.xml.ts`（`src/pages/favicon.svg.ts` と同型のエンドポイント）
- 依存の追加は無い（`@astrojs/sitemap` は使わない。PO 決定 2026-09-21）
- 公開 URL の構造・ページ数・既存のリンクは変わらない
