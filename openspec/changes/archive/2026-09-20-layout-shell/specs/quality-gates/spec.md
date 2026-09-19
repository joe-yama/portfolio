# Spec Delta

## MODIFIED Requirements

### Requirement: 外部通信ゼロ
出力される HTML が参照するフォント・画像・スタイルは、すべて同一オリジンでなければならない（MUST）。ビルド時に外部から取得した画像とフォントも、出力では同一オリジンのパスに変換されていなければならない（MUST）。

#### Scenario: 出力 HTML の参照先
- **WHEN** ビルド後に出力 HTML の `src` / `href` を検査する
- **THEN** `https://` で始まる参照はリンク（`<a>`）と `hreflang` の `<link rel="alternate">` 以外に無い

#### Scenario: フォントの参照先
- **WHEN** ビルド後に出力 HTML とインライン CSS の `@font-face` を検査する
- **THEN** `url(` の参照先はすべて同一オリジンのパスで、外部ホストへの参照は無い
