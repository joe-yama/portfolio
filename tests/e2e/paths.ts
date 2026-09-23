import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { locales } from '../../src/lib/i18n';
import { photoIdFromEntry } from '../../src/lib/photo-meta';

// cwd に依存せず、このファイルの位置からリポジトリの写真データを読む
const photosDir = fileURLToPath(new URL('../../src/content/photos', import.meta.url));

/** 写真の slug（= コレクションの id。src/content.config.ts と同じ photoIdFromEntry で導く）。Astro の glob `*.yaml` はドットファイルに一致しないので、同じく除く */
const photoSlugs = readdirSync(photosDir)
  .filter((name) => name.endsWith('.yaml') && !name.startsWith('.'))
  .map(photoIdFromEntry)
  .sort();
if (photoSlugs.length === 0) throw new Error(`${photosDir} に写真データが無い`);

/** 200 を返すべきページ。パスは baseURL からの相対（先頭スラッシュなし） */
export const pagePaths = locales.flatMap((lang) => [
  `${lang}/`,
  `${lang}/photos/`,
  ...photoSlugs.map((slug) => `${lang}/photos/${slug}/`),
  `${lang}/career/`,
]);

/** 404 ページを確かめるための、存在しないパス */
export const notFoundPath = 'does-not-exist/';

/** アクセシビリティ検査（a11y.spec.ts）と外部要求の検査（network.spec.ts）の対象 */
export const paths = [...pagePaths, notFoundPath];

/** そのパスの応答として期待するステータス */
export function expectedStatus(path: string): number {
  return path === notFoundPath ? 404 : 200;
}
