# Tasks

## 1. ヘッダーロゴリンクの下線除去

- [x] 1.1 RED: `tests/e2e/viewport.spec.ts` と同様に `page.goto` + `getComputedStyle` を使い、`/ja/` の `.logo`（ヘッダー左の "Josuke Yamane" リンク）の computed `textDecorationLine` が `none` であることを検証する e2e テストを追加し（`tests/e2e/links.spec.ts` に追加）、修正前に失敗することを確認する
- [x] 1.2 GREEN: `src/components/Header.astro` の scoped style の `.logo` に `text-decoration: none;` を追加し、1.1 のテストを通す。`src/styles/global.css` の `a { text-decoration: underline; }`（全リンク共通）自体は変更しない
- [x] 1.3 検証: `.logo` が `<a href>` のままであること（リンク先 `homePath(lang, base)` が変わらないこと）を 1.1 のテストと同じブロックでアサートし、`pnpm test`（既存の単体テストに影響がないこと）・`pnpm lint`・`pnpm typecheck`・`pnpm build && pnpm e2e` を実行して結果を示す

## 2. トップページ本文最下部の並び替えとドット絵アイコン付与

design.md の D1〜D5 を前提とする。`profile-and-career` の spec delta（`specs/profile-and-career/spec.md`）に沿って実装する。

- [x] 2.1 RED: `src/lib/pixel.ts` に追加する新規グリッド（2.2 で追加）が 16 行 × 各行 16 文字であることを検証する単体テスト（`tests/unit/pixel.test.ts` を新規作成。既存の `gridSize` を使って `github` / `linkedin` / `briefcase` / `globe` それぞれの `gridSize(rows)` が `{ width: 16, height: 16 }` になることを確認する形でよい）を追加し、まだグリッドが存在しないため失敗することを確認する
- [x] 2.2 GREEN: `src/lib/pixel.ts` に次の 4 つの定数を追加し、2.1 を通す（デザインはコントローラーが確定済みなので値をそのまま使う。修正が必要な場合のみ変更してよいが、寸法（16×16）は変えないこと）:

  ```ts
  /** トップの連絡先リンクのアイコン: GitHub（簡略化した猫のシルエット） */
  export const github: readonly string[] = [
    '................',
    '................',
    '...#........#...',
    '..###......###..',
    '..############..',
    '..############..',
    '.##############.',
    '.##############.',
    '.###.######.###.',
    '.##############.',
    '.##############.',
    '..############..',
    '...##########...',
    '.....######.....',
    '................',
    '................',
  ];

  /** トップの連絡先リンクのアイコン: LinkedIn（"in" のモノグラム） */
  export const linkedin: readonly string[] = [
    '................',
    '................',
    '................',
    '...###..........',
    '...###..........',
    '................',
    '...###..######..',
    '...###..######..',
    '...###..##..##..',
    '...###..##..##..',
    '...###..##..##..',
    '...###..##..##..',
    '...###..##..##..',
    '...###..##..##..',
    '................',
    '................',
  ];

  /** サイト内導線のアイコン: Career（鞄） */
  export const briefcase: readonly string[] = [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......####......',
    '......#..#......',
    '......#..#......',
    '...##########...',
    '...#........#...',
    '...##########...',
    '...#........#...',
    '...#........#...',
    '...##########...',
    '................',
    '................',
  ];

  /** サイト内導線のアイコン: 言語切り替え（地球儀） */
  export const globe: readonly string[] = [
    '................',
    '................',
    '......####......',
    '....#..##..#....',
    '...#...##...#...',
    '..#....##....#..',
    '..#....##....#..',
    '.##############.',
    '.##############.',
    '..#....##....#..',
    '..#....##....#..',
    '...#...##...#...',
    '....#..##..#....',
    '......####......',
    '................',
    '................',
  ];
  ```

- [x] 2.3 RED: `tests/e2e/links.spec.ts`（または新規ファイル）に、`/ja/` のトップページで以下を検証する e2e テストを追加し、実装前に失敗することを確認する:
  - `main` 内で `nav.links`（Photos・Career・言語切り替え）の `getBoundingClientRect().top` が `ul.links`（連絡先リンク）のそれより小さい（＝サイト内導線が先、連絡先リンクが最も下）
  - `ul.links li a` と `nav.links a` のすべてのリンクが、内部に `svg[aria-hidden="true"]`（`viewBox="0 0 16 16"`）を 1 つ持つ
  - GitHub・LinkedIn の `<a>` に含まれる `svg` の中身（`rect` の個数、または `outerHTML`）が、それぞれ `github` / `linkedin` グリッドの `#` の数と一致する（アイコンの取り違えがないことの確認）
- [x] 2.4 GREEN: `src/pages/[lang]/index.astro` を変更する:
  - `<nav class="links">` ブロックを `<ul class="links">` ブロックより前（ソース順で先）に置く
  - `<ul class="links">` の各 `<a>` に、`link.kind` に応じて `PixelArt` を差し込む（`github` → `github` グリッド、`linkedin` → `linkedin` グリッド、それ以外は spec 通りアイコンなし）
  - `<nav class="links">` の `navLinks` 由来の Photos/Career と言語切り替えの `<a>` に、それぞれ `camera`（Photos）・`briefcase`（Career）・`globe`（言語切り替え）を差し込む
  - `<a>` に `display: flex; align-items: center; gap: 0.35em;` を追加する scoped style を書く
  - 2.3 のテストを通す
- [x] 2.5 検証: `pnpm test`・`pnpm lint`・`pnpm typecheck`・`pnpm build && pnpm e2e` を実行し、既存の `tests/e2e/viewport.spec.ts` の「トップページの初見表示」（1280×720・1440×900、`ja`/`en` 両方）が引き続き緑であることを含めて結果を示す

