# Proposal

## Why

`fix-misc` で追加したトップページ本文のドット絵のうち、Career の鞄（briefcase）は取っ手が細くて判別しづらく、言語切り替えの地球儀（globe）は横帯が枠いっぱいに伸びて照準のように見える（同 change のブランチレビューで実測）。また同レビューの Minor 1〜4 は、アイコンの取り違えや格子の崩れを番人が検出できない穴と、将来の文言変更でアイコンが黙って消える実装上の脆さを指摘している。同じファイル群に触るので 1 つの change にまとめて直す（PO 承認 2026-09-23）。

## What Changes

- `briefcase` と `globe` の 16×16 ドット絵を、視認性の高い絵に描き直す（見た目の変更のみ。16×16・装飾 `<svg>`・配色追従は既存どおり）
- `tests/e2e/links.spec.ts` のアイコン取り違えの番人を、rect 数の一致ではなく描画内容（rect の座標列）の一致で比べるよう強化する（camera と linkedin がともに 66 セルで、数では取り違えを検出できない）。対象を連絡先 2 件だけでなくサイト内導線 3 件にも広げる
- `tests/unit/pixel.test.ts` の github / linkedin / briefcase / globe の番人を、camera / lost と同じ厳しい番人（16 行 × 16 文字・`.` と `#` だけ・塗りが 1 セル以上）に統合する
- `src/pages/[lang]/index.astro` のサイト内導線とアイコンの対応づけを、表示ラベル文字列に依存しない形にする
- 同ファイルの `as readonly string[]` 型アサーション 2 箇所を除去する

含めない: ヘッダーの常設ナビへのアイコン追加、GitHub / LinkedIn / camera の描き直し、AWS バッジ。

## Capabilities

### New Capabilities

なし

### Modified Capabilities

なし（`profile-and-career` の「トップページの連絡先リンク」「トップページのサイト内の導線」要件が求めるドット絵アイコンの表示はそのまま満たし、要求は変えない。`skip_specs: true`）

## Impact

- `src/lib/pixel.ts`（`briefcase` / `globe` のグリッド）
- `src/pages/[lang]/index.astro`（アイコンの対応づけ・型アサーション除去。見た目・DOM 構造は不変）
- `tests/unit/pixel.test.ts`、`tests/e2e/links.spec.ts`
- 他のページ・ヘッダーには影響しない
