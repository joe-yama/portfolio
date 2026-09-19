# quality-gates Specification

## Purpose

コードの変更が `main` に入る前に、lint・型検査・単体テスト・ビルドが機械的に確認され、サイトの「配信 JavaScript ゼロ・外部通信ゼロ」の制約が守られ続けるようにする。

## Requirements

### Requirement: 検証コマンド
リポジトリは `pnpm lint`（lint と整形の検査）、`pnpm typecheck`（型検査）、`pnpm test`（単体テスト）、`pnpm build`（静的ビルド）の 4 コマンドを提供しなければならない（MUST）。各コマンドは問題が無ければ終了コード 0、問題があれば非 0 で終了しなければならない（MUST）。`npm` / `npx` を前提にした手順を含んではならない（MUST NOT）。

#### Scenario: すべて通る状態
- **WHEN** クリーンな作業ツリーで 4 コマンドを順に実行する
- **THEN** すべて終了コード 0 で終わる

#### Scenario: lint 違反
- **WHEN** 整形されていないファイルを追加して `pnpm lint` を実行する
- **THEN** 終了コードは非 0 で、該当ファイルが報告される

#### Scenario: 型エラー
- **WHEN** 型の合わないコードを追加して `pnpm typecheck` を実行する
- **THEN** 終了コードは非 0 である

### Requirement: 実行環境の固定
Node のバージョンは `.node-version` で、pnpm のバージョンは `package.json` の `packageManager` で固定し、`pnpm-lock.yaml` をコミットしなければならない（MUST）。CI はこれらと同じバージョンを使わなければならない（MUST）。

#### Scenario: CI の Node
- **WHEN** CI が実行される
- **THEN** `.node-version` に書かれたバージョンの Node と、`packageManager` に書かれたバージョンの pnpm が使われる

#### Scenario: lockfile の凍結
- **WHEN** CI が依存をインストールする
- **THEN** `pnpm-lock.yaml` と `package.json` が食い違っていれば失敗する

### Requirement: Pull Request での CI
`main` を対象とする Pull Request と `main` への push では、GitHub Actions で lint → 型検査 → 単体テスト → ビルドが実行されなければならない（MUST）。いずれかが失敗したらチェックは失敗しなければならない（MUST）。

#### Scenario: すべて通る PR
- **WHEN** 4 段階すべてが成功する PR を開く
- **THEN** CI のチェックは成功として表示される

#### Scenario: テストが落ちる PR
- **WHEN** 単体テストが 1 つ失敗する PR を開く
- **THEN** CI のチェックは失敗として表示され、ビルドまで進まない

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
