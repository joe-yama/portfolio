# コンテンツ編集の細則

経歴・特許・資格・実績の YAML、および写真を触るときに読む。いずれもビルドで落ちる（＝気づける）が、落ちる理由が分かりにくいものを集めた。

## 経歴（日英の対応づけ）

- `skills` は**日英でカテゴリ数と各カテゴリの項目数が一致しないとビルドが落ちる**。対応づけは `Object.entries` の並び順で決まる。カテゴリ名は訳語でよい
- `certifications` と `achievements` は日英で同じ順番に並べる。表示は日付の安定ソートなので、同じ日付の項目は記述順で対応づく
- 資格と実績の `date` は**分かっている粒度で書く**（`YYYY-MM` か `YYYY-MM-DD`）。日を `-01` に丸めない。年月までの日付は並び順ではその月の 1 日として扱われ、同じ位置になる項目は記述順を保つ

検証は `validateCareerParity`（`skills` / `patents` を含む）。

## 特許

- `patents` も**日英で件数が一致しないとビルドが落ちる**
- `number` / `filedAt` / `countries` / `url` は日英で同じ値にし、`title` だけ言語ごとに変える
- **日本語の名称は暫定**（英語の定型名称から起こしたもの。Change 8 の裁定 D7b）。US / EP / WO の出願はまだ載っていない。全件取得の手順は `openspec/changes/archive/2026-09-21-patents-section/tasks.md` の末尾

## 写真を差し替えるとき

同じ slug で `pnpm photo:add` を再実行すると、既存の YAML データファイルは書き換えずに画像の登録だけを行って終了する（`title` / `location` / `alt` は手で書いた内容のまま残る）。その経路でだけ `node_modules/.astro/assets` も消すので、古い画像がビルド出力に残る問題も自動で避けられる（新規入稿の経路では消さない）。

写真ファイルは git に入れず GitHub Releases（タグ `photos`）に置く。詳細は設計書 §5。
