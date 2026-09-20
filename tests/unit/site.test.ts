import { describe, expect, it } from 'vitest';
import {
  alternateLinks,
  assetPath,
  homePath,
  languageSwitch,
  navLinks,
  photoPath,
  ui,
} from '../../src/lib/site';

describe('alternateLinks', () => {
  it('ja / en / x-default の 3 本を絶対 URL で返し、x-default は ja と同じ', () => {
    expect(alternateLinks('/ja/', 'https://example.com', '/')).toEqual([
      { hreflang: 'ja', href: 'https://example.com/ja/' },
      { hreflang: 'en', href: 'https://example.com/en/' },
      { hreflang: 'x-default', href: 'https://example.com/ja/' },
    ]);
  });

  it('下位ページでも接頭辞だけを置き換える', () => {
    expect(alternateLinks('/en/career/', new URL('https://example.com'), '/')).toEqual([
      { hreflang: 'ja', href: 'https://example.com/ja/career/' },
      { hreflang: 'en', href: 'https://example.com/en/career/' },
      { hreflang: 'x-default', href: 'https://example.com/ja/career/' },
    ]);
  });

  it('末尾スラッシュの無いパスも正規化する', () => {
    expect(alternateLinks('/ja', 'https://example.com', '/')[0]?.href).toBe(
      'https://example.com/ja/',
    );
  });

  it('接頭辞の無いパスには接頭辞を付けて返す', () => {
    expect(alternateLinks('/', 'https://example.com', '/')).toEqual([
      { hreflang: 'ja', href: 'https://example.com/ja/' },
      { hreflang: 'en', href: 'https://example.com/en/' },
      { hreflang: 'x-default', href: 'https://example.com/ja/' },
    ]);
  });
});

describe('navLinks', () => {
  it('Photos → Career の順で、そのロケールの下を指す', () => {
    expect(navLinks('ja', '/')).toEqual([
      { label: 'Photos', href: '/ja/photos/' },
      { label: 'Career', href: '/ja/career/' },
    ]);
    expect(navLinks('en', '/')).toEqual([
      { label: 'Photos', href: '/en/photos/' },
      { label: 'Career', href: '/en/career/' },
    ]);
  });
});

describe('languageSwitch', () => {
  it('日本語ページでは English を表示し、同じページの英語版へ', () => {
    expect(languageSwitch('/ja/career/', 'ja', '/')).toEqual({
      label: 'English',
      href: '/en/career/',
      hreflang: 'en',
    });
  });

  it('英語ページでは 日本語 を表示し、同じページの日本語版へ', () => {
    expect(languageSwitch('/en/', 'en', '/')).toEqual({
      label: '日本語',
      href: '/ja/',
      hreflang: 'ja',
    });
  });
});

describe('base 付きのパス生成', () => {
  const base = '/portfolio/';

  it('homePath', () => {
    expect(homePath('ja', base)).toBe('/portfolio/ja/');
    expect(homePath('en', '/')).toBe('/en/');
  });

  it('photoPath', () => {
    expect(photoPath(null, 'ja', base)).toBe('/portfolio/ja/photos/');
    expect(photoPath('sunset-dinghies', 'en', base)).toBe('/portfolio/en/photos/sunset-dinghies/');
    expect(photoPath(null, 'ja', '/')).toBe('/ja/photos/');
  });

  it('assetPath', () => {
    expect(assetPath('/favicon.svg', base)).toBe('/portfolio/favicon.svg');
    expect(assetPath('/favicon.svg', '/')).toBe('/favicon.svg');
  });

  it('navLinks はすべて base で始まる', () => {
    for (const link of navLinks('ja', base)) {
      expect(link.href.startsWith(base)).toBe(true);
    }
  });

  it('languageSwitch は base を保つ', () => {
    expect(languageSwitch('/portfolio/ja/career/', 'ja', base).href).toBe('/portfolio/en/career/');
  });

  it('alternateLinks は base 込みの絶対 URL を返す', () => {
    expect(alternateLinks('/portfolio/en/career/', 'https://example.com', base)).toEqual([
      { hreflang: 'ja', href: 'https://example.com/portfolio/ja/career/' },
      { hreflang: 'en', href: 'https://example.com/portfolio/en/career/' },
      { hreflang: 'x-default', href: 'https://example.com/portfolio/ja/career/' },
    ]);
  });
});

describe('ui', () => {
  it('両言語に 404 の文言と戻りリンクの文言がある', () => {
    expect(ui.ja.notFound).toBe('ページが見つかりません');
    expect(ui.en.notFound).toBe('Page not found');
    expect(ui.ja.backToTop).toBe('日本語のトップへ');
    expect(ui.en.backToTop).toBe('Go to the English top');
  });
});

describe('ui の写真まわりの文言', () => {
  it('日英とも同じキーを持つ', () => {
    for (const key of ['backToGallery', 'prevPhoto', 'nextPhoto'] as const) {
      expect(ui.ja[key].length).toBeGreaterThan(0);
      expect(ui.en[key].length).toBeGreaterThan(0);
      expect(ui.ja[key]).not.toBe(ui.en[key]);
    }
  });

  it('ナビの aria-label（siteNav / photoNav）が両ロケールで空でない', () => {
    for (const key of ['siteNav', 'photoNav'] as const) {
      expect(ui.ja[key].length).toBeGreaterThan(0);
      expect(ui.en[key].length).toBeGreaterThan(0);
      expect(ui.ja[key]).not.toBe(ui.en[key]);
    }
  });
});

describe('ui の経歴ページの文字列', () => {
  it('区画の見出しが両ロケールにある', () => {
    expect(ui.ja.careerSections).toEqual({
      experience: '職歴',
      skills: 'スキル',
      certifications: '資格',
      achievements: '実績',
    });
    expect(ui.en.careerSections).toEqual({
      experience: 'Experience',
      skills: 'Skills',
      certifications: 'Certifications',
      achievements: 'Achievements',
    });
  });

  it('実績の種別 4 つすべてにラベルがある', () => {
    for (const lang of ['ja', 'en'] as const) {
      for (const kind of ['talk', 'article', 'award', 'other'] as const) {
        expect(ui[lang].achievementKind[kind]).toBeTruthy();
      }
    }
    expect(ui.ja.achievementKind.talk).toBe('登壇');
    expect(ui.en.achievementKind.talk).toBe('Talk');
  });
});
