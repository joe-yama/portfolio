import { defineConfig } from 'astro/config';

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
});
