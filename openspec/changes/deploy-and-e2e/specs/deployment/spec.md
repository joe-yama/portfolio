# Spec Delta

## Purpose

サイトを GitHub Pages のプロジェクトサイトとして公開し、`main` の内容が自動で本番に反映される経路と、その経路が満たすべき権限・同時実行の制約を定める。

## ADDED Requirements

### Requirement: 公開 URL とパス接頭辞

公開されたサイトのトップは `https://joe-yama.github.io/portfolio/` でなければならない（MUST）。サイト内のすべての絶対パス参照（リンク、画像、スタイル、フォント、ファビコン）は `/portfolio/` で始まらなければならない（MUST）。ページの絶対 URL（`hreflang` の `href`）は `https://joe-yama.github.io/portfolio/` 配下でなければならない（MUST）。

#### Scenario: トップの公開 URL

- **WHEN** 公開されたサイトの `/portfolio/` を開く
- **THEN** `/portfolio/ja/` へ遷移する

#### Scenario: 内部リンクの接頭辞

- **WHEN** 公開された任意のページで、同一オリジンを指す `href` と `src` を集める
- **THEN** すべてが `/portfolio/` で始まる

#### Scenario: 言語代替リンクの絶対 URL

- **WHEN** `/portfolio/en/career/` の `link[rel=alternate]` を見る
- **THEN** `href` は `https://joe-yama.github.io/portfolio/ja/career/`、`https://joe-yama.github.io/portfolio/en/career/`、`https://joe-yama.github.io/portfolio/ja/career/`（x-default）の 3 本である

### Requirement: main への push での自動デプロイ

`main` への push で、GitHub Actions がサイトをビルドして GitHub Pages に公開しなければならない（MUST）。手動でも実行できなければならない（MUST）。デプロイの workflow は、リポジトリの内容の読み取り、Pages への書き込み、OIDC トークンの発行以外の権限を要求してはならない（MUST NOT）。同時に複数のデプロイが走らないようにしなければならない（MUST）。

#### Scenario: main への push

- **WHEN** `main` に push する
- **THEN** デプロイの workflow が起動し、成功すると公開サイトが更新される

#### Scenario: 手動実行

- **WHEN** GitHub の画面からデプロイの workflow を実行する
- **THEN** 同じ手順で公開される

#### Scenario: Pull Request

- **WHEN** `main` 向けの Pull Request を開く
- **THEN** デプロイの workflow は起動しない（CI のチェックだけが走る）

### Requirement: デプロイの実行環境

デプロイのビルドは、`.node-version` および `package.json` の `packageManager` と同じバージョンの Node と pnpm で行われなければならない（MUST）。

#### Scenario: Node のバージョン

- **WHEN** デプロイの workflow がビルドする
- **THEN** 使われる Node のバージョンは `.node-version` の内容と一致する
