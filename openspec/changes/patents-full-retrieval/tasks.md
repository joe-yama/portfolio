# Tasks

## Global Constraints

すべてのタスクに掛かる制約。implementer への brief に毎回そのまま渡す。

- パッケージマネージャは **pnpm**。`npm` / `npx` は使わない
- テストなしのコミットは禁止。RED → GREEN → REFACTOR を守る。テストの削除・skip・期待値の書き換えで通さない
- コミットメッセージは日本語、先頭に種別（`feat:` / `fix:` / `test:` / `docs:` / `chore:` / `refactor:`）。`tasks.md` のチェックは実装と同じコミットに含める
- 実装は spec（`openspec/changes/patents-full-retrieval/specs/`）を正とする。spec に無い機能・オプションを足さない。気づいた改善は本ファイル末尾の「提案」に書く
- 検証コマンド: `pnpm test`（単体）/ `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm e2e`
- **ローカルの緑を完了の根拠にしない**。CI の実行結果を最終証拠にする
- `git push --force`、`git reset --hard`、履歴の書き換え、裸の `git stash` は禁止
- 外部通信は Google Patents への読み取りだけ（PO 承認 2026-09-22）。送ってよいのは発明者名と公報番号だけ
- **部分的に取得できたデータで入稿しない**。同族が欠けると `countries` と並び順が狂う

## 1. 調査とデータの生成

- [x] 1.1 発明者クエリ 2 本の和集合 117 公報の公報ページをすべて取得し、`pages/` に 117 ファイルが揃っていること（欠けゼロ）をファイル数で確かめる。遮断されたら時間を空けて再開する（取得済みは飛ばす）。裁定 R9/R12 で代表公報の追加取得（JP 代表 43 件を `/ja`、US/EP/WO 代表 19 件を `/en`）も行い、`pages/` 136 件・`pages-ja/` 160 件、失敗 0 件
- [x] 1.2 公報ページから発明者一覧・`applications`・`countryStatus` を抽出し、D2 の規則で発明者を照合し、D1 の規則で同族にまとめ、D3〜D6 の規則で `number` / `countries` / `filedAt` / `title.ja` / `title.en` を決めた中間データ（JSON）を作る。採用件数・除外件数・JP 公報が無い同族の件数を出力して確かめる。採用 65 件・除外 1 件（117 件を過不足なくカバー）、JP 無し（暫定名称）2 件
- [x] 1.3 中間データを独立に検証するスクリプトを書いて通す。検査項目は (a) `number` に重複が無い、(b) すべての項目で `countries[0] === number.slice(0,2)`、(c) `filedAt` が同族の最小の出願年月と一致し `YYYY-MM` 形式、(d) `countries` に重複が無く先頭以外が出願の早い順、(e) 日英で件数・`number`・`filedAt`・`countries` が一致し `title` だけが違う、(f) `title` が空でなく日本語側に ASCII だけの行が無い（暫定名称は除く）。`verify-1.3.mjs` は a〜j すべて PASS（修正ラウンド 1 回目で (d) の並び替えのデータ源を Priority Applications に直した。裁定 R13。修正ラウンド 2 回目で `countries` が Country Status と Priority Applications の和集合になったことに (d) の独立計算を合わせ、出荷 YAML と中間データの 1:1 突合を (o) として追加。裁定 R17。a〜o すべて PASS）
- [x] 1.5 各同族の請求項 1（`class="claim-text"` の最初の 1 件。日本語は JP 代表公報の `pages-ja/`、英語は US / EP / WO 代表の `pages/`）から、発明の内容が推測できる短い見出しを日英それぞれ起こし、中間データの `title` を置き換える。正式名称は `officialTitleJa` / `officialTitleEn` として中間データに残す。全 65 件で日本語 40 文字以内・英語 90 文字以内であること、正式名称と一致する見出しが 0 件であることを数えて確かめる（裁定 D12）。日本語 40 文字以内（最長 31）・英語 90 文字以内（最長 90）、正式名称と一致 0 件、重複 0 件（修正ラウンド 2 回目で 23 件の見出しを請求項 1 の記載どおりに直し、`claim1Ja`/`claim1En` を全文化、`titleEnSource` を追加。裁定 R17）
- [x] 1.6 `verify-1.3.mjs` に見出しの検査を足して通す。(k) 日本語の `title` が 40 文字以内・英語が 90 文字以内、(l) `title` が `officialTitle` と一致しない、(m) 日本語の `title` に「、及び」「及び」で列挙される定型の末尾（`〜装置、プログラム、及び〜`）が無い、(n) 同じ `title` が 2 件以上に現れない（定型に戻っていないことの検出）。`node .superpowers/sdd/tasks/verify-1.3.mjs` が exit 0。a〜o すべて PASS、exit code 0
- [x] 1.4 `research/publications.md`（掲載する全件の表と、落とした公報の表＋落とした理由）と `research/method.md`（エンドポイント・抽出した構造化データ・照合と同族化の規則・遮断を避ける間隔）を書き、表の件数が 1.2 の出力と一致することを確かめる。**全件の表には「見出し（`title`） / 公報の正式名称 / 根拠にした請求項 1 の抜粋」を含め、PO が 65 件すべてを照合できるようにする**（裁定 D12・D13）
- [x] 1.7 PO 指示（2026-09-22）: 英語の見出しを、日英で別の発明に見えた 6 件を含め、日本語と同じ代表公報（65 件中 63 件が JP、2 件が代表自身の US）の請求項 1 から作り直し、日英を揃える。`titleEnSource` を実態（JP 63 件・US 2 件）に合わせ、`claim1En` は代表が JP の場合は不要にする。`patents-en.yaml` / `src/content/career/en.yaml` を再生成し、`ja.yaml` は変更しない。`verify-1.3.mjs` に (p)（`number` が JP で始まる同族はすべて `titleEnSource === 'JP'`）を追加し、変異（1 件を `US` に戻す）で FAIL することを確認。`research/publications.md`（英語見出しと英語請求項ブロックの更新）・`research/method.md` §5 の内訳を実態に直す。日英が対応する 6 件の前後比較は `task-1.2-report.md` の修正ラウンド 3 節に記録。英語見出し最長 89 文字、`verify-1.3.mjs` は a〜p すべて PASS

