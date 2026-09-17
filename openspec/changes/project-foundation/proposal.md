# Proposal

## Why

設計書（`docs/superpowers/specs/2026-09-17-portfolio-site-design.md`）は PO 承認済みだが、リポジトリにはまだアプリケーションコードもツールチェーンも無い。以降の change（レイアウト、写真パイプライン、経歴ページ、デプロイ）はすべて「内容データのスキーマと検証」「日英ルーティング」「lint / typecheck / test / build の実行基盤」の上に載るため、最初にこの土台を 1 つの change として作り、CI で守られた状態にする。

## What Changes

- pnpm + Astro（TypeScript strict、静的ビルド）のプロジェクトを初期化する。Node と pnpm のバージョンを `.node-version` と `packageManager` で固定する
- Biome（lint / format）、Vitest（単体テスト）、`@astrojs/check`（型検査）を導入し、`pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` を確定させる
- 内容データ（`profile` / `career` / `photos`）の Zod スキーマを定義し、スキーマで表せない制約（`featured` がちょうど 1 枚、`order` の重複なし、`image` が Release `photos` の URL、slug とファイル名の一致、日英の件数一致）を独自の検証でビルド前に失敗させる
- 日英ルーティングの骨格を作る。全ページを `/ja/` と `/en/` の下に置き、`/` は `/ja/` へ静的リダイレクトする。言語切り替え URL を求めるユーティリティを用意する
- `profile` / `career` のサンプル YAML（日英）と、名前と一行紹介だけの言語別トップページを作り、ビルドが通ることを確認する
- GitHub Actions で PR と `main` への push に対して `lint → typecheck → test → build` を実行する CI を追加する
- ハーネスを確定したコマンドに合わせる（`.claude/rules/testing.md` のコマンド節、hooks の lint / test 検出、`CLAUDE.md` のコマンド表、`docs/harness/README.md` §5）

含めないもの（後続の change）: レイアウトとデザイン（`layout-shell`）、Release `photos` の作成・`pnpm photo:add`・ギャラリー（`photo-pipeline`）、トップの完成と経歴ページ（`profile-and-career`）、e2e と GitHub Pages デプロイ・独自ドメイン（`deploy-and-e2e`）。

## Capabilities

### New Capabilities

- `content-schema`: 内容データ（profile / career / photos）の構造、必須項目、および集合全体にかかる制約（代表写真は 1 枚、並び順の重複なし、写真 URL の形式、日英の件数一致）。違反はビルドを失敗させる
- `i18n-routing`: すべてのページが `/ja/` と `/en/` の下にあること、`/` が `/ja/` へ静的にリダイレクトされること、同じページの他言語版 URL の求め方
- `quality-gates`: lint / 型検査 / 単体テスト / ビルドが 1 コマンドずつで実行でき、PR ごとに CI で必ず通ること。配信 JavaScript ゼロと外部通信ゼロの制約

### Modified Capabilities

（なし。既存の spec は無い）

## Impact

- 新規: `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`.node-version`、`astro.config.ts`、`tsconfig.json`、`biome.json`、`vitest.config.ts`、`src/`（`content.config.ts`、`content/`、`lib/`、`pages/[lang]/`）、`tests/unit/`、`.github/workflows/ci.yml`
- 変更: `.gitignore`、`.claude/rules/testing.md`、`.claude/hooks/lint-on-edit.sh`、`.claude/hooks/test-on-stop.sh`、`CLAUDE.md`、`docs/harness/README.md`
- 依存の追加（PO 承認済み、設計書 §9 の一覧内）: `astro`、`@astrojs/check`、`typescript`、`@biomejs/biome`、`vitest`。これ以外は追加しない
- 外部サービス: GitHub Actions が有効になる。GitHub Pages への公開はまだ行わない
- ハーネス: hooks が実際に `pnpm exec biome check` と `pnpm test` を実行するようになる。PostToolUse / Stop の所要時間が増える
