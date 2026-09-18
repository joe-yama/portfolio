# Design

## Context

リポジトリにはハーネス（CLAUDE.md、rules、hooks、skills）と設計書だけがあり、アプリケーションコードは無い。技術スタックは設計書 §2・§9 で Astro + pnpm + GitHub Pages に決まっている。hooks の lint / test 検出はスタック未決定のため空振りしている。

この change の詳細な手順（コードの雛形、コマンド、期待出力）は `docs/superpowers/plans/2026-09-17-project-foundation.md` にある。本書はその設計判断の要点だけをまとめる。動機は proposal.md を参照。

## Goals / Non-Goals

**Goals:**

- 後続 change が依存するモジュール境界（スキーマ / 検証 / コンテンツ入口 / i18n）を、この時点で固定する
- Astro に依存しない部分を純 TypeScript に切り出し、Vitest で速く確実にテストできるようにする
- CI と hooks が同じコマンド（`pnpm lint` / `typecheck` / `test` / `build`）を叩く状態にする

**Non-Goals:**

- 見た目（レイアウト、配色、フォント、ドット絵）。トップは名前と一行紹介だけの最小版
- 写真の実データと Release `photos` の作成、`pnpm photo:add`
- e2e（Playwright）、GitHub Pages デプロイ、独自ドメイン

## Decisions

### D1. Zod スキーマと検証関数を `astro:*` 非依存の純 TS に分ける

- `src/content/schemas.ts`（形）、`src/lib/validate.ts`（形で表せない制約）、`src/lib/i18n.ts`（ロケール）は `astro/zod` 以外の Astro API を import しない
- `src/lib/content.ts` だけが `astro:content` に依存し、`getCollection` を包んで検証してから返す。ページは `content.ts` だけを使う
- 理由: `astro:content` は Vitest から直接 import できず、Astro の仮想モジュールに依存するテストは遅く壊れやすい。純 TS に分ければ検証ロジックの単体テストが素直に書ける
- 代替: すべて `content.config.ts` に書く → テストがビルド経由になり、RED → GREEN の回転が遅い。不採用

### D2. 日英の件数一致は「判定関数の単体テスト + 実データのビルド時検証」

- 設計書 §5.2 は「単体テストで確認」とあるが、Vitest から YAML を読むには依存（yaml パーサー）を足す必要がある
- `validateCareerParity(ja, en)` を単体テストし、実データは `getCareer` がビルド時に呼んで失敗させる。検出はビルドと CI で行われ、「マージ前に気づく」という意図は満たす
- PO 承認済み（2026-09-17）

### D3. ページは `src/pages/[lang]/index.astro` の動的セグメント 1 つで両言語を出す

- `getStaticPaths` で `locales` を返し、`[lang]` を `isLocale` で絞る
- 理由: `ja/` と `en/` の 2 ディレクトリに同じページを置くと重複が増える
- リスク: Astro の i18n 設定（`prefixDefaultLocale` + `redirectToDefaultLocale`）と動的セグメントの併用はインストール後に実物で確認する。併用できなければ `src/pages/ja/` と `src/pages/en/` に分け、本体をコンポーネントに寄せる（計画の「確認ポイント」）

### D4. 写真の画像は Astro のリモート画像最適化で同一オリジン化する

- `astro.config.ts` の `image.domains` に `github.com` を入れる。実際の `<Picture>` 出力は Change 3 で扱うが、設定はここで入れて `astro check` に通す
- 理由: 外部通信ゼロの制約（quality-gates）を、ビルド時取得 + `dist/_astro/` への出力で満たす

### D5. pnpm 12 のビルドスクリプト許可を `pnpm-workspace.yaml` で明示

- `onlyBuiltDependencies: [esbuild, sharp]`。pnpm 10 以降は依存の postinstall を既定で止めるため、Astro が使う 2 つを許可する
- 代替: `pnpm approve-builds` の対話 → CI で使えない。不採用

### D6. CI は `lint → typecheck → test → build` の単一ジョブ

- `pnpm/action-setup`（`packageManager` から版を読む）+ `actions/setup-node`（`node-version-file: .node-version`）+ `pnpm install --frozen-lockfile`
- 理由: ステップ数が少なく、どこで落ちたかがログで分かる。並列化して速くする段階ではない
- e2e とデプロイは Change 5 で足す

### D7. hooks は編集されたファイル 1 つだけを lint し、Stop で `pnpm test` を回す

- `lint-on-edit.sh` の `detect_lint()` → `pnpm exec biome check "$file"`、`test-on-stop.sh` の `detect_test()` → `pnpm test`
- 理由: PostToolUse は毎編集で走るので全体 lint は重い。Vitest は数秒で終わる想定なので Stop に入れられる。e2e は入れない（設計書 §8）

## Risks / Trade-offs

- [Astro の API 名や設定キーが計画時の想定と違う] → 計画の「確認ポイント」で `node_modules/astro/` の型定義を確認し、実装を実物に合わせる。差分は Issue にコメントする
- [`pnpm install` がサンドボックスのネットワーク制限で失敗する] → 許可先に npm レジストリは入っている。失敗したら出力を添えて PO に報告し、勝手に設定を緩めない
- [`redirectToDefaultLocale` が静的出力で `dist/index.html` を作らない] → 作らない場合は `src/pages/index.astro` に `<meta http-equiv="refresh">` を書く。JavaScript は使わない
- [hooks が動き始めて編集のたびに数秒待つ] → 受け入れる。重くなったら Stop 側だけ残す提案を出す
- [写真 0 枚でも `photos` コレクションを定義するため、空ディレクトリの扱いで警告が出る] → `.gitkeep` を置くか、Change 3 まで `photos` の glob を空のまま定義して警告の有無を確認する。ビルドが失敗しなければよい

## Migration Plan

新規導入なので移行は無い。ロールバックは PR を閉じるだけで `main` に影響しない。ハーネスの hooks 変更も同じ PR に含めるため、`main` にマージされるまでは hooks は空振りのまま。

## Open Questions

- 独自ドメイン名（設計書 §11）。この change では `site` を `https://joe-yama.github.io` にしておき、Change 5 で差し替える。specs と tasks に影響しない