## 3. 経歴データの文言修正とスキルの追加・置き換え

データ編集のみ。`docs/content-authoring.md`「経歴（日英の対応づけ）」に従い、`ja.yaml` と `en.yaml` を同じカテゴリ数・項目数で更新する。design.md の D6 を参照。

- [x] 3.1 RED: `tests/` 配下を `全社横断`（ja.yaml のみ）・`開発標準化機能`・`リードしている`（experience の role/bullets 文言）・`Python, SQL`（プログラミング言語の現在値）で grep し、これらの厳密な文字列に依存しているテストが無いか確認する。もし依存しているテストがあれば、新しい文言に合わせて期待値を更新する（変更前にまず現状の文言で全テストが緑であることを確認してから着手する）
- [x] 3.2 GREEN: `src/content/career/ja.yaml` を編集する:
  - `experience[0].role` を `エンジニアリング標準化リード（全社横断）` → `エンジニアリング標準化リード` に変更する（「（全社横断）」を削除）
  - `experience[0].bullets[0]` を `100 名超のエンジニアを対象に、プロジェクト横断の開発標準化機能を立ち上げ、リードしている` → `100 名超のエンジニアを対象に、プロジェクト横断の開発標準活動を立ち上げリーディング` に変更する
  - `skills.クラウド` に `プラットフォームエンジニアリング` を追加する（末尾でよい）
  - `skills.プログラミング言語` を `[Python, SQL]` から `[Python, Java, Scala, C++, TypeScript]` に置き換える
  - `skills` に新しいカテゴリ `言語` を追加し、値を `[英語を第一言語とするチームのリーディング]` にする（他のカテゴリの後に追加する）
- [x] 3.3 GREEN: `src/content/career/en.yaml` を、ja.yaml と同じカテゴリ数・カテゴリごとの項目数になるように編集する（`docs/content-authoring.md` の日英対応づけルールに従う。カテゴリの記述順を ja.yaml と揃えること）:
  - `experience[0].role` の `(Cross-Project)` 相当はそのままでよい（「全社横断」の削除は日本語版の文言修正であり、英語版はすでに `Cross-Project` のみで「全社」に相当する語を含んでいない）。ただし `bullets[0]` の内容変更（「立ち上げ、リードしている」→「立ち上げリーディング」のニュアンス）に対応する自然な英語表現に更新する（例: `Founded and am leading a cross-project engineering-standards initiative for 100+ engineers` 相当。厳密な直訳でなくてよいが、原文の意味を変えないこと）
  - `skills.Cloud`（または対応するキー名）に `Platform Engineering` を追加する
  - `skills.Programming languages`（または対応するキー名）を `[Python, SQL]` 相当から `[Python, Java, Scala, C++, TypeScript]` に置き換える
  - `skills` に新しいカテゴリ `Languages` を追加し、値を `[Leading teams whose primary language is English]` にする
- [x] 3.4 検証: `pnpm test`（`validateCareerParity` を含む既存の単体テストが日英の件数一致を検証する）・`pnpm lint`・`pnpm typecheck`・`pnpm build && pnpm e2e` を実行し、3.1 で更新したテストも含めてすべて緑であることを示す

## 提案（本 change のスコープ外・後続への申し送り）

- ヘッダーの常設ナビ（`src/components/Header.astro` の `<nav>`）には今回アイコンを付けていない。トップページ本文と意匠を揃えるなら別 change で検討する
- 手描きの 16×16 ドット絵（GitHub・LinkedIn・Career・言語切り替え）は「仮の絵」（`camera`/`lost` と同水準）。レビューで実際の見た目を見て、視認性が低ければ差し替えを検討する
- **AWS 認定資格 12 件へのバッジ画像表示は実装したが、PO の判断（見た目が良くない）で取り消した**（2026-09-22、`revert: AWS認定資格のバッジロゴ表示を取り消す`）。aws.amazon.com 公式の 500×500 PNG をそのまま `<img>` で縮小表示する形だった。再挑戦する場合は見せ方（サイズ・配置・ドット絵化するか等）から design.md で検討し直すこと。取得済みだった画像・対応表は削除済みで残っていない
- ブランチ全体レビュー（2026-09-22、Approved）の Minor 指摘:
  1. `tests/e2e/links.spec.ts` のアイコン取り違えの番人が rect 数の一致だけを見ており、camera（66）と linkedin（66）が同数のため取り違え変異を検出できない。`outerHTML` か先頭 rect の座標で比較するよう強化する
  2. `tests/unit/pixel.test.ts` の新規グリッド（github/linkedin/briefcase/globe）の番人が `gridSize` の width/height だけを見ており、1 行だけ短い・`.`/`#` 以外の文字が混ざる等の変異を検出できない。既存のより厳しい番人ブロック（`toHaveLength(16)` + 正規表現）に統合する
  3. `src/pages/[lang]/index.astro` の nav アイコン対応づけが `navLinks` の表示ラベル文字列（`'Photos'`/`'Career'`）をキーにしている。将来ラベルを訳語にするとアイコンが例外無しに消える。`navLinks` の戻り値にアイコンを持たせるか index 対応にする
  4. 同ファイルの `as readonly string[]` という型アサーションが 2 箇所。ローカル変数に受けて narrowing すればキャスト無しにできる
  5. 手描きドット絵の視認性（実測）: briefcase（鞄）が取っ手の線が細く判別しづらい、globe（地球儀）が横帯が枠いっぱいに伸びていて照準のように見える。差し替えるなら globe → briefcase の順で効果が大きい
