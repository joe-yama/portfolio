import { describe, expect, it } from 'vitest';
import { alternateLinks, languageSwitch, navLinks, ui } from '../../src/lib/site';

describe('alternateLinks', () => {
  it('ja / en / x-default の 3 本を絶対 URL で返し、x-default は ja と同じ', () => {
    expect(alternateLinks('/ja/', 'https://example.com')).toEqual([
      { hreflang: 'ja', href: 'https://example.com/ja/' },
      { hreflang: 'en', href: 'https://example.com/en/' },
      { hreflang: 'x-default', href: 'https://example.com/ja/' },
    ]);
  });

  it('下位ページでも接頭辞だけを置き換える', () => {
    expect(alternateLinks('/en/career/', new URL('https://example.com'))).toEqual([
      { hreflang: 'ja', href: 'https://example.com/ja/career/' },
      { hreflang: 'en', href: 'https://example.com/en/career/' },
      { hreflang: 'x-default', href: 'https://example.com/ja/career/' },
    ]);
  });

  it('末尾スラッシュの無いパスも正規化する', () => {
    expect(alternateLinks('/ja', 'https://example.com')[0]?.href).toBe('https://example.com/ja/');
  });
});

describe('navLinks', () => {
  it('Photos → Career の順で、そのロケールの下を指す', () => {
    expect(navLinks('ja')).toEqual([
      { label: 'Photos', href: '/ja/photos/' },
      { label: 'Career', href: '/ja/career/' },
    ]);
    expect(navLinks('en')).toEqual([
      { label: 'Photos', href: '/en/photos/' },
      { label: 'Career', href: '/en/career/' },
    ]);
  });
});

describe('languageSwitch', () => {
  it('日本語ページでは English を表示し、同じページの英語版へ', () => {
    expect(languageSwitch('/ja/career/', 'ja')).toEqual({
      label: 'English',
      href: '/en/career/',
      hreflang: 'en',
    });
  });

  it('英語ページでは 日本語 を表示し、同じページの日本語版へ', () => {
    expect(languageSwitch('/en/', 'en')).toEqual({ label: '日本語', href: '/ja/', hreflang: 'ja' });
  });
});

describe('ui', () => {
  it('両言語に 404 の文言と戻りリンクの文言がある', () => {
    expect(ui.ja.notFound).toBe('ページが見つかりません');
    expect(ui.en.notFound).toBe('Page not found');
    expect(ui.ja.backToTop.length).toBeGreaterThan(0);
    expect(ui.en.backToTop.length).toBeGreaterThan(0);
  });
});
