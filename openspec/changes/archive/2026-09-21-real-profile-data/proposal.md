# Proposal

## Why

v1 は 2026-09-21 に公開したが、プロフィールと経歴は `サンプル株式会社` / `hello@example.com` というサンプルデータのままである。採用担当・転職エージェントに見せる名刺サイトとして機能していない。PO から実データの聞き取りが完了したため、差し替える。

あわせて、実データを入れる前に `validateCareerParity` の穴を塞ぐ。現在この検証は `experience` / `certifications` / `achievements` の件数だけを見ており、**`skills` は日英で食い違ってもビルドを通過して公開される**。実データは日英 2 ファイルを手で書くため、この食い違いが最も起きやすいのは `skills` である。

## What Changes

- `validateCareerParity` が `skills` も検証する。カテゴリ名の集合が日英で対応していないとき、および対応するカテゴリの項目数が違うときにビルドを失敗させる
- `src/content/profile/{ja,en}.yaml` を実データに差し替える（`name`、`tagline`、`links` は GitHub と LinkedIn の 2 本）
- `src/content/career/{ja,en}.yaml` を実データに差し替える（職歴 4 件、スキル 5 カテゴリ、資格 14 件、実績 6 件）
- サンプルデータを前提にした単体テストの期待値を実データに合わせて更新する

**BREAKING ではない**。データ構造は変えず、値だけを差し替える。

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

- `content-schema`: 「経歴の日英の件数一致」の要求に `skills` を加える。カテゴリ名の集合と、対応するカテゴリの項目数の一致を求める

## Impact

- 影響するコード: `src/lib/validate.ts`（`validateCareerParity`）、`tests/unit/validate.test.ts`
- 影響するデータ: `src/content/profile/{ja,en}.yaml`、`src/content/career/{ja,en}.yaml`
- 影響する表示: トップページ（`name` / `tagline` / 連絡先リンク）、`/career/`（職歴・スキル・資格・実績）。日英の 4 ページ
- 依存の追加なし。公開 URL・ルーティング・レイアウトは変えない
- 実データは公開リポジトリと GitHub Pages に載る。出典は PO 本人の公開 LinkedIn プロフィールで、PO が掲載内容を決定済み
