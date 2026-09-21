# ポートフォリオサイト 設計書

- 作成日: 2026-09-17
- 状態: brainstorming で PO 承認済み（5 セクションすべて）。2026-09-17 の PO レビューで 3 点を反映（pnpm 採用、写真は GitHub Releases に保管、change ごとに GitHub Issue で進行管理）。2026-09-18 の Change 2 `layout-shell` の brainstorming で §4・§5・§6・§7 を更新（ヘッダーとフッターの内容、フォントの配信方式、ドット絵の形式）
- 対象: 初回リリース（v1）。ここに書かれていない機能は含めない

## 1. 目的と読者

PO 本人の名刺となる Web サイト。役割の優先順位は次のとおり。

1. **採用担当・転職エージェント**に経歴・スキル・実績を見せる
2. **アマチュアカメラマンとしての写真ポートフォリオ**を見せる

情報発信（ブログ、近況）は v1 の対象外。プロフィール主体であることが PO の決定。

## 2. 決定事項の一覧

| 項目 | 決定 |
|---|---|
| 主目的 | プロフィール（名刺的）。写真ポートフォリオを併設 |
| 写真の規模 | 厳選数十枚を固定展示。入れ替えは年に数回 |
| 更新方法 | リポジトリの YAML を編集して push。管理画面なし |
| 写真の保管 | 画像ファイルは git に入れず、同リポジトリの GitHub Releases（タグ `photos`）の asset として保管。YAML はその URL を参照し、ビルド時に取得する（PO レビュー 2026-09-17） |
| 公開先 | 個人 GitHub.com の公開リポジトリ `joe-yama/portfolio`。無料枠。**v1 は GitHub Pages の既定 URL `https://joe-yama.github.io/portfolio/`**（`site: 'https://joe-yama.github.io'` + `base: '/portfolio'`。PO 決定 2026-09-21）。独自ドメインは後続 |
| パッケージマネージャ | pnpm（PO レビュー 2026-09-17。npm は使わない） |
| 進行管理 | OpenSpec の change 1 つにつき GitHub Issue を 1 つ作り、経過と方針変更を記録。PR は `Closes #N` で紐付け、マージでクローズ（PO レビュー 2026-09-17） |
| 言語 | 日本語 + 英語の二言語。全ページを両言語で用意 |
| デザイン | 写真主役の徹底ミニマル。ドット文字とドット絵で遊び心を出す |
| 技術スタック | Astro（TypeScript）+ GitHub Pages + GitHub Actions |
| ライセンス | コードは MIT。写真・文章は All rights reserved（`LICENSE` に両方を記載済み） |

## 3. 含めないもの（v1）

ブログ・近況の一覧、問い合わせフォーム（メールリンクで代替）、ライトボックスや無限スクロールなどの JavaScript 演出、検索、コメント、アクセス解析、外部 CDN や外部フォント配信、PR ごとのプレビュー環境、視覚回帰テスト、Lighthouse のスコア閾値、CI での画像取得キャッシュ（毎ビルドで Releases から数十枚を取得する。遅くなったら検討）。
必要になったら OpenSpec の change として提案する。

## 4. サイト構成と URL

すべてのページを `/ja/` と `/en/` の下に置く（`prefixDefaultLocale: true`）。`/` は `/ja/` へ静的リダイレクト（`src/pages/index.astro` の `<meta http-equiv="refresh" content="0;url=/ja/">`。JavaScript 不要。Astro の `redirectToDefaultLocale` はルートの index.astro の存在を要求したうえで同じ `/` と競合する警告を出すため使わない。実装時判断 2026-09-17、Issue #1）。

