import type { APIRoute } from 'astro';
import { getPhotos } from '../lib/content';
import { sitemapXml } from '../lib/sitemap';

/** 検索エンジンに渡すサイトマップ。静的ビルドで dist/sitemap.xml に出る */
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('astro.config の site が必要（サイトマップの絶対 URL に使う）');
  const slugs = (await getPhotos()).map((photo) => photo.id);
  return new Response(sitemapXml(slugs, site, import.meta.env.BASE_URL), {
    headers: { 'Content-Type': 'application/xml' },
  });
};