## 2. ビルドの番人を先に足す

- [x] 2.1 `src/lib/validate.ts` に `validateCareerPatents` を TDD で追加し、ビルド時の検証に組み込む。単体テストは「一致する」「先頭が違う」「英語のデータだけ違う」の 3 つを含み、エラーに `number` と `countries[0]` が含まれることを確かめる。あわせて**見出しの長さ**（日本語 40 文字以内・英語 90 文字以内。超えたら `number` と文字数を含むエラー）も同じ関数で検証し、境界値（40 / 41、90 / 91）の単体テストを足す。`pnpm test` が緑
- [x] 2.2 `tests/unit/career.test.ts` に `sortPatents` → `splitPatents` の適用順を検査するテストを追加する。並び替えを飛ばすと落ちるように、先頭の項目の `filedAt` を期待する。`pnpm test` が緑（裁定 R6 で e2e に移動。`tests/e2e/pages.spec.ts` の「特許は出願国数が多い順、同数なら出願年月が新しい順に並ぶ」が該当。YAML から独立に計算した先頭項目の `number` が最初の `<li>` に現れることを確かめる）

## 3. 表示の手直し

- [x] 3.1 `src/components/PatentItem.astro` を新設し、`career.astro` の特許の `<li>` 2 か所をこのコンポーネントの呼び出しに置き換える。`pnpm build` と既存の `pnpm e2e` が緑のまま（表示は変わらない）
- [x] 3.2 `career.astro` 先頭のコメントを実際の 5 区画に直す。`pnpm lint` が緑

## 4. データの差し替え

- [x] 4.1 「日本語ページと英語ページで特許のリンク先が異なる」e2e を先に書いて RED を確認し、`src/content/career/{ja,en}.yaml` の `patents` を 1.2 の中間データに差し替えて（`en.yaml` の `url` は `/en`）GREEN にする。`pnpm build` / `pnpm test` / `pnpm e2e` がすべて緑
- [x] 4.2 `tests/e2e/pages.spec.ts` の特許の検査から件数のハードコード（51 / 46）を除き、「先頭 5 件だけが見えている」（`li:visible` が 5）「折りたたみの件数 = 総数 − 5」「英語ページでも折りたたみが開く」を検査する。`pnpm e2e` が緑

## 5. 番人が本当に番人か確かめる