| URL | 役割 | 内容 |
|---|---|---|
| `/ja/` | トップ（名刺） | 代表写真 1 枚を大きく。名前、一行の自己紹介、連絡先リンク（GitHub、メール、SNS）、3 ページへの導線。ロゴとナビにドット文字 |
| `/ja/photos/` | ギャラリー | 写真のグリッド。余白広め、キャプション無し。クリックで個別ページ |
| `/ja/photos/<slug>/` | 写真の個別ページ | 1 枚を画面いっぱいに。タイトル、撮影地、撮影日、撮影情報を 1 行。前後の写真へのリンク |
| `/ja/career/` | 経歴 | 職歴の時系列、スキル、資格、登壇・執筆などの実績、外部リンク |
| `/404.html` | 見つからない | ドット絵 1 枚と両言語への戻りリンク |

`/en/` 配下も同じ構成。各ページのヘッダーに言語切り替えを置き、**同じページの他言語版**に飛ぶ（トップに戻さない）。`<html lang>` と `hreflang` の `<link rel="alternate">`（`ja` / `en` / `x-default` = `ja`）を全ページに出す。

ヘッダーとフッター（PO 決定 2026-09-18）:

- ヘッダーは 1 行。左にロゴ（`profile` の `name` をドット文字で表示。クリックでその言語のトップへ）、右にナビ「Photos」「Career」（両言語とも英字）と言語切り替え（相手の言語名を表示。日本語ページでは「English」、英語ページでは「日本語」）。狭い画面では折り返すだけで、開閉メニューは作らない
- フッターは「© 年 名前」の 1 行のみ。年はビルド時の年
- `/404.html` にはナビと言語切り替えを置かない（どの言語のページか決められないため）。フッターは共通

写真の個別ページの前後リンク（PO 決定 2026-09-20）: 並び順の先頭の写真には「前」のリンクを、末尾の写真には「次」のリンクを出さない。中間の写真は両方出す。

トップと `/career/` の表示（Agent 裁定 2026-09-21。PO 不在の無人リリースで決め、PO が後から覆せる）:

- トップの「連絡先リンク」は `profile.links` を YAML の順に並べ、`label` を表示する（`kind` は表示にも装飾にも使わない）。`mailto:` はそのまま使い、外部リンクに `target` / `rel` は付けない
- トップの「3 ページへの導線」は本文に Photos / Career / 他言語版トップの 3 リンク（ヘッダーと重複してよい。本文が名刺の主導線）
- `/career/` の `<title>` とページの `h1` は両言語とも `Career`（ナビの英字表記に揃える）。本文の節見出し（職歴・スキル・資格・実績）はロケール別の文字列で、置き場は `src/lib/site.ts` の `ui`

## 5. 内容データの構造

Astro のコンテンツコレクション（Zod スキーマ）で定義し、ビルド時に検証する。

```
src/content/
├── profile/   ja.yaml, en.yaml   # 名前、一行紹介、連絡先リンク
├── career/    ja.yaml, en.yaml   # 職歴、スキル、資格、実績
└── photos/    <slug>.yaml        # 写真 1 枚 = 1 ファイル。二言語を同居。画像本体は Releases（下記）
src/components/pixel/*.astro      # ドット絵（インライン SVG。Agent 作の仮の絵）
public/CNAME                      # 独自ドメイン名

GitHub Releases（タグ photos、`--latest=false`）
└── <slug>.jpg                    # 写真の元画像。URL は
                                  # https://github.com/joe-yama/portfolio/releases/download/photos/<slug>.jpg
```

写真ファイルは git の履歴と clone に入れない（PO 決定）。同リポジトリの Release `photos` に asset として置き、YAML から URL で参照する。Release は Agent が初回に 1 つ作り、以後は asset の追加・差し替え（`--clobber`）・削除（`gh release delete-asset`）だけを行う。

### 5.1 写真（`photos`）

```yaml
image: https://github.com/joe-yama/portfolio/releases/download/photos/2025-kyoto-dawn.jpg
                         # Release asset の URL。ビルド時に Astro が取得し、取得失敗でビルドを止める
order: 10                # ギャラリーの並び順（昇順）
featured: true           # トップの代表写真。コレクション全体で 1 枚だけ true
takenAt: 2025-11-03      # 撮影日
title:    { ja: "夜明けの鴨川", en: "Kamo River at Dawn" }
location: { ja: "京都",       en: "Kyoto, Japan" }
alt:      { ja: "...", en: "..." }   # 必須。アクセシビリティ用
exif:                    # 5 項目すべて必須
  camera: "Fujifilm X-T5"
  lens: "XF 23mm F1.4 R LM WR"
  aperture: 1.4          # 数値。表示時に "f/1.4"
  shutterSpeed: "1/250"  # 文字列。"1/250" や "2s"
  iso: 800               # 整数
```

