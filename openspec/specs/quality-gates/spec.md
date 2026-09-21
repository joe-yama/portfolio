# quality-gates Specification

## Purpose

コードの変更が `main` に入る前に、lint・型検査・単体テスト・ビルドが機械的に確認され、サイトの「配信 JavaScript ゼロ・外部通信ゼロ」の制約が守られ続けるようにする。

## Requirements

### Requirement: 検証コマンド
リポジトリは `pnpm lint`（lint と整形の検査）、`pnpm typecheck`（型検査）、`pnpm test`（単体テスト）、`pnpm build`（静的ビルド）、`pnpm e2e`（ビルド出力に対するブラウザでの検査）の 5 コマンドを提供しなければならない（MUST）。各コマンドは問題が無ければ終了コード 0、問題があれば非 0 で終了しなければならない（MUST）。`npm` / `npx` を前提にした手順を含んではならない（MUST NOT）。`pnpm test` は単体テストだけを実行し、ブラウザを必要とするテストを含んではならない（MUST NOT）。

#### Scenario: すべて通る状態
- **WHEN** クリーンな作業ツリーで 5 コマンドを順に実行する
- **THEN** すべて終了コード 0 で終わる

#### Scenario: lint 違反
- **WHEN** 整形されていないファイルを追加して `pnpm lint` を実行する
- **THEN** 終了コードは非 0 で、該当ファイルが報告される

#### Scenario: 型エラー
- **WHEN** 型の合わないコードを追加して `pnpm typecheck` を実行する
- **THEN** 終了コードは非 0 である

#### Scenario: 単体テストの範囲
- **WHEN** `pnpm test` を実行する
- **THEN** ブラウザを起動せずに終わる

### Requirement: 実行環境の固定
Node のバージョンは `.node-version` で、pnpm のバージョンは `package.json` の `packageManager` で固定し、`pnpm-lock.yaml` をコミットしなければならない（MUST）。CI はこれらと同じバージョンを使わなければならない（MUST）。

#### Scenario: CI の Node
- **WHEN** CI が実行される
- **THEN** `.node-version` に書かれたバージョンの Node と、`packageManager` に書かれたバージョンの pnpm が使われる

#### Scenario: lockfile の凍結
- **WHEN** CI が依存をインストールする
- **THEN** `pnpm-lock.yaml` と `package.json` が食い違っていれば失敗する

### Requirement: Pull Request での CI
`main` を対象とする Pull Request と `main` への push では、GitHub Actions で lint → 型検査 → 単体テスト → ビルド → e2e が実行されなければならない（MUST）。いずれかが失敗したらチェックは失敗しなければならない（MUST）。

#### Scenario: すべて通る PR
- **WHEN** 5 段階すべてが成功する PR を開く
- **THEN** CI のチェックは成功として表示される

#### Scenario: テストが落ちる PR
- **WHEN** 単体テストが 1 つ失敗する PR を開く
- **THEN** CI のチェックは失敗として表示され、ビルドまで進まない

#### Scenario: e2e が落ちる PR
- **WHEN** e2e が 1 つ失敗する PR を開く
- **THEN** CI のチェックは失敗として表示される

### Requirement: 配信 JavaScript ゼロ
ビルドで出力される HTML は `<script` 要素を含んではならない（MUST NOT）。

#### Scenario: 出力 HTML の検査
- **WHEN** ビルド後に出力ディレクトリの HTML をすべて検査する
- **THEN** `<script` を含むファイルは 1 つも無い

### Requirement: 外部通信ゼロ
出力される HTML が参照するフォント・画像・スタイルは、すべて同一オリジンでなければならない（MUST）。ビルド時に外部から取得した画像とフォントも、出力では同一オリジンのパスに変換されていなければならない（MUST）。

#### Scenario: 出力 HTML の参照先
- **WHEN** ビルド後に出力 HTML の `src` / `href` を検査する
- **THEN** `https://` で始まる参照はリンク（`<a>`）と `hreflang` の `<link rel="alternate">` 以外に無い

#### Scenario: フォントの参照先
- **WHEN** ビルド後に出力 HTML とインライン CSS の `@font-face` を検査する
- **THEN** `url(` の参照先はすべて同一オリジンのパスで、外部ホストへの参照は無い

### Requirement: ビルド出力のブラウザ検査

`pnpm e2e` は、ビルド出力を静的に配信した状態でブラウザから検査しなければならない（MUST）。検査は少なくとも次を含まなければならない（MUST）: すべての種類のページ（トップ、ギャラリー、写真の個別ページ、経歴、404）が両ロケールで表示されること、各ページの `<html lang>` が URL のロケールと一致すること、`link[rel=alternate][hreflang]` が 3 本あること、言語切り替えが同じページの他言語版へ遷移すること、写真が `<picture>` として出力されていること、ページが外部ホストへリクエストを行わないこと、アクセシビリティの自動検査で違反が 0 件であること。

#### Scenario: すべてのページの表示

- **WHEN** `pnpm e2e` を実行する
- **THEN** 5 種類 × 2 言語のページと 404 ページが表示され、いずれも失敗しない

#### Scenario: アクセシビリティ違反

- **WHEN** いずれかのページにアクセシビリティ違反を持つ要素を追加して `pnpm e2e` を実行する
- **THEN** 終了コードは非 0 になる

#### Scenario: 外部ホストへのリクエスト

- **WHEN** e2e が各ページを開いている間のネットワーク要求を集める
- **THEN** 配信元以外のホストへの要求は 0 件である

### Requirement: ビルド出力の内部リンク検査

ビルド出力の HTML が参照する同一オリジンの `href` / `src` / `srcset` は、すべてビルド出力の中のファイルに解決しなければならない（MUST）。解決しない参照が 1 つでもあれば、検査は非 0 で終了しなければならない（MUST）。

#### Scenario: すべて解決する

- **WHEN** 正常なビルド出力に対して検査を実行する
- **THEN** 終了コードは 0 である

#### Scenario: 壊れたリンク

- **WHEN** 出力の中のどれか 1 ファイルを削除して検査を実行する
- **THEN** 終了コードは非 0 で、解決しなかった参照が報告される