- [x] 5.1 2.1 / 2.2 / 4.1 / 4.2 で足した検査に 1 つずつ変異を当て、それぞれが落ちることを隔離実行（`docs/harness/README.md` の手順）で確かめる。当てる変異は (a) `countries[0]` の比較を常に真にする、(b) `sortPatents` を外す、(c) `<details>` に `open` を付ける、(d) `en.yaml` の `url` を `/ja` に戻す。落ちなかった検査は直してから再度確かめ、結果を本ファイルに記録する

  変異は 1 つずつ当てて実行し、都度バックアップから内容を復元した（`git checkout` は使っていない）。`.mut-exp/` での隔離実行（`pnpm exec vitest run --root`）は、`node_modules/.vite` の古いキャッシュが残っていると変異前の挙動のまま緑に見える罠があり、実プロジェクト設定での直接実行に切り替えて確かめ直した（詳細は報告 `task-5-report.md`）。

  | 変異 | 当てた場所 | 落ちた検査 | 結果 |
  |---|---|---|---|
  | a countries[0] の比較を常に真に | `src/lib/validate.ts` の `validateCareerPatents`（97-98行目付近） | `tests/unit/validate.test.ts` の「countries の先頭が代表公報の国と違えば…」「日本語のデータは整合し英語のデータだけ先頭が違うとき…」 | 落ちた（2 件） |
  | a2 見出しの長さの比較を常に真に | 同関数の `length > maxLength` | `tests/unit/validate.test.ts` の「日本語の見出しが 41 文字なら…」「英語の見出しが 91 文字なら…」 | 落ちた（2 件） |
  | b `sortPatents` を外す | `src/pages/[lang]/career.astro` の `splitPatents(sortPatents(career.patents))` → `splitPatents(career.patents)` | `tests/e2e/pages.spec.ts` の「特許は出願国数が多い順、同数なら出願年月が新しい順に並ぶ」 | 落ちた |
  | c `<details>` に `open` を付ける | `src/pages/[lang]/career.astro` の `<details>` | `tests/e2e/pages.spec.ts` の「折りたたみを開く前は先頭 5 件だけ見えている」（連鎖して「summary をクリックすると…」も落ちた） | 落ちた（2 件） |
  | d `en.yaml` の `url` を 1 件だけ `/ja` に戻す | `src/content/career/en.yaml`（`JP7200645B2` の `url`） | `tests/e2e/pages.spec.ts` の「日本語ページと英語ページで特許のリンク先が異なる」 | 落ちた |
  | e `ja.yaml` / `en.yaml` の `patents` 末尾に同じダミーを 1 件足す | 両ファイル | どの検査も | 落ちなかった（期待どおり。件数の期待値がデータから導かれている証拠。総数 65→66、summary の残数 60→61 に自動で追随した） |
  | e 追加確認: `tests/e2e/pages.spec.ts` の `parsePatents` を壊す（2 件目以降を数えない） | 同ファイルの `numberMatch` 判定に `if (patents.length >= 1) break;` を追加 | 「折りたたみを開く前は…」「summary をクリックすると…」×2 言語、「出願国数が多い順…」 | 落ちた（5 件。抽出関数自体が件数を正しく見ている証拠） |
  | f 同じダミーを `ja.yaml` にだけ足す | `src/content/career/ja.yaml` | `pnpm build`（`validateCareerParity`） | ビルドが `patents の件数が日英で違う（ja: 66, en: 65）` で失敗（期待どおり） |

  **裁定 R24（レビュー単位 B+C）**: ブランチ全体レビュー手前で、変異表に無い穴が 2 つ見つかった。
  I-1「`src/lib/content.ts` の `validateCareerPatents` の配線を消してもどのテストも落ちない」、
  I-2「`tests/e2e/pages.spec.ts` が出願年月・出願国の表示内容を検査していない」。今回のラウンドで
  I-2 は `tests/e2e/pages.spec.ts` に検査を追加して塞ぎ、I-1 は追加した変異 (g)(h) が既存の
  `src/lib/content.ts` の配線で正しく検出されることを確かめて閉じた（配線自体を検査する自動テストは
  「単体テストでは配線は守れない」制約により追加していない。将来また 2 行を削っても pnpm build /
  test / e2e のどれも落ちない、という I-1 の指摘の核心は変異による都度確認以外には残る。後続に
  引き継ぐ）。

  | 変異 | 当てた場所 | 落ちた検査 | 結果 |
  |---|---|---|---|
  | g `countries` の先頭 2 つを入れ替える | `src/content/career/ja.yaml`（`JP7200645B2` の `countries: [JP, US, CN]` → `[US, JP, CN]`） | `pnpm build`（`src/lib/content.ts` 経由で呼ばれる `validateCareerPatents`） | ビルドが `countries の先頭が代表公報の国と違う（number: JP7200645B2, countries[0]: US）` で失敗（期待どおり） |
  | h `title` を 41 文字に伸ばす | `src/content/career/ja.yaml`（`JP7200645B2` の `title`） | `pnpm build`（同上） | ビルドが `title が長すぎる（number: JP7200645B2, 41 文字、上限 40 文字）` で失敗（期待どおり） |
  | i `<PatentItem lang={lang}>` を `lang="ja"` に固定 | `src/pages/[lang]/career.astro` の 2 か所 | `tests/e2e/pages.spec.ts` の新規「先頭の項目は出願年月（ロケール表記）と出願国を YAML の値のまま英語で表示する」 | 落ちた |
  | j `countries` の `<span>` を削除 | `src/components/PatentItem.astro` | 上記の新規テスト（日英両方） | 落ちた（2 件） |
  | k `formatMonth` の `<span>` を削除 | `src/components/PatentItem.astro` | 上記の新規テスト（日英両方） | 落ちた（2 件） |

  I-1・I-2 の確認手順・実行結果の実出力は `.superpowers/sdd/tasks/task-5-report.md` に追記した。

