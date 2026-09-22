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

データ編集のみ。`docs/content-authoring.md`「経歴（日英の対応づけ）」に従い、`ja.yaml` と `en.yaml` を同じカテゴリ数・項目数で更新する。design.md の D9 を参照。

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

## 4. AWS 認定資格 12 件へのバッジ画像表示

design.md の D6〜D8、`content-schema` と `profile-and-career` の spec delta に沿って実装する。バッジ画像 12 件すべて取得済み（コントローラーが aws.amazon.com の公式資格ページから取得、`file` コマンドで PNG 500×500 であることを確認済み）:
`/private/tmp/claude-501/-Users-joe-repo-github-personal-joe-yama-portfolio--worktrees-feature-fix-misc/9e44d26a-62f7-494b-8963-a34af1acd186/scratchpad/aws-badges/`

資格名（`certifications[].name` の文字列と完全一致）とファイル名の対応:

| name | ファイル名 |
|---|---|
| AWS Certified AI Practitioner | `ai-practitioner.png` |
| AWS Certified CloudOps Engineer - Associate | `cloudops-engineer-associate.png` |
| AWS Certified Data Engineer - Associate | `data-engineer-associate.png` |
| AWS Certified Developer - Associate | `developer-associate.png` |
| AWS Certified DevOps Engineer - Professional | `devops-engineer-professional.png` |
| AWS Certified Machine Learning Engineer - Associate | `machine-learning-engineer-associate.png` |
| AWS Certified Advanced Networking - Specialty | `advanced-networking-specialty.png` |
| AWS Certified Security - Specialty | `security-specialty.png` |
| AWS Certified Machine Learning - Specialty | `machine-learning-specialty.png` |
| AWS Certified Cloud Practitioner | `cloud-practitioner.png` |
| AWS Certified Solutions Architect - Professional | `solutions-architect-professional.png` |
| AWS Certified Solutions Architect - Associate | `solutions-architect-associate.png` |

- [x] 4.1 RED: `tests/unit/schemas.test.ts` に、`certifications` の項目が任意の `logo`（文字列）を持てることを検証する単体テストを追加し、まだスキーマが `logo` を許可していないため失敗することを確認する
- [x] 4.2 GREEN: `src/content/schemas.ts` の `datedItemSchema` に `logo: z.string().optional()` を追加し、4.1 を通す
- [ ] 4.3 GREEN: 上表の 12 ファイルを `aws-badges/` から `public/badges/` にコピーする。`src/content/career/ja.yaml` と `src/content/career/en.yaml` の該当する AWS 認定資格の項目（12 件、`docs/content-authoring.md` の「certifications は日英で同じ順番に並べる」に従い両言語とも同じ項目に。`name` は日英で同じ英語表記のまま）に、上表の対応で `logo: /badges/<ファイル名>` を追加する
- [ ] 4.4 RED: `tests/e2e/pages.spec.ts` または `tests/e2e/links.spec.ts` に、`/ja/career/` の資格セクションで `logo` を持つ項目に `<img>`（`alt` がその資格の `name` と一致）が現れ、`logo` を持たない項目（TOEIC・Licensed Scrum Master 等）には `<img>` が現れないことを検証する e2e テストを追加し、実装前に失敗することを確認する
- [ ] 4.5 GREEN: `src/pages/[lang]/career.astro` の資格セクションで、`item.logo` がある場合に `<img src={withBase(item.logo, base)} alt={item.name} />` を名前の隣に表示する。4.4 のテストを通す
- [ ] 4.6 検証: `pnpm test`・`pnpm lint`・`pnpm typecheck`・`pnpm build && pnpm e2e` を実行し、すべて緑であることを示す。加えて `dist/` に `badges/` 配下の画像が出力されていること（`ls dist/badges/` 等）を確認する

## 提案（本 change のスコープ外・後続への申し送り）

- ヘッダーの常設ナビ（`src/components/Header.astro` の `<nav>`）には今回アイコンを付けていない。トップページ本文と意匠を揃えるなら別 change で検討する
- 手描きの 16×16 ドット絵（GitHub・LinkedIn・Career・言語切り替え）は「仮の絵」（`camera`/`lost` と同水準）。レビューで実際の見た目を見て、視認性が低ければ差し替えを検討する
