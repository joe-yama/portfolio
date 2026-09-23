import { describe, expect, it } from 'vitest';
import { briefcase, camera, globe } from '../../src/lib/pixel';
import {
  alternateLinks,
  canonicalUrl,
  careerPath,
  homePath,
  languageSwitch,
  navLinks,
  ogLocale,
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
      { label: 'Photos', href: '/ja/photos/', icon: camera },
      { label: 'Career', href: '/ja/career/', icon: briefcase },
    ]);
    expect(navLinks('en', '/')).toEqual([
      { label: 'Photos', href: '/en/photos/', icon: camera },
      { label: 'Career', href: '/en/career/', icon: briefcase },
    ]);
  });
});

describe('導線のアイコン（design D1）', () => {
  it('navLinks の Photos は camera、Career は briefcase を持つ', () => {
    const byLabel = Object.fromEntries(navLinks('ja', '/').map((l) => [l.label, l.icon]));
    expect(byLabel).toEqual({ Photos: camera, Career: briefcase });
  });

  it('languageSwitch は両ロケールで globe を持つ', () => {
    expect(languageSwitch('/ja/', 'ja', '/').icon).toBe(globe);
    expect(languageSwitch('/en/', 'en', '/').icon).toBe(globe);
  });
});

describe('languageSwitch', () => {
  it('日本語ページでは English を表示し、同じページの英語版へ', () => {
    expect(languageSwitch('/ja/career/', 'ja', '/')).toEqual({
      label: 'English',
      href: '/en/career/',
      hreflang: 'en',
      icon: globe,
    });
  });

  it('英語ページでは 日本語 を表示し、同じページの日本語版へ', () => {
    expect(languageSwitch('/en/', 'en', '/')).toEqual({
      label: '日本語',
      href: '/ja/',
      hreflang: 'ja',
      icon: globe,
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
  it('日英とも実際の文言になっている', () => {
    expect(ui.ja.backToGallery).toBe('写真一覧へ');
    expect(ui.en.backToGallery).toBe('Back to photos');
    expect(ui.ja.prevPhoto).toBe('前の写真');
    expect(ui.en.prevPhoto).toBe('Previous photo');
    expect(ui.ja.nextPhoto).toBe('次の写真');
    expect(ui.en.nextPhoto).toBe('Next photo');
  });

  it('ナビの aria-label（siteNav / photoNav）が両ロケールで実際の文言になっている', () => {
    expect(ui.ja.siteNav).toBe('サイト内の案内');
    expect(ui.en.siteNav).toBe('Site navigation');
    expect(ui.ja.photoNav).toBe('前後の写真');
    expect(ui.en.photoNav).toBe('Photo navigation');
  });
});

describe('careerPath', () => {
  it('ロケールごとの経歴のパスを返す', () => {
    expect(careerPath('ja', '/')).toBe('/ja/career/');
    expect(careerPath('en', '/portfolio')).toBe('/portfolio/en/career/');
  });
});

describe('ogLocale', () => {
  it('ja は ja_JP、en は en_US を返す', () => {
    expect(ogLocale('ja')).toBe('ja_JP');
    expect(ogLocale('en')).toBe('en_US');
  });
});

describe('canonicalUrl', () => {
  it('base 付きでそのページ自身の絶対 URL を返す（lang はパスから判定する）', () => {
    expect(canonicalUrl('/portfolio/en/career/', 'https://example.com', '/portfolio')).toBe(
      'https://example.com/portfolio/en/career/',
    );
    // 末尾スラッシュを補い、URL オブジェクトの site も受ける
    expect(canonicalUrl('/ja/career', new URL('https://example.com'), '/')).toBe(
      'https://example.com/ja/career/',
    );
  });

  it('site にパスがあっても捨てない', () => {
    expect(canonicalUrl('/portfolio/ja/', 'https://example.com/sub/', '/portfolio')).toBe(
      'https://example.com/sub/portfolio/ja/',
    );
  });
});

describe('ui の経歴ページの文字列', () => {
  it('区画の見出しが両ロケールにある', () => {
    expect(ui.ja.careerSections).toEqual({
      experience: '職歴',
      skills: 'スキル',
      certifications: '資格',
      achievements: '実績',
      patents: '代表的な特許',
    });
    expect(ui.en.careerSections).toEqual({
      experience: 'Experience',
      skills: 'Skills',
      certifications: 'Certifications',
      achievements: 'Achievements',
      patents: 'Featured Patents',
    });
  });

  it('実績の種別 4 つすべてにラベルがある', () => {
    expect(ui.ja.achievementKind).toEqual({
      talk: '登壇',
      article: '執筆',
      award: '受賞',
      other: 'その他',
    });
    expect(ui.en.achievementKind).toEqual({
      talk: 'Talk',
      article: 'Article',
      award: 'Award',
      other: 'Other',
    });
  });

  it('特許の区画見出しが両ロケールにある', () => {
    expect(ui.ja.careerSections.patents).toBe('代表的な特許');
    expect(ui.en.careerSections.patents).toBe('Featured Patents');
  });

  it('特許の折りたたみの文言が件数を埋めて返る', () => {
    expect(ui.ja.morePatents(46)).toBe('さらに 46 件を表示');
    expect(ui.en.morePatents(46)).toBe('Show 46 more');
  });

  it('在職中の表記（present）が両ロケールにある（design D10）', () => {
    expect(ui.ja.present).toBe('現在');
    expect(ui.en.present).toBe('Present');
  });
});