- `image` は Zod で URL として検証し、さらに独自検証で「このリポジトリの Release `photos` 配下の URL で、ファイル名が `<slug>.jpg`」であることを確認する。それ以外の URL は受け付けない
- スキーマで表現できない制約（`featured` がちょうど 1 枚、`order` の重複なし、slug がファイル名と一致、`image` の URL 形式）は独自の検証関数で行い、ビルド前に失敗させる
- 撮影情報の表示形式は `Fujifilm X-T5 · XF 23mm F1.4 · f/1.4 · 1/250 · ISO 800`

### 5.2 経歴（`career`）と プロフィール（`profile`）

- `career`: `experience[]`（期間 from/to、組織、役割、要点 bullets 最大 5）、`skills`（カテゴリ名 → 名前の配列）、`certifications[]`（日付、名前、リンク任意）、`achievements[]`（日付、名前、リンク任意、種別: talk / article / award / other）
- `profile`: `name`、`tagline`、`links[]`（label、url、種別: github / email / x / linkedin / other）
- 日英は別ファイル。`experience`、`certifications`、`achievements` の件数が両言語で一致することを単体テストで確認する
- 表示規則（Agent 裁定 2026-09-21）: `experience` は `from` の降順、`certifications` と `achievements` は `date` の降順。`to` が無い職歴の期間は ja `現在` / en `Present`。期間は `Intl.DateTimeFormat`（ja: `2020年4月 – 現在`、en: `Apr 2020 – Present`）、資格・実績の日付も `Intl.DateTimeFormat`（ja: `2023年6月1日`、en: `June 1, 2023`）。`skills` はカテゴリ名 + 名前のカンマ区切り 1 行を YAML のキー順に並べる（表やタグ UI は作らない）。`achievements` の `kind` のラベルは ja 登壇 / 執筆 / 受賞 / その他、en Talk / Article / Award / Other。`url` がある項目だけリンクにする
- 整形・並び替えは `.astro` の外の純関数（`src/lib/career.ts`）に置き、Vitest で固定する

### 5.3 入稿ルール

- 写真は JPEG、長辺 2,500px 程度、sRGB、品質 90 前後で入稿。RAW や高解像度の元データは Release にも置かない（ビルド時間と取得量を抑えるため）
- 1 枚 1〜2 MB、数十枚で合計 100 MB 程度を想定。Release asset の上限（1 ファイル 2 GB）には遠く、合計の制限はない
- `pnpm photo:add <画像ファイル>` が次を一度に行う: (1) EXIF を読み取る、(2) 長辺 2500px・sRGB・JPEG 品質 90 への縮小を行う（元画像がこれより小さい場合は拡大しない）、(3) `gh release upload photos <slug>.jpg` で Release に上げる（同名があれば `--clobber` で差し替え）、(4) `src/content/photos/<slug>.yaml` の雛形（image の URL、takenAt、exif の 5 項目）を生成する。入稿側（カメラ本体や現像ソフト）で事前に縮小しておく必要はなくなった（PO 決定 2026-09-20）。title / location / alt は手で書く欄として `TODO:` で始まる印が入り、印が残ったままではビルドが `validatePhotos` で止まる（PO 決定 2026-09-20）。EXIF 読み取り・縮小・アップロードは開発時だけで、公開サイトには影響しない（依存: exifr、sharp。アップロードは `gh` CLI を使う）
- `photo:add` の実行には `gh` が joe-yama で認証されていることが必要。スクリプトは冒頭で `gh api user` を確認し、違うアカウントなら中断する
- 写真の削除は YAML を消して push し、asset は `gh release delete-asset photos <slug>.jpg` で消す。asset だけ残っても公開サイトには影響しない

