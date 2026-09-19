import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  // 独自ドメイン決定時（Change 5）に置き換える。hreflang の絶対 URL 生成に必要
  site: 'https://joe-yama.github.io',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  image: {
    // 写真は GitHub Releases の URL（github.com → objects.githubusercontent.com にリダイレクト）
    domains: ['github.com'],
  },
  fonts: [
    {
      // ロゴ・ナビ・見出しのドット文字。ビルド時に Google Fonts から unicode-range 分割済みの
      // woff2 を取得し dist/_astro/fonts/ から自己配信する（設計書 §7、PO 決定 2026-09-18）
      provider: fontProviders.google(),
      name: 'DotGothic16',
      cssVariable: '--font-dot',
      weights: [400],
      styles: ['normal'],
      subsets: ['japanese', 'latin'],
      display: 'swap',
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
