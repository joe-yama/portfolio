# Design

## Context

仕分けは main `ef40034` に対して行った（出典: `openspec/changes/archive/*/tasks.md` の末尾）。並行して `feature/header-nav-icons` が `Header.astro`、`src/lib/site.ts`、`src/pages/[lang]/index.astro` の導線まわり、`tests/unit/site.test.ts`、`tests/e2e/links.spec.ts` を変更するので、本 change はそれらに触らない。ただし `index.astro` の代表写真まわり（frontmatter の `featured` の取得と `.hero` / `.art` の CSS）は本 change が触る。導線の JSX とは行が離れているので、衝突は小さい。

## Decisions

### D1: 特許の見出し（PO 決定 2026-09-23）

| 公報 | 言語 | 新しい `title` |
|---|---|---|
| JP2025095979A | en | Taking a photo on a short press and recording video on a long press with an in-car camera |
| JP2020093622A | en | Recognizing an occupant on camera to restore their settings in the same or another car |
| JP7310636B2 | ja | 近接する2台の相対速度が何度も正負反転したら処理を実行、並走時は早めに |
| JP7310636B2 | en | Acting when nearby vehicles' relative speed keeps flipping sign, sooner side by side |
| JP2021111156A | ja | 前方車の灯火が見えにくいと判定したら車間を広げるか運転者に通知 |

いずれも上限（ja 40 / en 90 字）に収まる。PO に示した案のうち 3 本が上限を超えていたため、意味を変えずに詰めた版をコントローラーが PO に提示済み。照合表 `research/publications.md` は archive の中にあるので書き換えず、`docs/status.md` の「PO 判断として残っている件」から Change 11 の段落を消すときに、新しい見出しの出典がこの design であることを書く。

### D2: 写真の id をファイル名そのものにする

`src/content.config.ts` の photos の `glob()` に `generateId: ({ entry }) => entry.replace(/\.yaml$/, '')` を渡す。既定の id 生成（github-slugger）は `.` を消し、大文字を小文字にするため、`kamo-river-v1.2.yaml` → `kamo-river-v12` になり、`validatePhotos` の `image` 一致検査で必ず落ちる。id 生成を純関数（`photoIdFromEntry`）として `src/lib/photo-meta.ts` に置き、unit テストで `.` と大文字を固定する。写真ページの URL は `photo.id` から作られるので、`.` を含む slug の URL（`/ja/photos/kamo-river-v1.2/`）がそのまま出る。Astro の静的出力でディレクトリ名に `.` を含んでも配信できることを、RED の段階で実際の YAML を置いたビルドで確かめる（仕分けはソースの読解と slugger 単体の実測だけで行ったため）。

### D3: 写真 0 枚はビルドを失敗させる（PO 決定 2026-09-23）

`validatePhotos` 冒頭の `if (entries.length === 0) return [];` を消す。0 枚では featured が 0 枚になるので既存の「featured はちょうど 1 枚にする（現在 0 枚: なし）」で落ちる。これで BaseLayout と index.astro の `if (!featured) throw …` は到達しなくなるので、代表写真の取得を `src/lib/content.ts` の `getFeaturedPhoto()` 1 か所にまとめる（Change 10 の ponytail H-B3）。検証がビルドの経路で先に走ることは既存の配線の番人（content.test）が守っている。

### D4: 経歴の検証を 1 回にまとめる

`src/lib/content.ts` の `assertValid` を ja・en・parity で 3 回呼ぶ形から、エラー配列を結合して 1 回呼ぶ形にする。content.test では、ja と en の両方にエラーがあるとき両方が 1 つの例外に現れることと、`getCareer('ja')` が ja のデータを返すこと、検証に渡すロケールを入れ替えると落ちること（41〜90 文字の日本語 title を使う）を固定する。

### D5: 入稿の中断を 1 行に揃える

`scripts/photo-add.ts` の `exifr.parse` と `sharp` の呼び出しを try で包み、既存の `die()` で「画像として読めない: <パス>」の 1 行にする。`ghFailureMessage`（`src/lib/photo-meta.ts`）は stderr が空白だけのとき `message` の先頭行だけを返し、login も先頭行だけを使う。photo-add-cli のテストは PATH を偽の `gh` のディレクトリだけにする（本物の `gh` に落ちない）、一時ディレクトリを `afterAll` で消す、パス区切りだけを含む slug（`a/b`）のケースを足す、撮影情報が欠けた画像を sharp でその場で作って子プロセスで中断文言を確かめる。

### D6: 仕分けで「挙動不変」とした整理

一覧は `tasks.md` の 4〜6 章。どれも既存のテストが緑のまま通ることを前提にし、テストの削除・期待値の書き換えで通さない。テストを畳む場合は、畳んだ後も同じ変異で落ちることを確かめる。

## Risks / Trade-offs

- D2 で id の作り方を変えると、既存の 2 枚（`2025-kyoto-dawn` などの小文字・ハイフンだけの名前）は id が変わらない。変わらないことを e2e の既存ページ一覧が確かめる
- D3 で 0 枚のビルドが落ちるので、写真を全部消して作業する運用はできなくなる（PO 承認済み）
- `index.astro` を A と B の両方が触る。PR 前に `origin/main` へ rebase し、先にマージされた側の変更を取り込む
