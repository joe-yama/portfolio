# Design

## Context

申し送りの仕分けは 2026-09-23 に行った（出典は各 `openspec/changes/archive/*/tasks.md` の末尾）。`icon-refresh` が `src/pages/[lang]/index.astro`、`src/lib/pixel.ts`、`tests/unit/pixel.test.ts`、`tests/e2e/links.spec.ts` を変えるため、これらと写真表示まわり（`PhotoPicture.astro`、`photos/[slug].astro`、`viewport.spec.ts`、`BaseLayout.astro` の代表写真）には触らない。

## Goals / Non-Goals

**Goals:** A 7 件の解消と、B の品質改善。公開サイトの見た目は変えない。

**Non-Goals:** 新機能、写真表示・トップページ・ヘッダーの変更、アイコン関連。

## Decisions

- **D1 特許の `url` 必須化**: スキーマで必須にし、`PatentItem.astro` の三項分岐を消して常にリンクにする。代替の「分岐を残してテストで担保」は、実データで通らない経路を保守し続けることになるので採らない（PO 決定）
- **D2 公報番号の一意性**: `validateCareerPatents` に言語ごとの重複検出を足し、エラーに `number` を含める。日英の突き合わせは既存の `validateCareerParity` の仕事なので、重複は言語ごとに見れば足りる
- **D3 経歴の検証の配線を守る番人**: `astro:content` を `vi.mock` し、不正なデータ（公報番号の重複など）で `getCareer` が例外を投げることを単体テストで確かめる。モックが Vitest の設定上効かない場合は、無理に代替を作らず穴が残ることを `tasks.md` の「提案」に記録する（裁定。代償: 配線を消す退行はビルドでしか気づけないまま）
- **D4 入稿コマンドのエラー**: `parseCliArgs` と `toSlug` の呼び出しを既存の 1 行中断（`die`）の経路に入れる。`parseArgs` の例外は原因のメッセージを 1 行に含めてから使い方を出す。GitHub への問い合わせより前で止まる順序は変えない
- **D5 e2e の対象ページ**: `tests/e2e/paths.ts` で `src/content/photos/*.yaml` から slug を読み、全写真の個別ページを対象に含める。a11y / network は `page.goto` の応答が 200 であることを確かめる
- **D6 品質改善は挙動を変えない**: 既存のテストが緑のまま通ることを証拠にする。テストを消すのは、同じことを確かめる別のテストが残る重複だけ

## Risks / Trade-offs

- `url` 必須化で、将来 url の無い特許を載せたくなったらスキーマを戻す必要がある → 代償は spec とスキーマの 1 行ずつ
- e2e の対象ページが写真の枚数に比例して増える → 写真は数十枚規模の想定で、実行時間への影響は小さい