## 6. 画像パイプラインと表示

Astro 本体の `astro:assets`（sharp）でビルド時に最適化する。実行時処理はなし。独自の画像処理コードは書かない。

写真はリモート画像として扱う。`astro.config` の `image.remotePatterns` に `{ protocol: 'https', hostname: '**.githubusercontent.com' }` を、`image.domains` に `github.com` を登録し、`<Picture>` に `inferSize` を付ける。Astro がビルド時に Release から元画像を取得し、最適化した派生画像を `dist/_astro/` に出力するので、公開サイトの画像はすべて同一オリジンから配信される（§7「外部通信ゼロ」は維持）。ローカル開発も同じ経路で取得するため、ネットワークが必要。

GitHub Release のダウンロード URL（`github.com/.../releases/download/...`）は `release-assets.githubusercontent.com` へ 302 リダイレクトする。`image.domains` はリダイレクト先のホストを許可しないため、リダイレクト先を許可する `image.remotePatterns` が別途必要（実測 2026-09-20）。`domains: ['github.com']` も引き続き必要で、`remotePatterns` の `**.githubusercontent.com` は `github.com` に一致しないため、`domains` を外すと最初の取得（`github.com` の URL）自体が許可されなくなる（実測 2026-09-20。両方を設定すること）。

| 用途 | 目標幅 | 補足 |
|---|---|---|
| ギャラリーのグリッド | 400 / 800 / 1200px、AVIF + WebP + JPEG フォールバック | `loading="lazy"`、幅高さ指定で CLS を防ぐ。元の縦横比を保ち、トリミングしない |
| 個別ページ | 1200 / 1800 / 2500px、同じ形式 | 入稿上限 2,500px を超える拡大はしない |
| トップの代表写真 | 個別ページと同じセット | `loading="eager"` と `fetchpriority="high"` |

上の幅は「目標幅」であり、常にその幅で出力されるとは限らない。sharp は拡大しない（`withoutEnlargement: true`）ため、元画像の幅が目標幅より小さい場合は元画像の幅で打ち切られる（例: 元画像が 1667×2500px の縦位置写真なら、個別ページの出力は 1200w と 1667w になり、2500w は生成されない）。これは入稿上限 2,500px を超える拡大をしないという方針と整合する正しい挙動（実測 2026-09-20）。

- `<Picture>` コンポーネントを使い、`formats={['avif','webp']}`、`widths`、`inferSize`、`fallbackFormat="jpeg"`（既定は PNG のため明示が必要）を指定する
- 公開画像から EXIF は sharp の既定で除去される。撮影情報は YAML から表示するので、位置情報などが漏れることはない
- ドット絵は Agent が描く仮の絵を Astro コンポーネント内のインライン SVG（`shape-rendering="crispEdges"`、`fill="currentColor"`）で表現する。文字色に追従するのでダーク/ライトで描き分けず、PNG も最適化パイプラインも使わない。PO が自作の絵に差し替えるときは別 change で行う（PO 決定 2026-09-18）

**運用上の注意（キャッシュの落とし穴、2026-09-20 判明。Astro 側のバグで設定では直せない）**: 温かいローカルキャッシュ（`node_modules/.astro/assets`）での再ビルド時、リモート画像の再検証が必ず失敗し `Proceeding with stale cache` の警告が出る。原因は `node_modules/astro/dist/assets/build/remote.js` の `revalidateRemoteImage` が許可リストを第 4 引数に取るのに、呼び出し側の `build/generate.js:121` が引数を 2 つしか渡しておらず、既定の空の許可リストが使われるため。実害は、`pnpm photo:add` で同じ slug の写真を `gh release upload --clobber` で差し替えても、ローカルの温かいキャッシュでは古い画像がビルド出力に残ること。回避策は `node_modules/.astro/assets` を消してからビルドする。CI は毎回冷えているので影響しない。

## 7. デザインの土台

