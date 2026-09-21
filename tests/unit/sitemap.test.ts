import { describe, expect, it } from 'vitest';
import { sitemapEntries, sitemapXml } from '../../src/lib/sitemap';

const site = 'https://joe-yama.github.io';
const base = '/portfolio';
const slugs = ['kariya-ferris-wheel', 'sunset-dinghies'];
const prefix = 'https://joe-yama.github.io/portfolio';

describe('sitemapEntries', () => {
  it('写真 2 枚のとき 10 件の loc を返す', () => {
    expect(sitemapEntries(slugs, site, base).map((e) => e.loc)).toEqual([
      `${prefix}/ja/`,
      `${prefix}/ja/career/`,
      `${prefix}/ja/photos/`,
      `${prefix}/ja/photos/kariya-ferris-wheel/`,
      `${prefix}/ja/photos/sunset-dinghies/`,
      `${prefix}/en/`,
      `${prefix}/en/career/`,
      `${prefix}/en/photos/`,
      `${prefix}/en/photos/kariya-ferris-wheel/`,
      `${prefix}/en/photos/sunset-dinghies/`,
    ]);
  });

  it('写真が 1 枚増えると 12 件になる', () => {
    expect(sitemapEntries([...slugs, 'new-photo'], site, base)).toHaveLength(12);
  });

  it('写真が 0 枚でも 6 件返す', () => {
    expect(sitemapEntries([], site, base)).toHaveLength(6);
  });

  it('振り分けページと 404 は含まない', () => {
    const locs = sitemapEntries(slugs, site, base).map((e) => e.loc);
    expect(locs).not.toContain(`${prefix}/`);
    expect(locs.some((loc) => loc.includes('404'))).toBe(false);
  });

  it('loc に重複が無い', () => {
    const locs = sitemapEntries(slugs, site, base).map((e) => e.loc);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('英語の経歴ページは代替 3 本を持つ', () => {
    const entry = sitemapEntries(slugs, site, base).find((e) => e.loc === `${prefix}/en/career/`);
    expect(entry?.alternates).toEqual([
      { hreflang: 'ja', href: `${prefix}/ja/career/` },
      { hreflang: 'en', href: `${prefix}/en/career/` },
      { hreflang: 'x-default', href: `${prefix}/ja/career/` },
    ]);
  });

  it('base が無くても組み立てられる', () => {
    expect(sitemapEntries([], 'https://example.com', '/')[0]?.loc).toBe('https://example.com/ja/');
  });
});

describe('sitemapXml', () => {
  const xml = sitemapXml(slugs, site, base);

  it('XML 宣言と urlset で始まる', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });

  it('xhtml 名前空間を宣言する', () => {
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it('loc を 10 件持つ', () => {
    expect([...xml.matchAll(/<loc>/g)]).toHaveLength(10);
  });

  it('xhtml:link を 30 本持つ', () => {
    expect([...xml.matchAll(/<xhtml:link /g)]).toHaveLength(30);
  });

  it('日本語トップの url を書き出す', () => {
    expect(xml).toContain(`<loc>${prefix}/ja/</loc>`);
    expect(xml).toContain(
      `<xhtml:link rel="alternate" hreflang="x-default" href="${prefix}/ja/"/>`,
    );
  });

  it('URL の & を実体参照にする', () => {
    expect(sitemapXml(['a&b'], site, base)).toContain('photos/a&amp;b/');
  });
});