## 6. 仕上げ

- [x] 6.1 ブランチ全体のレビューの指摘のうち Critical / Important を反映する。Minor は本ファイル末尾の「提案」に転記する
- [ ] 6.2 PR を作る（本文に `Closes #<Issue 番号>` と、掲載する全件・落とした公報の確認用の表への導線）。CI が緑であることを確認する

## レビューの単位

`.claude/rules/review.md` に従う。タスクごとではなく次の 4 単位でレビューする。

| 単位 | 対象 | 理由 |
|---|---|---|
| A | 1.1〜1.6 | データの正しさがこの change の本体。抽出規則・照合規則・同族化の誤りと、**見出しが請求項 1 の範囲を外れていないか**はここでしか捕まえられない |
| B | 2.1〜2.2 | spec の要求（`countries` の先頭）と共有インターフェース（`validate.ts`）に触る |
| C | 3.1〜3.2 + 4.1〜4.2 | 表示とデータは一緒に見ないと「片方だけ直す事故」を検出できない。UI は reviewer 自身が Playwright MCP で `http://127.0.0.1:<port>/{ja,en}/career/` を実操作して確かめる |
| D | ブランチ全体 | 必須（1 回） |

5.1 は変異の実行結果が証拠になるので、単体のレビューは行わず D に含める。

## 提案（後続へ）

<!-- レビューで出た Minor と、実装中に気づいた change 外の改善をここに書く -->

- Change 8 が後続に回した分のうち、この change に含めないもの: 印刷用 CSS（`@media print` で `<details>` を開く）、特許一覧が `<ul>` 2 本に割れる件、~~`validateCareerParity` が日英で `filedAt` / `countries` の一致を見ていない件（1.3 の (e) で入稿時には確かめるが、ビルドの番人にはしていない）~~ → **`origin/main` へ rebase した時点（2026-09-22）で解消済み**。別セッションの change `followup-hardening`（Change 10）が `validateCareerParity` に `certifications`/`achievements` の `date`、`patents` の `countries` 件数と `filedAt` の比較キー検査を足しており、この change の 65 件のデータはその検査を通ることを rebase 後の `pnpm build` で確認した

### 番人の限界（この change で塞ぎきれなかったもの）

- **`src/lib/content.ts` の `assertValid(validateCareerPatents(...))` の 2 行を消しても、データが正しい限りどのテストも落ちない**。単体テストは `astro:content` に依存するため配線を通せず、e2e とビルドは正しいデータでは配線の有無を区別できない。変異 (g)(h) は「配線がある状態で不正なデータを入れると落ちる」ことしか示していない
- **検査 (p)（`titleEnSource` が JP）が守るのはラベルであって本文ではない**。レビュアーが実測で、`titleEn` の本文だけを US 請求項由来の旧文言に戻してラベルを `JP` のままにすると ALL PASS になることを確かめている。**PR や文書で「番人が見出しの本文を保証する」と読める書き方をしない**
- **検査 (o) が見ているのは中間 YAML（`.superpowers/`）であって、出荷される `src/content/career/*.yaml` ではない**。中間データは workspace の削除で消えるので、恒久的な番人にはできない
- `number` の重複を防ぐビルド時の番人が無い。同じ `number` を 2 件書いても日英の件数が合っていれば e2e も緑になる

### 見出しの精度（PO 判断の余地）

