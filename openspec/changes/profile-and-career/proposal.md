# Proposal

## Why

トップ `/{ja,en}/` は代表写真・名前・一行紹介だけで、名刺として必要な連絡先とサイト内の導線が無い。ヘッダーの「Career」リンクは飛び先のページが存在せず 404 になる。`career` のデータ（職歴・スキル・資格・実績）は入っているのに、どこにも表示されていない。v1 公開の前に、この 2 つの穴を埋める。

## What Changes

- トップ `/{ja,en}/` に**連絡先リンク**を追加する（`profile.links` を YAML の順に並べ、`label` を表示する）
- トップ `/{ja,en}/` に**サイト内の導線**を追加する（本文に Photos / Career / 他言語版トップの 3 リンク）
- **`/{ja,en}/career/` を新設する**（職歴の時系列、スキル、資格、実績。`url` を持つ項目は外部リンクにする）
- 経歴の整形・並び替えを `.astro` の外の純関数（`src/lib/career.ts`）に置き、Vitest で固定する
- 節見出しと `achievements` の種別ラベルを `src/lib/site.ts` の `ui` に追加する
- `src/pages/[lang]/index.astro` の検証目的のダミー呼び出し `await getCareer(lang)` を削除する（`/career/` が両ロケールでビルドされることで日英件数一致の検証は保たれる）

含めないもの: プロフィール・経歴の実データ投入（サンプルのまま公開する。PO 決定 2026-09-21）、新しいページ・ブログ・フォーム・JavaScript・ドット絵の追加、レイアウトの大幅変更。

## Capabilities

### New Capabilities

- `profile-and-career`: トップの名刺としての内容（連絡先リンク、サイト内の導線）と、経歴ページ `/{ja,en}/career/` の構成・並び順・表示形式

### Modified Capabilities

（なし。`layout-shell` のヘッダー要求は既に `/career/` へのリンクを定めており、変更は要らない）

## Impact

- 追加: `src/pages/[lang]/career.astro`、`src/lib/career.ts`、`tests/unit/career.test.ts`
- 変更: `src/pages/[lang]/index.astro`（連絡先・導線の追加、ダミー呼び出しの削除）、`src/lib/site.ts`（`ui` に節見出しと種別ラベル、導線のリンク生成）、`tests/unit/site.test.ts`
- 依存の追加は無い（日付の整形は `Intl.DateTimeFormat`）
- ビルド出力に 2 ページ増える（10 → 12 ページ）
