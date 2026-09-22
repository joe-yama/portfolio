# Design

## Context

トップページ本文のアイコンは `src/lib/pixel.ts` の 16×16 文字列グリッドを `PixelArt` コンポーネントが `<rect>` 列の `<svg>` に描く。サイト内導線は `navLinks()`（`src/lib/site.ts`、ヘッダーと共用）が `[Photos, Career]` を固定順で返し、トップページは表示ラベル `'Photos'` / `'Career'` をキーにアイコンを引いている。

## Goals / Non-Goals

**Goals:** briefcase / globe の視認性の改善、番人の穴 2 件の解消、ラベル依存と型アサーションの除去。

**Non-Goals:** ヘッダーへのアイコン追加、他の絵の描き直し、`navLinks()` の戻り値の型変更（ヘッダーと共用のため触らない）。

## Decisions

- **ドット絵の描き直し**: 鞄は取っ手を 2 セル幅の太い線にし、本体を塗りつぶし寄り（留め具や帯を抜きで表現）にして 16px でもシルエットで判別できるようにする。地球儀は外周を円で閉じ、経線・緯線を円の内側で止める（枠外に伸ばさない）ことで照準と区別する。camera / github と同程度の塗り密度を目安にする。最終的な見え方は reviewer が Playwright で 1x 表示のスクリーンショットを撮って確かめ、PO が PR で受け入れる。
- **ラベル非依存の対応づけ**: `index.astro` 内で `navLinks()` の結果に、同じ順序のアイコン配列 `[camera, briefcase]` を index で対応づける。`navLinks()` の型は変えない（ヘッダーへの波及を避ける）。対応が崩れた場合（件数の不一致）はビルド時に例外を投げる。
- **型アサーション除去**: `contactIcons[link.kind]` / アイコンをローカル変数に受けて truthy で narrowing する（`.map` のコールバック内で `const icon = ...` を使う）。
- **e2e の番人**: 各リンク内の `svg rect` の `(x, y)` 列を取り出し、期待するグリッドの `cells()` と完全一致で比べる。対象は導線 3 件（camera / briefcase / globe）と連絡先 2 件（github / linkedin）。
- **unit の番人**: 既存の camera / lost の `describe.each` に 4 件を加え、`gridSize` だけの `describe.each` を削除する（統合）。

## Risks / Trade-offs

- 描き直した絵の良し悪しは主観 → 代償: PO が PR で不採用なら絵のグリッドだけ差し戻す（コード・テストの変更は独立に有効）
- e2e を座標の完全一致にすると、今後の絵の描き直しで期待値ではなく実装（`cells(grid)`）から期待値を作るので追加の保守は要らない
