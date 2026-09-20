# Spec Delta

## ADDED Requirements

### Requirement: favicon
すべてのページは、同一オリジンの SVG ファビコン `/favicon.svg` を `<link rel="icon">` で参照しなければならない（MUST）。`/favicon.svg` はビルド出力に含まれ、ドット絵をベクター図形で表現し、外部の画像やフォントを参照してはならない（MUST NOT）。

#### Scenario: ファビコンの出力
- **WHEN** ビルドする
- **THEN** `dist/favicon.svg` が存在し、`dist/ja/index.html` と `dist/404.html` に `<link rel="icon" href="/favicon.svg">` が含まれる

#### Scenario: ブラウザのコンソール
- **WHEN** `/ja/` を表示する
- **THEN** ファビコン取得の 404 エラーがコンソールに出ない
