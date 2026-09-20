# Spec Delta

## MODIFIED Requirements

### Requirement: favicon
すべてのページは、同一オリジンの SVG ファビコンを `<link rel="icon">` で参照しなければならない（MUST）。参照先のパスは公開時のパス接頭辞を含んでいなければならない（MUST）。ファビコンはビルド出力に含まれ、ドット絵をベクター図形で表現し、外部の画像やフォントを参照してはならない（MUST NOT）。

#### Scenario: ファビコンの出力
- **WHEN** ビルドする
- **THEN** `dist/favicon.svg` が存在し、`dist/ja/index.html` と `dist/404.html` の `<link rel="icon">` の `href` は公開時のパス接頭辞付きのファビコンのパス（接頭辞が `/portfolio` なら `/portfolio/favicon.svg`）である

#### Scenario: ブラウザのコンソール
- **WHEN** `/ja/` を表示する
- **THEN** ファビコン取得の 404 エラーがコンソールに出ない