- `JP2025095979A` の英語見出し `A **single button** that takes…` — 請求項は「ユーザの撮影操作を受け付ける入力部」。ブランチ全体のレビューは「請求項が入力部を単数で書き、短押し・長押しを明示しているので許容範囲の具体化」と判定して Minor 据え置き。日本語は正確
- `JP2020093622A` の英語見出し `…settings in **any car**` — 請求項は「当該車載制御装置または他の車載制御装置」。やや広い。日本語「他の車にも復元」は正確
- `JP7310636B2` は日英そろって抽象語（ja「所定処理」/ en "an action"）で、請求項には忠実だが読み手に何が起きるか伝わらない。US 請求項の「手動運転から自動運転へ切り替える」は JP 請求項に無いので足せない
- `JP2021111156A` の日本語見出し「…の**少なくとも一方を実施**」も請求項の言い回しがそのままで読みにくい
- どれも `en.yaml` の 1 行と `publications.md` の 1 行だけで直せる（`validateCareerParity` は `title` を比べないので後続で安全に直せる）

### コードと番人の整理

- `src/lib/validate.ts` の `validateCareerPatents(career, lang: string)` が `PATENT_TITLE_MAX_LENGTH` を定数オブジェクトにしながら三項演算子で引いている。`'JA'` / `'jp'` を渡すと**日本語データが黙って 90 文字上限で検査される**。`lang: Locale` ＋ `PATENT_TITLE_MAX_LENGTH[lang]` にすれば型で塞げる（`i18n.ts` は astro 非依存なので型のみ import は node 直実行の経路を壊さない）
- `src/lib/content.ts` が `assertValid` を日英で 2 回呼ぶので、ja にエラーがあると en のエラーが出ない（1 回のビルドで両方直せない）。配列を結合して 1 回にできる
- `tests/e2e/pages.spec.ts` の `patentsByLang.en` がどこからも読まれていない。`parsePatents` が `patents:` ブロックに限定せずファイル全体を走査している（将来ほかの区画が `number` を持つと総数が黙って増える）
- `tests/e2e/pages.spec.ts` の `formatMonth` が `month: lang === 'ja' ? 'long' : 'short'` を使っているが、本体の `src/lib/career.ts` は「ja では long と short の出力が同じ」として意図的に `'short'` 固定にしている。**独立実装のつもりが、本体が消した分岐を復活させている**
- `tests/e2e/pages.spec.ts` の「出願国数が多い順、**同数なら出願年月が新しい順**に並ぶ」は、assert が先頭 1 件の `number` だけで、先頭が 6 か国で唯一のためタイブレークを壊す変異では落ちない。タイブレーク自体は `tests/unit/career.test.ts` が守っているので穴ではないが、**テスト名が守備範囲を過大に言っている**
- 65 件すべてが `url` を持つため、spec の「`url` を持たない項目をリンクにしてはならない」を実データで踏む経路が無く、`PatentItem.astro` の三項の else 側は実質デッドパス
- ponytail（`net: -95 lines possible.`）: e2e の `firstBySortOrder` の返り値と 3 定数への分散、「url を持つ項目の名称だけが…」テストが日英リンク比較と重複、`publications.md` の「見出し（en）もこの日本語の請求項を根拠にしている」が 63 ブロックに逐語で繰り返されている（前段の節に同じ説明があるので例外の 2 件だけ注記すればよい）

### `PatentItem` の切り出しが残した非対称

- `career.astro` の `<style>` の `ul` 規則は `<ul>` が career.astro 内にあるため効くが、`<li>` は `PatentItem` 側にあり `data-astro-cid-*` を持たない。**将来 `career.astro` の `<style>` に `li { … }` を足すと、資格・実績の `<li>` にだけ効いて特許の `<li>` には効かない**。いまは `li` 規則が無いので実害ゼロ（レビュアーが computed 値の一致を実測済み）。`li` 規則を足すときは `global.css` か `PatentItem.astro` 側に置く

### 調査と文書

- `research/publications.md` の落とした公報の名称だけ英語大文字（`VOICE DIALOGUE SYSTEM, …`）。`pages-ja` から日本語の正式名称を取れる
- `research/publications.md` の同族メンバー表が、行によって代表公報自身を含んだり含まなかったりする（束ねた公報の数を読み手が数えられない）
- **`docs/harness/README.md` の隔離実行の手順（`.mut-exp/` に別ルートを作って `pnpm exec vitest run --root` する）は、`node_modules/.vite` の古いキャッシュのせいで誤った緑を返す**（Task 5.1 で実測）。実装者は「実プロジェクト設定へ直接変異＋バックアップ復元」方式に切り替えて正しい結果を得た。手順の記述を直す必要がある
- 発明者クエリの網羅性は `Josuke Yamane` / `山根丈亮` の 2 表記でしか確かめていない。`J. Yamane` のような別表記で登録された公報があれば取りこぼす