- **色**: モノトーン基調。写真の色を邪魔しない。ダークとライトは OS 設定に追従（`prefers-color-scheme`）。切り替え UI は置かない
- **文字**: 見出し・ロゴ・ナビ・言語切り替え・撮影情報の 1 行は DotGothic16（Google Fonts、SIL OFL 1.1）。配信は Astro の Fonts API（Google プロバイダー）で、ビルド時に unicode-range 分割済みの woff2 を取得して `dist/_astro/fonts/` から自己配信する。読み込み中は代替フォントで即表示（`display: swap`）。本文はシステムフォント（`system-ui`）。TTF（約 2 MB）の `public/fonts/` 同梱は、初回訪問の読み込み量が大きいためやめた（PO 決定 2026-09-18）
- **ドット絵**: トップのアイコンと 404 ページの 2 点（v1）。言語切り替えは文字のみ
- **配信 JavaScript**: ゼロ。Astro の島も使わない
- **外部通信**: 公開サイトからはゼロ。フォント、画像、スクリプトすべて同一オリジン。ビルド時の外部取得は GitHub Releases（写真）と Google Fonts（DotGothic16）の 2 箇所のみ
- **アクセシビリティ**: すべての写真に `alt`、キーボードで全リンクに到達、コントラスト比 4.5:1 以上、言語切り替えに `hreflang`

具体的な余白・サイズ・配置は実装計画の中でモックを作り、PO が確認する。

## 8. テストと検証

| 層 | ツール | 確認すること | タイミング |
|---|---|---|---|
| 内容の検証 | Zod スキーマ + 独自検証 | 必須項目、型、`image` が Release `photos` の URL、`featured` が 1 枚、`order` 重複なし。画像の実在は Astro の取得で確認（失敗でビルド停止） | ビルド時 |
| 単体テスト | Vitest | 撮影情報の整形、言語切り替え URL、日英の件数一致、並び順、写真 URL の検証、EXIF 雛形生成（アップロード部分は `gh` をモック） | Stop hook と CI |
| 表示の検証 | Playwright（+ axe） | 5 種類 × 2 言語のページ表示、リンク切れなし、`<picture>` の出力、言語切り替えが対応ページへ、アクセシビリティ違反なし | CI とレビュー時 |
| 静的チェック | `astro check`、Biome、リンク切れ検査 | 型、lint と整形、ビルド後 HTML 内の内部リンク | 編集時と CI |

- Biome を採用する理由: 設定 1 ファイル、依存 1 つ、高速。ESLint と Prettier は入れない
- e2e は数十秒かかるので Stop hook には入れない。CI とレビュー用サブエージェントが実行する
- レビュー用サブエージェントは `pnpm build` → `pnpm preview` → Playwright MCP で実操作する（`file:` URL は使えない）

### 8.1 ハーネスへの反映（同じ change で行う）

1. `.claude/rules/testing.md` にコマンドを記載: `pnpm test`（Vitest）、`pnpm lint`（Biome）、`pnpm typecheck`（astro check）、`pnpm e2e`（Playwright）
2. `.claude/hooks/lint-on-edit.sh` の `detect_lint()` を `pnpm exec biome check <file>` に、`.claude/hooks/test-on-stop.sh` の `detect_test()` を `pnpm test` に置き換える
3. `.claude/settings.json` の `permissions.allow` は 2026-09-17 のレビュー反映で `pnpm test / lint / typecheck / e2e / build / preview` と `pnpm exec biome / playwright` に置き換え済み。`pnpm install` は ask。実装時に不足があれば追記する
4. `CLAUDE.md` の「技術スタック」「コマンド」節と `docs/harness/README.md` §5 を更新

## 9. デプロイと運用

