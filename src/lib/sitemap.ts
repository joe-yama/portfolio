import type { Locale } from './i18n';
import { locales } from './i18n';
import {
  type AlternateLink,
  absoluteUrl,
  alternateLinks,
  careerPath,
  homePath,
  photoPath,
} from './site';

export type SitemapEntry = { loc: string; alternates: AlternateLink[] };

/**
 * ロケール配下のページのパス。サイトマップに載せるのはこの 4 種類で、
 * 写真の枚数だけ個別ページが増える（design D4）。振り分けページと 404 は載せない
 */
function localePaths(lang: Locale, slugs: string[], base: string): string[] {
  return [
    homePath(lang, base),
    careerPath(lang, base),
    photoPath(null, lang, base),
    ...slugs.map((slug) => photoPath(slug, lang, base)),
  ];
}

/** サイトマップに載せるページと、その言語代替 */
export function sitemapEntries(slugs: string[], site: string | URL, base: string): SitemapEntry[] {
  return locales.flatMap((lang) =>
    localePaths(lang, slugs, base).map((path) => ({
      loc: absoluteUrl(path, site),
      alternates: alternateLinks(path, site, base),
    })),
  );
}

/** URL は slug 由来なので & が入りうる。素のままだと XML として壊れる */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sitemapXml(slugs: string[], site: string | URL, base: string): string {
  const urls = sitemapEntries(slugs, site, base).map((entry) => {
    const links = entry.alternates.map(
      (link) =>
        `    <xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${escapeXml(link.href)}"/>`,
    );
    return [`  <url>`, `    <loc>${escapeXml(entry.loc)}</loc>`, ...links, `  </url>`].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