| 流れ | 内容 |
|---|---|
| 進行管理 | change を起こす時点で Agent が GitHub Issue を作り、経過・方針変更・ブロッカーをコメントで記録する。PR 本文に `Closes #N`。運用ルールは `CLAUDE.md` と `.claude/rules/git.md` |
| Pull Request | `astro check` → Biome → Vitest → ビルド → Playwright e2e。すべて通らないとマージ不可（`main` のブランチ保護は PO が GitHub 上で設定）。マージで Issue が閉じる |
| `main` へマージ | `withastro/action@v6` でビルド（lockfile から pnpm を自動判別）、`actions/deploy-pages@v5` で GitHub Pages へ公開。ビルド中に Release `photos` から写真を取得する（公開リポジトリなので認証不要） |
| 独自ドメイン | **v1 では使わない**（`public/CNAME` は作らない。PO 決定 2026-09-21）。移行するときは `public/CNAME` にドメイン名を置き、`astro.config` の `site` を `https://<ドメイン>` に変え、**`base` を削除**する（`base` を消し忘れると全リンクが `/portfolio/` 付きのまま 404 になる）。DNS 登録は PO の作業。HTTPS は GitHub Pages が自動発行 |
| Node / pnpm | Node は `.node-version` で固定（CI と同じ）。パッケージマネージャは pnpm。`package.json` の `packageManager` フィールドでバージョンを固定し、`pnpm-lock.yaml` をコミットする。npm / npx は使わない |
| 依存 | astro、@astrojs/check + typescript、@biomejs/biome、vitest、@playwright/test（+ axe-core）、exifr、@types/node（devDependencies。`scripts/photo-add.ts` を Node で直接実行する CLI の型検査に使う。ライセンス MIT（DefinitelyTyped）。公開サイトのビルド出力には含まれない。PO 承認 2026-09-20）、sharp（devDependencies。`pnpm photo:add` が入稿時に元画像を長辺 2500px・sRGB・品質 90 の JPEG へ縮小するために使う。ライセンス Apache-2.0。Astro が `astro:assets` の画像最適化に使っている依存でもあり、既に node_modules に入っていた（バージョンは Astro と同じ 0.35.x）。明示的に追加したのは、pnpm の厳格な `node_modules` では自前スクリプトから `import sharp` が解決できないため（実測 `MODULE_NOT_FOUND`）。新たなバイナリのダウンロードは発生しない。公開サイトのビルド出力には含まれない。PO 承認 2026-09-20）。これ以外は追加のたびに PO へ提示 |

## 10. リポジトリの現状と前提

- リポジトリは `/Users/joe/repo/github-personal/joe-yama/portfolio`（remote: `github-personal` 経由の `joe-yama/portfolio`）。全コミットは個人名義（joe-yama）で SSH 署名済み
- ハーネス（Superpowers、OpenSpec、hooks、Playwright MCP、permissions）は構築済み。`docs/harness/README.md` 参照
- `gh` CLI はこのマシンに複数アカウントがある。Issue / Release の操作は joe-yama で行う必要があり、Agent は書き込み前に `gh api user` で確認する
- アプリケーションコードはまだ 1 行もない。実装は writing-plans の計画に従い、OpenSpec の change として進める

## 11. PO に依頼する入力

1. **独自ドメイン名**（`CNAME` と `site` に必要）と、DNS を管理しているサービス
2. **写真**: 初回に載せる数十枚（入稿ルールは 5.3）と、代表写真 1 枚の指定。Release への登録は Agent が `photo:add` で行う
3. **経歴データ**: 職歴、スキル、資格、実績の元情報（日英）。Agent が YAML に整形する
4. **プロフィール**: 表示名、一行紹介（日英）、連絡先リンク
5. **GitHub 側の設定**: Pages を GitHub Actions ソースで有効化、`main` のブランチ保護（PR 必須 + CI 必須）

写真と経歴データが揃う前でも、ダミーの写真 2〜3 枚とサンプル経歴で v1 の実装と検証は進められる。

## 12. 未決事項（設計外・運用）

`docs/HANDOFF.md` §6 のうち未回答: 月あたりのトークン費用上限、自律実行の許容範囲（夜間放置、push 権限）、Beads の導入時期、Agent Teams の利用。これらは実装計画の中で影響する時点に確認する。
